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

        const resultsHtml = results.map(result => this.createResultItem(result)).join('');
        this.searchResults.innerHTML = resultsHtml;
        this.attachResultListeners();
    }

    createResultItem(result) {
        // Gestisci i campi che potrebbero non esistere
        const thumbnail = this.getThumbnailHTML(result);
        const località = result.location || 'Non specificata';
        const periodo = result.historical_period || result.period || result.year || 'Non specificato';
        const autore = result.creator || 'Autore sconosciuto';
        const biblioteca = result.Digital_Library ? result.Digital_Library.name : '';
        const titolo = result.title || 'Mappa senza titolo';

        return `
            <div class="search-result-item" data-map-id="${result.id}" data-coords="${result.Coordinate ? result.Coordinate.latitude + ',' + result.Coordinate.longitude : ''}">
                ${thumbnail}
                
                <div class="search-result-content">
                    <div class="search-result-title">${this.escapeHTML(titolo)}</div>
                    
                    <div class="search-result-details">
                        <div class="search-result-field">
                            <i class="bi bi-geo-alt search-result-icon"></i>
                            <span class="search-result-label">Località:</span>
                            <span class="search-result-value">${this.escapeHTML(località)}</span>
                        </div>
                        
                        <div class="search-result-field">
                            <i class="bi bi-clock-history search-result-icon"></i>
                            <span class="search-result-label">Periodo:</span>
                            <span class="search-result-value">${this.escapeHTML(periodo)}</span>
                        </div>
                        
                        <div class="search-result-field">
                            <i class="bi bi-person search-result-icon"></i>
                            <span class="search-result-label">Autore:</span>
                            <span class="search-result-value">${this.escapeHTML(autore)}</span>
                        </div>
                        
                        ${biblioteca ? `
                        <div class="search-result-field">
                            <i class="bi bi-building search-result-icon"></i>
                            <span class="search-result-label">Biblioteca:</span>
                            <span class="search-result-value">${this.escapeHTML(biblioteca)}</span>
                        </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    getThumbnailHTML(result) {
        // Controlla se esiste una miniatura nel risultato
        // Adatta questi nomi di campo in base a quello che restituisce il tuo backend
        const thumbnailUrl = result.thumbnail || 
                             result.thumbnail_url || 
                             result.preview_image || 
                             result.image_url ||
                             (result.Digital_Library && result.Digital_Library.thumbnail);

        if (thumbnailUrl) {
            return `
                <div class="search-result-thumbnail">
                    <img src="${thumbnailUrl}" alt="Miniatura mappa" onerror="this.parentElement.innerHTML='<div class=\\'search-result-thumbnail-placeholder\\'><i class=\\'bi bi-map\\'></i></div>'">
                </div>
            `;
        } else {
            // Placeholder se non c'è miniatura
            return `
                <div class="search-result-thumbnail">
                    <div class="search-result-thumbnail-placeholder">
                        <i class="bi bi-map"></i>
                    </div>
                </div>
            `;
        }
    }

    attachResultListeners() {
        document.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', () => this.handleResultClick(item));
        });
    }

    //QUI gestisci il click su un risultato
    handleResultClick(item) {
        const mapId = item.dataset.mapId;
        const coords = item.dataset.coords;
        const title = item.querySelector('.search-result-title').textContent;
        
        //TODO: implementare la logica per centrare il globo sulla posizione
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

    escapeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Inizializza quando il DOM è pronto
document.addEventListener('DOMContentLoaded', () => {
    new SearchManager();
});