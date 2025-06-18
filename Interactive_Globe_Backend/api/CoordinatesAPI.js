const express = require('express');
const router = express.Router();
const Coordinates = require('../model/Coordinates');
const Maps = require('../model/Maps');
const Digital_Libraries = require('../model/Digital_Libraries');
const URL = process.env.URL;

// Aggiorna le coordinate di una mappa (creando nuove coordinate)
router.put('/maps/:id/set-coordinates', async (req, res) => {
  const { id } = req.params;
  const { place_name, latitude, longitude } = req.body;
  
  if (place_name === undefined ||latitude === undefined || longitude === undefined) {
    return res.status(400).json({ error: 'I parametri latitude e longitude sono richiesti' });
  }

  try {
    // Verifica che la mappa esista
    const map = await Maps.findByPk(id);
    if (!map) {
      return res.status(404).json({ error: 'Mappa non trovata' });
    }
    
    // Crea nuove coordinate
    const newCoordinates = await Coordinates.create({
      place_name,
      latitude,
      longitude
    });
    
    // Aggiorna il riferimento alla coordinata nella mappa
    await map.update({ coord_id: newCoordinates.id });
    
    res.json({ 
      success: true, 
      message: 'Nuove coordinate create e associate alla mappa con successo',
      map,
      coordinates: newCoordinates
    });
  } catch (error) {
    console.error('Errore durante la creazione e l\'associazione delle coordinate:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Aggiorna le coordinate di una mappa (assegnando coordinate esistenti)
router.put('/maps/:id/update-coordinates', async (req, res) => {
  const { id } = req.params;
  const { coord_id } = req.body;
  
  if (!coord_id) {
    return res.status(400).json({ error: 'Il parametro coord_id è richiesto' });
  }

  try {
    // Verifica che le coordinate esistano
    const coordinates = await Coordinates.findByPk(coord_id);
    if (!coordinates) {
      return res.status(404).json({ error: 'Coordinate non trovate' });
    }
    
    // Verifica che la mappa esista
    const map = await Maps.findByPk(id);
    if (!map) {
      return res.status(404).json({ error: 'Mappa non trovata' });
    }
    
    // Aggiorna il riferimento alla coordinata
    await map.update({ coord_id });
    
    res.json({ 
      success: true, 
      message: 'Coordinate della mappa aggiornate con successo',
      map
    });
  } catch (error) {
    console.error('Errore durante l\'aggiornamento delle coordinate:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Route per ottenere le coordinate di una mappa specifica
router.get('/maps/:id/coordinates', async (req, res) => {
  const { id } = req.params;
  
  try {
    const map = await Maps.findByPk(id, {
      include: [Coordinates]
    });
    
    if (!map) {
      return res.status(404).json({ error: 'Mappa non trovata' });
    }
    
    if (!map.Coordinate) {
      return res.status(404).json({ error: 'Questa mappa non ha coordinate associate' });
    }
    
    res.json(map.Coordinate);
  } catch (error) {
    console.error('Errore durante il recupero delle coordinate:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});



// Route per ottenere il numero di mappe per una coordinata specifica
router.get('/coordinates/:coord_id/maps/count', async (req, res) => {
  try {
    const { coord_id } = req.params;
    
    const count = await Maps.count({
      where: {
        coord_id: coord_id
      }
    });
    
    res.json({ count });
  } catch (error) {
    console.error('Errore nel conteggio delle mappe:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Route per ottenere tutte le mappe di una coordinata specifica
router.get('/coordinates/:coord_id/maps', async (req, res) => {
  try {
    const { coord_id } = req.params;
    
    const maps = await Maps.findAll({
      where: {
        coord_id: coord_id
      },
      include: [
        {
          model: Digital_Libraries,
          as: 'Digital_Library',
          attributes: ['name']
        },
        {
          model: Coordinates,
          attributes: ['place_name', 'latitude', 'longitude']
        }
      ],
      order: [['title', 'ASC']]
    });
    
    if (maps.length === 0) {
      return res.status(404).json({ error: 'Nessuna mappa trovata per questa coordinata' });
    }
    
    // Trasforma i risultati includendo l'URL dell'immagine
    const transformedMaps = maps.map(map => {
      const mapData = map.toJSON();
      
      return {
        id: mapData.id,
        title: mapData.title,
        location: mapData.location,
        historical_period: mapData.historical_period,
        creator: mapData.creator,
        type: mapData.type,
        file_name: mapData.file_name,
        Digital_Library: mapData.Digital_Library,
        Coordinate: mapData.Coordinate,
        image_url: mapData.Digital_Library ? 
          `${URL}/api/maps/${mapData.id}/image` : null
      };
    });
    
    res.json({
      coordinate_id: coord_id,
      total_maps: maps.length,
      maps: transformedMaps
    });
    
  } catch (error) {
    console.error('Errore nel recupero delle mappe per coordinata:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Route per ottenere informazioni complete su una coordinata (incluso il numero di mappe)
router.get('/coordinates/:coord_id/info', async (req, res) => {
  try {
    const { coord_id } = req.params;
    
    // Ottieni le informazioni della coordinata
    const coordinate = await Coordinates.findByPk(coord_id);
    
    if (!coordinate) {
      return res.status(404).json({ error: 'Coordinata non trovata' });
    }
    
    // Conta le mappe associate
    const mapCount = await Maps.count({
      where: {
        coord_id: coord_id
      }
    });
    
    res.json({
      coordinate: coordinate,
      map_count: mapCount
    });
    
  } catch (error) {
    console.error('Errore nel recupero info coordinata:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

module.exports = router;