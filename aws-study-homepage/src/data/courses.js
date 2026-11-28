// The four coding course sites. Plain data, so the build (vite.config.js) can
// also read it for the page crawlers see. Bought as `<id>-for-aws` (the purchase
// id in the token's `certs`); prices come from src/data/prices.js.
export const COURSES = [
  { id: 'bash', title: 'Bash for AWS', url: 'https://bash.levelupstudyhub.com', mark: '$_', color: '#89d185',
    blurb: 'Health checks, log digging, backups to Amazon S3 and one-command website deploys.', tutorials: 4, hours: 10 },
  { id: 'python', title: 'Python for AWS', url: 'https://python.levelupstudyhub.com', mark: '>>>', color: '#7db6e4',
    blurb: 'Spreadsheet reports, the AWS bill, certificate alerts and an upload pipeline with Lambda and DynamoDB.', tutorials: 4, hours: 16 },
  { id: 'javascript', title: 'JavaScript for AWS', url: 'https://js.levelupstudyhub.com', mark: 'JS', color: '#eed65a',
    blurb: 'Web pages, live dashboards, a serverless contact form and a study tracker with sign-in.', tutorials: 4, hours: 18 },
  { id: 'typescript', title: 'TypeScript for AWS', url: 'https://typescript.levelupstudyhub.com', mark: 'TS', color: '#93a8f4',
    blurb: 'Bug-proof code, your own AWS command-line tool, and infrastructure as code with the Cloud Development Kit.', tutorials: 3, hours: 14 },
];

// More courses, bought by their own plan id (`plan`), which is also the
// purchase id in the token's `certs`.
// `live: false` shows the card as coming soon, with no link to a site that
// doesn't answer yet; switch it to true on launch day (docs/launch-tech-spanish.md).
// Tech Spanish keeps the old name until spanish.levelupstudyhub.com exists (it is not in SITE_SUBDOMAINS).
export const OTHER_COURSES = [
  { id: 'tech-spanish', plan: 'tech-spanish', title: 'Tech Spanish ↔ Tech English', url: 'https://spanish.aws-study-flashcards-app.com', mark: 'ñ', color: '#f2a845',
    blurb: 'Talk and write about software, DevOps and AWS in Spanish and in English: what goes in a formal document, what the team really says, and what is slang.',
    modules: 9, hours: 8, live: false },
];
