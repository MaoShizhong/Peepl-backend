const asyncHandler = require('express-async-handler');
const Post = require('../../models/Post');
const { validationResult } = require('express-validator');
const { notFoundError } = require('../helpers/error_handling');

exports.toggleLikePost = asyncHandler(async (req, res) => {
    const { postID } = req.params;
    const { _id } = req.user;

    const postToUpdate = await Post.findById(postID).exec();

    if (!postToUpdate) {
        res.status(404).json(notFoundError);
        return;
    }

    if (postToUpdate.likes.find((userID) => userID.valueOf() === _id)) {
        postToUpdate.likes = postToUpdate.likes.filter((userID) => userID.valueOf() !== _id);
    } else {
        postToUpdate.likes.push(_id);
    }

    await postToUpdate.save();
    res.json({ newLikes: postToUpdate.likes });
});

exports.editPost = asyncHandler(async (req, res) => {
    const { postID } = req.params;
    const { body } = req.body;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        // Send only the first form error back to user
        const error = errors.array()[0].msg;
        return res.status(400).json({ error });
    }

    const editedPost = await Post.findByIdAndUpdate(
        postID,
        { body: body, isEdited: true },
        { new: true }
    )
        .populate('author', 'handle details.firstName details.lastName profilePicture')
        .exec();

    if (!editedPost) {
        res.status(404).json(notFoundError);
    } else {
        res.json({ editedPost });
    }
});
