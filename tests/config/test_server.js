const express = require('express');
const session = require('express-session');

require('dotenv').config();

const app = express();

const passport = require('passport');
const { localStrategy } = require('../../passport/strategies');
const { serialize, deserialize } = require('../../passport/serialize');

passport.use(localStrategy);

passport.serializeUser(serialize);
passport.deserializeUser(deserialize);

app.use(express.urlencoded({ extended: false }));
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: process.env.MODE === 'prod',
            maxAge: 2 * 24 * 60 * 60 * 1000, // 2 days (refreshed every successful request)
            httpOnly: process.env.MODE === 'prod',
            sameSite: process.env.MODE === 'prod' ? 'none' : 'lax',
        },
    })
);

app.use(passport.initialize());
app.use(passport.session());

const userRouter = require('../../routes/user_router');
const authRouter = require('../../routes/auth_router');

app.use('/users', userRouter);
app.use('/auth', authRouter);

module.exports = app;
