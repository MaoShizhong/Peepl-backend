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
        const loginRes = await loggedInUser1.post('/auth/sessions/local').type('form').send({
            email: wrongUser.email,
            password: wrongUser.auth.password,
        });
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

        const getRes = await loggedInUser.get(`/users/${editForm.handle}`);
        expect(getRes.status).toBe(200);
        expect(getRes.body.user).toEqual({
            _id: user._id,
            handle: editForm.handle,
            name: `${editForm.firstName} ${editForm.lastName}`,
            DOB: editForm.DOB.value,
            city: editForm.city.value,
            country: editForm.country.value,
            galleryIsHidden: false,
            profilePicture: null,
        });
    });

    it('Changes the visibility of a field if visibility option altered', async () => {
        const editRes = await loggedInUser.put(`/users/${user._id}`).send(editFormHidden);
        expect(editRes.status).toBe(200);

        const getRes = await loggedInUser.get(`/users/${editFormHidden.handle}`);
        expect(getRes.status).toBe(200);
        expect(getRes.body.user).toEqual({
            _id: user._id,
            handle: 'editedhandle',
            name: `${editForm.firstName} ${editForm.lastName}`,
            DOB: editForm.DOB.value,
            profilePicture: null,
            galleryIsHidden: false,
        });
    });

    it(`Prevents editing user details if edited age is under ${AGE_LIMIT}`, async () => {
        const errorRes = await loggedInUser.put(`/users/${user._id}`).send(editFormError);
        expect(errorRes.status).toBe(400);
        expect(errorRes.body).toEqual({
            error: 'You must be at least 13 years old to sign up to Peepl.',
        });

        const getRes = await loggedInUser.get(`/users/${editForm.handle}`);
        expect(getRes.status).toBe(200);
        expect(getRes.body.user).toEqual({
            _id: user._id,
            handle: 'editedhandle',
            name: `${editForm.firstName} ${editForm.lastName}`,
            DOB: editForm.DOB.value,
            profilePicture: null,
            galleryIsHidden: false,
        });
    });
});

describe('Adding education/employment fields', () => {
    const startingEducationField = user.details.education.value;
    const startingEmploymentField = user.details.employment.value;

    const newEducationEntry1 = {
        institution: 'Preschool',
        start: '1999-12-17T00:00:00.000Z',
        end: '2000-12-17T00:00:00.000Z',
    };

    const newEducationEntry2 = {
        institution: 'Another school',
        start: '1998-12-17T00:00:00.000Z',
        end: '2000-12-17T00:00:00.000Z',
    };

    const newEmploymentEntry1 = {
        title: 'New guy',
        company: 'New ltd',
        start: '2018-12-17T03:23:00.000Z',
        end: null,
    };

    const newEmploymentEntry2 = {
        title: 'New guy2',
        company: 'New ltd2',
        start: '2019-10-17T03:23:00.000Z',
        end: '2019-12-17T03:23:00.000Z',
    };

    it("Adds a valid education entry to the user's education details", async () => {
        const newEducationArray = [...startingEducationField, newEducationEntry1];

        const addRes = await loggedInUser.put(`/users/${user._id}/education`).send({
            education: { value: newEducationArray, visibility: 'everyone' },
        });
        expect(addRes.status).toBe(200);
        expect(addRes.body).toEqual({
            education: newEducationArray,
            visibility: 'everyone',
        });
    });

    it('Sorts education entries by end date (latest first) then start date (latest first)', async () => {
        const newEducationArray = [
            newEducationEntry2,
            newEducationEntry1,
            ...startingEducationField,
        ];

        const addRes = await loggedInUser.put(`/users/${user._id}/education`).send({
            education: { value: newEducationArray, visibility: 'everyone' },
        });
        expect(addRes.status).toBe(200);
        expect(addRes.body).toEqual({
            education: [...startingEducationField, newEducationEntry1, newEducationEntry2],
            visibility: 'everyone',
        });
    });

    it('Changes visibility of education details', async () => {
        const newEducationArray = [...startingEducationField, newEducationEntry1];

        const addRes = await loggedInUser.put(`/users/${user._id}/education`).send({
            education: { value: newEducationArray, visibility: 'friends' },
        });
        expect(addRes.status).toBe(200);
        expect(addRes.body).toEqual({
            education: newEducationArray,
            visibility: 'friends',
        });
    });

    it('Adds a new employment field to details, ordering by end date (latest first) then start date (latest first)', async () => {
        const newEmploymentArray = [
            newEmploymentEntry1,
            newEmploymentEntry2,
            ...startingEmploymentField,
        ];

        const addRes = await loggedInUser.put(`/users/${user._id}/employment`).send({
            employment: {
                value: newEmploymentArray,
                visibility: 'everyone',
            },
        });
        expect(addRes.status).toBe(200);
        expect(addRes.body).toEqual({
            employment: [newEmploymentEntry1, ...startingEmploymentField, newEmploymentEntry2],
            visibility: 'everyone',
        });
    });

    it('Deletes employment entries by being passed an employment array omitting entries to be deleted', async () => {
        const addRes = await loggedInUser.put(`/users/${user._id}/employment`).send({
            employment: {
                value: startingEmploymentField,
                visibility: 'everyone',
            },
        });
        expect(addRes.status).toBe(200);
        expect(addRes.body).toEqual({
            employment: startingEmploymentField,
            visibility: 'everyone',
        });
    });

    it('Prevents changing details if not logged in as the correct user', async () => {
        const newEducationArray = [...startingEducationField, newEducationEntry1];

        const newEmploymentArray = [...startingEmploymentField, newEmploymentEntry1];

        const addRes1 = await loggedInUser1.put(`/users/${user._id}/education`).send({
            education: {
                value: newEducationArray,
                visibility: 'everyone',
            },
        });
        expect(addRes1.status).toBe(403);
        expect(addRes1.body).toEqual(unauthorisedError);

        const addRes2 = await loggedInUser1.put(`/users/${user._id}/employment`).send({
            education: {
                value: newEmploymentArray,
                visibility: 'everyone',
            },
        });
        expect(addRes2.status).toBe(403);
        expect(addRes2.body).toEqual(unauthorisedError);
    });
});
