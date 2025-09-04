const express = require('express');
const path = require('path');

// --- Logic Modules ---
const { parseClientData } = require('../logic/parseClientData');
const { parseWorkPlan } = require('../logic/parseWorkPlan');
const { parseExecutionPlan } = require('../logic/parseExecutionPlan');
const { getCurrentDate } = require('../logic/getCurrentDate');

// --- Service Wrappers ---
const { generateClientProposal } = require('../services/openAiService');
const { generateWorkPlan, formatProposalAsHtml } = require('../services/googleGeminiService');
const { performResearch } = require('../services/perplexityService');
const { generateExecutionPlan } = require('../services/claudeService');
const { createPdf } = require('../services/pdfService');
const { sendMessage } = require('../services/slackService');
const { insertRow } = require('../services/googleSheetsService');
const { sendEmail } = require('../services/gmailService');

const app = express();
const port = 3000;

app.use(express.json());
// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, '../../public')));


// A simple root route to serve the frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/index.html'));
});

// The main API endpoint for the cotizador
app.post('/api/cotizador', async (req, res) => {
    console.log('--- Workflow Started ---');
    const { requestBody } = req.body;

    if (!requestBody) {
        return res.status(400).json({ error: 'requestBody is missing' });
    }

    try {
        // 1. Parse client data from the initial request (from step_7)
        const clientData = await parseClientData({ payload: requestBody });
        console.log('Step 1/14: Parsed Client Data:', clientData);

        // 2. Get current date (from step_17)
        const currentDate = getCurrentDate();
        console.log('Step 2/14: Got Current Date:', currentDate);

        // 3. Generate Work Plan (from step_2)
        const workPlanRaw = await generateWorkPlan({ message: requestBody });
        console.log('Step 3/14: Generated Work Plan (raw)');

        // 4. Parse the Work Plan (from step_4)
        const workPlan = await parseWorkPlan({ executionPlanRaw: workPlanRaw });
        console.log('Step 4/14: Parsed Work Plan');

        // 5. Perform research (from steps 18, 5, 6) - simplified to 3 calls
        const industryChallenges = await performResearch('...');
        console.log('Step 5/14: Performed Industry Research');
        const communityView = await performResearch('...');
        console.log('Step 6/14: Performed Community Research');
        const marketView = await performResearch('...');
        console.log('Step 7/14: Performed Market Research');

        // 8. Generate Client Proposal (from step_9)
        const proposal = await generateClientProposal({ clientData, workPlan, industryChallenges, communityView, marketView });
        console.log('Step 8/14: Generated Client Proposal');

        // 9. Format proposal as HTML (from step_10)
        const proposalHtml = await formatProposalAsHtml(proposal);
        console.log('Step 9/14: Formatted Proposal as HTML');

        // 10. Create PDF from HTML (from step_12)
        const pdfPath = path.join(__dirname, 'temp_proposal.pdf'); // temp path
        await createPdf(proposalHtml, pdfPath);
        console.log('Step 10/14: Created PDF');

        // 11. Generate Execution Plan (from step_15)
        const executionPlanMd = await generateExecutionPlan({ workPlan, proposal });
        console.log('Step 11/14: Generated Execution Plan (Markdown)');

        // 12. Parse Execution Plan (from step_14)
        const executionPlan = await parseExecutionPlan({ planMd: executionPlanMd });
        console.log('Step 12/14: Parsed Execution Plan');

        // 13. Send notifications (steps 3, 11, 16)
        await sendMessage('C096JQX0PNE', `Cotización lista para ${clientData.nombre_cliente}`);
        console.log('Step 13/14: Sent Slack Notification');

        await insertRow('1JpNaALQOdaft_dv9US4ED6CgN1rnpOMAenRZ57BcyiU', { A: clientData.nombre_cliente });
        console.log('Step 14/14: Inserted row in Google Sheets');

        // Final email step is commented out as it requires a real file path and is the last step.
        // await sendEmail(clientData.email_cliente, 'Su cotización está lista', proposalHtml, { file: pdfPath, name: 'Proposal.pdf' });
        // console.log('Step 15/15: Sent final email');

        console.log('--- Workflow Finished Successfully ---');
        res.json({ success: true, message: 'Workflow completed successfully! (using placeholder data)' });

    } catch (error) {
        console.error('--- Workflow Failed ---');
        console.error(error);
        res.status(500).json({ success: false, error: 'An error occurred during the workflow.' });
    }
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
