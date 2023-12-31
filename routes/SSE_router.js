const { Router } = require('express');
const { checkAuthenticated } = require('../controllers/auth/auth');
const {
    subscribeToFriendRequestNotifications,
    subscribeToFeedUpdates,
} = require('../controllers/SSE/subscribe');

const sseRouter = Router();

sseRouter.use(checkAuthenticated);

sseRouter.get('/friend-requests', subscribeToFriendRequestNotifications);
sseRouter.get('/feed-updates', subscribeToFeedUpdates);

module.exports = sseRouter;
