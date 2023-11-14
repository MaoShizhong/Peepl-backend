const { Router } = require('express');
const { checkAuthenticated } = require('../controllers/auth/auth');
const {
    getAllUsers,
    getSpecificUser,
    getWall,
    getUserFriendsList,
    validateFriendQueryObjectIDs,
    validatePostForm,
    writePostToWall,
    likePost,
    unlikePost,
    verifySameUser,
    sendFriendRequest,
    respondToFriendRequest,
} = require('../controllers/users/user');
const { validateObjectIDs } = require('../controllers/helpers/error_handling');

const userRouter = Router();

/*
    - Compulsory middleware
*/

// All routes require being logged in
userRouter.use('/', checkAuthenticated);
// All routes that contain objectIDs require objectID validation
userRouter.use('/:userID', validateObjectIDs);

/*
    - Routes
*/

/*
    Users
*/
userRouter.get('/', getAllUsers);
userRouter.get('/:userID', getSpecificUser);

/*
    Wall and posts
*/
userRouter.get('/:userID/posts', getWall);
userRouter.post('/:userID/posts', validatePostForm, writePostToWall);
userRouter.post('/:userID/posts/:postID/likes', likePost);
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
