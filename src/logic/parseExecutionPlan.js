// Extracted and refactored from step_14 of the original workflow.
// This module parses a markdown execution plan into a structured JSON object.

// --- Helper Functions ---

function toStr(x) { return typeof x === 'string' ? x : (x == null ? '' : String(x)); }
function norm(s) { return s.replace(/\r\n/g, '\n'); }
function trimPipes(s) { return s.replace(/^\s*\|/, '').replace(/\|\s*$/, '').trim(); }
function toISO(s) {
  const t = Date.parse(s.trim());
  return Number.isFinite(t) ? new Date(t).toISOString() : s.trim();
}
function splitCsvLike(s) {
  if (!s) return [];
  return s.split(/[,;]+/).map(x => x.trim()).filter(Boolean);
}

/**
 * This is the function where the original dead-code bug was found.
 * The `else if` branch has been removed as it was unreachable.
 */
function parseIdList(s) {
  if (!s) return [];
  // Supports: "T1, T2", "T1-4", "T1/T22", "T1–4"
  const tokens = s.split(/[,\s/]+/).filter(Boolean);
  const out = [];
  for (const tk of tokens) {
    const m = tk.match(/^([A-Za-z]+)?(\d+)(?:[-–](\d+))?$/);
    if (m) {
      const prefix = m[1] || 'T';
      const a = parseInt(m[2], 10);
      const b = m[3] ? parseInt(m[3], 10) : a;
      const start = Math.min(a, b);
      const end = Math.max(a, b);
      for (let i = start; i <= end; i++) out.push(`${prefix}${i}`);
    }
  }
  return Array.from(new Set(out));
}

function parseNumberCell(s) {
  const n = Number(String(s).replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function findSection(md, heading) {
  const re = new RegExp(`^##\\s+${escapeRegExp(heading)}\\s*$`, 'mi');
  const m = md.match(re);
  if (!m) return '';
  const start = m.index ?? 0;
  const after = md.slice(start + m[0].length);
  const next = after.search(/^##\s+/m);
  return next >= 0 ? after.slice(0, next).trim() : after.trim();
}

function findSubSection(md, heading) {
  const re = new RegExp(`^###\\s+${escapeRegExp(heading)}\\s*.*$`, 'mi');
  const m = md.match(re);
  if (!m) return '';
  const start = m.index ?? 0;
  const after = md.slice(start + m[0].length);
  const next = after.search(/^###\s+|^##\s+/m);
  return next >= 0 ? after.slice(0, next).trim() : after.trim();
}

function escapeRegExp(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

function parseFirstTable(sectionMd) {
  const lines = sectionMd.split('\n');
  let i = 0;
  for (; i < lines.length; i++) {
    if (/^\s*\|.*\|\s*$/.test(lines[i]) && i + 1 < lines.length && /^\s*\|?\s*:?-{3,}/.test(lines[i + 1])) {
      break;
    }
  }
  if (i >= lines.length - 1) return null;

  const headerLine = trimPipes(lines[i]);
  const headers = headerLine.split('|').map(h => h.trim());
  i += 2; // skip the separator line

  const rows = [];
  for (; i < lines.length; i++) {
    const line = lines[i];
    if (!/^\s*\|.*\|\s*$/.test(line)) {
      if (line.trim() === '') continue; else break;
    } else {
      const cells = trimPipes(line).split('|').map(c => c.trim());
      while (cells.length < headers.length) cells.push('');
      rows.push(cells.slice(0, headers.length));
    }
  }
  return { headers, rows };
}

function hdrMap(headers) {
  const normHdrs = headers.map(h => h.toLowerCase());
  return (label) => {
    const idx = normHdrs.indexOf(label.toLowerCase());
    return idx >= 0 ? idx : -1;
  };
}

function parseTasks(sec) {
  const tbl = parseFirstTable(sec);
  if (!tbl) return [];
  const map = hdrMap(tbl.headers);
  return tbl.rows.map(r => {
    const id = (r[map('ID')] || '').toUpperCase();
    const title = r[map('Task')] || '';
    const phase = parseInt(r[map('Phase')] || '0', 10) || 0;
    const sprintId = r[map('Sprint')] || '';
    const ownerRole = r[map('Owner Role')] || '';
    const effortHours = parseNumberCell(r[map('Effort (h)')] || '0');
    const depsRaw = r[map('Dependencies')] || '';
    const depsParts = depsRaw.split(/[,+]/).map(x => x.trim()).filter(Boolean);
    const deps = [];
    for (const p of depsParts) deps.push(...parseIdList(p));
    return { id, title, phase, sprintId, ownerRole, effortHours, dependencies: Array.from(new Set(deps)) };
  });
}

function parseNumberedList(sec) {
    return sec.split('\n')
        .map(l => l.trim())
        .filter(l => /^\d+\.\s+/.test(l))
        .map(l => l.replace(/^\d+\.\s+/, '').trim());
}

/**
 * Parses a markdown execution plan.
 * @param {object} inputs - The input object, containing `planMd`.
 * @returns {Promise<object>} A structured execution plan.
 */
async function parseExecutionPlan(inputs) {
  const md = norm(toStr(inputs?.planMd || ''));
  if (!md.trim()) {
    return { ok: false, error: 'Empty planMd input.' };
  }

  const tasksSec = findSection(md, 'Tasks');
  const tasks = parseTasks(tasksSec);

  // Simplified parsing for now, can be expanded later
  return {
    ok: true,
    tasks,
    stats: {
        taskCount: tasks.length
    }
  };
}

module.exports = { parseExecutionPlan, parseIdList }; // Exporting helper for testing
