const express = require('express');
const request = require('supertest');
const userRouter = require('../routes/user_router');
const { invalidPatternError, notFoundError } = require('../controllers/helpers/error_handling');

const app = express();

app.use(express.urlencoded({ extended: false }));
app.use('/users', userRouter);

const { users } = require('./config/test_users');

const userIDs = users.map((user) => user._id.valueOf());

const STARTING_USER_COUNT = users.length;
const NONEXISTANT_ID = '65269890203feea7cca8826b';
const INVALID_OBJECT_ID = 'foobar';

describe('GET /users', () => {
    test(`In-memory database has ${STARTING_USER_COUNT} test users loaded on test start`, async () => {
        const res = await request(app).get('/users');

        expect(res.status).toBe(200);
        expect(res.body.users.length).toBe(STARTING_USER_COUNT);
    });

    it('Returns only _id and full names when getting all users', async () => {
        const containsOnlyExpectedProperties = (user) => {
            const properties = Object.getOwnPropertyNames(user);
            const expectedProperties = ['_id', 'name'];

            return JSON.stringify(properties) === JSON.stringify(expectedProperties);
        };

        const res = await request(app).get('/users');

        expect(res.status).toEqual(200);
        expect(res.body.users.every(containsOnlyExpectedProperties)).toBe(true);
    });

    it(`Returns only users whose names match a provided search query`, async () => {
        const res = await request(app).get('/users?search=2');

        expect(res.status).toBe(200);
        expect(res.body.users.length).toBe(1);
        expect(res.body.users[0].name).toBe(
            `${users[2].details.firstName} ${users[2].details.lastName}`
        );
    });

    it(`Returns only users whose names match a provided search query (case insensitive)`, async () => {
        const res = await request(app).get('/users?search=last');

        expect(res.status).toBe(200);
        expect(res.body.users.length).toBe(STARTING_USER_COUNT);
    });

    it("Gets first user from in-memory test database, showing name and other details marked with 'visibility: everyone'", async () => {
        const { details } = users[0];

        const res = await request(app).get(`/users/${userIDs[0]}`);

        expect(res.status).toBe(200);
        expect(res.body).toEqual({
            name: `${details.firstName} ${details.lastName}`,
            DOB: details.DOB.value,
            city: details.city.value,
            country: details.country.value,
            employment: details.employment.value,
            education: details.education.value,
        });
    });

    it.only("Gets fourth user from in-memory test database, showing only name and handle (other details are set to 'visibility: hidden'; no _id)", async () => {
        const { details } = users[3];

        const containsHiddenDetails = (resObj) => {
            const resKeys = Object.keys(resObj);
            const hiddenDetails = Object.keys(details).filter(
                (key) => details[key].visibility === 'hidden'
            );

            return resKeys.some((key) => hiddenDetails.includes(key));
        };

        const res = await request(app).get(`/users/${userIDs[3]}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('handle');
        expect(res.body).toHaveProperty('name', `${details.firstName} ${details.lastName}`);
        expect(containsHiddenDetails(res.body)).toBe(false);
    });

    it('Returns 404 when fetching non-existant user', async () => {
        const res = await request(app).get(`/users/${NONEXISTANT_ID}`);
        expect(res.status).toBe(404);
        expect(res.body).toEqual(notFoundError);
    });

    it('Returns 400 when fetching with invalid ObjectID pattern', async () => {
        const res = await request(app).get(`/users/${INVALID_OBJECT_ID}`);
        expect(res.status).toBe(400);
        expect(res.body).toEqual(invalidPatternError(INVALID_OBJECT_ID));
    });
});

describe('POST /users', () => {
    it.skip('Adds new user to the test database if all form fields pass validation', async () => {
        return request(app)
            .post('/auth/users')
            .type('form')
            .send({
                email: 'user3@test.com',
                password: 'asdfASDF3',
                confirm: 'asdfASDF3',
            })
            .expect(201)
            .then(() => {
                request(app)
                    .get('/users')
                    .expect(200)
                    .expect((res) => {
                        if (res.body.users.length !== STARTING_USER_COUNT + 1) {
                            throw new Error('User was not added');
                        }
                    })
                    .then((response) => {
                        expect(response.body.users.at(-1)).toMatchObject({
                            username: 'user3',
                        });
                    });
            });
    });

    it.skip('Rejects new user submission if password does not match constraints', (done) => {
        request(app)
            .post('/auth/users')
            .type('form')
            .send({
                username: 'user4',
                email: 'user4@test.com',
                password: 'password',
                confirm: 'password',
            })
            .expect(400)
            .then(() => {
                request(app)
                    .get('/users')
                    .expect((res) => {
                        if (res.body.users.length !== STARTING_USER_COUNT + 1) {
                            throw new Error('User incorrectly added');
                        }
                    })
                    .end(done);
            });
    });

    it.skip('Rejects new user submission if password fields do not match', (done) => {
        request(app)
            .post('/auth/users')
            .type('form')
            .send({
                username: 'user4',
                email: 'user4@test.com',
                password: 'asdfASDF4',
                confirm: '4FDSAfdsa',
            })
            .expect(400)
            .then(() => {
                request(app)
                    .get('/users')
                    .expect((res) => {
                        if (res.body.users.length !== STARTING_USER_COUNT + 1) {
                            throw new Error('User incorrectly added');
                        }
                    })
                    .end(done);
            });
    });
});

// describe('PUT /users', () => {
//     it("Stores user2 as pending friend in user0's friends list upon friend request", async () => {
//         const putRes = await request(app).put(
//             `/users/${users[0]}/friends?action=add&userID=${users[2]}`
//         );
//         expect(putRes.status).toEqual(200);

//         const getRes = await request(app).get(`/users/${users[0]}/friends`);
//         expect(getRes.status).toEqual(200);
//         expect(getRes.body).toEqual([
//             { user: { _id: users[2], username: 'user2' }, status: 'requested' },
//         ]);
//     });

//     it("Adds the incoming friend request to user2's friends list before accept", () => {
//         return request(app)
//             .get(`/users/${users[2]}/friends`)
//             .expect(200)
//             .then((res) => {
//                 expect(res.body).toEqual([
//                     {
//                         user: { _id: users[0], username: 'user0' },
//                         status: 'incoming',
//                     },
//                 ]);
//             });
//     });

//     it("Marks both user0 and user2's pending friend requests as accepted when user2 accepts", async () => {
//         const putRes = await request(app).put(
//             `/users/${users[2]}/friends?action=accept&userID=${users[0]}`
//         );
//         expect(putRes.status).toBe(200);

//         const user0Res = await request(app).get(`/users/${users[0]}/friends`);
//         expect(user0Res.status).toBe(200);
//         expect(user0Res.body).toEqual([
//             {
//                 user: { _id: users[2], username: 'user2' },
//                 status: 'accepted',
//             },
//         ]);

//         const user2Res = await request(app).get(`/users/${users[2]}/friends`);
//         expect(user2Res.status).toBe(200);
//         expect(user2Res.body).toEqual([
//             {
//                 user: { _id: users[0], username: 'user0' },
//                 status: 'accepted',
//             },
//         ]);
//     });

//     it('Adds requested friend to user1 and incoming friend request to user2 upon friend request', async () => {
//         const putRes = await request(app).put(
//             `/users/${users[1]}/friends?action=add&userID=${users[2]}`
//         );
//         expect(putRes.status).toEqual(200);

//         const user1Res = await request(app).get(`/users/${users[1]}/friends`);
//         expect(user1Res.status).toEqual(200);
//         expect(user1Res.body).toEqual([
//             {
//                 user: { _id: users[3], username: 'user1Friend' },
//                 status: 'accepted',
//             },
//             { user: { _id: users[2], username: 'user2' }, status: 'requested' },
//         ]);

//         const user2Res = await request(app).get(`/users/${users[2]}/friends`);
//         expect(user2Res.status).toEqual(200);
//         expect(user2Res.body).toEqual([
//             { user: { _id: users[0], username: 'user0' }, status: 'accepted' },
//             { user: { _id: users[1], username: 'user1' }, status: 'incoming' },
//         ]);
//     });

//     it("Removes pending entry from both users' friends lists upon rejection", async () => {
//         const putRes = await request(app).put(
//             `/users/${users[2]}/friends?action=reject&userID=${users[1]}`
//         );
//         expect(putRes.status).toEqual(200);

//         const user1Res = await request(app).get(`/users/${users[1]}/friends`);
//         expect(user1Res.status).toEqual(200);
//         expect(user1Res.body).toEqual([
//             {
//                 user: { _id: users[3], username: 'user1Friend' },
//                 status: 'accepted',
//             },
//         ]);

//         const user2Res = await request(app).get(`/users/${users[2]}/friends`);
//         expect(user2Res.status).toEqual(200);
//         expect(user2Res.body).toEqual([
//             { user: { _id: users[0], username: 'user0' }, status: 'accepted' },
//         ]);
//     });

//     it('Prevents attempting to add a non-existant user as a friend, returning a 404', async () => {
//         const putRes = await request(app).put(
//             `/users/${users[2]}/friends?action=add&userID=6521aac212fde41aa85be1a0`
//         );
//         expect(putRes.status).toEqual(404);

//         const user2Res = await request(app).get(`/users/${users[2]}/friends`);
//         expect(user2Res.status).toEqual(200);
//         expect(user2Res.body).toEqual([
//             { user: { _id: users[0], username: 'user0' }, status: 'accepted' },
//         ]);
//     });

//     it('Prevents accepting a non-existant friend request, returning a 400', async () => {
//         const putRes = await request(app).put(
//             `/users/${users[2]}/friends?action=accept&userID=645eaae21267e41aa35ba2a2`
//         );
//         expect(putRes.status).toEqual(404);

//         const user2Res = await request(app).get(`/users/${users[2]}/friends`);
//         expect(user2Res.status).toEqual(200);
//         expect(user2Res.body).toEqual([
//             { user: { _id: users[0], username: 'user0' }, status: 'accepted' },
//         ]);
//     });
// });

// describe('DELETE /users', () => {
//     it('Deletes user1Friend', async () => {
//         const deleteRes = await request(app).delete(`/users/${users[3]}`);
//         expect(deleteRes.status).toBe(200);

//         const res = await request(app).get('/users');
//         expect(res.status).toBe(200);
//         expect(res.body.users.length).toBe(STARTING_USER_COUNT);
//         expect(res.body.users.find((user) => user.username === 'user1Friend')).toBe(undefined);
//     });

//     it("Removes user1Friend from user1's friends list after deletion", () => {
//         return request(app)
//             .get(`/users/${users[1]}/friends`)
//             .expect(200)
//             .then((res) => {
//                 expect(res.body).toEqual([]);
//             });
//     });

//     it('Returns 404 upon an attempt to delete a non-existant user', (done) => {
//         request(app).delete('/users/62218a22128de91a680ba11b').expect(404, done);
//     });

//     it('Returns 400 upon an attempt to delete an invalid ObjectId pattern query', (done) => {
//         request(app).delete('/users/foobar').expect(400, done);
//     });

//     it('Removes user0 and user2 as friends when user2 deletes friendship status', async () => {
//         const putRes = await request(app).delete(`/users/${users[2]}/friends?userID=${users[0]}`);
//         expect(putRes.status).toEqual(200);

//         const user0Res = await request(app).get(`/users/${users[0]}/friends`);
//         expect(user0Res.status).toEqual(200);
//         expect(user0Res.body).toEqual([]);

//         const user2Res = await request(app).get(`/users/${users[2]}/friends`);
//         expect(user2Res.status).toEqual(200);
//         expect(user2Res.body).toEqual([]);
//     });

//     it('Returns 404 upon an attempt to remove a friend who is not a friend', (done) => {
//         request(app)
//             .delete(`/users/${users[2]}/friends?userID=62218a22128de91a680ba11b`)
//             .expect(404, done);
//     });
// });
