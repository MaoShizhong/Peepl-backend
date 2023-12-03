const request = require('supertest');
const { notFoundError } = require('../controllers/helpers/error_handling');
const { extractPublicID } = require('../controllers/helpers/util');

const app = require('./config/test_server');
const { cloudinary } = require('../cloudinary/cloudinary');

const { users } = require('./config/test_users');
const { friendUsers } = require('./config/test_friends');
const { feedUsers } = require('./config/test_feedusers');

const STARTING_USER_COUNT = users.length + friendUsers.length + feedUsers.length;
const NONEXISTANT_ID = '65269890203feea7cca8826b';

const loggedInUser = request.agent(app);

let newUserCloudinaryImagePrefix;

// Cleanup test uploads from cloudinary database
afterAll(async () => {
    await cloudinary.api.delete_resources_by_prefix(newUserCloudinaryImagePrefix);
    await cloudinary.api.delete_folder(newUserCloudinaryImagePrefix);
});

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

    it('Returns only _id, full names and profile picture URL (null) when getting all users', async () => {
        const containsOnlyExpectedProperties = (user) => {
            const properties = Object.getOwnPropertyNames(user);
            const expectedProperties = ['_id', 'name', 'profilePicture'];

            return properties.every((property) => expectedProperties.includes(property));
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

    it("Gets first user from in-memory test database, showing name and other details marked with 'visibility: everyone'; no _id", async () => {
        const { details } = users[0];

        const res = await loggedInUser.get(`/users/${users[0].handle}`);

        expect(res.status).toBe(200);
        expect(res.body.user).not.toHaveProperty('_id');
        expect(res.body.user).toHaveProperty('handle');
        expect(res.body.user).toMatchObject({
            name: `${details.firstName} ${details.lastName}`,
            DOB: details.DOB.value,
            city: details.city.value,
            country: details.country.value,
            employment: details.employment.value,
            education: details.education.value,
            profilePicture: null,
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

        const res = await loggedInUser.get(`/users/${users[3].handle}`);

        expect(res.status).toBe(200);
        expect(Object.getOwnPropertyNames(res.body.user).sort()).toEqual(
            ['handle', 'name', 'profilePicture', 'galleryIsHidden'].sort()
        );
        expect(res.body.user.name).toBe(`${details.firstName} ${details.lastName}`);
        expect(containsHiddenDetails(res.body)).toBe(false);
    });

    it('Returns 404 when fetching non-existant user', async () => {
        const res = await loggedInUser.get(`/users/${NONEXISTANT_ID}`);
        expect(res.status).toBe(404);
        expect(res.body).toEqual(notFoundError);
    });
});

describe('Successful user creation', () => {
    const form = {
        email: 'new@new.com',
        password: 'newNEW1234',
        confirm: 'newNEW1234',
        firstName: 'NewFirst',
        lastName: 'NewLast',
        'DOB.value': '1991-06-11T00:00:00.000Z',
        'city.value': 'Neuerlin',
        'country.value': 'Germany',
    };

    it('Adds new user to the test database if all form fields pass validation', async () => {
        const postRes = await request(app)
            .post('/auth/users')
            .field('email', form.email)
            .field('password', form.password)
            .field('confirm', form.confirm)
            .field('firstName', form.firstName)
            .field('lastName', form.lastName)
            .field('DOB.value', form['DOB.value'])
            .field('city.value', form['city.value'])
            .field('country.value', form['country.value'])
            .attach('profilePicture', `${__dirname}/images/test.png`);
        expect(postRes.status).toBe(201);

        const getRes = await loggedInUser.get('/users');
        expect(getRes.status).toBe(200);
        expect(getRes.body.users.length).toBe(STARTING_USER_COUNT + 1);

        const newUser = getRes.body.users.at(-1);

        expect(newUser).toHaveProperty('name', 'NewFirst NewLast');
        expect(newUser).toHaveProperty('profilePicture');
        expect(newUser).not.toHaveProperty('password');

        [newUserCloudinaryImagePrefix] = extractPublicID(newUser.profilePicture).split('/');
    }, 10000);

    it('Adds new user to the test database even if optional form fields are missing', async () => {
        const postRes = await request(app)
            .post('/auth/users')
            .field('email', 'new2@new2.com')
            .field('password', form.password)
            .field('confirm', form.confirm)
            .field('firstName', form.firstName)
            .field('lastName', form.lastName)
            .field('DOB.value', '1991-06-11T00:00:00.000Z');
        expect(postRes.status).toBe(201);

        const getRes = await loggedInUser.get('/users');
        expect(getRes.status).toBe(200);
        expect(getRes.body.users.length).toBe(STARTING_USER_COUNT + 2);

        const newUser = getRes.body.users.at(-1);
        expect(newUser).toHaveProperty('name', `${form.firstName} ${form.lastName}`);
        expect(newUser).toHaveProperty('profilePicture', null);
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

    const invalidForm = {
        email: 'invalid@invalid.com',
        password: 'newNEW1234',
        confirm: 'newNEW1234',
        firstName: 'NewFirst',
        lastName: 'NewLast',
        'DOB.value': '1991-06-11T00:00:00.000Z',
    };

    it('Rejects new user submission if the provided email is already in use', async () => {
        const postRes = await request(app)
            .post('/auth/users')
            .field('email', users[0].email)
            .field('password', invalidForm.password)
            .field('confirm', invalidForm.confirm)
            .field('firstName', invalidForm.firstName)
            .field('lastName', invalidForm.lastName)
            .field('DOB.value', invalidForm['DOB.value']);

        expect(postRes.status).toBe(400);
        expect(postRes.body).toEqual({
            error: 'Email already in use.\nIf you have an existing account with this email tied to Github and wish to set a password, please log in and set this in your account settings.',
        });
    });

    it('Rejects new user submission if DOB results in an age younger than 13 years', async () => {
        const postRes = await request(app)
            .post('/auth/users')
            .field('email', invalidForm.email)
            .field('password', invalidForm.password)
            .field('confirm', invalidForm.confirm)
            .field('firstName', invalidForm.firstName)
            .field('lastName', invalidForm.lastName)
            .field('DOB.value', '2015-06-11');

        expect(postRes.status).toBe(400);
        expect(postRes.body).toEqual({
            error: 'You must be at least 13 years old to sign up to Peepl.',
        });
    });

    it('Rejects new user submission if required field is missing (lastName)', async () => {
        const postRes = await request(app)
            .post('/auth/users')
            .field('email', invalidForm.email)
            .field('password', invalidForm.password)
            .field('confirm', invalidForm.confirm)
            .field('firstName', invalidForm.firstName)
            .field('DOB.value', invalidForm['DOB.value']);

        expect(postRes.status).toBe(400);
        expect(postRes.body).toEqual({ error: 'Last name must be provided.' });
    });

    it('Rejects new user submission if password does not match constraints', async () => {
        const postRes = await request(app)
            .post('/auth/users')
            .field('email', invalidForm.email)
            .field('password', 'password')
            .field('confirm', 'password')
            .field('firstName', invalidForm.firstName)
            .field('lastName', invalidForm.lastName)
            .field('DOB.value', invalidForm['DOB.value']);

        expect(postRes.status).toBe(400);
        expect(postRes.body).toEqual({ error: 'Password must follow the listed requirements.' });
    });

    it('Rejects new user submission if password fields do not match', async () => {
        const postRes = await request(app)
            .post('/auth/users')
            .field('email', invalidForm.email)
            .field('password', invalidForm.password)
            .field('confirm', 'password')
            .field('firstName', invalidForm.firstName)
            .field('lastName', invalidForm.lastName)
            .field('DOB.value', invalidForm['DOB.value']);

        expect(postRes.status).toBe(400);
        expect(postRes.body).toEqual({ error: 'Passwords must match.' });
    });

    it('Rejects new user submission if profile picture file attachment exceeds 8 MiB limit', async () => {
        const postRes = await request(app)
            .post('/auth/users')
            .field('email', invalidForm.email)
            .field('password', invalidForm.password)
            .field('confirm', invalidForm.password)
            .field('firstName', invalidForm.firstName)
            .field('lastName', invalidForm.lastName)
            .field('DOB.value', invalidForm['DOB.value'])
            .attach('profilePicture', `${__dirname}/images/too_big.png`);

        expect(postRes.status).toBe(400);
        expect(postRes.body).toEqual({ error: 'File too large' });
    });

    it('Rejects profile picture file attachment if not a png/jpg/jpeg/webp', async () => {
        const postRes = await request(app)
            .post('/auth/users')
            .field('email', invalidForm.email)
            .field('password', invalidForm.password)
            .field('confirm', invalidForm.password)
            .field('firstName', invalidForm.firstName)
            .field('lastName', invalidForm.lastName)
            .field('DOB.value', invalidForm['DOB.value'])
            .attach('profilePicture', `${__dirname}/images/wrong_type.txt`);

        expect(postRes.status).toBe(400);
        expect(postRes.body).toEqual({
            error: 'Invalid file type. Only PNG/JPG/JPEG/WEBP images allowed.',
        });
    });

    it('Validates file type by magic number, rejecting a renamed invalid file even if extension/MIME type is valid', async () => {
        const postRes = await request(app)
            .post('/auth/users')
            .field('email', invalidForm.email)
            .field('password', invalidForm.password)
            .field('confirm', invalidForm.password)
            .field('firstName', invalidForm.firstName)
            .field('lastName', invalidForm.lastName)
            .field('DOB.value', invalidForm['DOB.value'])
            .attach('profilePicture', `${__dirname}/images/wrong_type_rename.png`);

        expect(postRes.status).toBe(400);
        expect(postRes.body).toEqual({
            error: 'Invalid file type. Only PNG/JPG/JPEG/WEBP images allowed.',
        });
    });
});
