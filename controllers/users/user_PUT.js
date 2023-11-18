const asyncHandler = require('express-async-handler');
const User = require('../../models/User');
const { acceptFriendRequest, rejectFriendRequest } = require('../helpers/friend_requests');
const { sortByEndDescendingThenStartDescending } = require('../helpers/sort');
const {
    editDetailsFields,
    editDetailsFieldsTheHaveSubfields,
} = require('../validation/form_validation');
const { notFoundError } = require('../helpers/error_handling');
const { validationResult } = require('express-validator');
const Post = require('../../models/Post');

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

exports.editPost = asyncHandler(async (req, res) => {
    const { postID } = req.params;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        // Send only the first form error back to user
        const error = errors.array()[0].msg;
        return res.status(400).json({ error });
    }

    const editedPost = await Post.findByIdAndUpdate(
        postID,
        { body: req.body.body, isEdited: true },
        { new: true }
    );

    if (!editedPost) {
        res.status(404).json(notFoundError);
    } else {
        res.json(editedPost);
    }
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
    const newUserDetails = { details: {} };
    editDetailsFields.forEach((field) => {
        if (field === 'handle' || field === 'email') {
            newUserDetails[field] = req.body[field];
        } else if (field === 'firstName' || field === 'lastName') {
            newUserDetails.details[field] = req.body[field];
        } else {
            const [fieldName, subField] = field.split('.');
            newUserDetails.details[field] = req.body[fieldName][subField];
        }
    });
    editDetailsFieldsTheHaveSubfields.forEach((field) => {
        const [fieldName, subField] = field.split('.');
        newUserDetails.details[field] = req.body[fieldName][subField];
    });

    const updatedUser = await User.findByIdAndUpdate(_id, newUserDetails, { new: true }).exec();

    if (!updatedUser) {
        res.status(404).json(notFoundError);
    } else {
        res.json(updatedUser);
    }
});

exports.editEducation = asyncHandler(async (req, res) => {
    const { education } = req.body;
    const { _id } = req.user;

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
