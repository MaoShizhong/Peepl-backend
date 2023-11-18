const { feedUserIDs } = require('./test_IDs');
const { generateUsername } = require('unique-username-generator');
const { ObjectId } = require('mongoose').Types;

exports.feedUsers = [
    {
        _id: feedUserIDs[0],
        handle: generateUsername('-', 6),
        email: 'feeduser0@test.com',
        auth: { strategies: ['local'], password: 'asdfASDF0' },
        details: {
            firstName: 'Fr0',
            lastName: 'Last0',
            DOB: {
                value: '1995-12-17T03:20:00.000Z',
                visibility: 'everyone',
            },
            city: {
                value: 'Zeroton',
                visibility: 'everyone',
            },
            country: {
                value: 'United Kingdom',
                visibility: 'everyone',
            },
            employment: {
                value: [
                    {
                        title: '0Title',
                        company: '0Company',
                        start: '2015-12-17T03:20:00.000Z',
                    },
                ],
                visibility: 'everyone',
            },
            education: {
                value: [
                    {
                        institution: '0School',
                        start: '2000-12-17T03:20:00.000Z',
                        end: '2015-12-17T03:20:00.000Z',
                    },
                ],
                visibility: 'everyone',
            },
        },
        friends: [{ user: feedUserIDs[1], status: 'accepted' }],
    },
    {
        _id: feedUserIDs[1],
        handle: generateUsername('-', 6),
        email: 'feeduser1@test.com',
        auth: { strategies: ['local'], password: 'asdfASDF1' },
        details: {
            firstName: 'Fr1',
            lastName: 'Last1',
            DOB: {
                value: '1995-12-17T03:21:00.000Z',
                visibility: 'everyone',
            },
            city: {
                value: 'Oneton',
                visibility: 'everyone',
            },
            country: {
                value: 'United Kingdom',
                visibility: 'everyone',
            },
            employment: {
                value: [
                    {
                        title: '1Title',
                        company: '1Company',
                        start: '2015-12-17T03:21:00.000Z',
                    },
                ],
                visibility: 'everyone',
            },
            education: {
                value: [
                    {
                        institution: '1School',
                        start: '2000-12-17T03:21:00.000Z',
                        end: '2015-12-17T03:21:00.000Z',
                    },
                ],
                visibility: 'everyone',
            },
        },
        friends: [{ user: feedUserIDs[0], status: 'accepted' }],
    },
    {
        _id: feedUserIDs[2],
        handle: generateUsername('-', 6),
        email: 'feeduser2@test.com',
        auth: { strategies: ['local'], password: 'asdfASDF1' },
        details: {
            firstName: 'Fr1',
            lastName: 'Last1',
            DOB: {
                value: '1995-12-17T03:21:00.000Z',
                visibility: 'everyone',
            },
            city: {
                value: 'Oneton',
                visibility: 'everyone',
            },
            country: {
                value: 'United Kingdom',
                visibility: 'everyone',
            },
            employment: {
                value: [
                    {
                        title: '1Title',
                        company: '1Company',
                        start: '2015-12-17T03:21:00.000Z',
                    },
                ],
                visibility: 'everyone',
            },
            education: {
                value: [
                    {
                        institution: '1School',
                        start: '2000-12-17T03:21:00.000Z',
                        end: '2015-12-17T03:21:00.000Z',
                    },
                ],
                visibility: 'everyone',
            },
        },
        friends: [],
    },
];

exports.feedPosts = [
    {
        _id: new ObjectId().valueOf(),
        wall: feedUserIDs[1],
        author: feedUserIDs[1],
        timestamp: '2023-10-07T00:00:00.000Z',
        body: 'post0 own0',
        likes: [],
    },
    ...createPostsByUser0(),
    ...createPostsThatShouldNotShowUpOnTestFeeds()
];

function createPostsByUser0() {
    const posts = [];

    for (let i = 0; i < 40; i++) {
        // force dinstinctly different timestamps
        const date = new Date(Date.now() - i * 1000);

        posts.push({
            _id: new ObjectId().valueOf(),
            wall: feedUserIDs[0],
            author: feedUserIDs[0],
            timestamp: date.toISOString(),
            body: `${i}`,
            likes: [],
        });
    }

    return posts;
}

function createPostsThatShouldNotShowUpOnTestFeeds() {
    const posts = [];

    for (let i = 0; i < 40; i++) {
        // force dinstinctly different timestamps
        const date = new Date(Date.now() - i * 1000);

        posts.push({
            _id: new ObjectId().valueOf(),
            wall: feedUserIDs[2],
            author: feedUserIDs[2],
            timestamp: date.toISOString(),
            body: `${i}`,
            likes: [],
        });
    }

    return posts;
}
