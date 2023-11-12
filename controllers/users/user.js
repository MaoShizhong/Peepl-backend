const { getAllUsers, getSpecificUser, getWall, getUserFriendsList } = require('./user_GET');
const {
    validateFriendQueryObjectIDs,
    verifySameUser,
    sendFriendRequest,
    validatePostForm,
    writePostToWall,
} = require('./user_POST');
const { respondToFriendRequest } = require('./user_PUT');

module.exports = {
    getAllUsers,
    getSpecificUser,
    getWall,
    getUserFriendsList,
    validateFriendQueryObjectIDs,
    verifySameUser,
    validatePostForm,
    writePostToWall,
    sendFriendRequest,
    respondToFriendRequest,
};
