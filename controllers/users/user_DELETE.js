const asyncHandler = require('express-async-handler');
const User = require('../../models/User');
const Photo = require('../../models/Photo');
const { cloudinary } = require('../../cloudinary/cloudinary');
const { extractPublicID } = require('../helpers/util');

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

exports.removeProfilePicture = asyncHandler(async (req, res) => {
    const { _id } = req.user;

    const user = await User.findById(_id).exec();
    const photoIdToDelete = extractPublicID(user.profilePicture);
    user.profilePicture = null;

    await Promise.all([user.save(), cloudinary.api.delete_resources([photoIdToDelete])]);

    res.json({ message: 'Profile picture successfully removed.' });
});
