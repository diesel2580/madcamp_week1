const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// 사용자 정보 가져오기 라우트
router.get('/user', userController.getUserInfo);

module.exports = router;
