const asyncHandler = require('express-async-handler');
const User = require('../../models/User');
const Post = require('../../models/Post');
const Photo = require('../../models/Photo');
const { notFoundError } = require('../helpers/error_handling');
const { validationResult } = require('express-validator');
const { cloudinary } = require('../../cloudinary/cloudinary');
const fs = require('fs');

exports.sendFriendRequest = asyncHandler(async (req, res) => {
    // When passport implemented, userID will be obtained from req.user
    const { userID } = req.params;
    const { requested } = req.query;

    if (!requested) {
        return res.status(400).json({ error: 'Missing query string(s).' });
    }

    const userToSendFriendRequestTo = await User.exists({ _id: requested }).exec();
    if (!userToSendFriendRequestTo) {
        return res.status(404).json(notFoundError);
    }

    await Promise.all([
        User.findByIdAndUpdate(userID, {
            $push: { friends: { user: requested, status: 'requested' } },
        }).exec(),
        User.findByIdAndUpdate(requested, {
            $push: { friends: { user: userID, status: 'incoming' } },
        }).exec(),
    ]);

    res.json({ message: 'Friend request sent successfully.' });
});

exports.writePostToWall = asyncHandler(async (req, res) => {
    const { userID } = req.params;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        // Send only the first form error back to user
        const error = errors.array()[0].msg;
        return res.status(400).json({ error });
    }

    const userExists = await User.exists({ _id: userID }).exec();

    if (!userExists) {
        return res.status(404).json(notFoundError);
    }

    const wallPost = new Post({
        wall: userID,
        author: req.user._id,
        timestamp: new Date(),
        body: req.body.body,
        likes: [],
    });

    await wallPost.save();
    await wallPost.populate('author', 'handle details.firstName details.lastName profilePicture');

    res.status(201).json({ post: wallPost });
});

exports.addPhotoToGallery = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    const { path: filePath } = req.file;

    // Limit image physical size which should double up on file size reduction with webp format
    const uploadedImage = await cloudinary.uploader.upload(filePath, {
        folder: _id,
        eager: { crop: 'limit', height: 1080, width: 1920 },
        format: 'webp',
    });

    // delete temp image file once uploaded to cloudinary
    fs.rmSync(`${process.cwd()}/${filePath}`);

    const publicID = uploadedImage.public_id;
    const cloudinaryID = publicID.split('/')[1];

    const photo = new Photo({
        user: _id,
        timestamp: new Date(),
        cloudinaryID: cloudinaryID,
        url: uploadedImage.eager[0].secure_url,
    });

    await photo.save();

    res.status(201).json({ photo });
});
