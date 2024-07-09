const User = require('../models/User');

exports.getUserInfo = async (req, res) => {
    try {
        const userId = req.query.user_id;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ name: user.name, profile_image_url: user.profile_image_url });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};