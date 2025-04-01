const express = require('express');
const router = express.Router();
const Maps  = require('../model/Maps'); // Assicurati di avere il modello Maps definito correttamente

router.get('/maps/:m_id', async (req, res) => {
  try{
    const maps = await Maps.findAll({
      where: {
        m_id: req.params.m_id
      }
    });
    if(maps.lenght === 0){
      return res.status(404).json({error: 'Map not found'});
    }

    res.json(maps);
  } catch(error){
    console.error(error);
    res.status(500).json({error: 'Internal server error'});
  }
});

module.exports = router;