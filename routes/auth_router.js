const { Router } = require('express');
const {
    addNewUserLocal,
    login,
    logout,
    checkAuthenticated,
    deleteUser,
    setNewPassword,
    redirectToDashboard,
    loginFromRedirect,
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

/*
    ? The following 3 are called automatically in sequence to carry out the following:
    - 1st is called when `login with Github` is selected
    - When the user authorises on Github, Github will call the 2nd endpoint as a redirect automatically
    - The 2nd will redirect to a client page which will then use URL params to call the 3rd endpoint
    - The 3rd uses this to actually log the user in (res.redirect in 2nd cannot set cookie cross-domain)
*/
authRouter.get('/users/github', passport.authenticate('github', { scope: ['user:email'] }));
authRouter.get('/sessions/github', passport.authenticate('github'), redirectToDashboard);
authRouter.post('/sessions/github/:token', loginFromRedirect);

authRouter.put('/password-tokens/:token', verifyTokenFromEmailLink('passwordReset'));
authRouter.delete('/password-tokens/:token', setNewPassword, logout);

authRouter.put('/deletion-tokens/:token', verifyTokenFromEmailLink('accountDeletion'));
authRouter.delete('/deletion-tokens/:token', deleteUser, logout);

module.exports = authRouter;
