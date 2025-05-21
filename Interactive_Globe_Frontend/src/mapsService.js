export class MapsService {
   constructor() {

        this.baseUrl = import.meta.env.VITE_BACKEND_PORT || 'http://localhost:3000';
        console.log("MapsService inizializzato con baseUrl:", this.baseUrl);
    }

    async getMaps() {
        try {
            const response = await fetch(`${this.baseUrl}/api/maps`);
            if (!response.ok) {
                throw new Error('Errore durante il recupero delle mappe');
            }
            return await response.json();
        } catch (errore) {
            console.error('Errore:', errore);
            return [];
        }
    }

    async getMapsByComune(m_id = 1) {
    try {
        const endpoint = `${this.baseUrl}/api/maps/${m_id}/maps/images`;
        console.log("Richiesta a:", endpoint);
        const response = await fetch(endpoint);

        if (!response.ok) {
            throw new Error(`Errore durante il recupero delle mappe per il comune ID: ${m_id}. Status: ${response.status}`);
        }

        const data = await response.json(); 
        console.log("Dati ricevuti:", data);
        
        // Verifica che ogni URL sia costruito correttamente
        if (Array.isArray(data)) {
            data.forEach(map => {
                console.log(`URL per la mappa ${map.mapId}: ${map.url}`);
            });
        }
        
        return data;
    } catch (errore) {
        console.error('Errore completo:', errore);
        return [];
    }
}


    async searchMaps(searchTerm) {
        try {
            const response = await fetch(`${this.baseUrl}/api/maps/search/${searchTerm}`);
            if (!response.ok) {
                throw new Error('Errore durante il recupero delle mappe');
            }
            return await response.json();
        } catch (errore) {
            console.error('Errore:', errore);
            return [];
        }
    }
}