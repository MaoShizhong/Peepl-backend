const LocalStrategy = require('passport-local').Strategy;
const GithubStrategy = require('passport-github2').Strategy;
const User = require('../models/User');
const argon2 = require('argon2');
const { generateUsername } = require('unique-username-generator');
const { cloudinary } = require('../cloudinary/cloudinary');
const { getName, capitaliseFirstLetter } = require('../controllers/helpers/util');

exports.localStrategy = new LocalStrategy(
    // using `email` form field to sign in instead of username
    { usernameField: 'email' },
    async (email, password, done) => {
        try {
            const user = await User.findOne({ email: email, 'auth.strategy': 'local' }).exec();

            if (!user) {
                return done(null, false);
            }

            const matchingPassword = await argon2.verify(user.auth.password, password);
            if (!matchingPassword) {
                return done(null, false);
            }

            return done(null, {
                _id: user._id.valueOf(),
                handle: user.handle,
                profilePicture: user.profilePicture,
                email: user.email,
                details: user.details,
                isDemo: user.isDemo,
                isGithub: false,
            });
        } catch (err) {
            return done(err);
        }
    }
);

exports.githubStrategy = new GithubStrategy(
    {
        clientID: process.env.GITHUB_APP_ID,
        clientSecret: process.env.GITHUB_APP_SECRET,
        callbackURL:
            process.env.MODE === 'prod'
                ? process.env.PROD_GITHUB_CALLBACK_URL
                : process.env.DEV_GITHUB_CALLBACK_URL,
        scope: ['user:email'],
    },
    async (_, __, profile, done) => {
        try {
            const { id, displayName, username, photos, emails } = profile;
            const profilePictureURL = photos[0].value;
            const email = emails[0].value;

            const existingUser = await User.findOne({
                auth: { strategy: 'github', githubID: id },
            }).exec();

            if (existingUser) {
                // Update stored email if changed on GH
                // because GH accounts on Peepl cannot change their emails on the client
                if (email !== existingUser.email) {
                    existingUser.email = email;
                    await existingUser.save();
                }

                done(null, {
                    _id: existingUser._id.valueOf(),
                    handle: existingUser.handle,
                    profilePicture: existingUser.profilePicture,
                    email: existingUser.email,
                    details: existingUser.details,
                    isDemo: false,
                    isGithub: true,
                });
            } else {
                // prevent the tiniest of tiniest of chances that an auto-generated handle
                // collides with an existing one
                let handle, existingHandle;
                do {
                    handle = generateUsername('-', 6);
                    existingHandle = await User.exists({ handle: handle }).exec();
                } while (existingHandle);

                const [firstName, lastName] = getName({
                    name: displayName,
                    fallbackName: username,
                });

                const newUser = new User({
                    handle: handle,
                    email: email,
                    profilePicture: profilePictureURL,
                    auth: {
                        strategy: 'github',
                        githubID: id,
                    },
                    details: {
                        firstName: capitaliseFirstLetter(firstName),
                        lastName: capitaliseFirstLetter(lastName),
                        'DOB.value': new Date('1990-01-01'),
                    },
                });

                await Promise.all([newUser.save(), cloudinary.api.create_folder(newUser._id)]);

                done(null, {
                    _id: newUser._id.valueOf(),
                    handle: newUser.handle,
                    profilePicture: newUser.profilePicture,
                    email: newUser.email,
                    details: newUser.details,
                    isDemo: false,
                    isGithub: true,
                });
            }
        } catch (err) {
            return done(err);
        }
    }
);
