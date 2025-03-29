const express = require('express');
const dbConnection = require('./config/db_connection');
const MapMetadata = require('./model/MapMetadata');
const Maps = require('./model/Maps');
const cors = require('cors');
require('dotenv').config();

const mapsRouter = require('./controller/maps');
const mapMetadataRouter = require('./controller/map.metadata');

const fs = require('fs');
const path = require('path');

const MAPS_DIRECTORY = process.env.MAPS_DIR || path.join(__dirname, 'maps_dir');

const app = express();
app.use(express.json());
app.use(cors());

app.use('/api', mapsRouter);
app.use('/api', mapMetadataRouter);

async function syncMapsDirectory() {
  try {
    const files = fs.readdirSync(MAPS_DIRECTORY); // Ottieni la lista dei file nella cartella delle mappe
    const existingFiles = await Maps.findAll({ attributes: ['file_name'] }); // Ottieni i nomi dei file già presenti nel database
    const existingFileNames = existingFiles.map(map => map.file_name);

    for (const file of files) {
      if (!existingFileNames.includes(file)) {
        // Se il file non è già nel database, aggiungilo
        await Maps.create({ title: path.parse(file).name, file_name: file });
        console.log(`Aggiunta al database: ${file}`);
      }
    }
  } catch (error) {
    console.error('Errore nella sincronizzazione delle mappe:', error);
  }
}

// Connessione al database e sincronizzazione
dbConnection.authenticate()
  .then(() => {
    console.log('Connected to database');
    
    // Sincronizza i modelli con il database
    return dbConnection.sync({ force: false }); // Usa { force: true } solo se vuoi resettare le tabelle ad ogni avvio
  })
  .then(() => {
    console.log('Database synchronized');
    
    // Sincronizza la cartella delle mappe con il database
    syncMapsDirectory(); 
  })
  .catch((err) => {
    console.error('Error:', err);
  });

// Funzione per ottenere il percorso completo di una mappa
function getMapPath(fileName) {
    return path.join(MAPS_DIRECTORY, fileName);
}

const PORT = process.env.PORT;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
