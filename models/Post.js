const { model, Schema } = require('mongoose');
const { POST_CHAR_LIMIT } = require('../controllers/helpers/constants');
const { sendFeedUpdate, sendWallPostNotification } = require('../controllers/SSE/send');
const User = require('./User');

const PostSchema = new Schema(
    {
        wall: { type: Schema.Types.ObjectId, ref: 'user', required: true },
        author: { type: Schema.Types.ObjectId, ref: 'user', required: true },
        timestamp: { type: Date, required: true },
        body: { type: String, maxLength: POST_CHAR_LIMIT, required: true },
        likes: [{ type: Schema.Types.ObjectId, ref: 'user' }],
        isEdited: { type: Boolean, default: undefined },
    },
    { versionKey: false }
);

const Post = model('post', PostSchema);
Post.watch().on('change', async ({ operationType, fullDocument: newPost }) => {
    if (operationType !== 'insert') return;

    const populatedNewPost = await Post.findById(newPost._id)
        .populate('author', 'handle details.firstName details.lastName profilePicture')
        .exec();

    if (newPost.wall.valueOf() === newPost.author.valueOf()) {
        // user posted on their own wall - notify their friends of new feed post
        const { friends } = await User.findById(newPost.author.valueOf()).exec();
        sendFeedUpdate(friends, populatedNewPost);
    } else {
        // send header notification as user posted on another user's wall
        sendWallPostNotification(populatedNewPost);
    }
});

module.exports = Post;
