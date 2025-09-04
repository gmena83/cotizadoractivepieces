const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Generates an execution plan using the Claude API.
 * @param {object} promptData - The data for the prompt.
 * @returns {Promise<string>} The generated execution plan as a Markdown string.
 */
async function generateExecutionPlan(promptData) {
    console.log('--- Calling Anthropic Claude Service: generateExecutionPlan ---');

    if (!process.env.ANTHROPIC_API_KEY) {
        console.log('Warning: ANTHROPIC_API_KEY not found. Returning mock data.');
        return "# Mock Execution Plan\n\n- Anthropic API Key not configured.";
    }

    try {
        // In a real implementation, we would use the detailed prompt from `src/prompts/executionPlanPrompt.txt`
        const simplifiedPrompt = `Generate an execution plan in Markdown based on this proposal: ${JSON.stringify(promptData.proposal, null, 2)}.`;

        const response = await anthropic.messages.create({
            model: "claude-3-sonnet-20240229",
            max_tokens: 4096, // Increased token limit for potentially long plans
            messages: [{ role: "user", content: simplifiedPrompt }],
        });

        const content = response.content[0].text;
        console.log('--- Anthropic Claude Service: Execution Plan Generated Successfully ---');
        // The original workflow expects a markdown string from this step.
        return content;

    } catch (error) {
        console.error('Error calling Anthropic Claude API:', error);
        throw new Error('Failed to generate execution plan from Anthropic Claude.');
    }
}

module.exports = { generateExecutionPlan };
