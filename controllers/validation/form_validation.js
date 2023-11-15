const { AGE_LIMIT } = require('../helpers/constants');
const { body } = require('express-validator');
const User = require('../../models/User');

const userFormValidators = {
    handle: body('handle')
        .isLength({ min: 3, max: 25 })
        .withMessage('Handle must be between 3-25 characters.')
        .custom((handle) => !/[^\w-]/.test(handle))
        .withMessage(
            'Handle can only contain letters (either case), numbers, dashes and underscores.'
        )
        .custom(async (handle, { req }) => {
            const filter = { handle: handle };
            if (req.user) filter._id = { $ne: req.user._id };

            const existingHandle = await User.exists(filter).exec();
            if (existingHandle) throw new Error('Handle already in use.');
        })
        .withMessage('Handle already in use.'),

    email: body('email', 'Email must be a valid email format.')
        .isEmail()
        .custom(async (email, { req }) => {
            const filter = { email: email };
            if (req.user) filter._id = { $ne: req.user._id };

            const existingUser = await User.exists(filter).exec();
            if (existingUser) throw new Error('E-mail already in use.');
        })
        .withMessage(
            'Email already in use.\nIf you have an existing account with this email tied to Github and wish to set a password, please log in and set this in your account settings.'
        ),

    password: body('password', 'Password must follow the listed requirements.').isStrongPassword({
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 0,
    }),

    confirm: body('confirm', 'Passwords must match.').custom(
        (confirm, { req }) => confirm === req.body.password
    ),

    firstName: body('firstName', 'First name must be provided.').notEmpty(),

    lastName: body('lastName', 'Last name must be provided.').notEmpty(),

    'DOB.value': body('DOB.value', 'Date of birth must be provided.')
        .isISO8601()
        .custom((value) => {
            const now = new Date(Date.now());
            const currentYear = now.getFullYear();
            const ageLimitDateThreshold = now.setFullYear(currentYear - AGE_LIMIT);

            const dob = new Date(value);

            return dob < ageLimitDateThreshold;
        })
        .withMessage(`You must be at least ${AGE_LIMIT} years old to sign up to Peepl.`),

    'city.value': body('city.value').optional().isString(),

    'country.value': body('country.value').optional().isString(),

    education: body('education')
        .isArray()
        .withMessage('Education field must be an array.')
        .custom((array) =>
            array.every((object) => {
                const requiredFields = ['institution', 'start', 'end'];
                const objectFields = Object.keys(object);

                return (
                    objectFields.length === requiredFields.length &&
                    objectFields.every((field) => requiredFields.includes(field))
                );
            })
        )
        .withMessage(
            'Each education entry must contain an institution and start date. End date may be left blank if ongoing.'
        ),

    employment: body('employment')
        .isArray()
        .withMessage('Employment field must be an array.')
        .custom((array) =>
            array.every((object) => {
                const requiredFields = ['title', 'company', 'start', 'end'];
                const objectFields = Object.keys(object);

                return (
                    objectFields.length === requiredFields.length &&
                    objectFields.every((field) => requiredFields.includes(field))
                );
            })
        )
        .withMessage(
            'Each employment entry must contain a job title, company and start date. End date may be left blank if ongoing.'
        ),

    visibility: body(
        'DOB.visibility',
        'Date of birth visibility must either be "everyone", "friends" or "hidden".'
    ).custom((value) => ['everyone', 'friends', 'hidden'].includes(value)),
};

const signupFieldsLocal = [
    'email',
    'password',
    'confirm',
    'firstName',
    'lastName',
    'DOB.value',
    'city.value',
    'country.value',
];

const editDetailsFields = [
    'handle',
    'email',
    'firstName',
    'lastName',
    'DOB.value',
    'city.value',
    'country.value',
];

exports.editDetailsFields = editDetailsFields;

exports.editDetailsFieldsTheHaveSubfields = editDetailsFields
    .filter((field) => field.includes('.'))
    .map((field) => {
        const [fieldName] = field.split('.');
        return `${fieldName}.visibility`;
    });

exports.validateSignupLocal = signupFieldsLocal.map((field) => userFormValidators[field]);

exports.validateEditDetails = [
    ...editDetailsFields.map((field) => userFormValidators[field]),
    userFormValidators.visibility,
];
