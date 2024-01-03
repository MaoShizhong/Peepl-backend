const asyncHandler = require('express-async-handler');
const Post = require('../../models/Post');
const Comment = require('../../models/Comment');
const { notFoundError } = require('../helpers/error_handling');

exports.deletePost = asyncHandler(async (req, res) => {
    const { postID } = req.params;

    const [deletedPost] = await Promise.all([
        Post.findByIdAndDelete(postID).exec(),
        Comment.deleteMany({ post: postID }).exec(),
    ]);

    if (!deletedPost) {
        res.status(404).json(notFoundError);
    } else {
        res.json({ message: 'Post deleted.' });
    }
});

exports.deleteComment = asyncHandler(async (req, res) => {
    const { commentID } = req.params;

    const deletedComment = await Comment.findByIdAndDelete(commentID).exec();

    if (!deletedComment) {
        res.status(404).json(notFoundError);
    } else {
        res.end();
    }
});
