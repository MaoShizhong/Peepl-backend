const { Router } = require('express');
const { getAllUsers, getSpecificUser } = require('../controllers/users/user');
const { validateObjectIDs } = require('../controllers/helpers/error_handling');

const userRouter = Router();

userRouter.get('/', getAllUsers);
userRouter.get('/:userID', validateObjectIDs, getSpecificUser);

module.exports = userRouter;
