const { userIDs } = require('./test_IDs');
const { generateUsername } = require('unique-username-generator');

exports.users = [
    {
        _id: userIDs[0],
        handle: generateUsername('-', 6),
        email: 'user0@test.com',
        auth: { strategies: ['local'], password: 'asdfASDF0' },
        details: {
            firstName: 'First0',
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
        _id: userIDs[1],
        handle: generateUsername('-', 6),
        email: 'user1@test.com',
        auth: { strategies: ['local'], password: 'asdfASDF1' },
        details: {
            firstName: 'First1',
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
        _id: userIDs[2],
        handle: generateUsername('-', 6),
        email: 'user2@test.com',
        auth: { strategies: ['local'], password: 'asdfASDF2' },
        details: {
            firstName: 'First2',
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
        _id: userIDs[3],
        handle: generateUsername('-', 6),
        email: 'user3@test.com',
        auth: { strategies: ['local'], password: 'asdfASDF3' },
        details: {
            firstName: 'First3',
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
    {
        _id: userIDs[4],
        handle: generateUsername('-', 6),
        email: 'edit@edit.com',
        auth: { strategies: ['local'], password: 'asdfASDF4' },
        details: {
            firstName: 'FirstEdit',
            lastName: 'LastEdit',
            DOB: {
                value: '1995-12-17T03:20:00.000Z',
                visibility: 'everyone',
            },
            city: {
                value: 'Editcity',
                visibility: 'everyone',
            },
            country: {
                value: 'Editcountry',
                visibility: 'everyone',
            },
            employment: {
                value: [
                    {
                        title: 'Editor',
                        company: 'Edit Ltd',
                        start: '2015-12-17T03:23:00.000Z',
                        end: null
                    },
                ],
                visibility: 'everyone',
            },
            education: {
                value: [
                    {
                        institution: 'Edit Secondary School',
                        start: '2000-12-17T03:23:00.000Z',
                        end: '2015-12-17T03:23:00.000Z',
                    },
                ],
                visibility: 'everyone',
            },
        },
        friends: [],
    },
    {
        _id: userIDs[5],
        handle: generateUsername('-', 6),
        email: 'image@image.com',
        auth: { strategies: ['local'], password: 'asdfASDF5' },
        details: {
            firstName: 'FirstImage',
            lastName: 'LastImage',
            DOB: {
                value: '1995-12-17T03:20:00.000Z',
                visibility: 'everyone',
            },
            city: {
                value: 'Imagecity',
                visibility: 'everyone',
            },
            country: {
                value: 'Imagecountry',
                visibility: 'everyone',
            },
            employment: {
                value: [
                    {
                        title: 'Imager',
                        company: 'Image Ltd',
                        start: '2015-12-17T03:23:00.000Z',
                        end: null
                    },
                ],
                visibility: 'everyone',
            },
            education: {
                value: [
                    {
                        institution: 'Image Secondary School',
                        start: '2000-12-17T03:23:00.000Z',
                        end: '2015-12-17T03:23:00.000Z',
                    },
                ],
                visibility: 'everyone',
            },
        },
        friends: [],
    },
];
