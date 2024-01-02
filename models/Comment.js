const { model, Schema } = require('mongoose');

const CommentSchema = new Schema(
    {
        post: { type: Schema.Types.ObjectId, ref: 'post', required: true },
        author: { type: Schema.Types.ObjectId, ref: 'user', required: true },
        timestamp: { type: Date, required: true },
        body: { type: String, required: true },
    },
    { versionKey: false }
);

module.exports = model('comment', CommentSchema);
