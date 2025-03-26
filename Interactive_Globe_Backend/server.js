const express = require('express');
const dbConnection = require('./config/db_connection');

const app = express();

dbConnection.authenticate()
  .then(() => {
    console.log('Connected to database')
})
  .catch((err) => {
    console.error('Error:', err)
});

const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})