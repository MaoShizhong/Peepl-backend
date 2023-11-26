const { Router } = require('express');
const { checkAuthenticated } = require('../controllers/auth/auth');
const {
    getAllUsers,
    getSpecificUser,
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
} = require('../controllers/users/user');
const {
    handleImageFile,
    validateEditDetails,
    validateEditEducation,
    validateEditEmployment,
} = require('../controllers/validation/form_validation');
const {
    validateObjectIDs,
    validateFriendQueryObjectIDs,
    verifySameUser,
} = require('../controllers/validation/user_verify');

const userRouter = Router();

/*
    - Compulsory middleware
*/

// All routes require being logged in
userRouter.use('/', checkAuthenticated);
// All routes that contain objectIDs require objectID validation
userRouter.use('/:userID', validateObjectIDs);
userRouter.use('/:userID/posts/:postID', validateObjectIDs); // previous will not check :postID

/*
    - Routes
*/

/*
    Users
*/
userRouter.get('/', getAllUsers);
userRouter.get('/:userID', getSpecificUser);

/*
    Account details
*/
userRouter.put('/:userID', verifySameUser, validateEditDetails, editDetail);
userRouter.put('/:userID/education', verifySameUser, validateEditEducation, editEducation);
userRouter.put('/:userID/employment', verifySameUser, validateEditEmployment, editEmployment);
userRouter.put(
    '/:userID/profile-picture',
    handleImageFile('profilePicture'),
    verifySameUser,
    changeProfilePicture
);

/*
    Account gallery
*/

/*
    Wall and posts
*/
userRouter.get('/:userID/feed', verifySameUser, getFeed);
userRouter.get('/:userID/posts', getWall);
userRouter.post('/:userID/posts', validatePostForm, writePostToWall);
userRouter.post('/:userID/posts/:postID/likes', likePost);
userRouter.put('/:userID/posts/:postID', verifySameUser, validatePostForm, editPost);
userRouter.delete('/:userID/posts/:postID', verifySameUser, deletePost);
userRouter.delete('/:userID/posts/:postID/likes', unlikePost);

/*
    Friends
*/
userRouter.get('/:userID/friends', getUserFriendsList);

// Simply getting a user's friends list does not require these validations
userRouter.use('/:userID/friends', verifySameUser, validateFriendQueryObjectIDs);

userRouter.post('/:userID/friends', sendFriendRequest);
userRouter.put('/:userID/friends', respondToFriendRequest);

module.exports = userRouter;
