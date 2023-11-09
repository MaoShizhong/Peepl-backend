const { userIDs } = require('./test_IDs');

exports.users = [
    {
        _id: userIDs[0],
        email: 'user0@test.com',
        auth: { strategies: ['local'], password: 'asdfASDF0' },
        details: {
            firstName: 'First0',
            lastName: 'Last0',
            DOB: {
                value: new Date('1995-12-17T03:20:00'),
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
                        start: new Date('2015-12-17T03:20:00'),
                    },
                ],
                visibility: 'everyone',
            },
            education: {
                value: [
                    {
                        insitution: '0School',
                        start: new Date('2000-12-17T03:20:00'),
                        end: new Date('2015-12-17T03:20:00'),
                    },
                ],
                visibility: 'everyone',
            },
        },
        friends: [],
    },
    {
        _id: userIDs[1],
        email: 'user1@test.com',
        auth: { strategies: ['local'], password: 'asdfASDF1' },
        details: {
            firstName: 'First1',
            lastName: 'Last1',
            DOB: {
                value: new Date('1995-12-17T03:21:00'),
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
                        start: new Date('2015-12-17T03:21:00'),
                    },
                ],
                visibility: 'everyone',
            },
            education: {
                value: [
                    {
                        insitution: '1School',
                        start: new Date('2000-12-17T03:21:00'),
                        end: new Date('2015-12-17T03:21:00'),
                    },
                ],
                visibility: 'everyone',
            },
        },
        friends: [],
    },
    {
        _id: userIDs[2],
        email: 'user2@test.com',
        auth: { strategies: ['local'], password: 'asdfASDF2' },
        details: {
            firstName: 'First2',
            lastName: 'Last2',
            DOB: {
                value: new Date('1995-12-17T03:22:00'),
                visibility: 'friends',
            },
            city: {
                value: 'Twoton',
                visibility: 'friends',
            },
            country: {
                value: 'United Kingdom',
                visibility: 'friends',
            },
            employment: {
                value: [
                    {
                        title: '2Title',
                        company: '2Company',
                        start: new Date('2015-12-17T03:22:00'),
                    },
                ],
                visibility: 'friends',
            },
            education: {
                value: [
                    {
                        insitution: '2School',
                        start: new Date('2000-12-17T03:22:00'),
                        end: new Date('2015-12-17T03:22:00'),
                    },
                ],
                visibility: 'friends',
            },
        },
        friends: [],
    },
    {
        _id: userIDs[3],
        email: 'user3@test.com',
        auth: { strategies: ['local'], password: 'asdfASDF3' },
        details: {
            firstName: 'First3',
            lastName: 'Last3',
            DOB: {
                value: new Date('1995-12-17T03:20:00'),
                visibility: 'hidden',
            },
            city: {
                value: 'Threeton',
                visibility: 'hidden',
            },
            country: {
                value: 'United Kingdom',
                visibility: 'hidden',
            },
            employment: {
                value: [
                    {
                        title: '3Title',
                        company: '3Company',
                        start: new Date('2015-12-17T03:23:00'),
                    },
                ],
                visibility: 'hidden',
            },
            education: {
                value: [
                    {
                        insitution: '3School',
                        start: new Date('2000-12-17T03:23:00'),
                        end: new Date('2015-12-17T03:23:00'),
                    },
                ],
                visibility: 'hidden',
            },
        },
        friends: [],
    },
];
