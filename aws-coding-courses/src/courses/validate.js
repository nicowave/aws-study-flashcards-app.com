// Shape checks for course data, shared by courses.test.js and the Tech Spanish
// module tests. Each returns a list of problems ([] = fine), so a failing test
// names every broken step at once.
import { isBoth } from '../engine/i18n';
import { checkRewrite } from '../engine/steps/rewrite';
import { REGISTERS } from '../engine/steps/register';

export const KINDS = ['read', 'try', 'quiz', 'cards', 'build', 'register', 'rewrite'];

/** Problems in one tutorial, as a visitor sees it (already localized). */
export const tutorialProblems = (t, lang = 'en') => {
  const out = [];
  const at = (s) => `${t.slug}/${s?.id ?? '?'} (${lang})`;
  if (typeof t.slug !== 'string' || !t.slug) out.push(`tutorial without a slug: ${t.title}`);
  if (!(t.title && t.situation && t.level && t.hours)) out.push(`${t.slug}: needs title, situation, level and hours`);
  if (typeof t.number !== 'number') out.push(`${t.slug}: needs a number`);
  if (!Array.isArray(t.steps) || !t.steps.length) { out.push(`${t.slug}: has no steps`); return out; }
  const ids = new Set();
  for (const s of t.steps) {
    if (!KINDS.includes(s.kind)) out.push(`${at(s)}: unknown kind "${s.kind}"`);
    if (typeof s.id !== 'string' || !s.id) out.push(`${at(s)}: needs a string id`);
    if (ids.has(s.id)) out.push(`${at(s)}: duplicate step id`);
    ids.add(s.id);
    if (typeof s.title !== 'string' || !s.title) out.push(`${at(s)}: needs a title`);
    if (s.kind === 'read' && !s.body) out.push(`${at(s)}: a read step needs a body`);
    if (s.kind === 'try' && !(s.task && s.check && s.solution && s.scenario)) out.push(`${at(s)}: a try step needs task, check, solution and scenario`);
    if (s.kind === 'quiz') {
      if (!s.questions?.length) out.push(`${at(s)}: a quiz needs questions`);
      (s.questions || []).forEach((q, i) => {
        if (!q.q || !q.explain) out.push(`${at(s)} question ${i + 1}: needs q and explain`);
        if (!Array.isArray(q.options) || q.options[q.answer] === undefined) out.push(`${at(s)} question ${i + 1}: answer isn't one of the options`);
        if ((q.options || []).some((o) => typeof o !== 'string' || !o)) out.push(`${at(s)} question ${i + 1}: every option must be text`);
      });
    }
    if (s.kind === 'cards') {
      if (!s.cards?.length) out.push(`${at(s)}: a deck needs cards`);
      const cardIds = new Set();
      for (const c of s.cards || []) {
        if (!(c.id && c.front && c.back && c.difficulty)) out.push(`${at(s)} card ${c.id}: needs id, front, back and difficulty`);
        if (cardIds.has(c.id)) out.push(`${at(s)} card ${c.id}: duplicate card id`);
        cardIds.add(c.id);
      }
    }
    if (s.kind === 'register') {
      if (!s.items?.length) out.push(`${at(s)}: a register step needs items`);
      for (const item of s.items || []) {
        if (!REGISTERS.includes(item.answer)) out.push(`${at(s)} "${item.text}": answer must be ${REGISTERS.join(', ')}`);
        if (!(item.text && item.explain)) out.push(`${at(s)}: every item needs text and explain`);
      }
    }
    if (s.kind === 'rewrite') {
      if (!['es', 'en'].includes(s.target)) out.push(`${at(s)}: target must be 'es' or 'en'`);
      if (!(s.task && s.model && s.mustUse?.length)) out.push(`${at(s)}: needs task, model and mustUse`);
      else {
        const model = checkRewrite(s.model, s);
        if (!model.ok) out.push(`${at(s)}: the model answer doesn't pass (${JSON.stringify({ missing: model.missing, avoided: model.avoided, tooShort: model.tooShort })})`);
        if (checkRewrite('', s).ok) out.push(`${at(s)}: an empty answer passes`);
        if (s.source && checkRewrite(s.source, s).ok) out.push(`${at(s)}: copying the original passes`);
      }
    }
  }
  return out;
};

/** Every both(en, es) has both texts, of the same kind (text, list, function). */
export const missingTranslations = (value, path = 'course', out = []) => {
  if (isBoth(value)) {
    for (const lang of ['en', 'es']) if (value[lang] === undefined || value[lang] === null || value[lang] === '') out.push(`${path} (${lang})`);
    if (typeof value.en !== typeof value.es || Array.isArray(value.en) !== Array.isArray(value.es)) out.push(`${path} (en and es differ in kind)`);
    for (const lang of ['en', 'es']) missingTranslations(value[lang], `${path}.${lang}`, out);
  } else if (Array.isArray(value)) value.forEach((v, i) => missingTranslations(v, `${path}[${i}]`, out));
  else if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    for (const [k, v] of Object.entries(value)) missingTranslations(v, `${path}.${k}`, out);
  }
  return out;
};

/** The same steps, answers and cards in both languages (only the words change). */
export const parityProblems = (a, b) => {
  const out = [];
  if (a.slug !== b.slug || a.steps.length !== b.steps.length) return [`${a.slug}: different steps in each language`];
  a.steps.forEach((s, i) => {
    const o = b.steps[i];
    const at = `${a.slug}/${s.id}`;
    if (o.id !== s.id || o.kind !== s.kind) out.push(`${at}: different step in each language`);
    if (s.kind === 'quiz') s.questions.forEach((q, qi) => {
      const oq = o.questions?.[qi];
      if (!oq || oq.answer !== q.answer || oq.options.length !== q.options.length) out.push(`${at} question ${qi + 1}: answer or options differ between languages`);
    });
    if (s.kind === 'quiz' && s.questions.length !== o.questions.length) out.push(`${at}: different number of questions`);
    if (s.kind === 'register' && JSON.stringify(s.items.map((x) => x.answer)) !== JSON.stringify(o.items.map((x) => x.answer))) out.push(`${at}: register answers differ between languages`);
    if (s.kind === 'cards' && JSON.stringify(s.cards.map((c) => c.id)) !== JSON.stringify(o.cards.map((c) => c.id))) out.push(`${at}: different cards in each language`);
    if (s.kind === 'rewrite' && s.target !== o.target) out.push(`${at}: different target language`);
  });
  return out;
};
