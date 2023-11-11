const asyncHandler = require('express-async-handler');
const User = require('../../models/User');
const { acceptFriendRequest, rejectFriendRequest } = require('../helpers/friend_requests');
const { notFoundError } = require('../helpers/error_handling');

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
