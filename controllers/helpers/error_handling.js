const invalidPatternError = (string) => {
    return { error: `${string} is not a valid ObjectId pattern` };
};

exports.invalidPatternError = invalidPatternError;

exports.notFoundError = { error: '404: Resource could not be found.' };

exports.notLoggedInError = { error: 'Not logged in.' };

exports.unauthorisedError = { error: 'User not authorised to make this request.' };
