// app.js o server.js
const express = require('express');
const dbConnection = require('./config/db_connection');
const cors = require('cors');
require('dotenv').config();

const mapsRoutes = require('./api/maps');
const digitalLibrariesRoutes = require('./api/DigitalLibrary');
const coordinatesRoutes = require('./api/Coordinates');
const syncMapsDirectory = require('./service/mapsSync');

const app = express();

app.use('/maps_static', express.static(process.env.MAPS_DIR));

app.use(express.json());
app.use(cors());

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

app.use('/api', mapsRoutes);
console.log(process.env.MAPS_DIR);
app.use('/maps', express.static(process.env.MAPS_DIR));
app.use('/api', digitalLibrariesRoutes);
app.use('/api', coordinatesRoutes);

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
