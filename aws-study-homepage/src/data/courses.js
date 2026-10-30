// The four coding course sites on the Developer Path. Plain data, so the build
// (vite.config.js) can also read it for the page crawlers see.
export const COURSES = [
  { id: 'bash', title: 'Bash for AWS', url: 'https://bash.aws-study-flashcards-app.com', mark: '$_', color: '#89d185',
    blurb: 'Health checks, log digging, backups to Amazon S3 and one-command website deploys.', tutorials: 4, hours: 10 },
  { id: 'python', title: 'Python for AWS', url: 'https://python.aws-study-flashcards-app.com', mark: '>>>', color: '#7db6e4',
    blurb: 'Spreadsheet reports, the AWS bill, certificate alerts and an upload pipeline with Lambda and DynamoDB.', tutorials: 4, hours: 16 },
  { id: 'javascript', title: 'JavaScript for AWS', url: 'https://js.aws-study-flashcards-app.com', mark: 'JS', color: '#eed65a',
    blurb: 'Web pages, live dashboards, a serverless contact form and a study tracker with sign-in.', tutorials: 4, hours: 18 },
  { id: 'typescript', title: 'TypeScript for AWS', url: 'https://typescript.aws-study-flashcards-app.com', mark: 'TS', color: '#93a8f4',
    blurb: 'Bug-proof code, your own AWS command-line tool, and infrastructure as code with the Cloud Development Kit.', tutorials: 3, hours: 14 },
];
export const COURSE_PRICE = '$19.99';
export const BUNDLE_PRICE = '$59';
