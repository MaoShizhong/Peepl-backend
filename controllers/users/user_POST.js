const asyncHandler = require('express-async-handler');
const User = require('../../models/User');
const Post = require('../../models/Post');
const { notFoundError } = require('../helpers/error_handling');
const { body, validationResult } = require('express-validator');
const { POST_CHAR_LIMIT } = require('../helpers/constants');

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

exports.validatePostForm = body('body')
    .notEmpty()
    .withMessage('Post cannot be empty.')
    .isLength({ max: POST_CHAR_LIMIT })
    .withMessage(`Max. ${POST_CHAR_LIMIT} characters.`);

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

    res.status(201).json(wallPost);
});

exports.likePost = asyncHandler(async (req, res) => {
    const { postID } = req.params;
    const { _id } = req.user;

    // Add like only if post is not already liked by the user
    const post = await Post.findOneAndUpdate(
        { _id: postID, likes: { $ne: _id } },
        { $push: { likes: _id } },
        { new: true }
    ).exec();

    if (!post) {
        res.status(400).json({ error: 'Post already liked.' });
    } else {
        res.json({ post });
    }
});
