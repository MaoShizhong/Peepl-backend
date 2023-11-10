const asyncHandler = require('express-async-handler');
const { ObjectId } = require('mongoose').Types;
const User = require('../../models/User');
const { notFoundError } = require('../helpers/error_handling');

exports.validateSignupForm;

exports.getSpecificUser = asyncHandler(async (req, res) => {
    const { userID } = req.params;

    const removeFieldIfShouldHide = (field) => {
        // ! When friend system implemented, push 'friends' if req.user is not a friend
        const visibilitiesToHide = ['hidden'];

        return {
            $cond: {
                if: { $in: [`${field}.visibility`, visibilitiesToHide] },
                then: '$$REMOVE',
                else: `${field}.value`,
            },
        };
    };

    const aggregationResult = await User.aggregate([
        { $match: { _id: new ObjectId(userID) } },
        {
            $project: {
                _id: 0,
                handle: 1,
                'details.firstName': 1,
                'details.lastName': 1,
                'details.DOB': removeFieldIfShouldHide('$details.DOB'),
                'details.city': removeFieldIfShouldHide('$details.city'),
                'details.country': removeFieldIfShouldHide('$details.country'),
                'details.employment': removeFieldIfShouldHide('$details.employment'),
                'details.education': removeFieldIfShouldHide('$details.education'),
            },
        },
    ]);

    const user = aggregationResult[0];

    if (!user) {
        res.status(404).json(notFoundError);
    } else {
        const { firstName, lastName, ...hideableDetails } = user.details;

        res.json({
            _id: user._id,
            handle: user.handle,
            name: `${firstName} ${lastName}`,
            ...hideableDetails,
        });
    }
});