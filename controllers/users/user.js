const { getAllUsers, getSpecificUser, getWall, getUserFriendsList } = require('./user_GET');
const { validateFriendQueryObjectIDs, sendFriendRequest } = require('./user_POST');
const { respondToFriendRequest } = require('./user_PUT');

module.exports = {
    getAllUsers,
    getSpecificUser,
    getWall,
    getUserFriendsList,
    validateFriendQueryObjectIDs,
    sendFriendRequest,
    respondToFriendRequest,
};
