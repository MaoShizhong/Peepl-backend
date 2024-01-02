const asyncHandler = require('express-async-handler');
const Post = require('../../models/Post');
const { notFoundError } = require('../helpers/error_handling');

exports.deletePost = asyncHandler(async (req, res) => {
    const { postID } = req.params;

    const deletedPost = await Post.findByIdAndDelete(postID).exec();

    if (!deletedPost) {
        res.status(404).json(notFoundError);
    } else {
        res.json({ message: 'Post deleted.' });
    }
});
