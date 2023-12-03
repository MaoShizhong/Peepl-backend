const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');
const argon2 = require('argon2');
const User = require('../../models/User');
const { ObjectId } = require('mongoose').Types;
const { generateUsername } = require('unique-username-generator');
const { cloudinary } = require('../../cloudinary/cloudinary');
const fs = require('fs');

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
        const { path } = req.file;

        // upload with standardised profile picture format:
        // center-square crop then scale to 400x400 - webp for smaller file size
        const result = await cloudinary.uploader.upload(path, {
            folder: newUserId,
            eager: { crop: 'fill', height: 400, width: 400 },
            format: 'webp',
        });

        profilePictureURL = result.eager[0].secure_url;

        // delete temp image file once uploaded to cloudinary
        fs.rmSync(`${process.cwd()}/${path}`);
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
            strategies: ['local'],
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

exports.login = (req, res) => {
    const { _id, handle, email, details, isDemo, isGithubOnly } = req.user;

    res.status(201).json({
        _id: _id,
        handle: handle,
        email: email,
        details: details,
        isDemo: isDemo,
        isGithubOnly: isGithubOnly,
    });
};

exports.logout = (req, res, next) => {
    req.logout((err) => {
        req.session.destroy();
        res.clearCookie('connect.sid', {
            secure: process.env.MODE === 'prod',
            maxAge: 2 * 24 * 60 * 60 * 1000,
            httpOnly: process.env.MODE === 'prod',
            sameSite: process.env.MODE === 'prod' ? 'none' : 'lax',
        });

        if (err) next(err);
        else res.end();
    });
};

exports.checkAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        next();
    } else {
        res.status(401).json({ error: 'Not logged in.' });
    }
};
