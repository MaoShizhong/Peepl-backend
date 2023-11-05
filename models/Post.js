const { model, Schema } = require('mongoose');

const PostSchema = new Schema(
    {
        author: { type: Schema.Types.ObjectId, ref: 'user', required: true },
        timestamp: { type: Date, required: true },
        body: { type: String, maxLength: 4000, required: true },
        likes: [{ type: Schema.Types.ObjectId, ref: 'user' }],
    },
    { versionKey: false }
);

module.exports = model('post', PostSchema);
