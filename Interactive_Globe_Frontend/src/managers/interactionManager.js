import * as THREE from 'three';
import { rotateGlobeToPoint } from '../core/marker.js';
import gsap from 'gsap';

export class InteractionManager {
    constructor({
        camera,
        scene,
        group,
        points,
        imageLabels,
        autoRotateController,
        uiManager,
        cameraManager,
        controls
    }) {
        this.camera = camera;
        this.scene = scene;
        this.group = group;
        this.points = points;
        this.imageLabels = imageLabels;
        this.autoRotateController = autoRotateController;
        this.uiManager = uiManager;
        this.cameraManager = cameraManager;
        
        this.raycaster = new THREE.Raycaster();
        this.pointer = new THREE.Vector2();
        this.globeContainer = document.querySelector('.globe-container');

        this.currentHoveredPoint = null;
        this.tooltip = this.createTooltip();
        this.tooltipCache = new Map();

        this.controls = controls;
        this.isViewingMap = false;

        this.initialGlobeRotation = {
            x: Math.PI * 0.2, // Ruotato di 0.2 radianti sull'asse X
            y: Math.PI * 1.4, // Ruotato di 1.4 radianti sull'asse Y
            z: 0
        }

        this.initialCameraPosition = {
            x: this.camera.position.x,
            y: this.camera.position.y,
            z: this.camera.position.z
        }
    }

    handlePointerMove(event) {
        const rect = this.globeContainer.getBoundingClientRect();
        
        if (this.isPointerInBounds(event, rect)) {
            if(this.imageLabels.getActiveLabels().length > 0){
                if(this.currentHoveredPoint){
                    this.hideTooltip();
                }
            document.body.style.cursor = 'default';
            return;
            }

            this.updatePointerCoordinates(event, rect);
            this.raycaster.setFromCamera(this.pointer, this.camera);
            
            // Usa solo i punti effettivamente visibili per l'hover
            const visiblePointObjects = this.getVisiblePointObjects();
            const intersects = this.raycaster.intersectObjects(visiblePointObjects);
            
            if (intersects.length > 0) {
                const hoveredPoint = intersects[0].object.userData.parentPoint;
                
                // Doppio controllo: verifica ancora che il punto sia visibile
                if (this.isPointVisible(hoveredPoint)) {
                    // Se è un nuovo punto, mostra il tooltip
                    if (this.currentHoveredPoint !== hoveredPoint) {
                        this.currentHoveredPoint = hoveredPoint;
                        this.showTooltip(hoveredPoint, event);
                    } else {
                        // Aggiorna solo la posizione del tooltip
                        this.positionTooltip(event);
                    }
                    
                    document.body.style.cursor = 'pointer';
                } else {
                    // Il punto non è più visibile, nascondi il tooltip
                    if (this.currentHoveredPoint) {
                        this.hideTooltip();
                    }
                    document.body.style.cursor = 'default';
                }
            } else {
                // Nessun punto sotto il cursore
                if (this.currentHoveredPoint) {
                    this.hideTooltip();
                }
                document.body.style.cursor = 'default';
            }
        } else {
            // Mouse fuori dai bounds
            if (this.currentHoveredPoint) {
                this.hideTooltip();
            }
            document.body.style.cursor = 'default';
        }
    }

    handleClick(event) {
        const rect = this.globeContainer.getBoundingClientRect();
        
        if (!this.isPointerInBounds(event, rect)) return;
        
        if (this.imageLabels.isAnimating()) {
            console.log("Animazioni in corso, click ignorato");
            return;
        }

        this.hideTooltip();

        if(this.imageLabels.getActiveLabels().length > 0){
            return;
        }
        
        this.updatePointerCoordinates(event, rect);
        this.raycaster.setFromCamera(this.pointer, this.camera);
        
        // Check for point clicks
        const visiblePointObjects = this.getVisiblePointObjects();
        const intersectsPoints = this.raycaster.intersectObjects(visiblePointObjects);
        
        if (intersectsPoints.length > 0) {
            this.handlePointClick(intersectsPoints[0]);
            return;
        }
        
        // Check for label clicks
        const labelMeshes = this.imageLabels.getActiveLabels().map(label => label.mesh);
        const intersectsLabels = this.raycaster.intersectObjects(labelMeshes);
        
        if (intersectsLabels.length > 0) {
            const clickedPoint = intersectsPoints[0].object.userData.parentPoint;
            
            // Doppio controllo: verifica ancora che il punto sia visibile prima del click
            if (this.isPointVisible(clickedPoint)) {
                this.handlePointClick(intersectsPoints[0]);
                return;
            }
        }
        if (intersectsLabels.length > 0) {
            this.handleLabelClick(intersectsLabels[0]);
            return;
        }
        
    }


