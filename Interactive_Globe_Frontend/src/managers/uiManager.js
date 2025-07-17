import gsap from 'gsap';

export class UIManager {
    constructor() {
        this.elementsToHide = [
            '.search-comune-container', 
            '.helper',
            '.zoom-controls'
        ];
        
        this.mapElements = [
            '.mappe-info',
            '.close-map', 
            '.mappe-name',
            '.esplora'
        ];
    }

     hideMiniatureOnExplore() {
        console.log("Nascondendo miniatura al clic di Esplora");
        
        // Nascondi gli elementi della mappa (miniatura e pulsante esplora)
        this.mapElements.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) {
                gsap.to(element, {
                    opacity: 0,
                    duration: 0.3,
                    ease: "power2.out",
                    onComplete: () => {
                        element.style.pointerEvents = 'none';
                    }
                });
            }
        });
        this.hideMapElements();
    }

    showHTMLElementsPerExplore(hide = true) {
        this.elementsToHide.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) {
                if (hide) {
                    // Nasconde con animazione fade-out
                    gsap.to(element, {
                        opacity: 0,
                        duration: 0.3,
                        ease: "power2.out",
                        onComplete: () => {
                            element.style.pointerEvents = 'none';
                        }
                    });
                } else {
                    // Mostra con animazione fade-in
                    element.style.pointerEvents = 'auto';
                    gsap.to(element, {
                        opacity: 1,
                        duration: 0.3,
                        ease: "power2.out",
                        //delay: 0.2
                    });
                }
            }
        });
    }


    toggleHTMLElements(hide = true) {
        this.elementsToHide.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) {
                if (hide) {
                    // Nasconde con animazione fade-out
                    gsap.to(element, {
                        opacity: 0,
                        duration: 0.3,
                        ease: "power2.out",
                        onComplete: () => {
                            element.style.pointerEvents = 'none';
                        }
                    });
                } else {
                    // Mostra con animazione fade-in
                    element.style.pointerEvents = 'auto';
                    gsap.to(element, {
                        opacity: 1,
                        duration: 0.3,
                        ease: "power2.out",
                        delay: 0.8
                    });
                }
            }
        });
    }


    

    toggleMapElements(show, numeroMappe = 0) {
        if (show) {
            // Aggiorna il numero di mappe
            const numeroMappeSpan = document.getElementById('numero-mappe');
            if (numeroMappeSpan) {
                numeroMappeSpan.textContent = numeroMappe;
            }
            
            // Mostra elementi con animazione fade-in
            this.mapElements.forEach(selector => {
                const element = document.querySelector(selector);
                if (element) {
                    element.style.pointerEvents = 'auto';
                    gsap.to(element, {
                        opacity: 1,
                        duration: 0.3,
                        ease: "power2.out",
                        delay: 0.8
                    });
                }
            });
            
        } else {
            // Nasconde elementi con animazione fade-out
            this.mapElements.forEach(selector => {
                const element = document.querySelector(selector);
                if (element) {
                    gsap.to(element, {
                        opacity: 0,
                        duration: 0.3,
                        ease: "power2.out",
                        onComplete: () => {
                            element.style.pointerEvents = 'none';
                        }
                    });
                }
            });
        }
    } 


    showMapsGrid(maps) {
        // Crea il container della griglia se non esiste
        let gridContainer = document.querySelector('.maps-grid-container');
        
        if (!gridContainer) {
            gridContainer = this.createGridContainer();
            document.body.appendChild(gridContainer);
        }
        
        // Popola la griglia con le mappe
        this.populateGrid(gridContainer, maps);
        
        // Mostra la griglia con animazione
        requestAnimationFrame(() => {
            gridContainer.classList.add('visible');
        });
    }

    createGridContainer() {
        const container = document.createElement('div');
        container.className = 'maps-grid-container';
        
        container.innerHTML = `
            <div class="maps-grid-overlay">
                <div class="maps-grid-header">
                    <button class="close-grid">×</button>
                    <h3 class="grid-title">Mappe disponibili</h3>
                </div>
                <div class="maps-grid-content">
                    <div class="maps-grid"></div>
                </div>
            </div>
        `;
        
        return container;
    }

    populateGrid(container, maps) {
        const grid = container.querySelector('.maps-grid');
        const title = container.querySelector('.grid-title');
        
        // Aggiorna il titolo con il numero di mappe
        title.textContent = `${maps.length} mappe disponibili`;
        
        // Pulisci la griglia precedente
        grid.innerHTML = '';
        
        // Aggiungi ogni mappa alla griglia
        maps.forEach((map, index) => {
            const mapCard = this.createMapCard(map, index);
            grid.appendChild(mapCard);
        });
    }

    createMapCard(map, index) {
        const card = document.createElement('div');
        card.className = 'map-card';
        card.setAttribute('data-map-id', map.id);
        
        const imageUrl = `${import.meta.env.VITE_BACKEND_URL}/api/maps/${map.id}/image`;
        
        card.innerHTML = `
            <div class="map-card-image">
                <img src="${imageUrl}" alt="${map.title}" loading="lazy">
            </div>
            <div class="map-card-info">
                <h4 class="map-title">${map.title}</h4>
                <p class="map-description">${map.location || 'Nessuna descrizione'}</p>
                ${map.year ? `<span class="map-year">${map.year}</span>` : ''}
            </div>
        `;
        
        // Aggiungi event listener per il click sulla mappa
        card.addEventListener('click', () => {
            this.handleMapCardClick(map);
        });
        
        return card;
    }

    handleMapCardClick(map) {
        console.log("Mappa selezionata:", map.title);
        
        // Qui puoi implementare la logica per:
        // - Aprire la mappa in vista dettagliata
        // - Mostrare informazioni aggiuntive
        // - Permettere download o altre azioni
        
        // Esempio: aprire la mappa in una modale
        this.openMapModal(map);
    }

    openMapModal(map) {
        // Crea e mostra una modale con la mappa selezionata
        const modal = document.createElement('div');
        modal.className = 'map-modal';
        
        const imageUrl = `${import.meta.env.VITE_BACKEND_URL}/api/maps/${map.id}/image`;
        
        modal.innerHTML = `
            <div class="map-modal-content">
                <div class="map-modal-header">
                    <h3>${map.title}</h3>
                    <button class="close-modal">×</button>
                </div>
                <div class="map-modal-body">
                    <img src="${imageUrl}" alt="${map.title}" class="modal-map-image">
                    <div class="map-modal-info">
                        <p><strong>Luogo:</strong> ${map.location || 'Non specificato'}</p>
                        ${map.year ? `<p><strong>Anno:</strong> ${map.year}</p>` : ''}
                        ${map.description ? `<p><strong>Descrizione:</strong> ${map.description}</p>` : ''}
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Event listener per chiudere la modale
        const closeButton = modal.querySelector('.close-modal');
        closeButton.addEventListener('click', () => {
            modal.remove();
        });
        
        // Chiudi cliccando fuori dalla modale
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        // Mostra la modale
        requestAnimationFrame(() => {
            modal.classList.add('visible');
        });
    }

    hideMapsGrid() {
        const gridContainer = document.querySelector('.maps-grid-container');
        if (gridContainer) {
            gridContainer.classList.remove('visible');
            
            // Rimuovi il container dopo l'animazione
            setTimeout(() => {
                if (gridContainer.parentNode) {
                    gridContainer.parentNode.removeChild(gridContainer);
                }
            }, 300);
        }
    }

    

    showHTMLElements() {
        this.toggleHTMLElements(false);
    }

    hideHTMLElements() {
        this.toggleHTMLElements(true);
    }

    showMapElements() {
        this.toggleMapElements(true);
    }

    hideMapElements() {
        this.toggleMapElements(false);
    }
}