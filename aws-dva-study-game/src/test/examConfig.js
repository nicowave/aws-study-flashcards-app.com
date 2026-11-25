// Helpers that let the same component tests run unchanged in all four certification apps.
// Why: the apps share their components but differ in data, e.g. Cloud Practitioner,
// Solutions Architect and Developer store the answer as `correctAnswer`, AI Practitioner as `correct`.
export const correctIndex = (q) => (q.correctAnswer ?? q.correct);
export const answerField = (q) => ('correctAnswer' in q ? 'correctAnswer' : 'correct');
