var nodemailer = require('nodemailer');

const mail = {
    host: 'smtp.gmail.com',
    port: 587,
    auth: {
        user: process.env.MAILER_EMAIL,
        pass: process.env.MAILER_PASSWORD,
    },
    // sendmail: true,
    // newline: 'unix',
    // path: '/usr/sbin/sendmail'
};

var account = nodemailer.createTransport(mail);

async function sendMail(email, message, url) {
    var subject = '';
    if ( message.includes('email') )
        subject = 'matcha - Confirm email';
    else if ( message.includes('password') )
        subject = 'matcha - Reset password';
    else
        subject = message;

    let options = {
        "from": '"matcha" <matcha@1337.ma>',
        "to": email,
        "subject": subject,
        "html": `<a href='http://${url}'>${message}</a>`
    };
    try {
        account.sendMail(options, (error, info) => {
            if (error) {
                throw error;
            }
        }); 
    } catch (e) {
        throw new Error("failed to send email")
    }
}

module.exports = {
    sendMail
}