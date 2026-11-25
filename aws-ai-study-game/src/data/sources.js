// Rules for the `sources` field on every question and flashcard.
// Why: a study answer is only trustworthy if a learner (or we) can open the AWS page that
// backs it, and AWS changes services and limits, so every source carries the date we last
// checked it. sources.test.js enforces these rules; `npm run check-links` checks the URLs live.
//
// Shape: sources: [{ title, url, checked: 'YYYY-MM-DD' }]

// Only AWS's own sites count as official.
export const OFFICIAL_SOURCE_HOSTS = ['docs.aws.amazon.com', 'aws.amazon.com', 'd1.awsstatic.com'];

// A source older than this must be re-read and its `checked` date updated.
export const MAX_SOURCE_AGE_DAYS = 365;

const DAY_MS = 24 * 60 * 60 * 1000;

// Returns a list of plain-English problems with one item's sources ([] means it's fine).
export function sourceProblems(item, today = new Date()) {
  const sources = item.sources;
  if (!Array.isArray(sources) || sources.length === 0) return ['has no sources'];

  const problems = [];
  sources.forEach((s, i) => {
    const where = `source ${i + 1}`;
    if (!s || typeof s !== 'object') return problems.push(`${where} is not an object`);
    if (typeof s.title !== 'string' || !s.title.trim()) problems.push(`${where} has no title`);

    let url;
    try { url = new URL(s.url); } catch { problems.push(`${where} has an invalid url`); }
    if (url) {
      if (url.protocol !== 'https:') problems.push(`${where} is not https`);
      if (!OFFICIAL_SOURCE_HOSTS.includes(url.hostname)) problems.push(`${where} is not an official AWS site (${url.hostname})`);
    }

    // Parse as a calendar date so time zones can't shift it by a day
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.checked ?? '');
    const checked = m && new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    if (!checked || checked.getUTCDate() !== +m[3]) {
      problems.push(`${where} needs checked: 'YYYY-MM-DD'`);
    } else {
      const ageDays = Math.floor((today.getTime() - checked.getTime()) / DAY_MS);
      if (ageDays < -1) problems.push(`${where} is checked in the future (${s.checked})`);
      if (ageDays > MAX_SOURCE_AGE_DAYS) problems.push(`${where} was last checked ${s.checked}, more than ${MAX_SOURCE_AGE_DAYS} days ago: re-read it`);
    }
  });

  const urls = sources.map((s) => s?.url);
  if (new Set(urls).size !== urls.length) problems.push('lists the same url twice');
  return problems;
}
