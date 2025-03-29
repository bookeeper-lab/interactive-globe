const express = require('express');
const MapMetadata = require('../model/MapMetadata');

const router = express.Router();

router.post('/maps/:id/metadata', async (req, res) => {
    try {
      const { creator, location } = req.body;
      const mapId = req.params.id;
  
      let metadata = await MapMetadata.findOne({ where: { map_id: mapId } });
  
      if (metadata) {
        await metadata.update({ creator, location });
        res.json({ message: 'Metadati aggiornati', metadata });
      } else {
        metadata = await MapMetadata.create({ map_id: mapId, creator, location });
        res.json({ message: 'Metadati aggiunti', metadata });
      }
    } catch (error) {
      res.status(500).json({ error: 'Errore nell\'aggiornamento dei metadati' });
    }
});

module.exports = router;