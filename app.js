const cors = require('cors');
const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const MongoStore = require('connect-mongo');
const logger = require('morgan');

require('dotenv').config();

const app = express();

/*
- Mongoose setup
*/
const mongoose = require('mongoose');

async function connectToDatabase() {
    await mongoose.connect(process.env.CONNECTION_STRING);
}

try {
    mongoose.set('strictQuery', false);

    connectToDatabase();
    console.log('Connected to MongoDB');
} catch (error) {
    console.error(error);
    process.exit(1);
}

/*
    - Initialise passport
*/
const passport = require('passport');
const { localStrategy } = require('./passport/strategies');
const { serialize, deserialize } = require('./passport/serialize');

passport.use(localStrategy);
// passport.use(githubStrategy);

passport.serializeUser(serialize);
passport.deserializeUser(deserialize);

/*
    - Initialise middleware
*/
const { COOKIE_MAX_AGE } = require('./controllers/helpers/constants');

app.disable('x-powered-by');
app.use(logger('dev'));
app.set('trust proxy', 1);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(
    cors({
        origin: process.env.ALLOWED_ORIGINS.split(','),
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    })
);
app.use(
    session({
        name: process.env.COOKIE_NAME,
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({ client: mongoose.connection.getClient() }),
        cookie: {
            secure: process.env.MODE === 'prod',
            maxAge: COOKIE_MAX_AGE, // 2 days (refreshed every successful request)
            httpOnly: process.env.MODE === 'prod',
            sameSite: process.env.MODE === 'prod' ? 'none' : 'lax',
        },
    })
);
app.use(passport.session());

/*
    - Initialise routers
*/
const authRouter = require('./routes/auth_router');
const userRouter = require('./routes/user_router');

app.use('/auth', authRouter);
app.use('/users', userRouter);

/*
    - Listen
*/

const PORT = process.env.PORT || '3000';

try {
    app.listen(PORT);
    console.log(`Listening on port: ${PORT}`);
} catch (error) {
    console.error('Could not listen:', error);
}
