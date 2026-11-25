// "Register" steps: is this phrase for a formal document, for the team, or slang?
// Each item becomes one multiple-choice question, so the step reuses the quiz
// (scores and progress included). Items: { text, answer: 'formal' | 'team' | 'slang', explain, context? }
export const REGISTERS = ['formal', 'team', 'slang'];

export const registerQuestions = (items, t) => items.map((item) => ({
  q: `“${item.text}”${item.context ? ` — *${item.context}*` : ''}`,
  options: REGISTERS.map((r) => t(`register.${r}`)),
  answer: REGISTERS.indexOf(item.answer),
  explain: item.explain,
}));
