const axios = require('axios');
const User = require('../models/User');
const FriendList = require('../models/FriendList');
const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// MongoDB 연결 후 GridFSBucket 생성
let bucket;
mongoose.connection.on('connected', () => {
    console.log('[INFO] MongoDB connected');
    bucket = new GridFSBucket(mongoose.connection.db, {
        bucketName: 'profile_pics'
    });
});

exports.kakaoAuth = async (req, res) => {
    const { code } = req.query;

    console.log(`[INFO] Received authorization code: ${code}`);

    try {
        //토큰 발급 요청
        console.log('[INFO] Requesting access token from Kakao...');
        const tokenResponse = await axios.post('https://kauth.kakao.com/oauth/token', null, {
            params: {
                grant_type: 'authorization_code',
                client_id: process.env.KAKAO_REST_API_KEY,
                redirect_uri: process.env.KAKAO_REDIRECT_URI,
                code: code
            }
        });

        //토큰 발급 받음
        const accessToken = tokenResponse.data.access_token;
        console.log(`[INFO] Received access token: ${accessToken}`);

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

            // 프로필 이미지 다운로드 및 GridFS에 저장
            const profileImageUrl = kakaoProfile.properties.profile_image;
            const profilePicId = await saveProfileImageToGridFS(profileImageUrl);

            // 새로운 사용자와 연결된 빈 친구 목록 생성
            const friendList = new FriendList({
                user_id: new mongoose.Types.ObjectId(),
                friends: []
            });
            await friendList.save();

            user = new User({
                kakao_id: kakaoProfile.id,
                name: kakaoProfile.properties.nickname,
                profile_pic_id: profilePicId,
                friend_list_id: friendList._id // 친구 목록 ID 연결
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

// 프로필 이미지를 다운로드하여 GridFS에 저장하는 함수
async function saveProfileImageToGridFS(url) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;

        protocol.get(url, (response) => {
            const filename = path.basename(url);
            const filePath = path.join('/tmp', filename);
            const fileStream = fs.createWriteStream(filePath);

            response.pipe(fileStream);

            fileStream.on('finish', () => {
                fileStream.close();

                // GridFS에 파일 저장
                const uploadStream = bucket.openUploadStream(filename);
                const fileReadStream = fs.createReadStream(filePath);

                fileReadStream.pipe(uploadStream)
                    .on('error', (error) => reject(error))
                    .on('finish', () => {
                        fs.unlinkSync(filePath); // 임시 파일 삭제
                        resolve(uploadStream.id);
                    });
            });
        }).on('error', (error) => reject(error));
    });
}