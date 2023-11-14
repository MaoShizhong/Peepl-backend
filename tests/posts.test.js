const request = require('supertest');
const { POST_CHAR_LIMIT } = require('../controllers/helpers/constants');
const { notLoggedInError } = require('../controllers/helpers/error_handling');

const app = require('./config/test_server');

const { users } = require('./config/test_users');
const { posts } = require('./config/test_posts');

const userIDs = users.map((user) => user._id.valueOf());
const postIDs = posts.map((post) => post._id.valueOf());
const startingPostsOnWall0 = posts.filter((post) => post.wall === userIDs[0]);
const startingPostsOnWall1 = posts.filter((post) => post.wall === userIDs[1]);

const NONEXISTANT_ID = '65269890203feea7cca8826b';
const INVALID_OBJECT_ID = 'foobar';

const loggedInUser = request.agent(app);
const loggedInUser1 = request.agent(app);

describe('Login with user', () => {
    it('Logs a user in with the credentials via local strategy', async () => {
        const loginRes = await loggedInUser
            .post('/auth/sessions/local')
            .type('form')
            .send({ email: users[0].email, password: users[0].auth.password });
        expect(loginRes.status).toBe(201);
    });

    it('Logs a user in with the credentials via local strategy', async () => {
        const loginRes1 = await loggedInUser1
            .post('/auth/sessions/local')
            .type('form')
            .send({ email: users[1].email, password: users[1].auth.password });
        expect(loginRes1.status).toBe(201);
    });
});

describe('Get a wall of posts', () => {
    it('Requires being logged in to fetch wall posts', async () => {
        const wallRes = await request(app).get(`/users/${userIDs[0]}/posts`);
        expect(wallRes.status).toBe(401);
        expect(wallRes.body).toEqual(notLoggedInError);
    });

    it('Gets own wall if logged in', async () => {
        const wallRes = await loggedInUser.get(`/users/${userIDs[0]}/posts`);
        expect(wallRes.status).toBe(200);
        expect(wallRes.body.length).toBe(startingPostsOnWall0.length);
    });

    it("Gets another user's wall", async () => {
        const wallRes = await loggedInUser.get(`/users/${userIDs[1]}/posts`);
        expect(wallRes.status).toBe(200);
        expect(wallRes.body.length).toBe(startingPostsOnWall1.length);
    });

    it('Wall posts are populated and ordered by date posted (newest first)', async () => {
        const wallRes = await loggedInUser.get(`/users/${userIDs[0]}/posts`);

        expect(wallRes.status).toBe(200);

        expect(wallRes.body.at(0)).toHaveProperty('body', startingPostsOnWall0.at(-1).body);
        expect(wallRes.body.at(-1)).toHaveProperty('body', startingPostsOnWall0.at(0).body);

        expect(wallRes.body.at(0).author).toMatchObject({
            details: { firstName: 'First1', lastName: 'Last1' },
        });
        expect(wallRes.body.at(-1).author).toMatchObject({
            details: { firstName: 'First0', lastName: 'Last0' },
        });
    });
});

describe('Adding new posts to wall', () => {
    const postOnOwnWall = 'Added by First0 Last0 own';
    const postOnAnotherWall = 'Added by First0 Last0 not own';

    it('Adds a post to own wall', async () => {
        const postRes = await loggedInUser
            .post(`/users/${userIDs[0]}/posts`)
            .type('form')
            .send({ body: postOnOwnWall });
        expect(postRes.status).toBe(201);

        const wallRes = await loggedInUser.get(`/users/${userIDs[0]}/posts`);
        expect(wallRes.status).toBe(200);
        expect(wallRes.body.length).toBe(startingPostsOnWall0.length + 1);
        expect(wallRes.body.at(0).body).toEqual(postOnOwnWall);
    });

    it("Adds a post to another user's wall", async () => {
        const postRes = await loggedInUser
            .post(`/users/${userIDs[1]}/posts`)
            .type('form')
            .send({ body: postOnAnotherWall });
        expect(postRes.status).toBe(201);

        const wallRes = await loggedInUser.get(`/users/${userIDs[1]}/posts`);
        expect(wallRes.status).toBe(200);
        expect(wallRes.body.length).toBe(startingPostsOnWall1.length + 1);
        expect(wallRes.body.at(0).body).toEqual(postOnAnotherWall);
        expect(wallRes.body.at(0).author._id).toBe(userIDs[0]);
    });

    it('Does not add a new post if the post body is empty', async () => {
        const postRes = await loggedInUser
            .post(`/users/${userIDs[0]}/posts`)
            .type('form')
            .send({ body: '' });
        expect(postRes.status).toBe(400);
        expect(postRes.body).toEqual({ error: 'Post cannot be empty.' });

        const wallRes = await loggedInUser.get(`/users/${userIDs[0]}/posts`);
        expect(wallRes.status).toBe(200);
        expect(wallRes.body.length).toBe(startingPostsOnWall0.length + 1);
        expect(wallRes.body.at(0).body).toEqual(postOnOwnWall);
    });

    it(`Does not add a new post if the post body exceeds the character limit of ${POST_CHAR_LIMIT}`, async () => {
        const postRes = await loggedInUser
            .post(`/users/${userIDs[0]}/posts`)
            .type('form')
            .send({ body: 'a'.repeat(POST_CHAR_LIMIT + 1) });
        expect(postRes.status).toBe(400);
        expect(postRes.body).toEqual({ error: `Max. ${POST_CHAR_LIMIT} characters.` });

        const wallRes = await loggedInUser.get(`/users/${userIDs[0]}/posts`);
        expect(wallRes.status).toBe(200);
        expect(wallRes.body.length).toBe(startingPostsOnWall0.length + 1);
        expect(wallRes.body.at(0).body).toEqual(postOnOwnWall);
    });
});

