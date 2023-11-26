const {
    getAllUsers,
    getSpecificUser,
    getWall,
    getUserFriendsList,
    getFeed,
} = require('./user_GET');
const { sendFriendRequest, validatePostForm, writePostToWall, likePost } = require('./user_POST');
const {
    respondToFriendRequest,
    editPost,
    validateDetailField,
    editDetail,
    editEducation,
    editEmployment,
    changeProfilePicture,
} = require('./user_PUT');
const { unlikePost, deletePost } = require('./user_DELETE');

module.exports = {
    getAllUsers,
    getSpecificUser,
    validateDetailField,
    editDetail,
    editEducation,
    editEmployment,
    changeProfilePicture,
    getWall,
    getFeed,
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
