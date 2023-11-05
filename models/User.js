const { model, Schema } = require('mongoose');

const FriendSchema = new Schema(
    {
        user: { type: Schema.Types.ObjectId, ref: 'user', unique: true, required: true },
        status: { type: String, enum: ['requested', 'incoming', 'accepted'], required: true },
    },
    { _id: false }
);

const UserSchema = new Schema(
    {
        email: { type: String, required: true },
        auth: [{ type: String, enum: ['local', 'github'] }],
        password: {
            type: String,
            required: function () {
                return this.auth === 'local';
            },
        },
        githubID: {
            type: String,
            required: function () {
                return this.auth === 'github';
            },
        },
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        DOB: { type: Date, required: true },
        friends: [FriendSchema],
        isDemo: { type: Boolean, default: undefined },
        passwordReset: {
            token: String,
            expiry: Date,
            used: Boolean,
        },
        accountDeletion: {
            token: String,
            expiry: Date,
        },
        githubLoginToken: String,
    },
    { versionKey: false }
);

module.exports = model('user', UserSchema);
