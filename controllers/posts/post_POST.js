const asyncHandler = require('express-async-handler');
const Comment = require('../../models/Comment');
const { validationResult } = require('express-validator');

exports.addCommentToPost = asyncHandler(async (req, res) => {
    const { postID } = req.params;
    const { _id } = req.user;
    const { body } = req.body;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        // Send only the first form error back to user
        const error = errors.array()[0].msg;
        return res.status(400).json({ error });
    }

    const newComment = new Comment({
        post: postID,
        author: _id,
        timestamp: new Date(),
        body: body,
    });
    await newComment.save();
    await newComment.populate('author', 'handle details.firstName details.lastName profilePicture');

    res.status(201).json({ newComment });
});
