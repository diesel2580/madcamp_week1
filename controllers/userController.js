const User = require('../models/User');

exports.getUserInfo = async (req, res) => {
    try {
        const userId = req.query.user_id;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const profilePicUrl = `${req.protocol}://${req.get('host')}/api/profile_pics/${user.profile_pic_id}`;
        res.json({ name: user.name, profile_pic_id: user.profile_pic_id, profile_pic_url: profilePicUrl });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};