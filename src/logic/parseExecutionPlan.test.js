const { parseIdList, parseExecutionPlan } = require('./parseExecutionPlan');

describe('parseExecutionPlan', () => {
    // The most complex logic is in the parseIdList helper, which was the source of the original bug.
    // We will test it thoroughly.
    describe('parseIdList', () => {
        it('should handle a single ID', () => {
            expect(parseIdList("T1")).toEqual(["T1"]);
        });

        it('should handle a comma-separated list', () => {
            expect(parseIdList("T1,T2")).toEqual(["T1", "T2"]);
        });

        it('should handle a space-separated list', () => {
            expect(parseIdList("T1 T2")).toEqual(["T1", "T2"]);
        });

        it('should handle a slash-separated list', () => {
            expect(parseIdList("T1/T2")).toEqual(["T1", "T2"]);
        });

        it('should handle a hyphenated range', () => {
            expect(parseIdList("T1-3")).toEqual(["T1", "T2", "T3"]);
        });

        it('should handle an en-dash range', () => {
            expect(parseIdList("R5–7")).toEqual(["R5", "R6", "R7"]);
        });

        it('should handle mixed lists and ranges', () => {
            const result = parseIdList("T1, R2-4, X5");
            // sort for consistent comparison as Set order is not guaranteed
            result.sort();
            expect(result).toEqual(["R2", "R3", "R4", "T1", "X5"]);
        });

        it('should handle number-only input by defaulting to "T" prefix', () => {
            expect(parseIdList("123")).toEqual(["T123"]);
        });

        it('should return an empty array for invalid tokens', () => {
            expect(parseIdList("abc")).toEqual([]);
        });

        it('should handle empty string input', () => {
            expect(parseIdList("")).toEqual([]);
        });

        it('should handle messy input with extra spaces and duplicates', () => {
            const result = parseIdList(" T1, T2 , T1-2 ");
            result.sort();
            expect(result).toEqual(["T1", "T2"]);
        });
    });

    // Add a basic smoke test for the main exported function.
    it('should parse a markdown plan containing a Tasks table', async () => {
        const markdown = `
## Some Section
Some text here

## Tasks
| ID | Task           | Phase | Sprint | Owner Role | Effort (h) | Dependencies |
|----|----------------|-------|--------|------------|------------|--------------|
| T1 | Setup project  | 1     | S1     | Dev        | 8          |              |
| T2 | Design models  | 1     | S1     | Dev        | 16         | T1           |
| T3 | Build API      | 2     | S2     | Dev        | 24         | T2, T1       |

## Another Section
More text
        `;
        const result = await parseExecutionPlan({ planMd: markdown });
        expect(result.ok).toBe(true);
        expect(result.stats.taskCount).toBe(3);
        expect(result.tasks[1].title).toBe("Design models");
        expect(result.tasks[2].dependencies).toEqual(["T2", "T1"]);
    });

    it('should return an error for empty markdown input', async () => {
        const result = await parseExecutionPlan({ planMd: "" });
        expect(result.ok).toBe(false);
        expect(result.error).toBe('Empty planMd input.');
    });
});
