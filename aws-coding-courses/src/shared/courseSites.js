// Every course site, for the "More courses" footer. One list, so a new course
// (or a course going live) is one change here instead of one per course.
// `id` is each course's meta.json id; `live: false` shows "(coming soon)"
// with no link until the site answers (switch it on launch day).
export const COURSE_SITES = [
  { id: 'bash-for-aws', title: 'Bash for AWS', url: 'https://bash.levelupstudyhub.com', live: true },
  { id: 'python-for-aws', title: 'Python for AWS', url: 'https://python.levelupstudyhub.com', live: true },
  { id: 'javascript-for-aws', title: 'JavaScript for AWS', url: 'https://js.levelupstudyhub.com', live: true },
  { id: 'typescript-for-aws', title: 'TypeScript for AWS', url: 'https://typescript.levelupstudyhub.com', live: true },
  { id: 'tech-spanish', title: 'Tech Spanish ↔ Tech English', url: 'https://spanish.aws-study-flashcards-app.com', live: false },
];

/** The other course sites, for one course's footer. */
export const siblingsOf = (courseId) => COURSE_SITES.filter((s) => s.id !== courseId);
