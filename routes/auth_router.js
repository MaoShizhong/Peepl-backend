const { Router } = require('express');
const {
    addNewUserLocal,
    login,
    logout,
    checkAuthenticated,
    deleteUser,
    setNewPassword,
} = require('../controllers/auth/auth');
const { verifyTokenFromEmailLink } = require('../controllers/auth/email_sending');
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

authRouter.put('/password-tokens/:token', verifyTokenFromEmailLink('passwordReset'));
authRouter.delete('/password-tokens/:token', setNewPassword, logout);

authRouter.put('/deletion-tokens/:token', verifyTokenFromEmailLink('accountDeletion'));
authRouter.delete('/deletion-tokens/:token', deleteUser, logout);

module.exports = authRouter;
