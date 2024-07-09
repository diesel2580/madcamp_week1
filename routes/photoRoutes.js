const express = require('express');
const router = express.Router();
const photoController = require('../controllers/photoController');

router.post('/upload', photoController.uploadPhoto);
router.get('/photos', photoController.getPhotos);
router.get('/photos/:photo_data_id', photoController.getPhoto);
router.get('/merge-photos', photoController.mergePhotos);//photo export

module.exports = router;