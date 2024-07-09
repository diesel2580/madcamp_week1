const jwt = require('jsonwebtoken');
const User = require('../models/User');
const FriendList = require('../models/FriendList');

// 특정 시간 동안 사용 가능한 암호화된 user_id 생성
exports.generateFriendLink = (req, res) => {
    const { userId } = req.body;
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' }); // 토큰 유효기간 1시간

    res.json({ token });
};

// 친구 추가 요청 처리
exports.acceptFriend = async (req, res) => {
    const { token } = req.body;

    try {
        // 토큰 검증
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const friendUserId = decoded.userId; // 친구로 추가할 사용자 ID

        const { userId } = req.body; // 요청한 사용자 ID

        if (userId === friendUserId) {
            return res.status(400).json({ error: 'You cannot add yourself as a friend' });
        }

        const user = await User.findById(userId);
        const friendUser = await User.findById(friendUserId);

        if (!user || !friendUser) {
            return res.status(404).json({ error: 'User not found' });
        }

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

        res.json({ message: 'Friend added successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add friend', details: error.message });
    }
};