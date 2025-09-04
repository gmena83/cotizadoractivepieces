// This service will be responsible for sending emails via Gmail.
// For now, it contains a placeholder function.

/**
 * Sends an email with an attachment.
 * @param {string} to - The recipient's email address.
 * @param {string} subject - The email subject.
 * @param {string} body - The email body (HTML).
 * @param {object} attachment - The attachment object { file, name }.
 * @returns {Promise<void>}
 */
async function sendEmail(to, subject, body, attachment) {
    console.log(`--- Calling Gmail Service: sendEmail (placeholder) ---`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    // In the future, this will use the googleapis client for Gmail.
    return Promise.resolve();
}

module.exports = { sendEmail };
