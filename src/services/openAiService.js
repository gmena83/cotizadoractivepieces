const { OpenAI } = require('openai');

// Initialize the OpenAI client with the API key from environment variables
// The key is loaded from the .env file by dotenv in server.js
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generates a client proposal using OpenAI's GPT model.
 * @param {object} promptData - An object containing all the necessary data for the prompt.
 * @returns {Promise<object>} The generated proposal as a JSON object.
 */
async function generateClientProposal(promptData) {
    console.log('--- Calling OpenAI Service: generateClientProposal ---');

    if (!process.env.OPENAI_API_KEY) {
        console.log('Warning: OPENAI_API_KEY not found. Returning mock data.');
        // Return a mock response if the key is not set, to allow the workflow to continue.
        return {
            proposal: {
                executiveSummary: "This is a mock proposal because the OpenAI API key is not configured.",
                // other fields would go here
            }
        };
    }

    // In a real implementation, we would read the detailed prompt from `src/prompts/clientProposalPrompt.txt`
    // and inject the various parts of promptData into it.
    // For now, we use a simplified prompt to test the API call itself.
    const simplifiedPrompt = `
        Based on the following data, generate a project proposal.
        Client Name: ${promptData?.clientData?.nombre_cliente || 'N/A'}
        Company: ${promptData?.clientData?.empresa_cliente || 'N/A'}
        Work Plan Summary: ${promptData?.workPlan?.summaryLine || 'N/A'}

        Return a valid JSON object with a single root key "proposal", which contains the full proposal structure.
        Example: { "proposal": { "executiveSummary": "...", "timeline": "..." } }
    `;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4-turbo",
            messages: [{ role: "user", content: simplifiedPrompt }],
            response_format: { type: "json_object" },
        });

        const content = response.choices[0].message.content;
        console.log('--- OpenAI Service: Proposal Generated Successfully ---');
        return JSON.parse(content);

    } catch (error) {
        console.error('Error calling OpenAI API:', error);
        // It's better to throw the error so the main workflow can handle it.
        throw new Error('Failed to generate proposal from OpenAI.');
    }
}

module.exports = { generateClientProposal };
