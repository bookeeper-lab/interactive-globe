import * as THREE from 'three';
import { rotateGlobeToPoint } from '../core/marker.js';

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
            console.log("aspettando il conteggio")
            await this.updateMapCountForPoint(clickedPoint.coord_id);
        }
        
        if (!this.imageLabels.hasLabel(clickedPoint)) {
            this.imageLabels.createLabelForPoint(clickedPoint, this.group, this.scene, this.camera);

            if(this.controls){
                this.controls.enabled = false; // Disabilita i controlli della telecamera durante l'interazione
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
}