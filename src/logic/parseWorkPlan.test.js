const { parseWorkPlan } = require('./parseWorkPlan');

describe('parseWorkPlan', () => {
    const mockPlan = {
        expertDescription: "A great plan",
        WorkPlan: [{
            phaseNumber: 1,
            phaseName: "Discovery",
            objectives: ["Objective 1"],
            deliverables: ["Deliverable 1"],
            tasks: ["Task 1"],
            ownerRoles: ["PM"],
            durationDays: 5,
            dependencies: [],
            risks: [],
            mitigations: []
        }],
        TechStack: ["Node.js", "Jest"],
        InputsRequired: [],
        Assumptions: [],
        Exclusions: [],
        AcceptanceCriteria: [],
        SuccessMetrics: [],
        EstimatedEffort: {
            overallLevel: "S",
            byRole: [{ role: "Engineer", hours: 40 }]
        }
    };

    it('should parse a raw JSON string correctly', async () => {
        const payload = { executionPlanRaw: JSON.stringify(mockPlan) };
        const result = await parseWorkPlan(payload);
        expect(result.ok).toBe(true);
        expect(result.workplan.expertDescription).toBe("A great plan");
        expect(result.workplan.WorkPlan[0].phaseName).toBe("Discovery");
    });

    it('should parse JSON wrapped in markdown fences', async () => {
        const rawString = `\`\`\`json\n${JSON.stringify(mockPlan, null, 2)}\n\`\`\``;
        const payload = { executionPlanRaw: rawString };
        const result = await parseWorkPlan(payload);
        expect(result.ok).toBe(true);
        expect(result.workplan.TechStack).toEqual(["Node.js", "Jest"]);
    });

    it('should extract JSON from a string with leading/trailing text by finding the braces', async () => {
        const rawString = `Here is the plan:\n${JSON.stringify(mockPlan)}\nLet me know what you think.`;
        const payload = { executionPlanRaw: rawString };
        const result = await parseWorkPlan(payload);
        expect(result.ok).toBe(true);
        expect(result.workplan.WorkPlan.length).toBe(1);
    });

    it('should handle malformed JSON gracefully', async () => {
        const rawString = `{"expertDescription": "A plan", "WorkPlan": [}}`; // Malformed
        const payload = { executionPlanRaw: rawString };
        const result = await parseWorkPlan(payload);
        expect(result.ok).toBe(false);
        expect(result.error).toBe('Unable to parse JSON from input.');
    });

    it('should generate a summary line', async () => {
        const payload = { executionPlanRaw: JSON.stringify(mockPlan) };
        const result = await parseWorkPlan(payload);
        expect(result.summaryLine).toContain('1 fases');
        expect(result.summaryLine).toContain('5 días');
        expect(result.summaryLine).toContain('1 tareas');
        expect(result.summaryLine).toContain('~40 h');
        expect(result.summaryLine).toContain('Tech: Node.js, Jest');
    });
});
