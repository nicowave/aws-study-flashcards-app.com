// Builds the link-preview images (1200x630) that LinkedIn, X, Slack and
// group chats show when someone shares a game or course site. Same look as
// public/og-image.png. Needs Google Chrome installed:
//   node scripts/build-share-images.mjs   -> public/og/<site>.png
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT = fileURLToPath(new URL('../public/og/', import.meta.url));

const SITES = [
  { id: 'cloud-practitioner', kicker: 'Foundational certification', title: 'AWS Certified<br>Cloud Practitioner', accent: 'Are you ready for the exam?', color: '#3fb950',
    chips: ['65-question timed practice exam', 'Quizzes', 'Flashcards'], host: 'cloud.aws-study-flashcards-app.com' },
  { id: 'ai-practitioner', kicker: 'Foundational certification', title: 'AWS Certified<br>AI Practitioner', accent: 'Are you ready for the exam?', color: '#58a6ff',
    chips: ['65-question timed practice exam', 'Quizzes', 'Flashcards'], host: 'ai.aws-study-flashcards-app.com' },
  { id: 'solutions-architect-associate', kicker: 'Associate certification', title: 'AWS Certified<br>Solutions Architect', accent: 'Are you ready for the exam?', color: '#d29922',
    chips: ['65-question timed practice exam', 'Quizzes', 'Flashcards'], host: 'architect.aws-study-flashcards-app.com' },
  { id: 'developer-associate', kicker: 'Associate certification', title: 'AWS Certified<br>Developer', accent: 'Are you ready for the exam?', color: '#a371f7',
    chips: ['65-question timed practice exam', 'Quizzes', 'Flashcards'], host: 'developer.aws-study-flashcards-app.com' },
  { id: 'bash', kicker: 'Coding course', title: 'Bash for AWS', accent: 'Automate the work you do by hand.', color: '#3fb950',
    chips: ['Runs in your browser', 'Nothing to install', 'First tutorial free'], host: 'bash.aws-study-flashcards-app.com', mono: '$ aws s3 sync ./backups s3://team-backups' },
  { id: 'python', kicker: 'Coding course', title: 'Python for AWS', accent: 'Real scripts for real AWS jobs.', color: '#58a6ff',
    chips: ['Runs in your browser', 'Nothing to install', 'First tutorial free'], host: 'python.aws-study-flashcards-app.com', mono: '>>> boto3.client("s3").list_buckets()' },
  { id: 'javascript', kicker: 'Coding course', title: 'JavaScript for AWS', accent: 'From a web page to a serverless app.', color: '#d29922',
    chips: ['Runs in your browser', 'Nothing to install', 'First tutorial free'], host: 'js.aws-study-flashcards-app.com', mono: 'await fetch("/api/status")' },
  { id: 'typescript', kicker: 'Coding course', title: 'TypeScript for AWS', accent: 'Catch the bug before it ships.', color: '#79c0ff',
    chips: ['Runs in your browser', 'Nothing to install', 'First tutorial free'], host: 'typescript.aws-study-flashcards-app.com', mono: 'app.ts(16,30): error TS2551' },
];

const page = (s) => `<!doctype html><html><head><meta charset="utf-8"><style>
  * { margin: 0; box-sizing: border-box; }
  html, body { width: 1200px; height: 630px; overflow: hidden; }
  body { background: radial-gradient(circle at 88% 8%, #1a2236 0, #0d1117 46%); color: #e6edf3;
    font-family: -apple-system, "Helvetica Neue", Arial, sans-serif; padding: 64px 80px; display: flex; flex-direction: column; }
  .brand { font-size: 30px; font-weight: 700; letter-spacing: -0.5px; }
  .brand b { color: #ff9900; }
  .kicker { margin-top: 38px; font-size: 22px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; color: ${s.color}; }
  h1 { margin-top: 12px; font-size: ${s.title.includes('<br>') ? 60 : 72}px; line-height: 1.06; font-weight: 800; letter-spacing: -1.5px; }
  .accent { margin-top: 18px; font-size: 34px; font-weight: 700; color: #58a6ff; }
  .mono { margin-top: 18px; font: 500 24px ui-monospace, Menlo, monospace; color: #8b949e; }
  .chips { margin-top: auto; display: flex; gap: 14px; }
  .chip { border: 2px solid ${s.color}; color: ${s.color}; background: #161b22; border-radius: 10px; padding: 10px 18px; font-size: 22px; font-weight: 600; }
  .foot { margin-top: 22px; font-size: 21px; font-weight: 600; color: #8b949e; }
</style></head><body>
  <div class="brand"><b>AWS</b> Study Hub</div>
  <div class="kicker">${s.kicker}</div>
  <h1>${s.title}</h1>
  <div class="accent">${s.accent}</div>
  ${s.mono ? `<div class="mono">${s.mono}</div>` : ''}
  <div class="chips">${s.chips.map((c) => `<span class="chip">${c}</span>`).join('')}</div>
  <div class="foot">${s.host} &nbsp;·&nbsp; Start free, no account needed</div>
</body></html>`;

const tmp = mkdtempSync(join(tmpdir(), 'og-'));
mkdirSync(OUT, { recursive: true });
for (const s of SITES) {
  const html = join(tmp, `${s.id}.html`);
  writeFileSync(html, page(s));
  execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
    '--window-size=1200,630', `--screenshot=${join(OUT, `${s.id}.png`)}`, `file://${html}`], { stdio: 'ignore' });
  console.log('og/' + s.id + '.png');
}
