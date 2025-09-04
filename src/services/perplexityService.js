const axios = require('axios');

const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

/**
 * Performs a research query using the Perplexity AI API.
 * @param {string} prompt - The research prompt.
 * @returns {Promise<object>} The research results as a JSON object.
 */
async function performResearch(prompt) {
    console.log('--- Calling Perplexity AI Service: performResearch ---');

    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey) {
        console.log('Warning: PERPLEXITY_API_KEY not found. Returning mock data.');
        return { summary: "Mock research - Perplexity API Key not configured." };
    }

    try {
        const response = await axios.post(
            PERPLEXITY_API_URL,
            {
                model: "llama-3-sonar-large-32k-online",
                messages: [{ role: "user", content: prompt }],
            },
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        const content = response.data.choices[0].message.content;
        console.log('--- Perplexity AI Service: Research Completed Successfully ---');
        // The original prompts requested a JSON object in return.
        // A more robust implementation would use the extractJson helper.
        return JSON.parse(content);

    } catch (error) {
        console.error('Error calling Perplexity AI API:', error.response ? error.response.data : error.message);
        throw new Error('Failed to perform research with Perplexity AI.');
    }
}

module.exports = { performResearch };
