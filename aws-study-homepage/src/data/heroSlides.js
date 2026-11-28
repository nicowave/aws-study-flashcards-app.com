// The hub's rotating headlines, one per study track. Order matters: the first slide
// is the h1 and must keep the words of the static page in vite.config.js.
// Rules for this copy (see the multi-discipline plan):
// - "soon: true" tracks have no product yet: say "coming soon", never a price or a date.
// - Exam names are other companies' trademarks: plain text only, no logos, never "official".
// - No earnings promises: talk about skills employers ask for, not money people will make.
export const HERO_SLIDES = [
  {
    id: 'aws',
    track: 'AWS',
    badge: 'New: Developer Associate now live',
    before: 'Pass Your ',
    highlight: 'AWS Certification',
    after: ' First Try',
    subtitle:
      'Exam-style practice questions, flashcards, and full-length timed exam simulators for AWS Cloud Practitioner, AI Practitioner, Solutions Architect – Associate, and Developer – Associate. Know you’re ready before you book the real exam.',
    actions: [
      { label: 'Am I Ready? Free 10-Question Check', href: '#readiness', primary: true, icon: 'target' },
      { label: 'Try It Free, No Account Needed', href: 'https://cloud.levelupstudyhub.com', icon: 'cloud' },
    ],
  },
  {
    id: 'gis',
    track: 'GIS',
    soon: true,
    badge: 'New track: GIS courses coming soon',
    before: 'Become a GIS Professional and Put Your Skills ',
    highlight: 'on the Map',
    after: '',
    subtitle:
      'Learn what GIS is, build web maps with free open-source tools, and use them where maps answer real questions: real estate, city planning and international development work.',
    actions: [
      { label: 'See the GIS Courses', href: '/gis/', primary: true, icon: 'arrow' },
    ],
  },
  {
    id: 'google-cloud',
    track: 'Google Cloud',
    soon: true,
    badge: 'Coming soon: Google Cloud practice exams',
    // Google's naming rules: no colour on Google's name, so the highlight sits on "First Try"
    before: 'Pass Your Google Cloud Certification ',
    highlight: 'First Try',
    after: '',
    subtitle:
      'Practice games for Cloud Digital Leader, Generative AI Leader, Associate Cloud Engineer and more are in the works, built the same way as our AWS sets.',
    actions: [
      { label: 'Practise AWS Free Today', href: '#certifications', primary: true, icon: 'target' },
    ],
  },
  {
    id: 'automation',
    track: 'Automation',
    badge: 'Live now: first tutorial free',
    before: 'Become an ',
    highlight: 'Automation Expert',
    after: ' and Level Up Your Career',
    subtitle:
      'Script the repetitive work away with Bash and Python, then run it on AWS. Real projects, and the first tutorial of each course is free.',
    actions: [
      { label: 'Start Bash Free', href: 'https://bash.levelupstudyhub.com', primary: true, icon: 'code' },
      { label: 'See All Four Courses', href: '#courses' },
    ],
  },
  {
    id: 'finance-ai',
    track: 'Finance + AI',
    soon: true,
    badge: 'Coming soon: new course',
    before: 'Level Up Your Finance Career With ',
    highlight: 'Data Analytics and AI',
    after: '',
    subtitle:
      'Clean, chart and model financial data with Python and SQL, then check what AI tells you before you trust it. New course in the works.',
    actions: [
      { label: 'Start Python Free Today', href: 'https://python.levelupstudyhub.com', primary: true, icon: 'code' },
    ],
  },
];