describe('Liking wall posts', () => {
    it('Prevents post liking if not logged in', async () => {
        const rejectRes = await request(app).post(`/users/posts/${postIDs[0]}/likes`);
        expect(rejectRes.status).toBe(401);
        expect(rejectRes.body).toEqual(notLoggedInError);
    });

    it("Increases a post's like count by 1 when a user likes it", async () => {
        const wallRes = await loggedInUser.get(`/users/${userIDs[1]}/posts`);
        const postToLike = wallRes.body[0];
        expect(postToLike.likes.length).toBe(0);

        const likeRes = await loggedInUser.post(
            `/users/${userIDs[1]}/posts/${postToLike._id}/likes`
        );
        expect(likeRes.status).toBe(200);

        const likedWallRes = await loggedInUser.get(`/users/${userIDs[1]}/posts`);
        const likes = likedWallRes.body[0].likes;
        expect(likes.length).toBe(1);
    });

    it("Stores a like on a post as the liker's _id in the likes array", async () => {
        const likedWallRes = await loggedInUser.get(`/users/${userIDs[1]}/posts`);
        const likes = likedWallRes.body[0].likes;
        expect(likes).toEqual([userIDs[0]]);
    });

    it('Does not add a new like to a post if the liker has already liked the post', async () => {
        const wallRes = await loggedInUser.get(`/users/${userIDs[1]}/posts`);
        const postToLike = wallRes.body[0];
        expect(postToLike.likes.length).toBe(1);

        const duplicateRes = await loggedInUser.post(
            `/users/${userIDs[1]}/posts/${postToLike._id}/likes`
        );
        expect(duplicateRes.status).toBe(400);
        expect(duplicateRes.body).toEqual({ error: 'Post already liked.' });

        const likedWallRes = await loggedInUser.get(`/users/${userIDs[1]}/posts`);
        const likes = likedWallRes.body[0].likes;
        expect(likes.length).toBe(1);
    });

    it('Prevents unliking a post if the user has not already liked the post', async () => {
        const wallRes = await loggedInUser1.get(`/users/${userIDs[1]}/posts`);
        const postToUnlike = wallRes.body[0];
        expect(postToUnlike.likes.length).toBe(1);

        const notLikedRes = await loggedInUser1.delete(
            `/users/${userIDs[1]}/posts/${postToUnlike._id}/likes`
        );
        expect(notLikedRes.status).toBe(404);

        const likedWallRes = await loggedInUser1.get(`/users/${userIDs[1]}/posts`);
        const likes = likedWallRes.body[0].likes;
        expect(likes.length).toBe(1);
    });

    it("Removes a liker's _id from a post's likes array and reduces its count by 1 when unliked", async () => {
        const wallRes = await loggedInUser.get(`/users/${userIDs[1]}/posts`);
        const postToUnlike = wallRes.body[0];
        expect(postToUnlike.likes.length).toBe(1);

        const unlikeRes = await loggedInUser.delete(
            `/users/${userIDs[1]}/posts/${postToUnlike._id}/likes`
        );
        expect(unlikeRes.status).toBe(200);

        const likedWallRes = await loggedInUser.get(`/users/${userIDs[1]}/posts`);
        const likes = likedWallRes.body[0].likes;
        expect(likes.length).toBe(0);
    });
});