    // Helper methods
    isPointerInBounds(event, rect) {
        return event.clientX >= rect.left && 
               event.clientX <= rect.right && 
               event.clientY >= rect.top && 
               event.clientY <= rect.bottom;
    }

    updatePointerCoordinates(event, rect) {
        this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    }

    getAllPointObjects() {
        const allPointObjects = [];
        this.points.forEach(point => {
            point.mesh.children.forEach(childMesh => {
                allPointObjects.push(childMesh);
            });
        });
        return allPointObjects;
    }

    getVisiblePointObjects() {
        const allPointObjects = [];
        
        this.points.forEach(point => {
            if (this.isPointVisible(point)) {
                point.mesh.children.forEach(childMesh => {
                    childMesh.userData.parentPoint = point;
                    allPointObjects.push(childMesh);
                });
            }
        });
        
        return allPointObjects;
    }

    isPointVisible(point) {
        const pointPosition = new THREE.Vector3().setFromMatrixPosition(point.mesh.matrixWorld);
        const cameraDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
        const pointDirection = new THREE.Vector3().subVectors(pointPosition, this.camera.position).normalize();
        
        const dotProduct = cameraDirection.dot(pointDirection);
        
        // Check if point is occluded by globe
        const raycasterFromPoint = new THREE.Raycaster();
        raycasterFromPoint.set(pointPosition, new THREE.Vector3().subVectors(this.camera.position, pointPosition).normalize());
        
        const globeMesh = this.group.children[0];
        const intersections = raycasterFromPoint.intersectObject(globeMesh);
        
        return dotProduct > 0 && intersections.length === 0;
    }

    async handlePointClick(intersection) {
        const clickedPoint = intersection.object.userData.parentPoint;
        console.log("Punto cliccato:", clickedPoint.name);

        this.updatePlaceName(clickedPoint.name);
        this.autoRotateController.disable();

        if (clickedPoint.coord_id) {
            await this.updateMapCountForPoint(clickedPoint.coord_id);
        }
        
        if (!this.imageLabels.hasLabel(clickedPoint)) {
            this.imageLabels.createLabelForPoint(clickedPoint, this.group, this.scene, this.camera);

            if(this.controls){
                this.controls.enabled = false; 
                this.isViewingMap = true;
            }
            
            this.uiManager.hideHTMLElements();
            this.uiManager.showMapElements();
            
            rotateGlobeToPoint(this.group, clickedPoint, this.camera, () => {
                console.log("Rotazione completata");
            });

            this.cameraManager.zoomToPoint(clickedPoint, this.scene, this.imageLabels);
        }
    }

    updatePlaceName(placeName) {
        const mappeElement = document.querySelector('.mappe-name');
        if(mappeElement) {
            mappeElement.textContent = placeName;
        }
    }

