// Builds the link-preview images (1200x630) that LinkedIn, X, Slack and
// group chats show when someone shares the hub, a game or a course site.
// Needs Google Chrome installed:
//   node scripts/build-share-images.mjs   -> public/og-image.png + public/og/<site>.png
// The brand line is the Level Up Study Hub lockup (public/brand/), never "AWS" in orange:
// AWS trademark rules forbid AWS in our product name and its logo look.
// After a change, bump ?v= on the og:image tags so link previews fetch the new picture.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT = fileURLToPath(new URL('../public/og/', import.meta.url));
const HUB_OUT = fileURLToPath(new URL('../public/og-image.png', import.meta.url));

// The lockup drawing is 804 x 84 units. Heights in steps of 14 px keep its 6-unit grid on whole pixels.
const LOCKUP = readFileSync(new URL('../public/brand/level-up-study-hub-horizontal-reverse.svg', import.meta.url), 'utf8');
const lockup = (h) => LOCKUP.replace(/ width="[\d.]+" height="[\d.]+"/, ` width="${804 * h / 84}" height="${h}"`);

const SITES = [
  { id: 'cloud-practitioner', kicker: 'Foundational certification', title: 'AWS Certified<br>Cloud Practitioner', accent: 'Are you ready for the exam?', color: '#22d3ee',
    chips: ['65-question timed practice exam', 'Quizzes', 'Flashcards'], host: 'cloud.levelupstudyhub.com' },
  { id: 'ai-practitioner', kicker: 'Foundational certification', title: 'AWS Certified<br>AI Practitioner', accent: 'Are you ready for the exam?', color: '#a78bfa',
    chips: ['65-question timed practice exam', 'Quizzes', 'Flashcards'], host: 'ai.levelupstudyhub.com' },
  { id: 'solutions-architect-associate', kicker: 'Associate certification', title: 'AWS Certified<br>Solutions Architect', accent: 'Are you ready for the exam?', color: '#f472b6',
    chips: ['65-question timed practice exam', 'Quizzes', 'Flashcards'], host: 'architect.levelupstudyhub.com' },
  { id: 'developer-associate', kicker: 'Associate certification', title: 'AWS Certified<br>Developer', accent: 'Are you ready for the exam?', color: '#60a5fa',
    chips: ['65-question timed practice exam', 'Quizzes', 'Flashcards'], host: 'developer.levelupstudyhub.com' },
  { id: 'bash', kicker: 'Coding course', title: 'Bash for AWS', accent: 'Automate the work you do by hand.', color: '#22d3ee',
    chips: ['Runs in your browser', 'Nothing to install', 'First tutorial free'], host: 'bash.levelupstudyhub.com', mono: '$ aws s3 sync ./backups s3://team-backups' },
  { id: 'python', kicker: 'Coding course', title: 'Python for AWS', accent: 'Real scripts for real AWS jobs.', color: '#a78bfa',
    chips: ['Runs in your browser', 'Nothing to install', 'First tutorial free'], host: 'python.levelupstudyhub.com', mono: '>>> boto3.client("s3").list_buckets()' },
  { id: 'javascript', kicker: 'Coding course', title: 'JavaScript for AWS', accent: 'From a web page to a serverless app.', color: '#f472b6',
    chips: ['Runs in your browser', 'Nothing to install', 'First tutorial free'], host: 'js.levelupstudyhub.com', mono: 'await fetch("/api/status")' },
  { id: 'typescript', kicker: 'Coding course', title: 'TypeScript for AWS', accent: 'Catch the bug before it ships.', color: '#60a5fa',
    chips: ['Runs in your browser', 'Nothing to install', 'First tutorial free'], host: 'typescript.levelupstudyhub.com', mono: 'app.ts(16,30): error TS2551' },
  // Old name until spanish.levelupstudyhub.com exists (docs/launch-tech-spanish.md)
  { id: 'tech-spanish', kicker: 'Course · Curso', title: 'Tech Spanish ↔<br>Tech English', accent: 'Talk tech in both languages.', color: '#f2a845',
    chips: ['Spanish and English', 'Flashcards both ways', 'Two modules free'], host: 'spanish.aws-study-flashcards-app.com', mono: '¿Ya mergeaste la PR? · LGTM' },
];

