const jwt = require('jsonwebtoken');
const User = require('../models/User');
const FriendList = require('../models/FriendList');

// 특정 시간 동안 사용 가능한 암호화된 user_id 생성
exports.generateFriendLink = (req, res) => {
    const { userId } = req.body;
    console.log(`[INFO] Generating friend link for userId: ${userId}`);
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' }); // 토큰 유효기간 1시간

    console.log(`[INFO] Generated token: ${token}`);
    res.json({ token });
};

// 친구 추가 요청 처리
exports.acceptFriend = async (req, res) => {
    const { token, userId } = req.body;
    console.log(`[INFO] Accepting friend request with token: ${token} and userId: ${userId}`);

    try {
        // 토큰 검증
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const friendUserId = decoded.userId; // 친구로 추가할 사용자 ID
        console.log(`[INFO] Decoded token. Friend userId: ${friendUserId}`);

        if (userId === friendUserId) {
            console.log('[ERROR] User tried to add themselves as a friend');
            return res.status(400).json({ error: 'You cannot add yourself as a friend' });
        }

        const user = await User.findById(userId);
        const friendUser = await User.findById(friendUserId);

        if (!user || !friendUser) {
            console.log('[ERROR] User or friend user not found');
            return res.status(404).json({ error: 'User not found' });
        }

        console.log('[INFO] Both users found. Updating friend lists...');

        // 사용자와 친구의 친구 목록 업데이트
        await FriendList.updateOne(
            { user_id: userId },
            { $addToSet: { friends: friendUserId } },
            { upsert: true }
        );
        await FriendList.updateOne(
            { user_id: friendUserId },
            { $addToSet: { friends: userId } },
            { upsert: true }
        );

        console.log('[INFO] Friend lists updated successfully');
        res.json({ message: 'Friend added successfully' });
    } catch (error) {
        console.error(`[ERROR] Failed to add friend: ${error.message}`);
        res.status(500).json({ error: 'Failed to add friend', details: error.message });
    }
};

// 친구 리스트 불러오기
exports.getFriendList = async (req, res) => {
    const { user_id } = req.query;
    console.log('[INFO] Fetching friend list for user_id: ${user_id}');
    try {
        const friendList = await FriendList.findOne({ user_id }).populate('friends', 'name profile_image_url');

        if (!friendList) {
            console.log('[ERROR] Friend list not found');
            return res.status(404).json({ error: 'Friend list not found' });
        }
        console.log(friendList.friends);

        const friends = friendList.friends.map(friend => ({
            friend_id: friend._id,
            name: friend.name,
            profile_pic_url: friend.profile_image_url
        }));

        console.log('[INFO] Friend list fetched successfully');
        res.json({ friends });
    } catch (error) {
        console.error(`[ERROR] Failed to fetch friend list: ${error.message}`);
        res.status(500).json({ error: 'Failed to fetch friends', details: error.message });
    }
};