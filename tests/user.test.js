const request = require('supertest');
const { invalidPatternError, notFoundError } = require('../controllers/helpers/error_handling');

const app = require('./config/test_server');

const { users } = require('./config/test_users');
const { friendUsers } = require('./config/test_friends');
const { feedUsers } = require('./config/test_feedusers')

const userIDs = users.map((user) => user._id.valueOf());

const STARTING_USER_COUNT = users.length + friendUsers.length + feedUsers.length;
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

    it('Does not log a user if invalid credentials are provided', async () => {
        const loginRes = await request(app)
            .post('/auth/sessions/local')
            .type('form')
            .send({ email: users[0].email, password: 'fooBAR1234' });
        expect(loginRes.status).toBe(401);
    });
});

describe('Get user details', () => {
    test(`In-memory database has ${STARTING_USER_COUNT} test users loaded on test start`, async () => {
        const res = await loggedInUser.get('/users');

        expect(res.status).toBe(200);
        expect(res.body.users.length).toBe(STARTING_USER_COUNT);
    });

    it('Returns only _id and full names when getting all users', async () => {
        const containsOnlyExpectedProperties = (user) => {
            const properties = Object.getOwnPropertyNames(user);
            const expectedProperties = ['_id', 'name'];

            return JSON.stringify(properties) === JSON.stringify(expectedProperties);
        };

        const res = await loggedInUser.get('/users');

        expect(res.status).toEqual(200);
        expect(res.body.users.every(containsOnlyExpectedProperties)).toBe(true);
    });

    it(`Returns only users whose names match a provided search query`, async () => {
        const res = await loggedInUser.get('/users?search=rst2');

        expect(res.status).toBe(200);
        expect(res.body.users.length).toBe(1);
        expect(res.body.users[0].name).toBe(
            `${users[2].details.firstName} ${users[2].details.lastName}`
        );
    });

    it(`Returns only users whose names match a provided search query (case insensitive)`, async () => {
        const res = await loggedInUser.get('/users?search=last');

        expect(res.status).toBe(200);
        expect(res.body.users.length).toBe(STARTING_USER_COUNT);
    });

    it("Gets first user from in-memory test database, showing name and other details marked with 'visibility: everyone'", async () => {
        const { details } = users[0];

        const res = await loggedInUser.get(`/users/${userIDs[0]}`);

        expect(res.status).toBe(200);
        expect(res.body).not.toHaveProperty('_id');
        expect(res.body).toHaveProperty('handle');
        expect(res.body).toMatchObject({
            name: `${details.firstName} ${details.lastName}`,
            DOB: details.DOB.value,
            city: details.city.value,
            country: details.country.value,
            employment: details.employment.value,
            education: details.education.value,
        });
    });

    it("Gets fourth user from in-memory test database, showing only name and handle (other details are set to 'visibility: hidden'; no _id)", async () => {
        const { details } = users[3];

        const containsHiddenDetails = (resObj) => {
            const resKeys = Object.keys(resObj);
            const hiddenDetails = Object.keys(details).filter(
                (key) => details[key].visibility === 'hidden'
            );

            return resKeys.some((key) => hiddenDetails.includes(key));
        };

        const res = await loggedInUser.get(`/users/${userIDs[3]}`);

        expect(res.status).toBe(200);
        expect(Object.getOwnPropertyNames(res.body)).toEqual(['handle', 'name']);
        expect(res.body.name).toBe(`${details.firstName} ${details.lastName}`);
        expect(containsHiddenDetails(res.body)).toBe(false);
    });

    it('Returns 404 when fetching non-existant user', async () => {
        const res = await loggedInUser.get(`/users/${NONEXISTANT_ID}`);
        expect(res.status).toBe(404);
        expect(res.body).toEqual(notFoundError);
    });

    it('Returns 400 when fetching with invalid ObjectID pattern', async () => {
        const res = await loggedInUser.get(`/users/${INVALID_OBJECT_ID}`);
        expect(res.status).toBe(400);
        expect(res.body).toEqual(invalidPatternError(INVALID_OBJECT_ID));
    });
});

