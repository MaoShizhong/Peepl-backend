const { model, Schema } = require('mongoose');
const { POST_CHAR_LIMIT } = require('../controllers/helpers/constants');

const PostSchema = new Schema(
    {
        wall: { type: Schema.Types.ObjectId, ref: 'user', required: true },
        author: { type: Schema.Types.ObjectId, ref: 'user', required: true },
        timestamp: { type: Date, required: true },
        body: { type: String, maxLength: POST_CHAR_LIMIT, required: true },
        likes: [{ type: Schema.Types.ObjectId, ref: 'user' }],
    },
    { versionKey: false }
);

module.exports = model('post', PostSchema);
