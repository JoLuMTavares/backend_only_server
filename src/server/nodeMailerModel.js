var nodemailer = require('nodemailer');

function sendMail(recipientAddress, subject, body) {
  var smtpConfig = {
    // host: 'smtp-relay.sendinblue.com',
    host: 'smtp-relay.brevo.com',
    port: 2525, /* or 25 */
    // port: 587,
    // port: 143,
    secure: false, // TLS requires secureConnection to be false
    auth: {
      user: 'joaoluism.tavares@gmail.com',
      pass: 'dD0GK9hkP5smn2JN'
    },
    tls: {
      ciphers:'SSLv3'
    }
  };

  var transporter = nodemailer.createTransport(smtpConfig);

  var mailOptions = {
    from: ` "Notes App" <notes.corp@notes-world.com>`,
    to: recipientAddress,
    subject: subject,
    text: body,
    html: body
  };

  transporter.sendMail(mailOptions, function(err, info) {
    if (err) console.log(err, 'mail was not sent or delivered');
  });
}
module.exports.sendMail = sendMail;