    async updateMapCountForPoint(coordId) {
        console.log("contando le mappe")
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/coordinates/${coordId}/maps/count`);
            //console.log("risposta ricevuta", response);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            this.updateMapCount(data.count);

            
            // Salva l'ID coordinata per uso futuro (per il pulsante Esplora)
            this.currentCoordId = coordId;
            
        } catch (error) {
            console.error('Errore nel recupero del numero di mappe:', error);
            this.updateMapCount(0); // Fallback
        }
    }

    updateMapCount(count) {
        console.log("Aggiornamento numero mappe:", count);
        setTimeout(() => {
            const numeroMappeElement = document.getElementById('numero-mappe');
            if (numeroMappeElement) {
                numeroMappeElement.textContent = count;
                console.log("Aggiornamento riuscito");
            } else {
                console.warn("Elemento #numero-mappe non trovato nel timeout");
            }
        }, 500); // ritardo di mezzo secondo
    }


    handleLabelClick(intersection) {
        const clickedLabel = intersection.object;
        const labelData = this.imageLabels.getActiveLabels().find(label => label.mesh === clickedLabel);
        
        if (labelData) {
            console.log("Click su miniatura");
            // Add additional logic as needed
        }
    }

    /* handleClickOut() {
        if (this.imageLabels.getActiveLabels().length > 0) {
            console.log("Click out - chiusura di tutte le etichette");
            
            this.uiManager.showHTMLElements();
            this.uiManager.hideMapElements();
            this.cameraManager.zoomOut();
            
            this.imageLabels.getActiveLabels().forEach((label) => {
                this.imageLabels.removeLabelForPoint(label.point);
            });
        }
    } */

    handleClickCloseMap(){
        const closeButton = document.querySelector('.close-map');
        if(closeButton){
            closeButton.addEventListener('click', () => {
                console.log("chiusura per il click su croce");

                if(this.controls){
                    this.controls.enabled = true; // Riabilito i controlli
                    this.isViewingMap = false;
                }
                this.uiManager.showHTMLElements();
                this.uiManager.hideMapElements();
                this.cameraManager.zoomOut();
                this.imageLabels.getActiveLabels().forEach((label) => {
                this.imageLabels.removeLabelForPoint(label.point);
                });
            })
        }    
    }

    canEnableControls() {
        return !this.isViewingMap;
    }

    dispose(){
        if(this.tooltip && this.tooltip.parentNode) {
            this.tooltip.parentNode.removeChild(this.tooltip);
        }
        this.tooltipCache.clear();
    }

    createTooltip(){
        const tooltip = document.createElement('div');
        tooltip.id = 'marker-tooltip';
        tooltip.className = 'marker-tooltip';
        tooltip.innerHTML = `
            <div class="tooltip-title"></div>
            <div class="tooltip-count"></div>
            <div class="tooltip-arrow"></div>
         `;
        document.body.appendChild(tooltip);
        return tooltip;
    }


    async showTooltip(point, event){
        const titleElement = this.tooltip.querySelector('.tooltip-title');
        const countElement = this.tooltip.querySelector('.tooltip-count');

        titleElement.textContent = point.name;
        countElement.textContent = 'Caricamento...';

        this.positionTooltip(event);
        this.tooltip.classList.add('visible');

        const mapCount = await this.getMapCountForPoint(point);

        if(this.currentHoveredPoint === point){
            countElement.textContent = `${mapCount} mappe disponibili`;
        }
    }

    hideTooltip() {
        this.tooltip.classList.remove('visible');
        this.currentHoveredPoint = null;
    }

    positionTooltip(event) {
        const tooltipRect = this.tooltip.getBoundingClientRect();
        const x = event.clientX - tooltipRect.width / 2;
        const y = event.clientY - tooltipRect.height - 15; 

        this.tooltip.style.left = `${Math.max(10, Math.min(x, window.innerWidth - tooltipRect.width - 10))}px`;
        this.tooltip.style.top = `${Math.max(10, y)}px`;
    }

    async getMapCountForPoint(point) {
        if(!point.coord_id){
            return 0; // Nessun ID coordinata disponibile
        }
        if(this.tooltipCache.has(point.coord_id)) {
            return this.tooltipCache.get(point.coord_id);
        }

        try{
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/coordinates/${point.coord_id}/maps/count`);
            if(!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const count = data.count || 0;

            this.tooltipCache.set(point.coord_id, count);

            return count;
        } catch (error) {
            console.error('Errore nel recupero del numero di mappe:', error);
            return 0; // Fallback in caso di errore
        }
    }

    repositionGLobe(){
        console.log("Riposizionamento globo...");
        
        gsap.killTweensOf(this.group.rotation);
        gsap.killTweensOf(this.camera.position);
        
        // Chiudi tutte le etichette aperte
        if (this.imageLabels.getActiveLabels().length > 0) {
            this.uiManager.showHTMLElements();
            this.uiManager.hideMapElements();
            
            this.imageLabels.getActiveLabels().forEach((label) => {
                this.imageLabels.removeLabelForPoint(label.point);
            });
        }
        this.isViewingMap = false;
        const tl = gsap.timeline({
            onComplete: () => {
                if (this.autoRotateController) {
                    this.autoRotateController.enable();
                }
                
                console.log("Riposizionamento completato");
            }
        });
        
        // Anima la rotazione del globo alle posizioni iniziali
        tl.to(this.group.rotation, {
            x: this.initialGlobeRotation.x,
            y: this.initialGlobeRotation.y,
            z: this.initialGlobeRotation.z,
            duration: 1.5,
            ease: "power2.inOut"
        }, 0);
        
        // Anima la camera alla posizione iniziale
        tl.to(this.camera.position, {
            x: this.initialCameraPosition.x,
            y: this.initialCameraPosition.y,
            z: this.initialCameraPosition.z,
            duration: 1.5,
            ease: "power2.inOut"
        }, 0);
    }

    setupRepositionButton(){
        const repositionButton = document.querySelector('.reposition')
        if(repositionButton){
            repositionButton.addEventListener('click', () => {
                console.log("Riposizionamento globo richiesto");
                this.repositionGLobe();
            });
        }
    }

    async handleExploreClick() {
        console.log("Pulsante Esplora cliccato");
        
        if (!this.currentCoordId) {
            console.error("Nessun coordinate ID disponibile");
            return;
        }
        
        try {
            // Recupera tutte le mappe per questa coordinata
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/coordinates/${this.currentCoordId}/maps`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log("Dati ricevuti dall'API:", data);
            
            // Gestisci diversi formati di risposta
            let maps;
            if (Array.isArray(data)) {
                maps = data;
            } else if (data.maps && Array.isArray(data.maps)) {
                maps = data.maps;
            } else if (data.data && Array.isArray(data.data)) {
                maps = data.data;
            } else {
                console.warn("Formato dati non riconosciuto:", data);
                maps = [];
            }
            
            console.log("Mappe processate:", maps);
            
            if (maps.length === 0) {
                console.warn("Nessuna mappa trovata per questa coordinata");
                this.showNoMapsMessage();
                return;
            }
            
            // Mostra la griglia delle mappe nello stesso overlay
            this.showMapsGridInOverlay(maps);
            
        } catch (error) {
            console.error('Errore nel recupero delle mappe:', error);
            this.showErrorMessage('Errore nel caricamento delle mappe');
        }
    }

    showMapsGridInOverlay(maps, delay = 770) {
        console.log("Mostrando griglia mappe nell'overlay con delay di", delay, "ms");
        
        // Aspetta che l'animazione di chiusura della miniatura sia completata
        setTimeout(() => {
            // Trova il contenitore del globo
            const globeContainer = document.querySelector('.globe-container');
            if (!globeContainer) {
                console.error("Contenitore globo non trovato");
                return;
            }
            
            // Crea l'overlay che si sovrappone al globo
            const overlay = document.createElement('div');
            overlay.className = 'maps-grid-globe-overlay';
            overlay.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.6);
                z-index: 100;
                display: flex;
                flex-direction: column;
                opacity: 0;
                transition: opacity 0.3s ease;
            `;

            
            // Crea l'header con titolo e pulsante chiudi
            const header = document.createElement('div');
            header.className = 'maps-grid-header';
            header.style.cssText = `
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.2);
                flex-shrink: 0;
            `;
            
            const titleContainer = document.createElement('div');
            titleContainer.style.cssText = `
                display: flex;
                align-items: center;
                color: #f5f5f5;
            `;
            
            const title = document.createElement('h3');
            title.textContent = 'Mappe disponibili';
            title.style.cssText = `
                margin: 0;
                font-size: 18px;
                font-weight: 600;
            `;
            
            const count = document.createElement('span');
            count.textContent = ` (${maps.length})`;
            count.style.cssText = `
                color: rgba(245, 245, 245, 0.8);
                font-size: 14px;
                margin-left: 10px;
            `;
            
            const closeButton = document.createElement('button');
            closeButton.innerHTML = '×';
            closeButton.style.cssText = `
                background: none;
                border: none;
                color: #f5f5f5;
                font-size: 32px;
                cursor: pointer;
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: all 0.2s ease;
                line-height: 1;
            `;
            
            closeButton.addEventListener('mouseenter', () => {
                closeButton.style.background = 'rgba(255, 255, 255, 0.1)';
                closeButton.style.transform = 'scale(1.1)';
            });
            
            closeButton.addEventListener('mouseleave', () => {
                closeButton.style.background = 'none';
                closeButton.style.transform = 'scale(1)';
            });
            
            titleContainer.appendChild(title);
            titleContainer.appendChild(count);
            header.appendChild(titleContainer);
            header.appendChild(closeButton);
            
            // Crea il contenuto scrollabile
            const content = document.createElement('div');
            content.className = 'maps-grid-content';
            content.style.cssText = `
                flex: 1;
                overflow-y: auto;
                padding: 20px;
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
                gap: 15px;
                align-content: start;
            `;
            
            // Crea le carte delle mappe
            maps.forEach((map, index) => {
                const card = this.createMapCard(map, index);
                content.appendChild(card);
            });
            
            // Assembla l'overlay
            overlay.appendChild(header);
            overlay.appendChild(content);
            
            // Aggiungi l'overlay al contenitore del globo
            globeContainer.appendChild(overlay);
            
            // Mostra con animazione
            setTimeout(() => {
                overlay.style.opacity = '1';
            }, 50);
            
            // Setup listeners
            this.setupMapsGridListeners(overlay, maps);
            
            // Listener per il pulsante chiudi
            closeButton.addEventListener('click', () => {
                this.closeMapsGridOverlay();
            });
            
        }, delay); // Delay per aspettare l'animazione di chiusura della miniatura
    }

    closeMapsGridOverlay() {
        console.log("Chiudendo griglia mappe con fade-out lento");
        
        const overlay = document.querySelector('.maps-grid-globe-overlay');
        if (overlay) {
            // Cambia la transizione per renderla più lenta
            overlay.style.transition = 'opacity 0.8s ease-out';
            
            // Applica il fade-out
            overlay.style.opacity = '0';
            this.cameraManager.zoomOut();
            // Rimuovi l'elemento dopo che l'animazione è completata
            setTimeout(() => {
                if (overlay.parentNode) {
                    overlay.remove();
                    this.uiManager.showHTMLElementsPerExplore(false);
                }
            }, 950); // 800ms per completare l'animazione
        }
    }



    createMapsGridView(maps) {
        const mapsGridView = document.createElement('div');
        mapsGridView.className = 'maps-grid-view';
        
        // Crea l'header
        const header = document.createElement('div');
        header.className = 'maps-grid-header';
        
        const titleContainer = document.createElement('div');
        titleContainer.style.display = 'flex';
        titleContainer.style.alignItems = 'center';
        
        const title = document.createElement('h3');
        title.className = 'maps-grid-title';
        title.textContent = 'Mappe disponibili';
        
        const count = document.createElement('span');
        count.className = 'maps-count';
        count.textContent = `(${maps.length})`;
        
        titleContainer.appendChild(title);
        titleContainer.appendChild(count);
        
        const backButton = document.createElement('button');
        backButton.className = 'back-to-single';
        backButton.innerHTML = '←';
        backButton.title = 'Torna alla miniatura';
        
        header.appendChild(titleContainer);
        header.appendChild(backButton);
        
        // Crea il contenuto scrollabile
        const content = document.createElement('div');
        content.className = 'maps-grid-content';
        
        // Crea la griglia
        const grid = document.createElement('div');
        grid.className = 'maps-grid';
        
        // Crea le carte delle mappe
        maps.forEach((map, index) => {
            const card = this.createMapCard(map, index);
            grid.appendChild(card);
        });
        
        content.appendChild(grid);
        
        // Assembla tutto
        mapsGridView.appendChild(header);
        mapsGridView.appendChild(content);
        
        return mapsGridView;
    }

    createMapCard(map, index) {
    const card = document.createElement('div');
    card.className = 'map-card';
    card.dataset.mapIndex = index;
    card.style.cssText = `
        background-color: #2c2c2c;
        border-radius: 16px;
        overflow: hidden;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
        width: 100%;
        max-width: 500px; /* PIÙ GRANDE */
        aspect-ratio: 1 / 1; /* SEMPRE QUADRATA */
        position: relative;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
    `;

    card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-10px)';
        card.style.boxShadow = '0 18px 48px rgba(0, 0, 0, 0.5)';
    });

    card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0)';
        card.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.4)';
    });

    const imageContainer = document.createElement('div');
    imageContainer.style.cssText = `
        width: 100%;
        height: 100%;
        position: relative;
        background-color: #1a1a1a;
    `;

    const img = document.createElement('img');
    img.src = `${import.meta.env.VITE_BACKEND_URL}/api/maps/${map.id}/image`;
    img.style.cssText = `
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.3s ease, filter 0.3s ease;
        filter: sepia(20%) saturate(1.2) brightness(0.9);
    `;

    card.addEventListener('mouseenter', () => {
        img.style.transform = 'scale(1.05)';
        img.style.filter = 'sepia(10%) saturate(1.3) brightness(1)';
    });

    card.addEventListener('mouseleave', () => {
        img.style.transform = 'scale(1)';
        img.style.filter = 'sepia(20%) saturate(1.2) brightness(0.9)';
    });

    imageContainer.appendChild(img);

    const titleOverlay = document.createElement('div');
    titleOverlay.style.cssText = `
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
        padding: 40px 20px 20px 20px;
        pointer-events: none;
    `;

    const titleEl = document.createElement('h4');
    titleEl.textContent = map.title || map.name || 'Italia, 1983';
    titleEl.style.cssText = `
        color: #ffffff;
        font-size: 22px;
        font-weight: 700;
        margin: 0;
        line-height: 1.2;
        text-shadow: 2px 2px 6px rgba(0, 0, 0, 0.8);
        font-family: 'Arial', sans-serif;
        letter-spacing: 0.5px;
    `;

    titleOverlay.appendChild(titleEl);
    imageContainer.appendChild(titleOverlay);
    card.appendChild(imageContainer);

    return card;
}



    setupMapsGridListeners(overlay, maps) {
        // Listener per le carte delle mappe
        const mapCards = overlay.querySelectorAll('.map-card');
        mapCards.forEach((card, index) => {
            card.addEventListener('click', () => {
                const mapData = maps[index];
                this.handleMapCardClick(mapData);
            });
        });
    }

    hideMapsGridFromOverlay() {
        console.log("Nascondendo griglia mappe dall'overlay");
        this.closeMapsGridOverlay();
    }


