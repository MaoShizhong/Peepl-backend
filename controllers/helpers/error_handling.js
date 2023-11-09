const { isValidObjectId } = require('mongoose');

const invalidPatternError = (string) => {
    return { error: `${string} is not a valid ObjectId pattern` };
};

exports.invalidPatternError = invalidPatternError;
exports.notFoundError = { error: '404: Resource could not be found.' };

exports.validateObjectIDs = (req, res, next) => {
    for (const param of Object.values(req.params)) {
        if (!isValidObjectId(param)) {
            return res.status(400).json(invalidPatternError(param));
        }
    }

    next();
};
