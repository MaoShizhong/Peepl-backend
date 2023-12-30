const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.GMAIL_ADDRESS,
        pass: process.env.GMAIL_APP_PW,
    },
});

/**
 *
 * @param {'passwordReset'|'accountDeletion'} type
 */
exports.sendEmailWithLink = (type, recipient, token) => {
    const requestedAction = type === 'passwordReset' ? 'A password reset' : 'Account deletion';
    const openPageText =
        type === 'passwordReset' ? 'set a new password' : 'confirm account deletion';
    const linkText =
        type === 'passwordReset' ? 'Password reset link' : 'Account deletion confirmation link';
    const route = type === 'passwordReset' ? 'password-reset' : 'delete-account';

    const mailOptions = {
        from: process.env.GMAIL_ADDRESS,
        to: recipient,
        subject: `[NO REPLY] ${requestedAction.replace('A p', 'P')} link`,
        html: `
        <html>
        <body style="text-align: center">
            <img src="cid:peeplLogo">
            <p>${requestedAction} has been requested for the Peepl account associated with this email.</p>
            <p>If you did not request ${requestedAction.toLowerCase()}, you may ignore and delete this email.</p>
            <br>
            <p>Click on the following link to open a page where you can ${openPageText}.</p>
            <p><a href="${
                process.env.MODE === 'dev' ? process.env.DEV_CLIENT : process.env.PROD_CLIENT
            }/${route}/${token}">${linkText}</a></p>
            <p>This link cannot be reused once opened and will expire 10 minutes after this email was sent.</p>
        </body>
        </html>
    `,
        attachments: [
            {
                filename: 'peepl-logo.png',
                path: `${__dirname}/peepl-logo.png`,
                cid: 'peeplLogo',
            },
        ],
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log(`${requestedAction.replace('A p', 'P')} email sent: ${info.response}`);
        }
    });
};