hideMapsGridFromOverlay() {
    console.log("Nascondendo griglia mappe dall'overlay");
    
    const miniatureContainer = document.querySelector('.miniature-container');
    const mapsGridView = document.querySelector('.maps-grid-view');
    
    if (miniatureContainer && mapsGridView) {
        // Anima l'uscita
        mapsGridView.classList.remove('visible');
        
        // Rimuovi la classe di visualizzazione griglia
        setTimeout(() => {
            miniatureContainer.classList.remove('showing-grid');
            
            // Rimuovi l'elemento della griglia
            if (mapsGridView.parentNode) {
                mapsGridView.parentNode.removeChild(mapsGridView);
            }
        }, 300);
    }
}

handleMapCardClick(mapData) {
    console.log("Carta mappa cliccata:", mapData);
    
    // Qui puoi implementare la logica per aprire la mappa singola
    // Ad esempio, aprire in una nuova finestra o modale
    if (mapData.url || mapData.image) {
        window.open(mapData.url || mapData.image, '_blank');
    }
}

    showNoMapsMessage() {
        // Mostra un messaggio quando non ci sono mappe
        const message = document.createElement('div');
        message.className = 'no-maps-message';
        message.innerHTML = `
            <div class="message-content">
                <h3>Nessuna mappa disponibile</h3>
                <p>Non sono state trovate mappe per questa località.</p>
                <button class="close-message">Chiudi</button>
            </div>
        `;
        
        document.body.appendChild(message);
        
        // Event listener per chiudere il messaggio
        const closeButton = message.querySelector('.close-message');
        closeButton.addEventListener('click', () => {
            message.remove();
        });
        
        // Rimuovi automaticamente dopo 3 secondi
        setTimeout(() => {
            if (message.parentNode) {
                message.remove();
            }
        }, 3000);
    }

    showErrorMessage(errorText) {
        // Mostra un messaggio di errore
        const message = document.createElement('div');
        message.className = 'error-message';
        message.innerHTML = `
            <div class="message-content">
                <h3>Errore</h3>
                <p>${errorText}</p>
                <button class="close-message">Chiudi</button>
            </div>
        `;
        
        document.body.appendChild(message);
        
        // Event listener per chiudere il messaggio
        const closeButton = message.querySelector('.close-message');
        closeButton.addEventListener('click', () => {
            message.remove();
        });
        
        // Rimuovi automaticamente dopo 5 secondi
        setTimeout(() => {
            if (message.parentNode) {
                message.remove();
            }
        }, 5000);
    }

    closeMiniature() {
        // Chiudi tutte le etichette attive (miniature)
        this.imageLabels.getActiveLabels().forEach((label) => {
            this.imageLabels.removeLabelForPoint(label.point);
        });
        
        // Nascondi gli elementi della mappa singola
        this.uiManager.hideMapElements();
    }

    showMapsGrid(maps) {
        // Mantieni il globo visibile e mostra la griglia
        this.uiManager.showMapsGrid(maps);
    }

    setupExploreButton() {
        const exploreButton = document.querySelector('.esplora');
        if (exploreButton) {
            exploreButton.addEventListener('click', () => {
                this.handleExploreClick();
                this.imageLabels.getActiveLabels().forEach((label) => {
                    this.imageLabels.removeLabelForPoint(label.point);
                });
                this.uiManager.hideMiniatureOnExplore();
            });
        }
    }

    handleBackToSingleView() {
    // Se stiamo mostrando la griglia, torna alla miniatura
    const miniatureContainer = document.querySelector('.miniature-container');
    if (miniatureContainer && miniatureContainer.classList.contains('showing-grid')) {
        this.hideMapsGridFromOverlay();
    } else {
        // Altrimenti chiudi completamente l'overlay
        this.handleClickCloseMap();
    }
}

    setupBackFromGridButton() {
        const backButton = document.querySelector('.back-from-grid, .close-grid');
        if (backButton) {
            backButton.addEventListener('click', () => {
                this.handleBackToSingleView();
            });
        }
    }

    async handleAllMapsbutton(){
        console.log("Pulsante Esplora Tutto cliccato");
            try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/maps`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log("Tutte le mappe ricevute:", data);

            let maps;
            if (Array.isArray(data)) {
                maps = data;
            } else if (data.maps && Array.isArray(data.maps)) {
                maps = data.maps;
            } else if (data.data && Array.isArray(data.data)) {
                maps = data.data;
            } else {
                console.warn("Formato dati non riconosciuto:", data);
                maps = [];
            }

            if (maps.length === 0) {
                this.showNoMapsMessage();
                return;
            }

            // Mostra le mappe in overlay come al solito
            this.showMapsGridInOverlay(maps);

        } catch (error) {
            console.error('Errore nel recupero di tutte le mappe:', error);
            this.showErrorMessage('Errore nel caricamento delle mappe');
        }
    }


}