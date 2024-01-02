const asyncHandler = require('express-async-handler');
const User = require('../../models/User');
const { acceptFriendRequest, rejectFriendRequest } = require('../helpers/friend_requests');
const { sortByEndDescendingThenStartDescending, extractPublicID } = require('../helpers/util');
const { editDetailsFields } = require('../validation/form_validation');
const { notFoundError } = require('../helpers/error_handling');
const { validationResult } = require('express-validator');
const { cloudinary } = require('../../cloudinary/cloudinary');
const fs = require('fs');

exports.respondToFriendRequest = asyncHandler(async (req, res) => {
    // ! when passport implemented, get user ID from req.user and verify with param
    const { userID } = req.params;
    const { incoming, action } = req.query;

    if (!incoming || !action) {
        return res.status(400).json({ error: 'Missing query string(s).' });
    }

    const [self, incomingUser] = await Promise.all([
        User.findById(userID).exec(),
        User.findById(incoming).exec(),
    ]);

    if (!incomingUser) {
        return res.status(404).json(notFoundError);
    }

    switch (action) {
        case 'accept': {
            const friendRequestExists = await acceptFriendRequest(self, incomingUser);

            if (!friendRequestExists) return res.status(403).json(notFoundError);
            else break;
        }
        case 'reject': {
            const friendRequestExists = await rejectFriendRequest(self, incomingUser);

            if (!friendRequestExists) return res.status(403).json(notFoundError);
            else break;
        }
        default:
            return res.status(400).end();
    }

    res.end();
});

exports.editDetail = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        // Send only the first form error back to user
        const error = errors.array()[0].msg;
        return res.status(400).json({ error });
    }

    // set up update document
    const newUserDetails = {};
    editDetailsFields.forEach((field) => {
        if (field === 'handle') {
            newUserDetails.handle = req.body.handle;
        } else {
            newUserDetails[`details.${field}`] = req.body[field];
        }
    });

    const updatedUser = await User.findByIdAndUpdate(_id, newUserDetails, { new: true })
        .select('-auth -friends -galleryIsHidden -tokens')
        .exec();

    if (!updatedUser) {
        res.status(404).json(notFoundError);
    } else {
        res.json({ updatedUser });
    }
});

exports.editEducation = asyncHandler(async (req, res) => {
    const { education } = req.body;
    const { _id } = req.user;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        // Send only the first form error back to user
        const error = errors.array()[0].msg;
        return res.status(400).json({ error });
    }

    education.value.sort(sortByEndDescendingThenStartDescending);

    const updatedUser = await User.findByIdAndUpdate(
        _id,
        {
            'details.education.value': education.value,
            'details.education.visibility': education.visibility,
        },
        { new: true }
    )
        .select('details.education')
        .exec();

    const updatedEducation = updatedUser.details.education;

    res.json({
        education: updatedEducation.value,
        visibility: updatedEducation.visibility,
    });
});

exports.editEmployment = asyncHandler(async (req, res) => {
    const { employment } = req.body;
    const { _id } = req.user;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        // Send only the first form error back to user
        const error = errors.array()[0].msg;
        return res.status(400).json({ error });
    }

    employment.value.sort(sortByEndDescendingThenStartDescending);

    const updatedUser = await User.findByIdAndUpdate(
        _id,
        {
            'details.employment.value': employment.value,
            'details.employment.visibility': employment.visibility,
        },
        { new: true }
    )
        .select('details.employment')
        .exec();

    const updatedEmployment = updatedUser.details.employment;

    res.json({
        employment: updatedEmployment.value,
        visibility: updatedEmployment.visibility,
    });
});

exports.changeProfilePicture = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    let profilePictureURL = null;

    const user = await User.findById(_id).exec();

    if (req.file) {
        const { path } = req.file;

        /*
            Upload with standardised profile picture format:
            center-square crop then scale to 400x400 - webp for smaller file
            size then delete previous image data from db.
            If no current profilePicture then cloudinary delete request will
            try to delete with a public_id of '' which will simply do nothing.
        */
        const [result] = await Promise.all([
            cloudinary.uploader.upload(path, {
                folder: _id,
                eager: { crop: 'fill', height: 400, width: 400 },
                format: 'webp',
            }),
            cloudinary.api.delete_resources([extractPublicID(user.profilePicture)]),
        ]);

        profilePictureURL = result.eager[0].secure_url;

        // delete temp image file once uploaded to cloudinary
        fs.rmSync(`${process.cwd()}/${path}`);
    }

    user.profilePicture = profilePictureURL;
    await user.save();

    // set to the updated user's profilePicture property just in case for some
    res.json({ profilePicture: profilePictureURL });
});
