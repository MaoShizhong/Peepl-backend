const {
    getAllUsers,
    getSpecificUser,
    getRestOfProfile,
    getFeed,
    getGallery,
} = require('./user_GET');
const {
    sendFriendRequest,
    validatePostForm,
    writePostToWall,
    likePost,
    addPhotoToGallery,
} = require('./user_POST');
const {
    respondToFriendRequest,
    editPost,
    validateDetailField,
    editDetail,
    editEducation,
    editEmployment,
    changeProfilePicture,
} = require('./user_PUT');
const { toggleGalleryVisibility } = require('./user_PATCH');
const { unlikePost, deletePost, deletePhoto, removeFriend } = require('./user_DELETE');

module.exports = {
    getAllUsers,
    getSpecificUser,
    validateDetailField,
    editDetail,
    editEducation,
    editEmployment,
    changeProfilePicture,
    getRestOfProfile,
    getFeed,
    validatePostForm,
    writePostToWall,
    likePost,
    unlikePost,
    sendFriendRequest,
    respondToFriendRequest,
    removeFriend,
    editPost,
    deletePost,
    getGallery,
    toggleGalleryVisibility,
    addPhotoToGallery,
    deletePhoto,
};
