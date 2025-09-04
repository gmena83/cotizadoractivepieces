// Extracted and refactored from step_4 of the original workflow.
// This module parses the raw JSON output from an AI work plan generator.

// --- Helper Functions ---

function toStr(x) {
    if (typeof x === 'string') return x;
    try {
        return JSON.stringify(x ?? '');
    } catch {
        return String(x ?? '');
    }
}

/**
 * Robustly extracts a JSON object from a string which may be wrapped
 * in markdown code fences or have leading/trailing whitespace.
 */
function extractJson(s) {
    let jsonString = s.trim();

    // Case 1: Handle markdown code fences (e.g., ```json ... ```)
    const markdownMatch = jsonString.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
    if (markdownMatch) {
        jsonString = markdownMatch[1].trim();
    }

    // Case 2: Find the first top-level JSON object by balancing braces
    let depth = 0;
    let start = -1;
    for (let i = 0; i < jsonString.length; i++) {
        const ch = jsonString[i];
        if (ch === '{') {
            if (depth === 0) start = i;
            depth++;
        } else if (ch === '}') {
            depth--;
            if (depth === 0 && start !== -1) {
                const potentialJson = jsonString.slice(start, i + 1);
                try {
                    // Test if this slice is valid JSON
                    JSON.parse(potentialJson);
                    jsonString = potentialJson; // It is, so we use this as our definitive string
                    break;
                } catch {
                    // Ignore parsing errors and continue, as it might be a false positive
                }
            }
        }
    }

    try {
        return { parsed: JSON.parse(jsonString), raw: jsonString };
    } catch (e) {
        // Fallback for LLMs that wrap JSON in another JSON, e.g., { "response": "{...}" }
        try {
            const outer = JSON.parse(s.trim());
            if (outer && typeof outer.response === 'string') {
                return { parsed: JSON.parse(outer.response), raw: outer.response };
            }
        } catch { /* ignore secondary parsing errors */ }

        return { error: 'Unable to parse JSON from input.' };
    }
}


function asNum(x, d = 0) {
    const n = typeof x === 'number' ? x : Number(x);
    return Number.isFinite(n) ? n : d;
}

function cleanStrArray(x) {
    if (!Array.isArray(x)) return [];
    const out = x.map(v => (typeof v === 'string' ? v.trim() : String(v))).filter(Boolean);
    return Array.from(new Set(out));
}

function normalize(doc) {
    const phases = Array.isArray(doc?.WorkPlan) ? doc.WorkPlan.map((p) => ({
        phaseNumber: asNum(p?.phaseNumber, 0),
        phaseName: typeof p?.phaseName === 'string' ? p.phaseName : '',
        objectives: cleanStrArray(p?.objectives),
        deliverables: cleanStrArray(p?.deliverables),
        tasks: cleanStrArray(p?.tasks),
        ownerRoles: cleanStrArray(p?.ownerRoles),
        durationDays: asNum(p?.durationDays, 0),
        dependencies: cleanStrArray(p?.dependencies),
        risks: cleanStrArray(p?.risks),
        mitigations: cleanStrArray(p?.mitigations),
    })) : [];

    return {
        expertDescription: typeof doc?.expertDescription === 'string' ? doc.expertDescription : '',
        WorkPlan: phases,
        TechStack: cleanStrArray(doc?.TechStack),
        InputsRequired: cleanStrArray(doc?.InputsRequired),
        Assumptions: cleanStrArray(doc?.Assumptions),
        Exclusions: cleanStrArray(doc?.Exclusions),
        AcceptanceCriteria: cleanStrArray(doc?.AcceptanceCriteria),
        SuccessMetrics: cleanStrArray(doc?.SuccessMetrics),
        EstimatedEffort: {
            overallLevel: typeof doc?.EstimatedEffort?.overallLevel === 'string' ? doc.EstimatedEffort.overallLevel : '',
            byRole: Array.isArray(doc?.EstimatedEffort?.byRole) ?
                doc.EstimatedEffort.byRole.map((r) => ({ role: String(r?.role ?? ''), hours: asNum(r?.hours, 0) })) :
                [],
        },
    };
}


/**
 * Parses a raw AI-generated work plan, normalizes its structure, and enriches it with metadata.
 * @param {object} inputs - The input object, containing `executionPlanRaw` and other optional parameters.
 * @returns {Promise<object>} A structured work plan object.
 */
async function parseWorkPlan(inputs) {
    try {
        const rawText = toStr(inputs?.executionPlanRaw ?? '');
        const got = extractJson(rawText);
        if (got.error) {
            return {
                ok: false,
                error: got.error,
                sampleSnippet: rawText.slice(0, 400),
                hint: 'Map a STRING field from the AI step (e.g., response/content/text), not the whole step object.',
            };
        }

        const workdaysPerWeek = asNum(inputs?.workdaysPerWeek, 5);
        const hoursPerDay = asNum(inputs?.hoursPerDay, 8);
        const timeframeWeeks = asNum(inputs?.timeframeWeeks, 8);
        const maxDays = timeframeWeeks * 7;

        const doc = normalize(got.parsed);

        const totalDurationDays = doc.WorkPlan.reduce((a, b) => a + b.durationDays, 0);
        const totalTasks = doc.WorkPlan.reduce((a, b) => a + b.tasks.length, 0);

        const byRole = doc.EstimatedEffort.byRole.filter(r => r.role && Number.isFinite(r.hours));
        const totalHours = byRole.reduce((a, b) => a + b.hours, 0);

        const techStack = Array.from(new Set(doc.TechStack));

        const summaryLine = `Plan listo: ${doc.WorkPlan.length} fases, ${totalDurationDays} días, ` +
            `${totalTasks} tareas, esfuerzo ~${totalHours} h. ` +
            (techStack.length ? `Tech: ${techStack.slice(0, 6).join(', ')}${techStack.length > 6 ? ', ...' : ''}.` : '');

        return {
            ok: true,
            workplan: doc,
            summaryLine,
            rawUsed: got.raw ?? '',
        };

    } catch (e) {
        return {
            ok: false,
            error: e.message ?? String(e)
        };
    }
}

module.exports = { parseWorkPlan };
