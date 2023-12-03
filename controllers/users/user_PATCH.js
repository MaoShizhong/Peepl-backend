const asyncHandler = require('express-async-handler');
const User = require('../../models/User');

exports.toggleGalleryVisibility = asyncHandler(async (req, res) => {
    const { _id } = req.user;

    const user = await User.findById(_id).exec();
    user.galleryIsHidden = !user.galleryIsHidden;
    await user.save();

    res.json({ galleryIsHidden: user.galleryIsHidden });
});
