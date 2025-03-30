// app.js o server.js
const express = require('express');
const dbConnection = require('./config/db_connection');
const cors = require('cors');
require('dotenv').config();

const mapsRouter = require('./controller/maps');
const mapMetadataRouter = require('./controller/map.metadata');
const syncMapsDirectory = require('./service/mapsSync');

const app = express();
app.use(express.json());
app.use(cors());

app.use('/api', mapsRouter);
app.use('/api', mapMetadataRouter);

// Connessione al database e sincronizzazione
dbConnection.authenticate()
  .then(() => {
    console.log('Connected to database');
    // Sincronizza i modelli con il database
    return dbConnection.sync({ force: false });
  })
  .then(() => {
    console.log('Database synchronized');
    // Sincronizza la cartella delle mappe con il database
    syncMapsDirectory();
  })
  .catch((err) => {
    console.error('Error:', err);
  });

  
const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
