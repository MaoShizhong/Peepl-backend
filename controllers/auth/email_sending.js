const asyncHandler = require('express-async-handler');
const User = require('../../models/User');
const { sendEmailWithLink } = require('./nodemailer/emails');
const { randomBytes, createHash } = require('node:crypto');
const { ONE_TIME_TOKEN_EXPIRY } = require('../helpers/constants');

/**
 *
 * @param {'accountDeletion'|'passwordReset'} tokenType
 */
exports.sendEmail = (tokenType) =>
    asyncHandler(async (req, res) => {
        const { _id } = req.user;

        const hash = createHash('sha3-256');
        const token = randomBytes(32).toString('base64url');

        const hashedToken = hash.update(token).digest('base64');

        // Storing hashed token prevents anyone other than the recipient getting a usable reset token
        // Expiry set to 10 minutes from generation
        const updatedUser = await User.findByIdAndUpdate(_id, {
            [`tokens.${tokenType}`]: {
                token: hashedToken,
                expiry: new Date(Date.now() + ONE_TIME_TOKEN_EXPIRY),
                used: false,
            },
        }).exec();

        // Send unhashed token (usable) to recipient
        sendEmailWithLink(tokenType, updatedUser.email, token);

        const message =
            tokenType === 'passwordReset'
                ? 'Password reset email sent.'
                : 'Account deletion confirmation email sent.';
        res.json({ message });
    });

/**
 *
 * @param {'accountDeletion'|'passwordReset'} tokenType
 */
exports.verifyTokenFromEmailLink = (tokenType) =>
    asyncHandler(async (req, res) => {
        const { token } = req.params;

        const hash = createHash('sha3-256');
        const hashedToken = hash.update(token).digest('base64');

        const userWithValidToken = await User.findOneAndUpdate(
            {
                [`tokens.${tokenType}.token`]: hashedToken,
                [`tokens.${tokenType}.expiry`]: { $gt: new Date() },
                [`tokens.${tokenType}.used`]: false,
            },
            { [`tokens.${tokenType}.used`]: true },
            { new: true }
        ).exec();

        if (!userWithValidToken) {
            /*
                Reset token record does not auto delete unless a new password is actually set.
                In case a token is used but a new password not set, upon accessing an old link,
                this record will be removed to save storage space.
            */
            await User.findOneAndUpdate(
                { [`tokens.${tokenType}.token`]: hashedToken },
                { $unset: { [`tokens.${tokenType}`]: 1 } }
            ).exec();

            res.status(401).json({ message: 'Token expired or not valid.' });
        } else {
            res.json({ message: 'Token successfully validated.' });
        }
    });
