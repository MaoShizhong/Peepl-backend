const GET = require('./user_GET');
const POST = require('./user_POST');
const PUT = require('./user_PUT');
const PATCH = require('./user_PATCH');
const DELETE = require('./user_DELETE');

module.exports = {
    ...GET,
    ...POST,
    ...PUT,
    ...PATCH,
    ...DELETE,
};
