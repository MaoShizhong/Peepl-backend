const asyncHandler = require('express-async-handler');
const { ObjectId } = require('mongoose').Types;
const User = require('../../models/User');
const Post = require('../../models/Post');
const { notFoundError } = require('../helpers/error_handling');
const { FEED_POSTS_PER_PAGE } = require('../helpers/constants');

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
        .select(['profilePicture', 'details.firstName', 'details.lastName'])
        .exec();

    const allUsersWithNames = allUsers.map((user) => {
        return {
            _id: user._id,
            profilePicture: user.profilePicture,
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
                profilePicture: 1,
                galleryIsHidden: 1,
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
            profilePicture: user.profilePicture,
            galleryIsHidden: user.galleryIsHidden,
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
        res.status(404).json(notFoundError);
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

exports.getWall = asyncHandler(async (req, res) => {
    const { userID } = req.params;

    const wallPosts = await Post.find({ wall: userID })
        .populate({
            path: 'author',
            options: { projection: 'handle details.firstName details.lastName' },
        })
        .sort({ timestamp: -1 })
        .exec();

    res.json(wallPosts);
});

exports.getFeed = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    const { page } = req.query;

    const postsToSkip = FEED_POSTS_PER_PAGE * ((page ?? 1) - 1);

    const user = await User.findById(_id).select('friends').exec();
    const friends = user.friends.map((friend) => friend.user);

    const feedPosts = await Post.find({
        $and: [{ author: { $in: [...friends, _id] } }, { $expr: { $eq: ['$author', '$wall'] } }],
    })
        .skip(postsToSkip)
        .limit(FEED_POSTS_PER_PAGE)
        .sort({ timestamp: -1 })
        .exec();

    res.json(feedPosts);
});
