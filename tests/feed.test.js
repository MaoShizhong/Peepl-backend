const request = require('supertest');
const app = require('./config/test_server');

const { feedUsers: users, feedPosts: posts } = require('./config/test_feedusers');
const { unauthorisedError } = require('../controllers/helpers/error_handling');

const userIDs = users.map((user) => user._id.valueOf());

const loggedInUser0 = request.agent(app);
const loggedInUser1 = request.agent(app);

describe('Login with user', () => {
    it('Logs a user in with the correct credentials via local strategy', async () => {
        const loginRes = await loggedInUser0
            .post('/auth/sessions/local')
            .type('form')
            .send({ email: users[0].email, password: users[0].auth.password });
        expect(loginRes.status).toBe(201);
    });

    it('Logs a second user in with the correct credentials via local strategy', async () => {
        const loginRes = await loggedInUser1
            .post('/auth/sessions/local')
            .type('form')
            .send({ email: users[1].email, password: users[1].auth.password });
        expect(loginRes.status).toBe(201);
    });
});

describe('Get user details', () => {
    const acceptedTestFeedPosts = (post) =>
        post.author === userIDs[1] || post.author === userIDs[0];
    const sortByDateDescending = (postA, postB) =>
        new Date(postB.timestamp) - new Date(postA.timestamp);

    it("Gets user0's feed, establishing a new EventSource for SSEs", async () => {
        const user0Feed = posts
            .filter(acceptedTestFeedPosts)
            .sort(sortByDateDescending)
            .slice(0, 30);

        const res = await loggedInUser0.get(`/users/${userIDs[0]}/feed`);
        expect(res.status).toBe(200);
        expect(res.body).toEqual(user0Feed);
    });

    it('Limits feed results to max. 30 posts per page, treating omitted page query as page 1, sorted latest first', async () => {
        const user1FeedLatestThirty = posts
            .filter(acceptedTestFeedPosts)
            .sort(sortByDateDescending)
            .slice(0, 30);

        const res = await loggedInUser1.get(`/users/${userIDs[1]}/feed`);

        expect(res.status).toBe(200);
        expect(res.body).toEqual(user1FeedLatestThirty);
    });

    it('Returns paginated feed results to max. 30 posts per page', async () => {
        const user1FeedRemaining = posts
            .filter(acceptedTestFeedPosts)
            .sort(sortByDateDescending)
            .slice(30);
        const res = await loggedInUser1.get(`/users/${userIDs[1]}/feed?page=2`);

        expect(res.status).toBe(200);
        expect(res.body).toEqual(user1FeedRemaining);
    });

    it("Only returns posts from self and friends on the authors' own walls", async () => {
        const containsOnlySelfAndFriendsOwnPosts = (posts) =>
            posts.every((post) => [userIDs[0], userIDs[1]].includes(post.author));

        const res = await loggedInUser1.get(`/users/${userIDs[1]}/feed`);

        expect(res.status).toBe(200);
        expect(containsOnlySelfAndFriendsOwnPosts(res.body)).toBe(true);
    });

    it("Prevents getting a different user's feed", async () => {
        const res = await loggedInUser0.get(`/users/${userIDs[1]}/feed?page=2`);

        expect(res.status).toBe(403);
        expect(res.body).toEqual(unauthorisedError);
    });
});
