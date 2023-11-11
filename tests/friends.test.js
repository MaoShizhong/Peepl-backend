const request = require('supertest');
const { invalidPatternError, notFoundError } = require('../controllers/helpers/error_handling');

const app = require('./config/test_server');

const { friendUsers: users } = require('./config/test_friends');

const userIDs = users.map((user) => user._id.valueOf());

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

describe('Send friend requests', () => {
    it("Adds a 'requested' friend to a user's friends list upon sending a friend request", async () => {
        const requestRes1 = await loggedInUser.post(
            `/users/${userIDs[0]}/friends?requested=${userIDs[2]}`
        );
        const reqestRes2 = await loggedInUser.post(
            `/users/${userIDs[1]}/friends?requested=${userIDs[3]}`
        );

        expect(requestRes1.status).toBe(200);
        expect(reqestRes2.status).toBe(200);

        const getRes1 = await loggedInUser.get(`/users/${userIDs[0]}/friends`);
        const getRes2 = await loggedInUser.get(`/users/${userIDs[1]}/friends`);

        expect(getRes1.status).toBe(200);
        expect(getRes1.body.at(-1)).toEqual({
            user: { _id: userIDs[2], firstName: 'Fr2', lastName: 'Last2' },
            status: 'requested',
        });

        expect(getRes2.status).toBe(200);
        expect(getRes2.body.at(-1)).toEqual({
            user: { _id: userIDs[3], firstName: 'Fr3', lastName: 'Last3' },
            status: 'requested',
        });
    });

    it("Adds an 'incoming' friend request to the recipient user of a new friend request", async () => {
        const getRes1 = await loggedInUser.get(`/users/${userIDs[2]}/friends`);
        const getRes2 = await loggedInUser.get(`/users/${userIDs[3]}/friends`);

        expect(getRes1.status).toBe(200);
        expect(getRes1.body.at(-1)).toEqual({
            user: { _id: userIDs[0], firstName: 'Fr0', lastName: 'Last0' },
            status: 'incoming',
        });

        expect(getRes2.status).toBe(200);
        expect(getRes2.body.at(-1)).toEqual({
            user: { _id: userIDs[1], firstName: 'Fr1', lastName: 'Last1' },
            status: 'incoming',
        });
    });

    it('Marks respective requested/incoming friend requests as accepted when the recipient accepts', async () => {
        const acceptRes = await loggedInUser.put(
            `/users/${userIDs[2]}/friends?incoming=${userIDs[0]}&action=accept`
        );
        expect(acceptRes.status).toBe(200);

        const getRes1 = await loggedInUser.get(`/users/${userIDs[0]}/friends`);
        const getRes2 = await loggedInUser.get(`/users/${userIDs[2]}/friends`);

        expect(getRes1.status).toBe(200);
        expect(getRes1.body).toEqual([
            {
                user: { _id: userIDs[2], firstName: 'Fr2', lastName: 'Last2' },
                status: 'accepted',
            },
        ]);

        expect(getRes2.status).toBe(200);
        expect(getRes2.body).toEqual([
            {
                user: { _id: userIDs[0], firstName: 'Fr0', lastName: 'Last0' },
                status: 'accepted',
            },
        ]);
    });

    it('Deletes respective requested/incoming friend requests when the recipient rejects', async () => {
        const rejectRes = await loggedInUser.put(
            `/users/${userIDs[3]}/friends?incoming=${userIDs[1]}&action=reject`
        );
        expect(rejectRes.status).toBe(200);

        const getRes1 = await loggedInUser.get(`/users/${userIDs[1]}/friends`);
        const getRes2 = await loggedInUser.get(`/users/${userIDs[3]}/friends`);

        expect(getRes1.status).toBe(200);
        expect(getRes1.body).toEqual([]);

        expect(getRes2.status).toBe(200);
        expect(getRes2.body).toEqual([]);
    });

    it('Returns a 400 if any query string is missing', async () => {
        const missingRes1 = await loggedInUser.put(
            `/users/${userIDs[1]}/friends?incoming=${userIDs[0]}`
        );
        const missingRes2 = await loggedInUser.put(`/users/${userIDs[1]}/friends?action=reject`);
        const missingRes3 = await loggedInUser.post(`/users/${userIDs[1]}/friends`);

        [missingRes1, missingRes2, missingRes3].forEach((res) => {
            expect(res.status).toBe(400);
            expect(res.body).toEqual({ error: 'Missing query string(s).' });
        });
    });

    it("Returns a 400 if an invalid ObjectId is passed as the 'requested' query string", async () => {
        const requestRes = await loggedInUser.post(
            `/users/${userIDs[1]}/friends?requested=${INVALID_OBJECT_ID}`
        );
        expect(requestRes.status).toEqual(400);
        expect(requestRes.body).toEqual(invalidPatternError(INVALID_OBJECT_ID));

        const getRes = await loggedInUser.get(`/users/${userIDs[1]}/friends`);
        expect(getRes.status).toBe(200);
        expect(getRes.body).toEqual([]);
    });

    it('Prevents attempting to add a non-existant user as a friend, returning a 404', async () => {
        const requestRes = await loggedInUser.post(
            `/users/${userIDs[1]}/friends?requested=${NONEXISTANT_ID}`
        );
        expect(requestRes.status).toBe(404);
        expect(requestRes.body).toEqual(notFoundError);

        const getRes = await loggedInUser.get(`/users/${userIDs[1]}/friends`);
        expect(getRes.status).toBe(200);
        expect(getRes.body).toEqual([]);
    });

    it('Prevents actioning upon a non-existant friend request (valid user ID), returning a 403', async () => {
        const nonexistantRes = await loggedInUser.put(
            `/users/${userIDs[1]}/friends?incoming=${userIDs[0]}&action=accept`
        );
        expect(nonexistantRes.status).toBe(403);
        expect(nonexistantRes.body).toEqual(notFoundError);

        const user2Res = await loggedInUser.get(`/users/${userIDs[1]}/friends`);
        expect(user2Res.status).toBe(200);
        expect(user2Res.body).toEqual([]);
    });
});
