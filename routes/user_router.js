const { Router } = require('express');
const { checkAuthenticated } = require('../controllers/auth/auth');
const {
    getAllUsers,
    getSpecificUser,
    getWall,
    getUserFriendsList,
    validateFriendQueryObjectIDs,
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

userRouter.post(
    '/:userID/friends',
    validateObjectIDs,
    validateFriendQueryObjectIDs,
    sendFriendRequest
);

userRouter.put(
    '/:userID/friends',
    validateObjectIDs,
    validateFriendQueryObjectIDs,
    respondToFriendRequest
);

module.exports = userRouter;
