const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.get('/kakao', authController.kakaoAuth);

module.exports = router;