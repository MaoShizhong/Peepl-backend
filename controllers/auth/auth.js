const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');
const argon2 = require('argon2');
const User = require('../../models/User');
const Post = require('../../models/Post');
const Comment = require('../../models/Comment');
const Photo = require('../../models/Photo');
const { ObjectId } = require('mongoose').Types;
const { generateUsername } = require('unique-username-generator');
const { cloudinary } = require('../../cloudinary/cloudinary');
const fs = require('fs');
const { censorUserEmail } = require('../helpers/util');
const { createHash } = require('node:crypto');

exports.addNewUserLocal = asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        // Send only the first form error back to user
        const error = errors.array()[0].msg;
        return res.status(400).json({ error });
    }

    const {
        email,
        password,
        firstName,
        lastName,
        'DOB.value': DOB,
        'city.value': city,
        'country.value': country,
    } = req.body;

    // Generate new ObjectId early to prefix it to profile pictures
    // Allows easier bulk asset deletion by folder later upon user account deletion
    const newUserId = new ObjectId();

    let profilePictureURL = null;
    if (req.file) {
        const { path } = req.file.path;

        // upload with standardised profile picture format:
        // center-square crop then scale to 400x400 - webp for smaller file size
        const result = await cloudinary.uploader.upload(path, {
            folder: newUserId,
            eager: { crop: 'fill', height: 400, width: 400 },
            format: 'webp',
        });

        profilePictureURL = result.eager[0].secure_url;

        // delete temp uploaded image file once uploaded to cloudinary
        fs.rmSync(`${process.cwd()}/${path}`);
    } else {
        await cloudinary.api.create_folder(newUserId);
    }

    // prevent the tiniest of tiniest of chances that an auto-generated handle
    // collides with an existing one
    let handle, existingHandle;
    do {
        handle = generateUsername('-', 6);
        existingHandle = await User.exists({ handle: handle }).exec();
    } while (existingHandle);

    const hashedPassword = await argon2.hash(password);

    const newUser = new User({
        _id: newUserId,
        handle: handle,
        email: email,
        profilePicture: profilePictureURL,
        auth: {
            strategy: 'local',
            password: hashedPassword,
        },
        details: {
            firstName: firstName,
            lastName: lastName,
            'DOB.value': DOB,
            'city.value': city ? city : undefined,
            'country.value': country ? country : undefined,
        },
    });

    await newUser.save();

    next();
});

exports.setNewPassword = asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        // Send only the first form error back to user
        const error = errors.array()[0].msg;
        return res.status(400).json({ error });
    }

    const { token } = req.params;
    const { password } = req.body;

    const hash = createHash('sha3-256');
    const hashedToken = hash.update(token).digest('base64');

    const hashedPassword = await argon2.hash(password);

    const updatedUser = await User.findOneAndUpdate(
        { 'tokens.passwordReset.token': hashedToken },
        { $set: { password: hashedPassword }, $unset: { 'tokens.passwordReset': 1 } },
        { new: true }
    ).exec();

    if (!updatedUser) {
        res.json(404).json({ message: 'Invalid user. Could not change password.' });
    } else {
        // force logout
        next();
    }
});

exports.deleteUser = asyncHandler(async (req, res, next) => {
    const { token } = req.params;

    const hash = createHash('sha3-256');
    const hashedToken = hash.update(token).digest('base64');

    const { _id: deletedUserID } = await User.findOneAndDelete({
        'tokens.accountDeletion.token': hashedToken,
        'tokens.accountDeletion.used': true,
    }).exec();

    const postsToDelete = await Post.find({ author: deletedUserID }).exec();

    if (!deletedUserID) {
        res.status(404).json({ error: 'Invalid user.' });
        return;
    }

    // delete all user's cloudinary photos and Peepl data/remove from friends lists
    await Promise.all([
        Post.deleteMany({ author: deletedUserID }).exec(),
        Comment.deleteMany({ post: { $in: postsToDelete } }).exec(),
        Comment.updateMany({ author: deletedUserID }, { body: '', isDeleted: true }).exec(),
        Photo.deleteMany({ user: deletedUserID }).exec(),
        User.updateMany(
            { 'friends.user': deletedUserID },
            { $pull: { friends: { user: deletedUserID } } }
        ).exec(),
        cloudinary.api.delete_resources_by_prefix(deletedUserID.valueOf()),
    ]);

    // can't delete cloudinary folder until it is empty
    await cloudinary.api.delete_folder(deletedUserID.valueOf());

    // force logout/session destroy
    next();
});

exports.login = (req, res) => {
    const { _id, handle, profilePicture, email, details, isDemo, isGithub } = req.user;

    res.status(201).json({
        _id,
        handle,
        profilePicture,
        email: censorUserEmail(email),
        details,
        isDemo,
        isGithub,
    });
};

exports.logout = (req, res) => {
    req.session.destroy();
    res.clearCookie(process.env.COOKIE_NAME, {
        secure: process.env.MODE === 'prod',
        httpOnly: process.env.MODE === 'prod',
        sameSite: process.env.MODE === 'prod' ? 'none' : 'lax',
    }).json({ message: 'Log out successful.' });
};

exports.checkAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        next();
    } else {
        res.status(401).json({ error: 'Not logged in.' });
    }
};
