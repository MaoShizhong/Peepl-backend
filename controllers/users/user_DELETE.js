const asyncHandler = require('express-async-handler');
const User = require('../../models/User');
const Post = require('../../models/Post');
const Photo = require('../../models/Photo');
const { cloudinary } = require('../../cloudinary/cloudinary');
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

exports.deletePhoto = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    const { photoID } = req.params;

    const public_id = `${_id}/${photoID}`;

    await Promise.all([
        Photo.findOneAndDelete({ cloudinaryID: photoID }).exec(),
        cloudinary.api.delete_resources([public_id]),
    ]);

    res.json({ message: `${photoID} successfully deleted.` });
});

exports.removeFriend = asyncHandler(async (req, res) => {
    const { userID, friendID } = req.params;

    await Promise.all([
        User.findByIdAndUpdate(userID, { $pull: { friends: { user: friendID } } }),
        User.findByIdAndUpdate(friendID, { $pull: { friends: { user: userID } } }),
    ]);

    res.json({ removedFriendID: friendID });
});
