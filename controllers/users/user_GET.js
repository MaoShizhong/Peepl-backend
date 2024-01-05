const asyncHandler = require('express-async-handler');
const User = require('../../models/User');
const Post = require('../../models/Post');
const Photo = require('../../models/Photo');
const { notFoundError } = require('../helpers/error_handling');
const { ITEMS_PER_PAGE } = require('../helpers/constants');
const { getFriendStatus } = require('../helpers/friend_requests');
const Comment = require('../../models/Comment');

exports.getAllUsers = asyncHandler(async (req, res) => {
    const { _id, handle } = req.user;
    const { search } = req.query;
    const uriDecodedSearchQuery = decodeURIComponent(search ?? '');

    const searchRegex = new RegExp(uriDecodedSearchQuery, 'i');

    const [allUsers, friendsList] = await Promise.all([
        User.aggregate([
            {
                $addFields: {
                    fullName: { $concat: ['$details.firstName', ' ', '$details.lastName'] },
                },
            },
            {
                $match: {
                    $and: [{ fullName: { $regex: searchRegex } }, { handle: { $ne: handle } }],
                },
            },
            {
                $project: {
                    profilePicture: 1,
                    'details.firstName': 1,
                    'details.lastName': 1,
                    handle: 1,
                },
            },
        ]).exec(),
        User.findById(_id, 'friends -_id').exec(),
    ]);

    const allUsersWithNames = allUsers.map((user) => {
        return {
            _id: user._id,
            handle: user.handle,
            profilePicture: user.profilePicture,
            name: `${user.details.firstName} ${user.details.lastName}`,
            status: getFriendStatus(friendsList.friends, user._id),
        };
    });

    res.json({ users: allUsersWithNames });
});

exports.getSpecificUser = asyncHandler(async (req, res, next) => {
    const { handle } = req.params;

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
        { $match: { handle: handle } },
        {
            $project: {
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
    ]).exec();

    const user = aggregationResult[0];

    if (!user) {
        res.status(404).json(notFoundError);
    } else {
        const { firstName, lastName, ...hideableDetails } = user.details;

        req.profile = {
            user: {
                _id: user._id,
                handle: user.handle,
                profilePicture: user.profilePicture,
                galleryIsHidden: user.galleryIsHidden,
                name: `${firstName} ${lastName}`,
                ...hideableDetails,
            },
        };

        next();
    }
});

exports.getRestOfProfile = asyncHandler(async (req, res) => {
    const { _id } = req.profile.user;
    const { page } = req.query;

    const postsToSkip = ITEMS_PER_PAGE * ((page ?? 1) - 1);

    const [user, wallPosts, wallPostsCount] = await Promise.all([
        User.findById(_id, 'friends -_id')
            .populate({
                path: 'friends.user',
                options: { projection: 'details.firstName details.lastName profilePicture handle' },
            })
            .sort({ 'friends.user.details.firstName': 1, 'friends.user.details.lastName': 1 })
            .exec(),
        Post.find({ wall: _id })
            .skip(postsToSkip)
            .limit(ITEMS_PER_PAGE)
            .sort({ timestamp: -1 })
            .populate({
                path: 'author',
                options: { projection: 'handle details.firstName details.lastName profilePicture' },
            })
            .exec(),
        Post.countDocuments({ wall: _id }).exec(),
    ]);

    const wallPostIDs = wallPosts.map((post) => post.id);

    const commentsOnWallPosts = await Comment.find({ post: { $in: wallPostIDs } })
        .sort({ timestamp: 1 })
        .populate({
            path: 'author',
            options: { projection: 'handle details.firstName details.lastName profilePicture' },
        })
        .exec();

    const wallPostsWithComments = wallPosts.map((post) => {
        return {
            ...post.toObject(),
            comments: commentsOnWallPosts
                .filter((comment) => comment.post.valueOf() === post.id)
                .slice(-6),
        };
    });

    const formattedFriendsList = user.friends.map((friend) => {
        return {
            user: {
                _id: friend.user._id,
                handle: friend.user.handle,
                profilePicture: friend.user.profilePicture,
                firstName: friend.user.details.firstName,
                lastName: friend.user.details.lastName,
            },
            status: friend.status,
        };
    });

    const allPreviousPagesPosts = ((page ?? 1) - 1) * ITEMS_PER_PAGE;

    req.profile.friends = formattedFriendsList;
    req.profile.wall = wallPostsWithComments;
    req.profile.hasMorePosts =
        wallPostsCount > wallPostsWithComments.length + allPreviousPagesPosts;

    res.json(req.profile);
});

