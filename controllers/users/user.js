const { getAllUsers, getSpecificUser, getWall, getUserFriendsList } = require('./user_GET');
const { sendFriendRequest, validatePostForm, writePostToWall, likePost } = require('./user_POST');
const { respondToFriendRequest, editPost, validateDetailField, editDetail } = require('./user_PUT');
const { unlikePost, deletePost } = require('./user_DELETE');

module.exports = {
    getAllUsers,
    getSpecificUser,
    validateDetailField,
    editDetail,
    getWall,
    getUserFriendsList,
    validatePostForm,
    writePostToWall,
    likePost,
    unlikePost,
    sendFriendRequest,
    respondToFriendRequest,
    editPost,
    deletePost,
};
