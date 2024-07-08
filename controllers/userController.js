const User = require('../models/User');

exports.getUserInfo = async (req, res) => {
    try {
        const userId = req.query.user_id;

        // 사용자 ID로 사용자 정보 조회
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ name: user.name, profile_pic_id: user.profile_pic_id });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