exports.getIncomingFriendRequests = asyncHandler(async (req, res) => {
    const { _id } = req.user;

    const { friends } = await User.findById(_id, 'friends -_id')
        .populate({
            path: 'friends.user',
            options: { projection: 'details.firstName details.lastName profilePicture handle' },
        })
        .exec();

    const incomingRequests = friends
        .filter((request) => request.status === 'incoming')
        .map((request) => request.user);

    res.json({ incomingRequests });
});

exports.getFeed = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    const { page } = req.query;

    const postsToSkip = ITEMS_PER_PAGE * ((page ?? 1) - 1);

    const user = await User.findById(_id).select('friends').exec();
    const friends = user.friends.map((friend) => friend.user);

    const [feedPosts, feedPostsCount] = await Promise.all([
        Post.find({
            $and: [
                { author: { $in: [...friends, _id] } },
                { $expr: { $eq: ['$author', '$wall'] } },
            ],
        })
            .skip(postsToSkip)
            .limit(ITEMS_PER_PAGE)
            .sort({ timestamp: -1 })
            .populate({
                path: 'author',
                options: { projection: 'handle details.firstName details.lastName profilePicture' },
            })
            .exec(),
        Post.countDocuments({
            $and: [
                { author: { $in: [...friends, _id] } },
                { $expr: { $eq: ['$author', '$wall'] } },
            ],
        }).exec(),
    ]);

    const feedPostIDs = feedPosts.map((post) => post.id);

    const commentsOnFeedPosts = await Comment.find({ post: { $in: feedPostIDs } })
        .sort({ timestamp: 1 })
        .populate({
            path: 'author',
            options: { projection: 'handle details.firstName details.lastName profilePicture' },
        })
        .exec();

    const feedPostsWithComments = feedPosts.map((post) => {
        return {
            ...post.toObject(),
            comments: commentsOnFeedPosts
                .filter((comment) => comment.post.valueOf() === post.id)
                .slice(-6),
        };
    });

    const allPreviousPagesPosts = ((page ?? 1) - 1) * ITEMS_PER_PAGE;

    res.json({
        feed: feedPostsWithComments,
        hasMorePosts: feedPostsCount > feedPosts.length + allPreviousPagesPosts,
    });
});

exports.getGallery = asyncHandler(async (req, res) => {
    const { userID } = req.params;
    const { _id } = req.user;
    const { page } = req.query;

    const postsToSkip = ITEMS_PER_PAGE * ((page ?? 1) - 1);

    const [self, galleryOwner] = await Promise.all([
        User.findById(_id).exec(),
        User.findById(userID).exec(),
    ]);

    const isFriendsWithGalleryOwner = self.friends.find(
        (friend) => friend.user.valueOf() === userID
    );
    if (_id !== userID && galleryOwner.galleryIsHidden && !isFriendsWithGalleryOwner) {
        return res.status(403).json({
            message: 'This user has chosen to make their gallery visible only to their friends.',
        });
    }

    const [gallery, photoCount] = await Promise.all([
        Photo.find({ user: userID })
            .skip(postsToSkip)
            .limit(ITEMS_PER_PAGE)
            .sort({ timestamp: -1 })
            .exec(),
        Photo.countDocuments({ user: userID }).exec(),
    ]);

    const allPreviousPagesPosts = ((page ?? 1) - 1) * ITEMS_PER_PAGE;

    res.json({
        gallery: gallery,
        hasMorePhotos: photoCount > gallery.length + allPreviousPagesPosts,
    });
});
