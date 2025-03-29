const express = require('express');
const path = require('path');
const Maps = require('../model/Maps');
const multer = require('multer');

const router = express.Router();
const MAPS_DIRECTORY = process.env.MAPS_DIR || path.join(__dirname, '../maps');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, MAPS_DIRECTORY); // La cartella dove salvi le immagini
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Salva il file con un nome unico
  },
});

const upload = multer({ storage: storage });

// Endpoint per caricare un'immagine
router.post('/upload', upload.single('mapImage'), async (req, res) => {
  try {
    // Dopo aver caricato il file, inserisci il percorso nel database
    const newMap = await Maps.create({
      title: req.body.title, // Se invii un titolo nell'API
      file_name: req.file.filename, // Salva il nome del file nel database
      file_path: path.join('maps', req.file.filename), // Percorso relativo
    });

    res.status(201).json(newMap); // Ritorna i dati della mappa appena inserita
  } catch (error) {
    res.status(500).json({ error: 'Errore nel caricamento dell\'immagine' });
  }
});

// Endpoint per ottenere tutte le mappe
router.get('/maps', async (req, res) => {
  try {
    const maps = await Maps.findAll();
    res.json(maps);
  } catch (error) {
    console.error('Error fetching maps:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Restituisce il percorso completo di una mappa
router.get('/maps/:id', async (req, res) => {
  try {
    const map = await Maps.findByPk(req.params.id); // Usa Maps invece di Map
    if (!map) return res.status(404).json({ error: 'Mappa non trovata' });

    const fullPath = path.join(MAPS_DIRECTORY, map.file_name);
    res.json({ id: map.id, title: map.title, filePath: fullPath });
  } catch (error) {
    res.status(500).json({ error: 'Errore nel recupero della mappa' });
  }
});

// Endpoint per ottenere l'immagine di una mappa
router.get('/maps/:id/image', async (req, res) => {
  try {
    const map = await Maps.findByPk(req.params.id); // Trova la mappa tramite ID

    if (!map) {
      return res.status(404).json({ error: 'Mappa non trovata' });
    }

    // Percorso dell'immagine nel filesystem
    const filePath = path.join(MAPS_DIRECTORY, map.file_path);

    // Restituisci l'immagine come risposta
    res.sendFile(filePath);
  } catch (error) {
    res.status(500).json({ error: 'Errore nel recupero dell\'immagine' });
  }
});

module.exports = router;
