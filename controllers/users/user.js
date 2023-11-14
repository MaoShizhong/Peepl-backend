const { getAllUsers, getSpecificUser, getWall, getUserFriendsList } = require('./user_GET');
const {
    validateFriendQueryObjectIDs,
    verifySameUser,
    sendFriendRequest,
    validatePostForm,
    writePostToWall,
    likePost,
} = require('./user_POST');
const { respondToFriendRequest } = require('./user_PUT');
const { unlikePost } = require('./user_DELETE');

module.exports = {
    getAllUsers,
    getSpecificUser,
    getWall,
    getUserFriendsList,
    validateFriendQueryObjectIDs,
    verifySameUser,
    validatePostForm,
    writePostToWall,
    likePost,
    unlikePost,
    sendFriendRequest,
    respondToFriendRequest,
};
