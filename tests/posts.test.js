const express = require('express');
const request = require('supertest');
const userRouter = require('../routes/user_router');
const { POST_CHAR_LIMIT } = require('../controllers/helpers/constants');
const { invalidPatternError, notFoundError } = require('../controllers/helpers/error_handling');

const app = express();

app.use(express.urlencoded({ extended: false }));
app.use('/users', userRouter);

const { users } = require('./config/test_users');
const { posts } = require('./config/test_posts');

const userIDs = users.map((user) => user._id.valueOf());
const startPostCountByUser0 = posts.filter((post) => post.author === userIDs[0]).length;
const startPostCountByUser1 = posts.filter((post) => post.author === userIDs[1]).length;

const NONEXISTANT_ID = '65269890203feea7cca8826b';
const INVALID_OBJECT_ID = 'foobar';

describe('Get a wall of posts', () => {
    it("Gets a specified user's wall", async () => {
        const wallRes = await request(app).get(`/users/${userIDs[0]}/wall`);
        expect(wallRes.status).toBe(200);
        expect(wallRes.body).toHaveProperty('user', userIDs[0]);
        expect(wallRes.body.posts.length).toBe(startPostCountByUser0);
    });

    it("Gets another specified user's wall", async () => {
        const wallRes = await request(app).get(`/users/${userIDs[1]}/wall`);
        expect(wallRes.status).toBe(200);
        expect(wallRes.body).toHaveProperty('user', userIDs[1]);
        expect(wallRes.body.posts.length).toBe(startPostCountByUser1);
    });

    it('Wall posts are populated and ordered by date posted (newest first)', async () => {
        const wallRes = await request(app).get(`/users/${userIDs[0]}/wall`);
        expect(wallRes.status).toBe(200);
        expect(wallRes.body.posts.at(0)).toEqual(posts[1]);
        expect(wallRes.body.posts.at(1)).toEqual(posts[0]);
    });
});

describe('Adding new posts to wall', () => {
    it.skip("Adds a post to a user's own wall", async () => {
        const postRes = await request(app)
            .post(`/users/${userIDs[0]}/posts`)
            .type('form')
            .send({ body: 'Added by test' });
        expect(postRes.status).toBe(200);

        const wallRes = await request(app).get(`/users/${userIDs[0]}/wall`);
        expect(wallRes.status).toBe(200);
        expect(wallRes.body.posts.length).toBe(startPostCountByUser0 + 1);
        expect(wallRes.body.posts.at(0).body).toEqual('Added by test');
    });

    it.skip('Does not add a new post if the post body is empty', async () => {
        const postRes = await request(app)
            .post(`/users/${userIDs[0]}/posts`)
            .type('form')
            .send({ body: '' });
        expect(postRes.status).toBe(400);
        expect(postRes.body).toEqual({ error: 'Post cannot be empty.' });

        const wallRes = await request(app).get(`/users/${userIDs[0]}/wall`);
        expect(wallRes.status).toBe(200);
        expect(wallRes.body.posts.length).toBe(startPostCountByUser0 + 1);
        expect(wallRes.body.posts.at(0).body).toEqual('Added by test');
    });

    it.skip(`Does not add a new post if the post body exceeds the character limit of ${POST_CHAR_LIMIT}`, async () => {
        const postRes = await request(app)
            .post(`/users/${userIDs[0]}/posts`)
            .type('form')
            .send({ body: 'a'.repeat(POST_CHAR_LIMIT + 1) });
        expect(postRes.status).toBe(400);
        expect(postRes.body).toEqual({ error: `Max. ${POST_CHAR_LIMIT} characters.` });

        const wallRes = await request(app).get(`/users/${userIDs[0]}/wall`);
        expect(wallRes.status).toBe(200);
        expect(wallRes.body.posts.length).toBe(startPostCountByUser0 + 1);
        expect(wallRes.body.posts.at(0).body).toEqual('Added by test');
    });
});
