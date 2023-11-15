const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');
const argon2 = require('argon2');
const User = require('../../models/User');
const { generateUsername } = require('unique-username-generator');

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
                'DOB.value': DOB.value,
                'city.value': city ? city.value : undefined,
                'country.value': country ? country.value : undefined,
            },
        });

        await newUser.save();
    } catch (error) {
        return res
            .status(502)
            .json({ error: 'Server error during sign up. Please try again later.' });
    }

    next();
});

exports.login = (req, res) => {
    const { handle, email, details, isDemo, isGithubOnly } = req.user;

    res.status(201).json({
        handle: handle,
        email: email,
        details: details,
        isDemo: isDemo,
        isGithubOnly: isGithubOnly,
    });
};

exports.checkAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) next();
    else res.status(401).json({ error: 'Not logged in.' });
};
