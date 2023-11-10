const { Router } = require('express');
const { getAllUsers, getSpecificUser, getWall } = require('../controllers/users/user');
const { validateObjectIDs } = require('../controllers/helpers/error_handling');

const userRouter = Router();

userRouter.get('/', getAllUsers);
userRouter.get('/:userID', validateObjectIDs, getSpecificUser);
userRouter.get('/:userID/wall', validateObjectIDs, getWall);

module.exports = userRouter;
