// "Rewrite" steps: the learner writes a short text (a Slack message, a commit
// message, an email) and we check that it uses the key terms and avoids the
// traps. Matching ignores case and accents; a term ending in * matches any
// word that starts with it (despleg* → desplegar, desplegamos).
//
// step: { target: 'es' | 'en', task, source?, minWords?, model,
//         mustUse: [{ any: ['despleg*', 'implement*'], label? }],
//         avoid?: [{ any: ['librer*'], why }] }

export const normalize = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** A regular expression for one term, on word boundaries (after normalize). */
export const termPattern = (term) => {
  const n = normalize(term).trim();
  const prefix = n.endsWith('*');
  const core = escapeRe(prefix ? n.slice(0, -1) : n).replace(/\s+/g, '\\s+');
  return new RegExp(`(^|[^a-z0-9])${core}${prefix ? '' : '(?=$|[^a-z0-9])'}`);
};

export const hasTerm = (text, terms) => {
  const n = normalize(text);
  return terms.some((term) => termPattern(term).test(n));
};

export const countWords = (text) => (String(text || '').trim().match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) || []).length;

/** { ok, words, tooShort, missing: [label], avoided: [{ term, why }] } */
export const checkRewrite = (text, step) => {
  const words = countWords(text);
  const minWords = step.minWords ?? 5;
  const missing = (step.mustUse || []).filter((m) => !hasTerm(text, m.any)).map((m) => m.label || m.any[0].replace(/\*$/, '…'));
  const avoided = (step.avoid || []).filter((a) => hasTerm(text, a.any)).map((a) => ({ term: a.any[0].replace(/\*$/, '…'), why: a.why }));
  const tooShort = words < minWords;
  return { ok: !tooShort && !missing.length && !avoided.length, words, tooShort, minWords, missing, avoided };
};
