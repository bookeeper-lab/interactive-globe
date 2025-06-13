console.log('=== SEARCH TEST CARICATO ===');

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM caricato');
    
    const searchInput = document.getElementById('search-input');
    const searchDropdown = document.getElementById('search-dropdown');
    const searchResults = document.getElementById('search-results');
    
    console.log('Elementi trovati:', {
        input: !!searchInput,
        dropdown: !!searchDropdown,
        results: !!searchResults
    });
    
    if (searchInput) {
        console.log('Aggiungendo event listener all\'input...');
        
        searchInput.addEventListener('input', function(e) {
            const query = e.target.value.trim();
            console.log('Digitando:', query);
            
            if (query.length >= 2) {
                console.log('Query valida, mostrando dropdown...');
                searchResults.innerHTML = '<div style="padding: 10px;">Ricerca per: ' + query + '</div>';
                searchDropdown.classList.add('show');
            } else {
                console.log('Query troppo corta, nascondendo dropdown...');
                searchDropdown.classList.remove('show');
            }
        });
        
        // Test con fetch
        searchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                const query = e.target.value.trim();
                if (query.length >= 2) {
                    console.log('Testando fetch per:', query);
                    
                    fetch(`/api/search?q=${encodeURIComponent(query)}`)
                        .then(response => {
                            console.log('Risposta ricevuta:', response.status);
                            return response.json();
                        })
                        .then(data => {
                            console.log('Dati ricevuti:', data);
                            searchResults.innerHTML = '<div style="padding: 10px;">Risultati: ' + data.length + '</div>';
                            searchDropdown.classList.add('show');
                        })
                        .catch(error => {
                            console.error('Errore fetch:', error);
                            searchResults.innerHTML = '<div style="padding: 10px; color: red;">Errore: ' + error.message + '</div>';
                            searchDropdown.classList.add('show');
                        });
                }
            }
        });
        
        console.log('Event listeners aggiunti con successo');
    } else {
        console.error('ERRORE: Input element non trovato!');
    }
    
    // Chiudi dropdown quando si clicca fuori
    document.addEventListener('click', function(e) {
        if (!searchDropdown.contains(e.target) && e.target !== searchInput) {
            searchDropdown.classList.remove('show');
        }
    });
});

console.log('=== FINE SEARCH TEST ===');