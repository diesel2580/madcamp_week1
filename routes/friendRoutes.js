const express = require('express');
const router = express.Router();
const friendController = require('../controllers/friendController');

// 특정 시간 동안 사용 가능한 암호화된 user_id 생성
router.post('/generateFriendLink', friendController.generateFriendLink);

// 친구 추가 요청 처리
router.post('/acceptFriend', friendController.acceptFriend);

// 친구 리스트 불러오기
router.get('/list', friendController.getFriendList);


module.exports = router;