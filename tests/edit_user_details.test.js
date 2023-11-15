const request = require('supertest');
const { unauthorisedError } = require('../controllers/helpers/error_handling');
const { AGE_LIMIT } = require('../controllers/helpers/constants');

const app = require('./config/test_server');

// Deep copy user object to be able to compare after edits
const { users } = require('./config/test_users');

const user = users.at(-1);
const wrongUser = users[0];

const loggedInUser = request.agent(app);
const loggedInUser1 = request.agent(app);

describe('Log in as user to edit', () => {
    it('Logs edit test user in', async () => {
        const loginRes = await loggedInUser
            .post('/auth/sessions/local')
            .type('form')
            .send({ email: user.email, password: user.auth.password });
        expect(loginRes.status).toBe(201);
    });

    it('Logs "wrong" user in', async () => {
        const loginRes = await loggedInUser1
            .post('/auth/sessions/local')
            .type('form')
            .send({ email: wrongUser.email, password: wrongUser.auth.password });
        expect(loginRes.status).toBe(201);
    });
});

describe('Editing individual user details', () => {
    const editForm = {
        handle: 'editedhandle',
        email: 'edited@edited.com',
        firstName: user.details.firstName,
        lastName: user.details.lastName,
        DOB: { value: user.details.DOB.value, visibility: 'everyone' },
        city: { value: 'editedcity', visibility: 'everyone' },
        country: { value: 'editedcountry', visibility: 'everyone' },
    };

    const editFormHidden = {
        handle: 'editedhandle',
        email: 'edited@edited.com',
        firstName: user.details.firstName,
        lastName: user.details.lastName,
        DOB: { value: user.details.DOB.value, visibility: 'everyone' },
        city: { value: 'editedcity', visibility: 'hidden' },
        country: { value: 'editedcountry', visibility: 'hidden' },
    };

    const editFormError = {
        handle: 'editedhandle',
        email: 'edited@edited.com',
        firstName: user.details.firstName,
        lastName: user.details.lastName,
        DOB: { value: '2016-12-17T00:00:00.000Z', visibility: 'hidden' },
        city: { value: 'editedcity', visibility: 'hidden' },
        country: { value: 'editedcountry', visibility: 'everyone' },
    };

    it('Prevents editing a user if not logged in as that user', async () => {
        const rejectRes = await loggedInUser1.put(`/users/${user._id}`).send(editForm);

        expect(rejectRes.status).toBe(403);
        expect(rejectRes.body).toEqual(unauthorisedError);
    });

    it("Edits a user's own details if all form fields are valid", async () => {
        const editRes = await loggedInUser.put(`/users/${user._id}`).send(editForm);
        expect(editRes.status).toBe(200);

        const getRes = await loggedInUser.get(`/users/${user._id}`);
        expect(getRes.status).toBe(200);
        expect(getRes.body).toEqual({
            handle: editForm.handle,
            name: `${editForm.firstName} ${editForm.lastName}`,
            DOB: editForm.DOB.value,
            city: editForm.city.value,
            country: editForm.country.value,
        });
    });

    it('Changes the visibility of a field if visibility option altered', async () => {
        const editRes = await loggedInUser.put(`/users/${user._id}`).send(editFormHidden);
        expect(editRes.status).toBe(200);

        const getRes = await loggedInUser.get(`/users/${user._id}`);
        expect(getRes.status).toBe(200);
        expect(getRes.body).toEqual({
            handle: 'editedhandle',
            name: `${editForm.firstName} ${editForm.lastName}`,
            DOB: editForm.DOB.value,
        });
    });

    it(`Prevents editing user details if edited age is under ${AGE_LIMIT}`, async () => {
        const errorRes = await loggedInUser.put(`/users/${user._id}`).send(editFormError);
        expect(errorRes.status).toBe(400);
        expect(errorRes.body).toEqual({
            error: 'You must be at least 13 years old to sign up to Peepl.',
        });

        const getRes = await loggedInUser.get(`/users/${user._id}`);
        expect(getRes.status).toBe(200);
        expect(getRes.body).toEqual({
            handle: 'editedhandle',
            name: `${editForm.firstName} ${editForm.lastName}`,
            DOB: editForm.DOB.value,
        });
    });
});
