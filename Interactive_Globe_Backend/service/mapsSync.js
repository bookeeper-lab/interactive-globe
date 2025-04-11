// services/mapsSync.js
const fs = require('fs');
const path = require('path');
const Maps = require('../model/Maps');
const Digital_Libraries = require('../model/Digital_Libraries');

const MAPS_DIRECTORY = process.env.MAPS_DIR || path.join(__dirname, '../maps_dir');

async function syncMapsDirectory() {
  try {
    // Leggi le sottocartelle (che rappresentano i comuni)
    const municipalityFolders = fs.readdirSync(MAPS_DIRECTORY, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    for (const folder of municipalityFolders) {
      // Cerca o crea il comune basato sul nome della cartella
      let D_Libraries = await Digital_Libraries.findOne({ where: { name: folder } });
      if (!D_Libraries) {
        D_Libraries = await Digital_Libraries.create({
          name: folder,
          markerColor: "#000000",
          mapsNumber: 0 
        });
        console.log(`Creato nuovo comune: ${folder}`);
      }

      // Ottieni la lista dei file nella sottocartella
      const folderPath = path.join(MAPS_DIRECTORY, folder);
      const files = fs.readdirSync(folderPath);
      const existingFiles = await Maps.findAll({ attributes: ['file_name'] });
      const existingFileNames = existingFiles.map(map => map.file_name);

      // Crea le mappe che non esistono già nel database
      for (const file of files) {
        if (!existingFileNames.includes(file)) {
          await Maps.create({
            title: path.parse(file).name,
            file_name: file,
            m_id: D_Libraries.id  // Usa il record trovato o creato
          });
          console.log(`Aggiunta mappa: ${file} al comune: ${folder}`);
        }
      }
    }
  } catch (error) {
    console.error('Errore nella sincronizzazione delle mappe:', error);
  }
}

module.exports = syncMapsDirectory;
