const { Router } = require('express');
const { addNewUserLocal, login } = require('../controllers/auth/auth');
const { validateSignupLocal } = require('../controllers/validation/form_validation');
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
