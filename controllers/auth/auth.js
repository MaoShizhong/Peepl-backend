const asyncHandler = require('express-async-handler');
const { body, validationResult } = require('express-validator');
const argon2 = require('argon2');
const User = require('../../models/User');
const Wall = require('../../models/Wall');
const { generateUsername } = require('unique-username-generator');

const AGE_LIMIT = 13;

// All form fields will be end up flagging as an error if not a string
exports.validateSignupLocal = [
    body('email', 'Email must be a valid email format.')
        .isEmail()
        .custom(async (email) => {
            const existingUser = await User.exists({ email: email }).exec();
            if (existingUser) throw new Error('E-mail already in use');
        })
        .withMessage(
            'Email already in use.\nIf you have an existing account with this email tied to Github and wish to set a password, please log in and set this in your account settings.'
        ),

    body('password', 'Password must follow the listed requirements.').isStrongPassword({
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 0,
    }),

    body('confirm', 'Passwords must match.').custom(
        (confirm, { req }) => confirm === req.body.password
    ),

    body('firstName', 'First name must be provided.').notEmpty(),

    body('lastName', 'Last name must be provided.').notEmpty(),

    body('DOB', 'Date of birth must be provided.')
        .isDate()
        .custom((value) => {
            const now = new Date(Date.now());
            const currentYear = now.getFullYear();
            const thirteenYearsAgo = now.setFullYear(currentYear - AGE_LIMIT);

            const dob = new Date(value);

            return dob < thirteenYearsAgo;
        })
        .withMessage('You must be at least 13 years old to sign up to Peepl.'),

    body('city').optional(),

    body('country').optional().isString(),
];

exports.addNewUserLocal = asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        // Send only the first form error back to user
        const error = errors.array()[0].msg;
        return res.status(400).json({ error });
    }

    const { email, password, firstName, lastName, DOB, city, country } = req.body;

    // prevent the tiniest of tiniest of chances that an auto-generated handle
    // collides with an existing one
    let handle, existingHandle;
    do {
        handle = generateUsername('-', 6);
        existingHandle = await User.exists({ handle: handle }).exec();
    } while (existingHandle);

    try {
        const hashedPassword = await argon2.hash(password);

        const newUser = new User({
            handle: handle,
            email: email,
            auth: {
                strategies: ['local'],
                password: hashedPassword,
            },
            details: {
                firstName: firstName,
                lastName: lastName,
                'DOB.value': DOB,
                'city.value': city,
                'country.value': country,
            },
        });

        const newUserWall = new Wall({
            user: newUser._id,
            posts: [],
        });

        await Promise.all([newUser.save(), newUserWall.save()]);

        // ! remove when passport implemented
        req.user = {
            handle: newUser.handle,
            email: newUser.email,
            auth: newUser.auth,
            details: newUser.details,
            isDemo: newUser.isDemo,
        };
    } catch (error) {
        return res
            .status(502)
            .json({ error: 'Server error during sign up. Please try again later.' });
    }

    next();
});

exports.login = (req, res) => {
    const { handle, email, auth, details, isDemo } = req.user;

    res.status(201).json({
        handle: handle,
        email: email,
        details: details,
        isDemo: isDemo,
        isGithubOnly: !auth.strategies.includes('local'),
    });
};
