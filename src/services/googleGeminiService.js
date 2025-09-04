const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize the Google Gemini client with the API key from environment variables
// The key is loaded from the .env file by dotenv in server.js
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);

/**
 * Generates a work plan using the Google Gemini API.
 * @param {object} promptData - The data for the prompt.
 * @returns {Promise<object>} The generated work plan as a JSON object.
 */
async function generateWorkPlan(promptData) {
    console.log('--- Calling Google Gemini Service: generateWorkPlan ---');

    if (!process.env.GOOGLE_GEMINI_API_KEY) {
        console.log('Warning: GOOGLE_GEMINI_API_KEY not found. Returning mock data.');
        return { expertDescription: "Mock work plan - Google API Key not configured." };
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        // In a real implementation, we would read the detailed prompt from `src/prompts/workPlanPrompt.txt`
        const simplifiedPrompt = `Generate a work plan for a project with this request: ${promptData.message}. Return a valid JSON object with an "expertDescription" key and a "WorkPlan" array.`;

        const result = await model.generateContent(simplifiedPrompt);
        const response = await result.response;
        const text = response.text();

        // The original prompt asks for a bare JSON object, so we parse it.
        // A real implementation would use the more robust extractJson helper from parseWorkPlan.js
        console.log('--- Google Gemini Service: Work Plan Generated Successfully ---');
        return JSON.parse(text);

    } catch (error) {
        console.error('Error calling Google Gemini API for work plan:', error);
        throw new Error('Failed to generate work plan from Google Gemini.');
    }
}

/**
 * Renders a proposal object into an HTML string using the Google Gemini API.
 * @param {object} proposalJson - The proposal object to be rendered.
 * @returns {Promise<string>} The generated HTML string.
 */
async function formatProposalAsHtml(proposalJson) {
    console.log('--- Calling Google Gemini Service: formatProposalAsHtml ---');

    if (!process.env.GOOGLE_GEMINI_API_KEY) {
        console.log('Warning: GOOGLE_GEMINI_API_KEY not found. Returning mock data.');
        return `<h1>Mock Proposal</h1><p>Google API Key not configured.</p>`;
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        // In a real implementation, we would read the detailed prompt from `src/prompts/htmlFormatPrompt.txt`
        const simplifiedPrompt = `Format this JSON as a complete HTML document: ${JSON.stringify(proposalJson)}. Return only the HTML code, starting with <!DOCTYPE html>.`;

        const result = await model.generateContent(simplifiedPrompt);
        const response = await result.response;
        const text = response.text();

        console.log('--- Google Gemini Service: HTML Formatted Successfully ---');
        return text;

    } catch (error) {
        console.error('Error calling Google Gemini API for HTML formatting:', error);
        throw new Error('Failed to format proposal as HTML from Google Gemini.');
    }
}

module.exports = { generateWorkPlan, formatProposalAsHtml };
