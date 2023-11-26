const { invalidPatternError, unauthorisedError } = require('../helpers/error_handling');
const { isValidObjectId } = require('mongoose');
const fs = require('fs');

exports.validateObjectIDs = (req, res, next) => {
    for (const param of Object.values(req.params)) {
        if (!isValidObjectId(param)) {
            return res.status(400).json(invalidPatternError(param));
        }
    }

    next();
};

exports.validateFriendQueryObjectIDs = (req, res, next) => {
    const { requested, incoming } = req.query;

    for (const query of [requested, incoming]) {
        if (query && !isValidObjectId(query)) {
            return res.status(400).json(invalidPatternError(query));
        }
    }

    next();
};

exports.verifySameUser = (req, res, next) => {
    const { userID } = req.params;
    const { _id } = req.user;

    if (userID === _id) return next();

    /* multer must handle image file before same-user verification
    else it will throw a "write EPIPE" error, therefore any temp image
    data stored on disk must be deleted as request will end */
    if (req.file) {
        fs.rmSync(`${process.cwd()}/${req.file.path}`);
    }

    res.status(403).json(unauthorisedError);
};
