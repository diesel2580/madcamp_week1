const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    kakao_id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    profile_image_url: { type: String, required: true },  // 프로필 이미지 URL 필드 추가
    created_at: { type: Date, default: Date.now },
    friend_list_id: { type: mongoose.Schema.Types.ObjectId, ref: 'FriendList' }
});

module.exports = mongoose.model('User', userSchema);