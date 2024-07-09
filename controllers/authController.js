const axios = require('axios');
const User = require('../models/User');
const FriendList = require('../models/FriendList');
const mongoose = require('mongoose');

exports.kakaoAuth = async (req, res) => {
    const { code } = req.query;

    console.log(`[INFO] Received authorization code: ${code}`);

    try {
        // 토큰 발급 요청
        console.log('[INFO] Requesting access token from Kakao...');
        const tokenResponse = await axios.post('https://kauth.kakao.com/oauth/token', null, {
            params: {
                grant_type: 'authorization_code',
                client_id: process.env.KAKAO_REST_API_KEY,
                redirect_uri: process.env.KAKAO_REDIRECT_URI,
                code: code
            }
        });

        // 토큰 발급 받음
        const accessToken = tokenResponse.data.access_token;
        console.log(`[INFO] Received access token: ${accessToken}`);

        // 카카오 프로필 요청
        console.log('[INFO] Requesting user profile from Kakao...');
        const userResponse = await axios.get('https://kapi.kakao.com/v2/user/me', {
            headers: {
                Authorization: `Bearer ${accessToken}`
            },
            params: {
                property_keys: ["properties.nickname", "properties.profile_image"]
            }
        });

        const kakaoProfile = userResponse.data;
        console.log(`[INFO] Received Kakao profile: ${JSON.stringify(kakaoProfile)}`);

        console.log('[INFO] Checking if user exists in database...');
        let user = await User.findOne({ kakao_id: kakaoProfile.id });

        if (!user) {
            console.log('[INFO] User not found, creating new user...');

            // 새로운 사용자와 연결된 빈 친구 목록 생성
            const friendList = new FriendList({
                user_id: new mongoose.Types.ObjectId(),
                friends: []
            });
            await friendList.save();

            user = new User({
                kakao_id: kakaoProfile.id,
                name: kakaoProfile.properties.nickname,
                profile_image_url: kakaoProfile.properties.profile_image,  // 이미지 URL 저장
                friend_list_id: friendList._id
            });
            await user.save();

            // 사용자 ID를 friendList의 user_id로 업데이트
            friendList.user_id = user._id;
            await friendList.save();

            console.log('[INFO] New user created and saved to database');
        } else {
            console.log('[INFO] User found in database');
        }

        console.log(`[INFO] Redirecting to frontend with user_id: ${user._id}`);
        res.redirect(`myapp://oauth?user_id=${user._id}`);
    } catch (error) {
        console.error(`[ERROR] Failed to authenticate user: ${error.message}`);
        res.status(500).json({ error: 'Failed to authenticate user' });
    }
};