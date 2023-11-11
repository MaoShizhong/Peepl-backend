const asyncHandler = require('express-async-handler');
const User = require('../../models/User');
const { invalidPatternError, notFoundError } = require('../helpers/error_handling');
const { isValidObjectId } = require('mongoose');

exports.validateFriendQueryObjectIDs = (req, res, next) => {
    const { requested, incoming } = req.query;

    for (const query of [requested, incoming]) {
        if (query && !isValidObjectId(query)) {
            return res.status(400).json(invalidPatternError(query));
        }
    }

    next();
};

exports.sendFriendRequest = asyncHandler(async (req, res) => {
    // When passport implemented, userID will be obtained from req.user
    const { userID } = req.params;
    const { requested } = req.query;

    if (!requested) {
        return res.status(400).json({ error: 'Missing query string(s).' });
    }

    const userToSendFriendRequestTo = await User.exists({ _id: requested }).exec();
    if (!userToSendFriendRequestTo) {
        return res.status(404).json(notFoundError);
    }

    await Promise.all([
        User.findByIdAndUpdate(userID, {
            $push: { friends: { user: requested, status: 'requested' } },
        }).exec(),
        User.findByIdAndUpdate(requested, {
            $push: { friends: { user: userID, status: 'incoming' } },
        }).exec(),
    ]);

    res.json({ message: 'Friend request sent successfully.' });
});
