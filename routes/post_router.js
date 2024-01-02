const { Router } = require('express');
const { checkAuthenticated } = require('../controllers/auth/auth');
const { validateObjectIDs, verifySameUser } = require('../controllers/validation/user_verify');
const { editPost, toggleLikePost } = require('../controllers/posts/post_PUT');
const { deletePost } = require('../controllers/posts/post_DELETE');
const { validatePostForm } = require('../controllers/validation/form_validation');

const postRouter = Router();

postRouter.use('/:postID', checkAuthenticated, validateObjectIDs);

postRouter.put('/:postID/likes', toggleLikePost);
postRouter.put('/:postID', verifySameUser({ userInQuery: true }), validatePostForm, editPost);
postRouter.delete('/:postID', verifySameUser({ userInQuery: true }), deletePost);

module.exports = postRouter;
