const { userIDs } = require('./test_IDs');

exports.users = [
    {
        _id: userIDs[0],
        email: 'user0@test.com',
        auth: ['local'],
        password: 'asdfASDF0',
        firstName: 'First0',
        lastName: 'Last0',
        DOB: new Date('1995-12-17T03:24:00'),
        friends: [],
    },
    {
        _id: userIDs[1],
        email: 'user1@test.com',
        auth: ['local'],
        password: 'asdfASDF1',
        firstName: 'First1',
        lastName: 'Last1',
        DOB: new Date('1995-12-17T03:24:00'),
        friends: [],
    },
    {
        _id: userIDs[2],
        email: 'user2@test.com',
        auth: ['local'],
        password: 'asdfASDF2',
        firstName: 'First2',
        lastName: 'Last2',
        DOB: new Date('1995-12-17T03:24:00'),
        friends: [],
    },
    {
        _id: userIDs[3],
        email: 'user3@test.com',
        auth: ['local'],
        password: 'asdfASDF3',
        firstName: 'First3',
        lastName: 'Last3',
        DOB: new Date('1995-12-17T03:24:00'),
        friends: [],
    },
];
