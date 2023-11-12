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
    verifySameUser,
    sendFriendRequest,
    respondToFriendRequest,
} = require('../controllers/users/user');
const { validateObjectIDs } = require('../controllers/helpers/error_handling');

const userRouter = Router();

// All of these routes require being logged in
userRouter.use('/', checkAuthenticated);

userRouter.get('/', getAllUsers);
userRouter.get('/:userID', validateObjectIDs, getSpecificUser);
userRouter.get('/:userID/wall', validateObjectIDs, getWall);
userRouter.get('/:userID/friends', validateObjectIDs, getUserFriendsList);

userRouter.post('/:userID/posts', validateObjectIDs, validatePostForm, writePostToWall);
userRouter.post(
    '/:userID/friends',
    verifySameUser,
    validateObjectIDs,
    validateFriendQueryObjectIDs,
    sendFriendRequest
);

userRouter.put(
    '/:userID/friends',
    verifySameUser,
    validateObjectIDs,
    validateFriendQueryObjectIDs,
    respondToFriendRequest
);

module.exports = userRouter;
