class SearchManager {
    
    constructor() {
        this.searchInput = document.getElementById('search-input');
        this.searchDropdown = document.getElementById('search-dropdown');
        this.searchResults = document.getElementById('search-results');
        this.searchTimeout = null;
        this.hideTimeout = null; // Timeout per la chiusura animata
        
        // Configura l'URL del backend
        this.backendUrl = import.meta.env.VITE_BACKEND_URL;
        
        this.init();
    }
    
    init() {
        this.searchInput.addEventListener('input', (e) => this.handleInput(e));
        this.searchInput.addEventListener('focus', () => this.handleFocus());
        document.addEventListener('click', (e) => this.handleOutsideClick(e));
    }

    handleInput(e) {
        const query = e.target.value.trim();
        console.log('Input:', query);
        clearTimeout(this.searchTimeout);
        clearTimeout(this.hideTimeout); // Cancella timeout di chiusura se presente

        this.searchTimeout = setTimeout(() => {
            this.performSearch(query);
        }, 300);
    }

    handleFocus() {
        if (this.searchInput.value.trim().length >= 2) {
            this.showDropdown();
        }
    }

    handleOutsideClick(e) {
        if (!this.searchDropdown.contains(e.target) && e.target !== this.searchInput) {
            this.hideDropdown();
        }
    }

    async performSearch(query) {
        if (query.length < 2) {
            this.hideDropdown();
            return;
        }

        this.showLoading();

        try {
            const response = await fetch(`${this.backendUrl}/api/search?q=${encodeURIComponent(query)}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const results = await response.json();
            console.log('Risultati ricevuti:', results);
            
            this.displayResults(results);
        } catch (error) {
            console.error('Errore nella ricerca:', error);
            this.showError();
        }
    }

    showLoading() {
        this.searchResults.innerHTML = '<div class="search-loading">Ricerca in corso...</div>';
        this.showDropdown();
    }

    showError() {
        this.searchResults.innerHTML = '<div class="search-no-results">Errore nella ricerca</div>';
    }

    displayResults(results) {
        if (results.length === 0) {
            this.searchResults.innerHTML = '<div class="search-no-results">Nessun risultato trovato</div>';
            return;
        }

        const resultsHtml = results.map(result => `
            <div class="search-result-item" data-map-id="${result.id}" data-coords="${result.Coordinate ? result.Coordinate.latitude + ',' + result.Coordinate.longitude : ''}">
                <div class="search-result-title">${result.title}</div>
                <div class="search-result-details">
                    ${result.location ? result.location + ' • ' : ''}
                    ${result.creator ? 'di ' + result.creator + ' • ' : ''}
                    ${result.Digital_Library ? result.Digital_Library.name : ''}
                </div>
            </div>
        `).join('');

        this.searchResults.innerHTML = resultsHtml;
        this.attachResultListeners();
    }

    attachResultListeners() {
        document.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', () => this.handleResultClick(item));
        });
    }

    handleResultClick(item) {
        const mapId = item.dataset.mapId;
        const coords = item.dataset.coords;
        const title = item.querySelector('.search-result-title').textContent;
        
        this.searchInput.value = title;
        this.hideDropdown();
        
        if (coords) {
            const [lat, lng] = coords.split(',').map(Number);
            this.centerGlobeOnLocation(lat, lng);
        }
        
        // Aggiorna info mappa
        document.getElementById('mappe-info').textContent = title;
    }

    centerGlobeOnLocation(lat, lng) {
        console.log('Centra globo su:', lat, lng);
    }

    showDropdown() {
        // Cancella qualsiasi timeout di chiusura pendente
        clearTimeout(this.hideTimeout);
        
        // Rimuovi classe hiding se presente
        this.searchDropdown.classList.remove('hiding');
        
        // Mostra il dropdown con animazione
        this.searchDropdown.classList.add('show');
    }

    hideDropdown() {
        // Aggiungi classe hiding per l'animazione di chiusura
        this.searchDropdown.classList.add('hiding');
        this.searchDropdown.classList.remove('show');
        
        // Dopo l'animazione, nascondi completamente l'elemento
        this.hideTimeout = setTimeout(() => {
            this.searchDropdown.classList.remove('hiding');
        }, 200); // Stesso tempo della transizione CSS (0.2s)
    }
}

// Inizializza quando il DOM è pronto
document.addEventListener('DOMContentLoaded', () => {
    new SearchManager();
});