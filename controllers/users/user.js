const { getAllUsers, getSpecificUser, getWall, getUserFriendsList } = require('./user_GET');
const { sendFriendRequest, validatePostForm, writePostToWall, likePost } = require('./user_POST');
const { respondToFriendRequest, editPost } = require('./user_PUT');
const { unlikePost, deletePost } = require('./user_DELETE');
const { validateObjectIDs, validateFriendQueryObjectIDs, verifySameUser } = require('./verify');

module.exports = {
    getAllUsers,
    getSpecificUser,
    getWall,
    getUserFriendsList,
    validateObjectIDs,
    validateFriendQueryObjectIDs,
    verifySameUser,
    validatePostForm,
    writePostToWall,
    likePost,
    unlikePost,
    sendFriendRequest,
    respondToFriendRequest,
    editPost,
    deletePost,
};