const page = (s) => `<!doctype html><html><head><meta charset="utf-8"><style>
  * { margin: 0; box-sizing: border-box; }
  html, body { width: 1200px; height: 630px; overflow: hidden; }
  body { background: radial-gradient(circle at 88% 8%, #2a1f55 0, #0b1220 46%); color: #f2f5f9;
    font-family: -apple-system, "Helvetica Neue", Arial, sans-serif; padding: 64px 80px; display: flex; flex-direction: column; }
  .brand svg { display: block; }
  .kicker { margin-top: 38px; font-size: 22px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; color: ${s.color}; }
  h1 { margin-top: 12px; font-size: ${s.title.includes('<br>') ? 60 : 72}px; line-height: 1.06; font-weight: 800; letter-spacing: -1.5px; }
  .accent { margin-top: 18px; font-size: 34px; font-weight: 700; background: linear-gradient(90deg, #8b5cf6, #ec4899, #22d3ee); -webkit-background-clip: text; background-clip: text; color: transparent; display: inline-block; align-self: flex-start; }
  .mono { margin-top: 18px; font: 500 24px ui-monospace, Menlo, monospace; color: #a3b1c6; }
  .chips { margin-top: auto; display: flex; gap: 14px; }
  .chip { border: 2px solid ${s.color}; color: ${s.color}; background: #121a2c; border-radius: 10px; padding: 10px 18px; font-size: 22px; font-weight: 600; }
  .foot { margin-top: 22px; font-size: 21px; font-weight: 600; color: #a3b1c6; }
</style></head><body>
  <div class="brand">${lockup(42)}</div>
  <div class="kicker">${s.kicker}</div>
  <h1>${s.title}</h1>
  <div class="accent">${s.accent}</div>
  ${s.mono ? `<div class="mono">${s.mono}</div>` : ''}
  <div class="chips">${s.chips.map((c) => `<span class="chip">${c}</span>`).join('')}</div>
  <div class="foot">${s.host} &nbsp;·&nbsp; Start free, no account needed</div>
</body></html>`;

// The hub's own picture (public/og-image.png): the brand is the biggest thing on it.
const CERTS = [['Cloud Practitioner', '#22d3ee'], ['AI Practitioner', '#a78bfa'], ['Solutions Architect', '#f472b6'], ['Developer', '#60a5fa']];
const hubPage = () => `<!doctype html><html><head><meta charset="utf-8"><style>
  * { margin: 0; box-sizing: border-box; }
  html, body { width: 1200px; height: 630px; overflow: hidden; }
  body { background: radial-gradient(circle at 88% 8%, #2a1f55 0, #0b1220 46%); color: #f2f5f9;
    font-family: -apple-system, "Helvetica Neue", Arial, sans-serif; padding: 72px 80px 52px; display: flex; flex-direction: column; }
  .brand svg { display: block; }
  h1 { margin-top: 40px; font-size: 50px; line-height: 1.12; font-weight: 800; letter-spacing: -1.2px; }
  h1 span { background: linear-gradient(90deg, #8b5cf6, #ec4899, #22d3ee); -webkit-background-clip: text; background-clip: text; color: transparent; display: inline-block; }
  .sub { margin-top: 18px; font-size: 25px; color: #a3b1c6; }
  .chips { margin-top: auto; display: flex; gap: 14px; }
  .chip { border: 2px solid; background: #121a2c; border-radius: 10px; padding: 10px 18px; font-size: 22px; font-weight: 600; }
  .more { margin-top: 22px; font-size: 24px; color: #a3b1c6; }
  .foot { margin-top: 14px; font-size: 21px; font-weight: 600; color: #a3b1c6; }
</style></head><body>
  <div class="brand">${lockup(70)}</div>
  <h1>Pass your AWS certification<br><span>the first time.</span></h1>
  <div class="sub">Practice exams, study guides, real world and exam prep to level up your career.</div>
  <div class="chips">${CERTS.map(([c, col]) => `<span class="chip" style="color:${col};border-color:${col}">${c}</span>`).join('')}</div>
  <div class="more">+ Bash, Python, JavaScript and TypeScript courses for AWS</div>
  <div class="foot">levelupstudyhub.com &nbsp;·&nbsp; Start free, no account needed</div>
</body></html>`;

const tmp = mkdtempSync(join(tmpdir(), 'og-'));
mkdirSync(OUT, { recursive: true });
const shoot = (name, html, out) => {
  const file = join(tmp, `${name}.html`);
  writeFileSync(file, html);
  // --disable-gpu: the software rasteriser draws smooth letter edges.
  execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
    '--window-size=1200,630', `--screenshot=${out}`, `file://${file}`], { stdio: 'ignore' });
};
shoot('hub', hubPage(), HUB_OUT);
console.log('og-image.png');
for (const s of SITES) {
  shoot(s.id, page(s), join(OUT, `${s.id}.png`));
  console.log('og/' + s.id + '.png');
}
