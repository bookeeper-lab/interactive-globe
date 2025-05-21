const express = require('express');
const router = express.Router();
const Maps  = require('../model/Maps'); 
const Coordinates = require('../model/Coordinates');
const path = require('path');
const D_Libraries = require('../model/Digital_Libraries');

/* router.get('/maps/:m_id', async (req, res) => {
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
}); */

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

router.get('/maps/:m_id/maps/images', async (req, res) => {
  try {
    const municipalityId = req.params.m_id;

    // Trova la Digital Library associata al comune
    const library = await D_Libraries.findByPk(municipalityId, {
      include: [{ model: Maps, as: 'Maps' }]
    });

    if (!library || !library.Maps || library.Maps.length === 0) {
      return res.status(404).send('Nessuna immagine trovata per questo comune');
    }

    // Costruisci la risposta con le info di ogni immagine
    const imagePaths = library.Maps.map(map => {
      // Verifica se hai già il percorso completo del file
      // Assicurati che questo percorso corrisponda alla struttura delle cartelle e al modo in cui servi i file
      return {
        mapId: map.id,
        title: map.title,
        fileName: map.file_name,
        // Usa un percorso che corrisponda a come hai configurato il middleware express.static
        url: `/maps_static/${library.name}/${map.file_name || 'image.jpg'}`,
      };
    });

    console.log('Percorsi immagini inviati al client:', imagePaths);
    res.json(imagePaths);
  } catch (error) {
    console.error(error);
    res.status(500).send('Errore interno del server');
  }
});


router.get('/maps/:id/image', async (req, res) => {
  try {
    const mapId = req.params.id;

    const map = await Maps.findByPk(mapId, {
      include: [{ model: D_Libraries, as: 'Digital_Library' }]
    });
    if (!map) {
      return res.status(404).send('Mappa non trovata');
    }

    const municipalityFolder = map.Digital_Library.name;
    const imagePath =  path.join(process.env.MAPS_DIR, municipalityFolder, map.file_name);

    // Controlla che il file esista
    if (!fs.existsSync(imagePath)) {
      return res.status(404).send('File immagine non trovato');
    }

    res.sendFile(imagePath);
  } catch (error) {
    console.error(error);
    res.status(500).send('Errore interno');
  }
});



module.exports = router;