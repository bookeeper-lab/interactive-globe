import { MapsService } from "./mapsService";

export class MapsUI {
     constructor() {
        this.mapsService = new MapsService();
        this.mapsListContainer = document.getElementById('historical-maps');
        this.searchInput = document.getElementById('search-map');
        this.searchButton = document.getElementById('search-btn');
        this.comuneNameElement = document.getElementById('comune-name');
        
        // Uso un ID predefinito (1) per lo sviluppo
        // Normalmente questo valore verrebbe preso dall'elemento HTML
        this.comuneId = 1; // ID predefinito impostato a 1
        this.comuneName = this.comuneNameElement ? this.comuneNameElement.textContent : 'Comune Default';
        
        console.log(`Inizializzato MapsUI per comune: ${this.comuneName} (ID predefinito: ${this.comuneId})`);
        
        // Opzionalmente, imposta gli event listener
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Esempio di setup degli event listener
        if (this.searchButton) {
            this.searchButton.addEventListener('click', () => {
                if (this.searchInput && this.searchInput.value) {
                    this.searchMaps(this.searchInput.value);
                }
            });
        }
    }
    
    async loadMapsForCurrentComune() {
        try {
            console.log(`Caricamento mappe per il comune ID: ${this.comuneId}`);
            const maps = await this.mapsService.getMapsByComune(this.comuneId);
            console.log(`Ricevute ${maps ? maps.length : 0} mappe`);
            this.renderMaps(maps);
        } catch (error) {
            console.error('Errore durante il caricamento delle mappe:', error);
            this.showErrorMessage('Errore durante il caricamento delle mappe');
        }
    }

    async loadMapsForCurrentDigitalLibrary(){
        const historicalMapsContainer = document.getElementById('historical-maps');

        historicalMapsContainer.innerHTML = '';

        const maps = await this.mapsService.getMapsByComune(this.comuneId);

        if(!Array.isArray(maps)){
            console.error('Errore: maps non è un array', maps);
            return;
        }

        maps.forEach(map => {
            const img = document.createElement('img');
            img.src =  "http://localhost:3000" + map.url;
            console.log('URL immagine per ca:', map.url);
            img.alt = map.fileName || 'Mappa senza titolo';
            img.classList.add('map-image');
            

            const wrapper = document.createElement('div');
            wrapper.classList.add('map-wrapper');
            wrapper.appendChild(img);

            const tittle = document.createElement('p');
            tittle.textContent = map.title || 'Mappa senza titolo';
            tittle.classList.add('map-title');
            wrapper.appendChild(tittle);

            historicalMapsContainer.appendChild(wrapper);
        })

    }

    async searchMaps(searchTerm) {
        try {
            console.log(`Ricerca mappe con termine: ${searchTerm}`);
            const maps = await this.mapsService.searchMaps(searchTerm);
            this.renderMaps(maps);
        } catch (error) {
            console.error('Errore durante la ricerca delle mappe:', error);
            this.showErrorMessage('Errore durante la ricerca delle mappe');
        }
    }

    renderMaps(maps) {
        // Pulisce il contenitore delle mappe
        this.mapsListContainer.innerHTML = '';
        
        if (!maps || maps.length === 0) {
            this.mapsListContainer.innerHTML = '<p class="no-maps">Nessuna mappa trovata</p>';
            return;
        }
        
        // Crea un elemento per ogni mappa
        maps.forEach(map => {
            const mapItem = this.createMapItem(map);
            this.mapsListContainer.appendChild(mapItem);
        });
    }

    // Crea un elemento DOM per una singola mappa
    createMapItem(map) {
        const mapItem = document.createElement('div');
        mapItem.className = 'map-item';
        mapItem.dataset.mapId = map.id;
        
        const thumbnail = document.createElement('div');
        thumbnail.className = 'map-thumbnail';
        
        // Se la mappa ha un'immagine di anteprima, la utilizziamo
        if (map.thumbnailUrl) {
            const img = document.createElement('img');
            img.src = map.thumbnailUrl;
            img.alt = map.title;
            thumbnail.appendChild(img);
        } else {
            // Altrimenti, utilizziamo un placeholder
            thumbnail.innerHTML = '<div class="placeholder-thumbnail">No Image</div>';
        }
        
        const info = document.createElement('div');
        info.className = 'map-info';
        
        const title = document.createElement('h4');
        title.textContent = map.title || 'Mappa senza titolo';
        
        const date = document.createElement('p');
        date.className = 'map-date';
        date.textContent = map.date || 'Data sconosciuta';
        
        info.appendChild(title);
        info.appendChild(date);
        
        mapItem.appendChild(thumbnail);
        mapItem.appendChild(info);
        
        // Aggiungiamo l'event listener per il click sulla mappa
        mapItem.addEventListener('click', () => {
            this.selectMap(map);
        });
        
        return mapItem;
    }

    selectMap(map) {
        // Implementa la logica per selezionare una mappa
        console.log("Mappa selezionata:", map);
        // Ad esempio, potrebbe emettere un evento personalizzato
        const event = new CustomEvent('mapSelected', { detail: map });
        document.dispatchEvent(event);
    }

    showErrorMessage(message) {
        this.mapsListContainer.innerHTML = `<p class="error-message">${message}</p>`;
    }
}
    
