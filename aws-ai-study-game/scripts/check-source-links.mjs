// Opens every source URL cited by the AI Practitioner questions, flashcards and study guide and
// reports any that no longer load. Why: AWS moves and retires doc pages, and a dead link
// makes a "verified" answer look unverified. Needs the network, so it is not part of
// `npm test`. Run: npm run check-links
// (vite-node runs it so the data files' extensionless imports resolve like in the app.)
import { getAllQuestions } from '../src/data/index.js';
import { getAllDecks } from '../src/data/flashcards/index.js';
import { studyGuides } from '../src/data/studyGuide/index.js';

const items = [
  ...getAllQuestions().map((q) => ({ id: `${q.domain}/${q.id}`, sources: q.sources })),
  ...getAllDecks().flatMap((d) => d.cards.map((c) => ({ id: `${d.id}/${c.id}`, sources: c.sources }))),
  ...studyGuides.flatMap((g) => g.sections.map((s) => ({ id: `guide-${g.id}/${s.id}`, sources: s.sources }))),
];

// url -> ids that cite it, so each page is fetched once
const citedBy = new Map();
for (const item of items) {
  for (const s of item.sources ?? []) {
    if (!citedBy.has(s.url)) citedBy.set(s.url, []);
    citedBy.get(s.url).push(item.id);
  }
}

async function check(url) {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url, { redirect: 'follow', headers: { 'User-Agent': 'study-hub-link-check' } });
      const moved = res.url.replace(/#.*$/, '') !== url.replace(/#.*$/, '');
      return { url, status: res.status, finalUrl: moved ? res.url : null };
    } catch (e) {
      // Retry network blips once before calling the link broken
      if (attempt >= 2) return { url, status: 0, error: e.cause?.code ?? e.message };
    }
  }
}

const urls = [...citedBy.keys()];
const results = [];
const queue = [...urls];
await Promise.all(Array.from({ length: 6 }, async () => {
  while (queue.length) results.push(await check(queue.shift()));
}));

const broken = results.filter((r) => r.status !== 200);
const moved = results.filter((r) => r.status === 200 && r.finalUrl);

console.log(`Checked ${urls.length} unique source URLs cited by ${items.length} items.`);
for (const r of moved) console.log(`MOVED  ${r.url}\n    -> ${r.finalUrl}\n    cited by ${citedBy.get(r.url).join(', ')}`);
for (const r of broken) console.log(`BROKEN ${r.status || r.error} ${r.url}\n    cited by ${citedBy.get(r.url).join(', ')}`);
if (broken.length) {
  console.log(`\n${broken.length} broken link(s). Find the page's new address, re-read it, and update the source and its checked date.`);
  process.exit(1);
}
console.log(moved.length ? 'No broken links; consider updating the moved ones.' : 'All links load.');
