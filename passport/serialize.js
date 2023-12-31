const User = require('../models/User');

// Serialize = take user and store something in the session data (in this case, only user._id)
exports.serialize = (user, done) => {
    return done(null, user._id);
};

// Deserialize = extract session data and store something in req.user
exports.deserialize = async (id, done) => {
    try {
        const user = await User.findById(id).exec();
        done(null, {
            _id: user._id.valueOf(),
            handle: user.handle,
            profilePicture: user.profilePicture,
            email: user.email,
            details: user.details,
            isDemo: user.isDemo,
            isGithub: user.auth.strategy === 'github',
        });
    } catch (error) {
        done(error);
    }
};
