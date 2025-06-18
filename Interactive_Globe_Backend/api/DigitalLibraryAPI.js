const express = require('express');
const router = express.Router();
const Digital_Libraries = require('../model/Digital_Libraries');


router.get('/digital_libraries', async (req, res) => {
  try {
    const digitalLibraries = await Digital_Libraries.findAll();
    res.json(digitalLibraries);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;