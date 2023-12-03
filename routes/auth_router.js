const { Router } = require('express');
const { addNewUserLocal, login, logout, checkAuthenticated } = require('../controllers/auth/auth');
const {
    handleImageFile,
    validateSignupLocal,
} = require('../controllers/validation/form_validation');
const passport = require('passport');

const authRouter = Router();

authRouter.post(
    '/users',
    handleImageFile('profilePicture'),
    validateSignupLocal,
    addNewUserLocal,
    passport.authenticate('local'),
    login
);

authRouter.get('/sessions', checkAuthenticated, login);
authRouter.delete('/sessions', logout);
authRouter.post('/sessions/local', passport.authenticate('local'), login);

module.exports = authRouter;
