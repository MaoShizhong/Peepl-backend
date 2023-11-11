const asyncHandler = require('express-async-handler');
const { ObjectId } = require('mongoose').Types;
const User = require('../../models/User');
const { notFoundError } = require('../helpers/error_handling');
const Wall = require('../../models/Wall');

exports.getAllUsers = asyncHandler(async (req, res) => {
    let { search } = req.query;
    search ??= '';

    const searchRegex = new RegExp(search, 'i');

    const allUsers = await User.find({
        $or: [
            { 'details.firstName': { $regex: searchRegex } },
            { 'details.lastName': { $regex: searchRegex } },
        ],
    })
        .select(['details.firstName', 'details.lastName'])
        .exec();

    const allUsersWithNames = allUsers.map((user) => {
        return {
            _id: user._id,
            name: `${user.details.firstName} ${user.details.lastName}`,
        };
    });

    res.json({ users: allUsersWithNames });
});

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

exports.getUserFriendsList = asyncHandler(async (req, res) => {
    const { userID } = req.params;

    const user = await User.findById(userID, 'friends -_id')
        .populate({
            path: 'friends.user',
            options: { projection: 'details.firstName details.lastName' },
        })
        .exec();

    if (!user) {
        res.status(404).end();
    }

    const formattedFriendsList = user.friends.map((friend) => {
        return {
            user: {
                _id: friend.user._id,
                firstName: friend.user.details.firstName,
                lastName: friend.user.details.lastName,
            },
            status: friend.status,
        };
    });

    res.json(formattedFriendsList);
});

exports.getWall = async (req, res) => {
    const { userID } = req.params;

    const wall = await Wall.findOne({ user: userID }).exec();

    if (!wall) {
        res.status(404).json(notFoundError);
    } else {
        res.json(wall);
    }
};
