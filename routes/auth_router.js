const { Router } = require('express');
const { validateSignupLocal, addNewUserLocal, login } = require('../controllers/auth/auth');
const passport = require('passport');

const authRouter = Router();

authRouter.post(
    '/users',
    validateSignupLocal,
    addNewUserLocal,
    passport.authenticate('local'),
    login
);
authRouter.post('/sessions/local', passport.authenticate('local'), login);

module.exports = authRouter;
