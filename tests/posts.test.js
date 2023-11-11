const request = require('supertest');
const { POST_CHAR_LIMIT } = require('../controllers/helpers/constants');
const { notLoggedInError } = require('../controllers/helpers/error_handling');

const app = require('./config/test_server');

const { users } = require('./config/test_users');
const { posts } = require('./config/test_posts');

const userIDs = users.map((user) => user._id.valueOf());
const startingPostsOnWall0 = posts.filter((post) => post.wall === userIDs[0]);
const startingPostsOnWall1 = posts.filter((post) => post.wall === userIDs[1]);

const NONEXISTANT_ID = '65269890203feea7cca8826b';
const INVALID_OBJECT_ID = 'foobar';

const loggedInUser = request.agent(app);

describe('Login with user', () => {
    it('Logs a user in with the credentials via local strategy', async () => {
        const loginRes = await loggedInUser
            .post('/auth/sessions/local')
            .type('form')
            .send({ email: users[0].email, password: users[0].auth.password });
        expect(loginRes.status).toBe(201);
    });
});

describe('Get a wall of posts', () => {
    it('Requires being logged in to fetch wall posts', async () => {
        const wallRes = await request(app).get(`/users/${userIDs[0]}/wall`);
        expect(wallRes.status).toBe(401);
        expect(wallRes.body).toEqual(notLoggedInError);
    });

    it.skip('Gets own wall if logged in', async () => {
        const wallRes = await loggedInUser.get(`/users/${userIDs[0]}/wall`);
        expect(wallRes.status).toBe(200);
        expect(wallRes.body.length).toBe(startingPostsOnWall0.length);
    });

    it.skip("Gets another user's wall", async () => {
        const wallRes = await loggedInUser.get(`/users/${userIDs[1]}/wall`);
        expect(wallRes.status).toBe(200);
        expect(wallRes.body).toHaveProperty('user', userIDs[1]);
        expect(wallRes.body.length).toBe(startingPostsOnWall1.length);
    });

    it.skip('Wall posts are populated and ordered by date posted (newest first)', async () => {
        const wallRes = await loggedInUser.get(`/users/${userIDs[0]}/wall`);
        expect(wallRes.status).toBe(200);
        expect(wallRes.body.at(0)).toEqual(startingPostsOnWall1.at(-1));
        expect(wallRes.body.at(-1)).toEqual(startingPostsOnWall1.at(0));
    });
});

describe('Adding new posts to wall', () => {
    const postOnOwnWall = 'Added by First0 Last0 own';
    const postOnAnotherWall = 'Added by First0 Last0 not own';

    it.skip('Adds a post to own wall', async () => {
        const postRes = await loggedInUser
            .post(`/users/${userIDs[0]}/posts`)
            .type('form')
            .send({ body: postOnOwnWall });
        expect(postRes.status).toBe(200);

        const wallRes = await loggedInUser.get(`/users/${userIDs[0]}/wall`);
        expect(wallRes.status).toBe(200);
        expect(wallRes.body.posts.length).toBe(startingPostsOnWall0.length + 1);
        expect(wallRes.body.posts.at(0).body).toEqual(postOnOwnWall);
    });

    it.skip("Adds a post to another user's wall", async () => {
        const postRes = await loggedInUser
            .post(`/users/${userIDs[1]}/posts`)
            .type('form')
            .send({ body: postOnAnotherWall });
        expect(postRes.status).toBe(200);

        const wallRes = await loggedInUser.get(`/users/${userIDs[0]}/wall`);
        expect(wallRes.status).toBe(200);
        expect(wallRes.body.posts.length).toBe(startingPostsOnWall1.length + 1);
        expect(wallRes.body.posts.at(0).body).toEqual(postOnAnotherWall);
    });

    it.skip('Does not add a new post if the post body is empty', async () => {
        const postRes = await loggedInUser
            .post(`/users/${userIDs[0]}/posts`)
            .type('form')
            .send({ body: '' });
        expect(postRes.status).toBe(400);
        expect(postRes.body).toEqual({ error: 'Post cannot be empty.' });

        const wallRes = await loggedInUser.get(`/users/${userIDs[0]}/wall`);
        expect(wallRes.status).toBe(200);
        expect(wallRes.body.posts.length).toBe(startingPostsOnWall0.length + 1);
        expect(wallRes.body.posts.at(0).body).toEqual(postOnOwnWall);
    });

    it.skip(`Does not add a new post if the post body exceeds the character limit of ${POST_CHAR_LIMIT}`, async () => {
        const postRes = await loggedInUser
            .post(`/users/${userIDs[0]}/posts`)
            .type('form')
            .send({ body: 'a'.repeat(POST_CHAR_LIMIT + 1) });
        expect(postRes.status).toBe(400);
        expect(postRes.body).toEqual({ error: `Max. ${POST_CHAR_LIMIT} characters.` });

        const wallRes = await loggedInUser.get(`/users/${userIDs[0]}/wall`);
        expect(wallRes.status).toBe(200);
        expect(wallRes.body.posts.length).toBe(startingPostsOnWall0.length + 1);
        expect(wallRes.body.posts.at(0).body).toEqual(postOnOwnWall);
    });
});
