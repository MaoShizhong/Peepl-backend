const { Router } = require('express');
const { checkAuthenticated } = require('../controllers/auth/auth');
const user = require('../controllers/users/user');
const {
    handleImageFile,
    validateEditDetails,
    validateEditEducation,
    validateEditEmployment,
    validateFields,
    validatePostForm,
} = require('../controllers/validation/form_validation');
const {
    validateObjectIDs,
    validateFriendQueryObjectIDs,
    verifySameUser,
} = require('../controllers/validation/user_verify');
const { sendEmail } = require('../controllers/auth/email_sending');

const userRouter = Router();

// All routes require being logged in
userRouter.use('/', checkAuthenticated);

/*
    - Routes
*/

/*
    Users
*/
userRouter.get('/', user.getAllUsers);
userRouter.get('/:handle', user.getSpecificUser, user.getRestOfProfile);

// ! All routes that contain objectIDs require objectID validation
userRouter.use('/:userID', validateObjectIDs);
userRouter.use('/:userID/posts/:postID', validateObjectIDs); // previous will not check :postID

userRouter.delete('/:userID', verifySameUser(), sendEmail('accountDeletion'));

/*
    Account details
*/
userRouter.put(
    '/:userID',
    verifySameUser(),
    validateEditDetails,
    user.editDetail
);
userRouter.put('/:userID/education', verifySameUser(), validateEditEducation, user.editEducation);
userRouter.put(
    '/:userID/employment',
    verifySameUser(),
    validateEditEmployment,
    user.editEmployment
);
userRouter.put(
    '/:userID/profile-picture',
    handleImageFile('profilePicture'),
    verifySameUser(),
    user.changeProfilePicture
);
userRouter.patch(
    '/:userID/email',
    verifySameUser(),
    validateFields('email', 'password'),
    user.changeEmail
);
userRouter.patch('/:userID/password', verifySameUser(), sendEmail('passwordReset'));

/*
    Account gallery
*/
userRouter.get('/:userID/gallery', user.getGallery);
userRouter.patch('/:userID/gallery', verifySameUser(), user.toggleGalleryVisibility);
userRouter.post(
    '/:userID/gallery',
    handleImageFile('photo'),
    verifySameUser(),
    user.addPhotoToGallery
);
userRouter.delete('/:userID/gallery/:photoID', verifySameUser(), user.deletePhoto);

/*
    Feed/wall
*/
userRouter.get('/:userID/feed', verifySameUser(), user.getFeed);
userRouter.post('/:userID/posts', validatePostForm, user.writePostToWall);

/*
    Friends
*/
userRouter.use('/:userID/friends', verifySameUser(), validateFriendQueryObjectIDs);

userRouter.get('/:userID/friends', user.getIncomingFriendRequests);
userRouter.post('/:userID/friends', user.sendFriendRequest);
userRouter.put('/:userID/friends', user.respondToFriendRequest);
userRouter.delete('/:userID/friends/:friendID', user.removeFriend);

module.exports = userRouter;
