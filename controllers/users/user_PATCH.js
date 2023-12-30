const asyncHandler = require('express-async-handler');
const User = require('../../models/User');
const argon2 = require('argon2');
const { censorUserEmail } = require('../helpers/util');
const { validationResult } = require('express-validator');

exports.toggleGalleryVisibility = asyncHandler(async (req, res) => {
    const { _id } = req.user;

    const user = await User.findById(_id).exec();
    user.galleryIsHidden = !user.galleryIsHidden;
    await user.save();

    res.json({ galleryIsHidden: user.galleryIsHidden });
});

exports.changeEmail = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    const { email, password } = req.body;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        // Send only the first form error back to user
        const error = errors.array()[0].msg;
        return res.status(400).json({ error });
    }

    const user = await User.findById(_id).exec();
    const matchingPassword = await argon2.verify(user.auth.password, password);

    if (!matchingPassword) {
        return res.status(401).json({ error: 'Incorrect password.' });
    } else {
        user.email = email;
        await user.save();

        res.json({ newEmail: censorUserEmail(user.email) });
    }
});
