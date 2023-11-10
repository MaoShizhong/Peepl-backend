const { model, Schema } = require('mongoose');

const EmploymentSchema = new Schema(
    {
        title: String,
        company: String,
        start: Date,
        end: Date,
    },
    { _id: false }
);

const EducationSchema = new Schema(
    {
        institution: String,
        start: Date,
        end: Date,
    },
    { _id: false }
);

const FriendSchema = new Schema(
    {
        user: { type: Schema.Types.ObjectId, ref: 'user', unique: true, required: true },
        status: { type: String, enum: ['requested', 'incoming', 'accepted'], required: true },
    },
    { _id: false }
);

const TokenSchema = new Schema(
    {
        passwordReset: {
            token: String,
            expiry: Date,
            used: Boolean,
        },
        accountDeletion: {
            token: String,
            expiry: Date,
            used: Boolean,
        },
        githubLoginToken: String,
    },
    { _id: false }
);

const UserSchema = new Schema(
    {
        handle: { type: String, unique: true, required: true },
        email: { type: String, unique: true, required: true },
        auth: {
            strategies: [{ type: String, enum: ['local', 'github'] }],
            password: {
                type: String,
                required: function () {
                    return this.auth.strategies.includes('local');
                },
            },
            githubID: {
                type: String,
                required: function () {
                    return this.auth.strategies.includes('github');
                },
            },
        },
        details: {
            firstName: { type: String, required: true },
            lastName: { type: String, required: true },
            DOB: {
                value: { type: Date, required: true },
                visibility: {
                    type: String,
                    default: 'hidden',
                    enum: ['everyone', 'friends', 'hidden'],
                    required: true,
                },
            },
            city: {
                value: String,
                visibility: {
                    type: String,
                    default: 'hidden',
                    enum: ['everyone', 'friends', 'hidden'],
                },
            },
            country: {
                value: String,
                visibility: {
                    type: String,
                    default: 'hidden',
                    enum: ['everyone', 'friends', 'hidden'],
                },
            },
            employment: {
                value: [EmploymentSchema],
                visibility: {
                    type: String,
                    default: 'everyone',
                    enum: ['everyone', 'friends', 'hidden'],
                },
            },
            education: {
                value: [EducationSchema],
                visibility: {
                    type: String,
                    default: 'everyone',
                    enum: ['everyone', 'friends', 'hidden'],
                },
            },
        },
        friends: [FriendSchema],
        isDemo: { type: Boolean, default: undefined },
        tokens: TokenSchema,
    },
    { toJSON: { virtuals: true }, versionKey: false }
);

module.exports = model('user', UserSchema);
