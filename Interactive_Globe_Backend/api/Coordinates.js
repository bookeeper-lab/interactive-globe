const express = require('express');
const router = express.Router();
const Coordinates = require('../model/Coordinates');
const Maps = require('../model/Maps');

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

module.exports = router;