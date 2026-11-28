// Questions people search for, answered on the page (Faq.jsx) and in the
// FAQPage structured data the build adds (vite.config.js). Plain text only:
// both places print the same words, and search engines want them to match.
// Prices come from prices.js (this file is also read by vite.config.js in Node).
import { PRODUCT_MONTHLY, PRODUCT_YEARLY, PRO_YEARLY, PRO_TRIAL_DAYS, YEARLY_SAVINGS_PERCENT } from './prices.js';

export const FAQ = [
  {
    q: 'What is Level Up Study Hub?',
    a: 'Level Up Study Hub is a set of free-to-start study sites for Amazon Web Services certification exams. Each certification has a quiz game, flashcards, a study guide and a full-length timed exam simulator. Four coding courses (Bash, Python, JavaScript and TypeScript) teach scripting with real AWS tasks.',
  },
  {
    q: 'Which AWS certifications can I study for?',
    a: 'Four are live: AWS Certified Cloud Practitioner (CLF-C02), AWS Certified AI Practitioner (AIF-C01), AWS Certified Solutions Architect – Associate (SAA-C03) and AWS Certified Developer – Associate (DVA-C02).',
  },
  {
    q: 'Which AWS certification should I take first?',
    a: 'If you are new to the cloud, start with Cloud Practitioner: it covers core services, security, pricing and support. Choose AI Practitioner if your work is about generative AI and machine learning. After either one, Solutions Architect – Associate suits people who design systems, and Developer – Associate suits people who write code.',
  },
  {
    q: 'How close is the exam simulator to the real AWS exam?',
    a: 'Each simulator has 65 questions and the real time limit: 90 minutes for Cloud Practitioner and AI Practitioner, 130 minutes for the Associate exams. It scores you on the same 100 to 1,000 scale, against the real pass mark (700 for the Foundational exams, 720 for Associate), and shows how ready you are in each exam domain.',
  },
  {
    q: 'Is Level Up Study Hub free?',
    a: 'You can start free with no account: the study guides, the first quiz domain and the first flashcard deck of every certification. A free account adds every flashcard deck and cloud sync. Unlocking everything for one certification or course is a subscription you can cancel anytime.',
  },
  {
    q: 'How much does it cost?',
    a: `Each certification and each coding course is ${PRODUCT_MONTHLY} a month or ${PRODUCT_YEARLY} a year (yearly saves ${YEARLY_SAVINGS_PERCENT}%). Pro unlocks every certification and every coding course for ${PRO_YEARLY} a year. Subscriptions renew automatically until you cancel, which you can do anytime in Manage billing. Unlocks bought before subscriptions keep their lifetime access. Prices are in US dollars.`,
  },
  {
    q: 'Is there a free trial?',
    a: `Yes, for Pro, which unlocks every certification and every coding course for ${PRO_YEARLY} a year. Your first ${PRO_TRIAL_DAYS} days are free. Checkout asks for a card, and the first yearly charge happens when the ${PRO_TRIAL_DAYS} days end unless you cancel before then. One free trial per person. A single certification or course has no trial, because the free preview, the free account and the free first tutorial already let you try it first.`,
  },
  {
    q: 'How do I cancel or switch to yearly?',
    a: 'Sign in, open Settings, then Plan & Billing, and choose Manage billing. There you can cancel, see invoices and change your card. After you cancel, you keep access until the end of the month or year you paid for. To move a monthly subscription to yearly, choose Yearly where you bought it while signed in; Stripe credits the unused part of the month.',
  },
  {
    q: 'On how many devices can I use my account?',
    a: 'An account can stay signed in on up to 3 devices at once. Signing in on a fourth signs out the one used least recently, and that browser says why. Your progress syncs across all of them.',
  },
  {
    q: 'Do I need to install anything for the coding courses?',
    a: 'No. You practice in your browser: a practice terminal for Bash, real Python running in the page, and a JavaScript and TypeScript editor with a pretend AWS account. Each tutorial then shows you how to build the same thing on your own AWS account. The first tutorial of every course is free.',
  },
  {
    q: 'Is Level Up Study Hub made by Amazon Web Services?',
    a: 'No. Level Up Study Hub is an independent study tool by Nico Tek Solutions. It is not affiliated with or endorsed by Amazon Web Services. AWS and related marks are trademarks of Amazon.com, Inc.',
  },
];
