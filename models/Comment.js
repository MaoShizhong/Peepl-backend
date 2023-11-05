const { model, Schema } = require('mongoose');

const CommentSchema = new Schema(
    {
        post: { type: Schema.Types.ObjectId, ref: 'post', required: true },
        author: { type: Schema.Types.ObjectId, ref: 'user', required: true },
        timestamp: { type: Date, required: true },
        body: { type: String, required: true },
        likes: [{ type: Schema.Types.ObjectId, ref: 'user' }],
        replies: [{ type: Schema.Types.ObjectId, ref: 'comment' }],
        isReply: { type: Boolean, default: false },
    },
    { versionKey: false }
);

module.exports = model('comment', CommentSchema);
