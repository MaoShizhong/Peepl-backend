const { model, Schema } = require('mongoose');

const WallSchema = new Schema(
    {
        user: { type: Schema.Types.ObjectId, ref: 'user', required: true },
        posts: [{ type: Schema.Types.ObjectId, ref: 'post' }],
    },
    { versionKey: false }
);

module.exports = model('wall', WallSchema);
