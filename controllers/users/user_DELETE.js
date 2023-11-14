const asyncHandler = require('express-async-handler');
const Post = require('../../models/Post');
const { notFoundError } = require('../helpers/error_handling');

exports.unlikePost = asyncHandler(async (req, res) => {
    const { postID } = req.params;
    const { _id } = req.user;

    // Unlike only if the user has already liked the post
    const post = await Post.findOneAndUpdate(
        { _id: postID, likes: _id },
        { $pull: { likes: _id } },
        { new: true }
    );

    if (!post) {
        res.status(404).json(notFoundError);
    } else {
        res.json({ post });
    }
});

exports.deletePost = asyncHandler(async (req, res) => {
    const { postID } = req.params;

    const deletedPost = await Post.findByIdAndDelete(postID).exec();

    if (!deletedPost) {
        res.status(404).json(notFoundError);
    } else {
        res.json({ message: 'Post deleted.' });
    }
});
