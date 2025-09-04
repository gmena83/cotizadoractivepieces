const { WebClient } = require('@slack/web-api');

// Initialize the Slack client with the bot token from environment variables
// The key is loaded from the .env file by dotenv in server.js
const web = new WebClient(process.env.SLACK_BOT_TOKEN);

/**
 * Sends a message to a Slack channel.
 * @param {string} channel - The channel ID to post to.
 * @param {string} text - The message text.
 * @returns {Promise<void>}
 */
async function sendMessage(channel, text) {
    console.log('--- Calling Slack Service: sendMessage ---');

    if (!process.env.SLACK_BOT_TOKEN || !channel) {
        console.log('Warning: SLACK_BOT_TOKEN or channel ID is missing. Skipping Slack message.');
        return;
    }

    try {
        await web.chat.postMessage({
            channel: channel,
            text: text,
        });
        console.log('--- Slack Service: Message Sent Successfully ---');
    } catch (error) {
        console.error('Error sending Slack message. Ensure the bot token is correct and the bot is in the channel.');
        console.error(error);
        // Log the error but don't throw, to allow the main workflow to continue.
    }
}

module.exports = { sendMessage };
