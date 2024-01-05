const { IMAGE_UPLOAD_SIZE_LIMIT, AGE_LIMIT } = require('../helpers/constants');
const { body } = require('express-validator');
const User = require('../../models/User');
const multer = require('multer');
const { fromFile: checkFileType } = require('file-type');
const { rmSync } = require('fs');
const { POST_CHAR_LIMIT } = require('../helpers/constants');

// If no image file submitted, multer will do nothing and simply call next()
exports.handleImageFile = (imageFormField) => {
    return (req, res, next) => {
        const separateImageFileToTempStorage = multer({
            dest: 'images/temp',
            limits: { fileSize: IMAGE_UPLOAD_SIZE_LIMIT },
        }).single(imageFormField);

        /*
            If multer detects a file attachment, it will validate it then split
            the form body so the file goes into req.file and the rest of the form
            into req.body
        */
        separateImageFileToTempStorage(req, res, async (err) => {
            if (!err && !req.file) {
                return next();
            } else if (err instanceof multer.MulterError) {
                return res.status(400).json({ error: err.message });
            } else if (err) {
                return res.status(500).json({
                    error: 'Unknown error occurred during file upload. Please try again later.',
                });
            }

            // - only allow png/jpe?g/webp images - must detect by file magic number
            // - not naive ext/MIME type as this can easily be changed by the user before upload
            // - 'jpg' considered 'jpeg' by file-type-checker
            const validMimes = ['image/png', 'image/jpeg', 'image/webp'];

            const fileType = await checkFileType(`${process.cwd()}/${req.file.path}`);

            if (!fileType || !validMimes.includes(fileType.mime)) {
                rmSync(`${process.cwd()}/${req.file.path}`);

                res.status(400).json({
                    error: 'Invalid file type. Only PNG/JPG/JPEG/WEBP images allowed.',
                });
            } else {
                next();
            }
        });
    };
};

const userFormValidators = {
    handle: body('handle')
        .isLength({ min: 3, max: 45 })
        .withMessage('Handle must be between 3 - 45 characters.')
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

    'education.value': body('education.value')
        .isArray()
        .withMessage('Education field must be an array.')
        .custom((array) =>
            // noSQL injection protection
            array.every((entry) => {
                const requiredFields = ['institution', 'course', 'start', 'end', 'id'];
                const objectFields = Object.keys(entry);
                const objectValues = Object.values(entry);

                return (
                    objectFields.length === requiredFields.length &&
                    objectFields.every((field) => requiredFields.includes(field)) &&
                    objectValues.every(
                        (value) =>
                            value === null || (typeof value === 'string' && value.trim() !== '')
                    )
                );
            })
        )
        .withMessage(
            'Each education entry must contain an institution and start date. End date may be left blank if ongoing.'
        ),

    'employment.value': body('employment.value')
        .isArray()
        .withMessage('Employment field must be an array.')
        .custom((array) =>
            // noSQL injection protection
            array.every((entry) => {
                const requiredFields = ['title', 'company', 'start', 'end', 'id'];
                const objectFields = Object.keys(entry);
                const objectValues = Object.values(entry);

                return (
                    objectFields.length === requiredFields.length &&
                    objectFields.every((field) => requiredFields.includes(field)) &&
                    objectValues.every(
                        (value) =>
                            value === null || (typeof value === 'string' && value.trim() !== '')
                    )
                );
            })
        )
        .withMessage(
            'Each employment entry must contain a job title, company and start date. End date may be left blank if ongoing.'
        ),

    visibility: (field) =>
        body(
            `${field}.visibility`,
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
    'firstName',
    'lastName',
    'DOB.value',
    'city.value',
    'country.value',
];

const editDetailsFieldsThatHaveSubfields = editDetailsFields
    .filter((field) => field.includes('.'))
    .map((field) => {
        const [fieldName] = field.split('.');
        return `${fieldName}.visibility`;
    });

exports.editDetailsFields = [...editDetailsFields, ...editDetailsFieldsThatHaveSubfields];

exports.validateSignupLocal = signupFieldsLocal.map((field) => userFormValidators[field]);

exports.validateEditDetails = [
    ...editDetailsFields.map((field) => userFormValidators[field]),
    ...['DOB', 'city', 'country'].map((field) => userFormValidators.visibility(field)),
];

exports.validateEditEducation = [
    userFormValidators['education.value'],
    userFormValidators.visibility('education'),
];

exports.validateEditEmployment = [
    userFormValidators['employment.value'],
    userFormValidators.visibility('employment'),
];

exports.validateFields = (...fields) => {
    return fields.map((field) => userFormValidators[field]);
};

exports.validatePostForm = body('body')
    .notEmpty()
    .withMessage('Cannot be empty.')
    .isLength({ max: POST_CHAR_LIMIT })
    .withMessage(`Max. ${POST_CHAR_LIMIT} characters.`);
