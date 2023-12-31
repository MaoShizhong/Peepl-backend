const { friendUserIDs } = require('./test_IDs');
const { generateUsername } = require('unique-username-generator');

exports.friendUsers = [
    {
        _id: friendUserIDs[0],
        handle: generateUsername('-', 6),
        email: 'fruser0@test.com',
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
        friends: [],
    },
    {
        _id: friendUserIDs[1],
        handle: generateUsername('-', 6),
        email: 'fruser1@test.com',
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
    {
        _id: friendUserIDs[2],
        handle: generateUsername('-', 6),
        email: 'fruser2@test.com',
        auth: { strategies: ['local'], password: 'asdfASDF2' },
        details: {
            firstName: 'Fr2',
            lastName: 'Last2',
            DOB: {
                value: '1995-12-17T03:22:00.000Z',
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
                        start: '2015-12-17T03:22:00.000Z',
                    },
                ],
                visibility: 'friends',
            },
            education: {
                value: [
                    {
                        institution: '2School',
                        start: '2000-12-17T03:22:00.000Z',
                        end: '2015-12-17T03:22:00.000Z',
                    },
                ],
                visibility: 'friends',
            },
        },
        friends: [],
    },
    {
        _id: friendUserIDs[3],
        handle: generateUsername('-', 6),
        email: 'fruser3@test.com',
        auth: { strategies: ['local'], password: 'asdfASDF3' },
        details: {
            firstName: 'Fr3',
            lastName: 'Last3',
            DOB: {
                value: '1995-12-17T03:20:00.000Z',
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
                        start: '2015-12-17T03:23:00.000Z',
                    },
                ],
                visibility: 'hidden',
            },
            education: {
                value: [
                    {
                        institution: '3School',
                        start: '2000-12-17T03:23:00.000Z',
                        end: '2015-12-17T03:23:00.000Z',
                    },
                ],
                visibility: 'hidden',
            },
        },
        friends: [],
    },
];
