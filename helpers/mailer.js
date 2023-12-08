const formData = require('form-data');
const Mailgun = require('mailgun.js');
const config = require('../config/config.js');


const mailgun = new Mailgun(formData);
const mg = mailgun.client({ username: 'api', key: config.mailConfig.apiKey });

const sendEmail = (to, subject, html) => {
    return mg.messages.create(config.mailConfig.domain, {
        from: config.mailConfig.fromEmail,
        to: to,
        subject: subject,
        html: html
    });
}

module.exports = {
    sendEmail
};