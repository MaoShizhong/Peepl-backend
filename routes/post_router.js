const { Router } = require('express');
const { checkAuthenticated } = require('../controllers/auth/auth');
const { validateObjectIDs, verifySameUser } = require('../controllers/validation/user_verify');
const { addCommentToPost } = require('../controllers/posts/post_POST');
const { editPost, toggleLikePost } = require('../controllers/posts/post_PUT');
const { deletePost, deleteComment } = require('../controllers/posts/post_DELETE');
const { validatePostForm } = require('../controllers/validation/form_validation');

const postRouter = Router();

postRouter.use('/:postID', checkAuthenticated, validateObjectIDs);
postRouter.use('/:postID/comments/:commentID', validateObjectIDs);

postRouter.post('/:postID/comments', validatePostForm, addCommentToPost);
postRouter.put('/:postID/likes', toggleLikePost);
postRouter.put('/:postID', verifySameUser({ userInQuery: true }), validatePostForm, editPost);
postRouter.delete('/:postID', verifySameUser({ userInQuery: true }), deletePost);
postRouter.delete(
    '/:postID/comments/:commentID',
    verifySameUser({ userInQuery: true }),
    deleteComment
);

module.exports = postRouter;
