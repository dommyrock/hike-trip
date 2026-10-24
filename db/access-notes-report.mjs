// Markdown checklist for the twice-yearly access-note re-check (fees,
// closures, bookings change every season). Printed to stdout; the scheduled
// workflow .github/workflows/access-notes-recheck.yml turns it into an issue.
//   node db/access-notes-report.mjs > report.md
import { GROUP_ORIGIN, readCSV } from './csv.mjs';

const now = new Date();
const monthsSince = (ym) => {
  const [y, m] = ym.split('-').map(Number);
  return (now.getFullYear() - y) * 12 + (now.getMonth() + 1 - m);
};

const out = [
  'Twice-yearly check of the Explore set (data/explore/*.csv) — fees, closures, booking rules and huts change every season.',
  '',
  'For each trail: confirm the `access_note` still holds (official tourism / park / hut sites first), update or clear it, and set `access_note_as_of` to the month you checked (`YYYY-MM`). Trails without a note: look for anything new (a fee, a closure, a booking requirement). Then `npm run explore:gen && npm run db:seed:gen && npm run db:apply:remote && npm run deploy`.',
  '',
];
let noted = 0;
for (const group of Object.keys(GROUP_ORIGIN)) {
  const rows = readCSV(`data/explore/${group}.csv`);
  out.push(`### ${group[0].toUpperCase() + group.slice(1)} (${rows.length})`, '');
  for (const r of rows) {
    if (r.access_note) {
      noted++;
      // a note without a valid YYYY-MM (the generator refuses one) says so
      // rather than printing "as of " with a NaN age
      const asOf = /^\d{4}-(0[1-9]|1[0-2])$/.test(r.access_note_as_of) ? r.access_note_as_of : null;
      const age = asOf ? monthsSince(asOf) : null;
      out.push(
        `- [ ] **${r.name}** (\`${r.slug}\`) — ${r.access_note} _(${
          asOf ? `as of ${asOf}${age >= 6 ? `, ${age} months old` : ''}` : 'no valid access_note_as_of — set it'
        })_`
      );
    } else out.push(`- [ ] ${r.name} (\`${r.slug}\`) — no note`);
  }
  out.push('');
}
out.splice(4, 0, `${noted} trails carry a note today.`, '');
console.log(out.join('\n'));
