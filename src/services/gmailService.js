const { google } = require('googleapis');
const MailComposer = require('nodemailer/lib/mail-composer');

/**
 * Sends an email with an attachment using the Gmail API.
 * This function assumes authentication via Application Default Credentials.
 * The user must enable the Gmail API and grant domain-wide delegation to the service account
 * to send emails on behalf of a user in the domain.
 * @param {string} to - The recipient's email address.
 * @param {string} subject - The email subject.
 * @param {string} body - The email body (HTML).
 * @param {object} attachment - The attachment object { path, filename }.
 * @returns {Promise<void>}
 */
async function sendEmail(to, subject, body, attachment) {
    console.log('--- Calling Gmail Service: sendEmail ---');

    try {
        const auth = await google.auth.getClient({
            scopes: ['https://www.googleapis.com/auth/gmail.send'],
        });

        const gmail = google.gmail({ version: 'v1', auth });

        const mail = new MailComposer({
            to: to,
            subject: subject,
            html: body,
            attachments: [attachment],
        });

        const message = await mail.compile().build();
        const encodedMessage = Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

        await gmail.users.messages.send({
            userId: 'me', // 'me' refers to the authenticated user (or the user the service account is impersonating)
            resource: {
                raw: encodedMessage,
            },
        });

        console.log('--- Gmail Service: Email Sent Successfully ---');
    } catch (error) {
        console.error('Error calling Gmail API. Ensure API is enabled and permissions are granted.');
        console.error(error);
        // Log the error but don't throw, to allow the main workflow to continue.
    }
}

module.exports = { sendEmail };