describe('Successful user creation', () => {
    it('Adds new user to the test database if all form fields pass validation', async () => {
        const postRes = await request(app)
            .post('/auth/users')
            .send({
                email: 'new@new.com',
                password: 'newNEW1234',
                confirm: 'newNEW1234',
                firstName: 'NewFirst',
                lastName: 'NewLast',
                DOB: { value: '1991-06-11T00:00:00.000Z' },
                city: { value: 'Neuerlin' },
                country: { value: 'Germany' },
            });
        expect(postRes.status).toBe(201);

        const getRes = await loggedInUser.get('/users');
        expect(getRes.status).toBe(200);
        expect(getRes.body.users.length).toBe(STARTING_USER_COUNT + 1);

        const newUser = getRes.body.users.at(-1);

        expect(newUser).toHaveProperty('name', 'NewFirst NewLast');
        expect(newUser).not.toHaveProperty('password');
    });

    it('Adds new user to the test database even if optional form fields are missing', async () => {
        const postRes = await request(app)
            .post('/auth/users')
            .send({
                email: 'new2@new2.com',
                password: 'newNEW12342',
                confirm: 'newNEW12342',
                firstName: 'New2First',
                lastName: 'New2Last',
                DOB: { value: '1991-06-11T00:00:00.000Z' },
            });
        expect(postRes.status).toBe(201);

        const getRes = await loggedInUser.get('/users');
        expect(getRes.status).toBe(200);
        expect(getRes.body.users.length).toBe(STARTING_USER_COUNT + 2);

        const newUser = getRes.body.users.at(-1);
        expect(newUser).toHaveProperty('name', 'New2First New2Last');
        expect(newUser).not.toHaveProperty('password');
        expect(newUser).not.toHaveProperty('city');
        expect(newUser).not.toHaveProperty('country');
    });
});

describe('Rejecting invalid user creation', () => {
    afterEach(async () => {
        const getRes = await loggedInUser.get('/users');
        expect(getRes.body.users.length).toBe(STARTING_USER_COUNT + 2);
    });

    it('Rejects new user submission if the provided email is already in use', async () => {
        const postRes = await request(app)
            .post('/auth/users')
            .send({
                email: users[0].email,
                password: 'newNEW12342',
                confirm: 'newNEW12342',
                firstName: 'NewExistingFirst',
                lastName: 'NewExistingLast',
                DOB: { value: '1992-06-11' },
            });
        expect(postRes.status).toBe(400);
        expect(postRes.body).toEqual({
            error: 'Email already in use.\nIf you have an existing account with this email tied to Github and wish to set a password, please log in and set this in your account settings.',
        });
    });

    it('Rejects new user submission if DOB results in an age younger than 13 years', async () => {
        const postRes = await request(app)
            .post('/auth/users')
            .send({
                email: 'tooYoung@tooYoung.com',
                password: 'tooYOUNG13',
                confirm: 'tooYOUNG13',
                firstName: 'Too',
                lastName: 'Young',
                DOB: { value: '2015-06-11' },
            });
        expect(postRes.status).toBe(400);
        expect(postRes.body).toEqual({
            error: 'You must be at least 13 years old to sign up to Peepl.',
        });
    });

    it('Rejects new user submission if required field is missing (lastName)', async () => {
        const postRes = await request(app).post('/auth/users').send({
            email: 'new3@new3.com',
            password: 'passwordPASSWORD1234',
            confirm: 'passwordPASSWORD1234',
            firstName: 'New3First',
        });
        expect(postRes.status).toBe(400);
        expect(postRes.body).toEqual({ error: 'Last name must be provided.' });
    });

    it('Rejects new user submission if password does not match constraints', async () => {
        const postRes = await request(app)
            .post('/auth/users')
            .send({
                email: 'new4@new4.com',
                password: 'password',
                confirm: 'password',
                firstName: 'New4First',
                lastName: 'New4Last',
                DOB: { value: '1992-06-11' },
            });
        expect(postRes.status).toBe(400);
        expect(postRes.body).toEqual({ error: 'Password must follow the listed requirements.' });
    });

    it('Rejects new user submission if password fields do not match', async () => {
        const postRes = await request(app)
            .post('/auth/users')
            .send({
                email: 'new5@new.com',
                password: 'asdfASDF5',
                confirm: '5FDSAfdsa',
                firstName: 'New5First',
                lastName: 'New5Last',
                DOB: { value: '1992-06-11' },
            });
        expect(postRes.status).toBe(400);
        expect(postRes.body).toEqual({ error: 'Passwords must match.' });
    });
});
