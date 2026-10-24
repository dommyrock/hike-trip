// CSV reading shared by the data scripts (generate-explore.mjs,
// access-notes-report.mjs). Node built-ins only — runs in CI without npm install.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

export const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// explore CSV -> origin slug in src/data/trails.js (the Dolomites set joins Val Gardena's)
export const GROUP_ORIGIN = { dolomites: 'ortisei', austria: 'austria', switzerland: 'switzerland', germany: 'germany' };

// RFC 4180-ish: quoted fields, "" escapes, commas/newlines inside quotes
export function parseCSV(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') (cell += '"'), i++;
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') row.push(cell), (cell = '');
    else if (ch === '\n') row.push(cell), rows.push(row), (row = []), (cell = '');
    else if (ch !== '\r') cell += ch;
  }
  if (cell || row.length) row.push(cell), rows.push(row);
  const [head, ...body] = rows;
  // a blank line (e.g. an extra newline at EOF) is not a trail
  return body.filter((r) => r.some((c) => c.trim() !== '')).map((r) => Object.fromEntries(head.map((k, i) => [k, r[i] ?? ''])));
}

// rows of a CSV under the repo root
export const readCSV = (rel) => parseCSV(readFileSync(join(root, rel), 'utf8'));
