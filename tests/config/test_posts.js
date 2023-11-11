const { postIDs, userIDs } = require('./test_IDs');

exports.posts = [
    {
        _id: postIDs[0],
        wall: userIDs[0],
        author: userIDs[0],
        timestamp: '2023-10-07T00:00:00.000Z',
        body: 'post0 own0',
        likes: [],
    },
    {
        _id: postIDs[1],
        wall: userIDs[0],
        author: userIDs[0],
        timestamp: '2023-10-07T01:00:00.000Z',
        body: 'post1 own0',
        likes: [],
    },
    {
        _id: postIDs[2],
        wall: userIDs[0],
        author: userIDs[1],
        timestamp: '2023-10-07T02:00:00.000Z',
        body: 'post2 from1',
        likes: [],
    },
    {
        _id: postIDs[3],
        wall: userIDs[1],
        author: userIDs[1],
        timestamp: '2023-10-07T02:00:00.000Z',
        body: 'post0 own1',
        likes: [],
    },
];
