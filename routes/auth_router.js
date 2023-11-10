const { Router } = require('express');
const { validateSignupLocal, addNewUserLocal, login } = require('../controllers/auth/auth');

const authRouter = Router();

authRouter.post('/users', validateSignupLocal, addNewUserLocal, login);

module.exports = authRouter;
