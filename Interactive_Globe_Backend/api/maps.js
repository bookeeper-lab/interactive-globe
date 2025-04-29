const express = require('express');
const router = express.Router();
const Maps  = require('../model/Maps'); 
const Coordinates = require('../model/Coordinates');
const path = require('path');
const D_Libraries = require('../model/Digital_Libraries');

router.get('/maps/:m_id', async (req, res) => {
  try {
    const maps = await Maps.findAll({
      where: {
        m_id: req.params.m_id
      },
      include: [{
        model: Coordinates,
      }]
    });
    
    if (maps.length === 0) {
      return res.status(404).json({error: 'Map not found'});
    }

    res.json(maps);
  } catch(error) {
    console.error(error);
    res.status(500).json({error: 'Internal server error'});
  }
});


// Route aggiuntiva: ottenere le coordinate di una mappa specifica
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

//Per ottenere l'immagine della mappa
router.get('/maps/:mapId/image', async (req, res) => {
  try {
      const map = await Maps.findByPk(req.params.mapId, {
          include: [{ model: D_Libraries, as: 'Digital_Library' }]
      });
      
      if (!map) {
          return res.status(404).send('Mappa non trovata');
      }
      
      const municipalityFolder = map.Digital_Library.name;
      const imagePath = path.join(process.env.MAPS_DIR, municipalityFolder, map.file_name);
      
      // Invia il file
      res.sendFile(imagePath);
  } catch (error) {
      console.error(error);
      res.status(500).send('Errore interno del server');
  }
});

module.exports = router;