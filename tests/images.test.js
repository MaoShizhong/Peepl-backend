const request = require('supertest');
const { unauthorisedError } = require('../controllers/helpers/error_handling');
const { extractPublicID } = require('../controllers/helpers/util')

const app = require('./config/test_server');
const { cloudinary } = require('../cloudinary/cloudinary');

const { users } = require('./config/test_users');

const imageUser = users.at(-1);
const wrongUser = users.at(-2);

// const NONEXISTANT_ID = '65269890203feea7cca8826b';
// const INVALID_OBJECT_ID = 'foobar';

const loggedInUser = request.agent(app);
const wrongLoggedInUser = request.agent(app);

beforeAll(async () => {
    await loggedInUser
        .post('/auth/sessions/local')
        .type('form')
        .send({ email: imageUser.email, password: imageUser.auth.password });
    await wrongLoggedInUser
        .post('/auth/sessions/local')
        .type('form')
        .send({ email: wrongUser.email, password: wrongUser.auth.password });
});

// Cleanup test uploads from cloudinary database
afterAll(async () => {
    await cloudinary.api.delete_resources_by_prefix(imageUser._id);
    await cloudinary.api.delete_folder(imageUser._id);
});

describe('Manage profile picture', () => {
    let firstProfilePicturePublicID;

    it('Adds a profile picture when previously without one', async () => {
        const imageRes = await loggedInUser
            .put(`/users/${imageUser._id}/profile-picture`)
            .attach('profilePicture', `${__dirname}/images/profile_picture_1.jpg`);
        expect(imageRes.status).toBe(200);
        expect(imageRes.body).toHaveProperty('profilePicture');

        const profilePictureURL = imageRes.body.profilePicture;

        expect(profilePictureURL.startsWith('https://res.cloudinary.com')).toBe(true);
        expect(profilePictureURL.includes(imageUser._id)).toBe(true);
        expect(profilePictureURL.endsWith('.webp')).toBe(true);

        const getRes = await loggedInUser.get(`/users/${imageUser._id}`);
        expect(getRes.body).toHaveProperty('profilePicture', profilePictureURL);

        // get image's public id to check cloudinary deletion after profile picture change (later test)
        firstProfilePicturePublicID = extractPublicID(profilePictureURL);
    });

    it('Changes an existing profile picture to a new one', async () => {
        const imageRes = await loggedInUser
            .put(`/users/${imageUser._id}/profile-picture`)
            .attach('profilePicture', `${__dirname}/images/profile_picture_2.jpeg`);
        expect(imageRes.status).toBe(200);
        expect(imageRes.body).toHaveProperty('profilePicture');

        const getRes = await loggedInUser.get(`/users/${imageUser._id}`);
        expect(getRes.body).toHaveProperty('profilePicture', imageRes.body.profilePicture);
    });

    it('Deletes the previous profile picture from cloudinary when changed', async () => {
        try {
            await cloudinary.api.resource(firstProfilePicturePublicID);
            expect(() => {}).not.toHaveBeenCalled();
        } catch (err) {
            expect(err.error.http_code).toBe(404);
            expect(err.error.message).toBe(`Resource not found - ${firstProfilePicturePublicID}`);
        }
    });

    it('Removes profile picture from account', async () => {
        const deleteRes = await loggedInUser.put(`/users/${imageUser._id}/profile-picture`);
        expect(deleteRes.status).toBe(200);
        expect(deleteRes.body).toHaveProperty('profilePicture', null);

        const getRes = await loggedInUser.get(`/users/${imageUser._id}`);
        expect(getRes.body).toHaveProperty('profilePicture', null);
    });

    it('Only changes profile picture if requested user and logged in user match', async () => {
        const imageRes = await wrongLoggedInUser
            .put(`/users/${imageUser._id}/profile-picture`)
            .attach('profilePicture', `${__dirname}/images/profile_picture_1.jpg`);
        expect(imageRes.status).toBe(403);
        expect(imageRes.body).toEqual(unauthorisedError);

        const getRes = await loggedInUser.get(`/users/${imageUser._id}`);
        expect(getRes.body).toHaveProperty('profilePicture', null);
    });
});

describe.skip('Manage user photo gallery', () => {
    it.skip('', async () => {});
});
