const request = require('supertest');
const { unauthorisedError } = require('../controllers/helpers/error_handling');
const { extractPublicID } = require('../controllers/helpers/util');

const app = require('./config/test_server');
const { cloudinary } = require('../cloudinary/cloudinary');

const { users } = require('./config/test_users');

const imageUser = users.at(-1);
const wrongUser = users.at(-2);
const notFriend = users.at(-3);

// const NONEXISTANT_ID = '65269890203feea7cca8826b';
// const INVALID_OBJECT_ID = 'foobar';

const loggedInUser = request.agent(app);
const wrongLoggedInUser = request.agent(app);
const notFriendUser = request.agent(app);

beforeAll(async () => {
    await loggedInUser
        .post('/auth/sessions/local')
        .type('form')
        .send({ email: imageUser.email, password: imageUser.auth.password });
    await wrongLoggedInUser
        .post('/auth/sessions/local')
        .type('form')
        .send({ email: wrongUser.email, password: wrongUser.auth.password });
    await notFriendUser
        .post('/auth/sessions/local')
        .type('form')
        .send({ email: notFriend.email, password: notFriend.auth.password });
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
    let galleryPhotoURL;

    it.skip("Gets a user's gallery", async () => {
        const res = await loggedInUser.get(`/users/${imageUser._id}/gallery`);
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ photos: [] });
    });

    it.skip("Uploads an image to the user's gallery", async () => {
        const uploadRes = await loggedInUser
            .post(`/users/${imageUser._id}/gallery`)
            .attach('profilePicture', `${__dirname}/images/test.png`);
        expect(uploadRes.status).toBe(201);
        expect(uploadRes.body).toHaveProperty('photoURL');

        galleryPhotoURL = uploadRes.body.photoURL;

        const galleryRes = await loggedInUser.get(`/users/${imageUser._id}/gallery`);
        expect(galleryRes.status).toBe(200);
        expect(galleryRes.body).toEqual([galleryPhotoURL]);
    });

    it.skip("Makes a user's gallery viewable to other users if not hidden", async () => {
        const res = await notFriendUser.get(`/users/${imageUser._id}/gallery`);
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ photos: [galleryPhotoURL] });
    });

    it.skip("Hides a user's gallery from non-friends when setting toggled", async () => {
        const res = await notFriendUser.patch(`/users/${imageUser._id}/gallery`);
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ message: 'Gallery visibility: friends' });
    });

    it.skip("Makes a user's gallery viewable only to friends once hidden", async () => {
        const notFriendRes = await notFriendUser.get(`/users/${imageUser._id}/gallery`);
        expect(notFriendRes.status).toBe(403);
        expect(notFriendRes.body).toEqual({
            message: 'This user has chosen to make their gallery visible only to their friends.',
        });

        const friendRes = await wrongLoggedInUser.get(`/users/${imageUser._id}/gallery`);
        expect(friendRes.status).toBe(200);
        expect(friendRes.body).toEqual({ photos: [galleryPhotoURL] });
    });

    it.skip("Deletes a photo from the requesting user's gallery", async () => {
        const photoID = extractPublicID(galleryPhotoURL).split('/')[1];

        const deleteRes = await loggedInUser.delete(`/users/${imageUser._id}/gallery/${photoID}`);
        expect(deleteRes.status).toBe(200);
        expect(deleteRes.body).toEqual({ message: `${photoID} successfully deleted.` });

        const galleryRes = await loggedInUser.get(`/users/${imageUser._id}/gallery`);
        expect(galleryRes.status).toBe(200);
        expect(galleryRes.body).toEqual([]);
    });

    it.skip('Deletes the image from cloudinary when deleted from gallery', async () => {
        const galleryPhotoPublicID = extractPublicID(galleryPhotoURL);

        try {
            await cloudinary.api.resource(extractPublicID(galleryPhotoPublicID));
            expect(() => {}).not.toHaveBeenCalled();
        } catch (err) {
            expect(err.error.http_code).toBe(404);
            expect(err.error.message).toBe(`Resource not found - ${extractPublicID(galleryPhotoPublicID)}`);
        }
    });

    it.skip("Unhides a user's hidden gallery when setting toggled", async () => {
        const res = await notFriendUser.patch(`/users/${imageUser._id}/gallery`);
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ message: 'Gallery visibility: everyone' });
    });
});
