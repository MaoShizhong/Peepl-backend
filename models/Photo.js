const { model, Schema } = require('mongoose');

const PhotoSchema = new Schema(
    {
        user: { type: Schema.Types.ObjectId, ref: 'user', required: true },
        timestamp: { type: Date, required: true },
        cloudinaryID: { type: String, required: true },
        url: { type: String, required: true },
    },
    { versionKey: false }
);

module.exports = model('Photo', PhotoSchema);
