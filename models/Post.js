const { model, Schema } = require('mongoose');
const { POST_CHAR_LIMIT } = require('../controllers/helpers/constants');

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
        .select('-body -likes')
        .exec();

    // user posted on their own wall - notify their friends of new feed post
    if (newPost.wall.valueOf() === newPost.author.valueOf()) {
        // ! NOTIFY FEEDS OF NEW POST
        console.log('New wall post:', populatedNewPost);
    }
    // send header notification as user posted on another user's wall
    else {
        // ! SEND WALL TARGET HEADER NOTIFICATION OF NEW WALL POST
    }
});

module.exports = Post;
