const { postIDs, userIDs } = require('./test_IDs');

exports.posts = [
    {
        _id: postIDs[0],
        author: userIDs[0],
        timestamp: new Date('2023-10-07T00:00:00'),
        body: 'post0',
        likes: [],
    },
    {
        _id: postIDs[1],
        author: userIDs[0],
        timestamp: new Date('2023-10-07T01:00:00'),
        body: 'post1',
        likes: [],
    },
    {
        _id: postIDs[2],
        author: userIDs[1],
        timestamp: new Date('2023-10-07T02:00:00'),
        body: 'post2',
        likes: [],
    },
];
