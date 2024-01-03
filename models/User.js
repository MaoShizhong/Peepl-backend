const { model, Schema } = require('mongoose');
const { sendIncomingFriendRequestNotification } = require('../controllers/SSE/send');

const EmploymentSchema = new Schema(
    {
        id: String,
        title: String,
        company: String,
        start: Date,
        end: Date,
    },
    { _id: false }
);

const EducationSchema = new Schema(
    {
        id: String,
        institution: String,
        course: String,
        start: Date,
        end: Date,
    },
    { _id: false }
);

const FriendSchema = new Schema(
    {
        user: { type: Schema.Types.ObjectId, ref: 'user', required: true },
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
        email: { type: String, required: true },
        profilePicture: { type: String, default: null },
        auth: {
            strategy: { type: String, enum: ['local', 'github'] },
            password: {
                type: String,
                required: function () {
                    return this.auth.strategy === 'local';
                },
            },
            githubID: {
                type: String,
                required: function () {
                    return this.auth.strategy === 'github';
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
        galleryIsHidden: { type: Boolean, default: false },
        friends: [FriendSchema],
        isDemo: { type: Boolean, default: undefined },
        tokens: TokenSchema,
    },
    { toJSON: { virtuals: true }, versionKey: false }
);

const User = model('user', UserSchema);
User.watch().on('change', async ({ operationType, documentKey, updateDescription }) => {
    if (operationType !== 'update') return;

    // target only friend requests
    const updatedFieldPropertyName = Object.keys(updateDescription.updatedFields)[0];
    if (!updatedFieldPropertyName || !updatedFieldPropertyName.startsWith('friend')) return;

    // target only the friend request on the side of the user to send the notification to
    const newFriendEntry = updateDescription.updatedFields[updatedFieldPropertyName];
    if (newFriendEntry.status !== 'incoming') return;

    const idOfUserToNotify = documentKey._id.valueOf();
    const requesterDetails = await User.findById(
        newFriendEntry.user,
        'details.firstName details.lastName profilePicture handle'
    ).exec();

    sendIncomingFriendRequestNotification(idOfUserToNotify, requesterDetails);
});

module.exports = User;
