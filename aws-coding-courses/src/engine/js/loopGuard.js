// Loop protection for practice pages. A web page's script shares the tab's
// thread, so `while (true) {}` would freeze the whole course page. Each
// while, do-while and classic for loop gets a guard call in its condition:
//   while (x)          ->  while (__practiceLoop("app.js", 4) && (x))
//   for (i = 0; ; i++) ->  for (i = 0; __practiceLoop("app.js", 9); i++)
// (the file and the loop's line, so the error points at the right place)
// The guard (defined by the page shim) throws once a loop has run for about
// two seconds without the page getting a chance to breathe. The rewrite adds
// no newlines, so line numbers in errors stay right. for-of / for-in loops
// are left alone: they end when their list does.
//
// This is a small tokenizer, not a parser: it skips strings, template
// literals, comments and regular expressions, and matches brackets.

const WORD = /[A-Za-z0-9_$]/;
// After these words a "/" starts a regular expression, not a division
const BEFORE_REGEX = new Set(['return', 'typeof', 'case', 'do', 'else', 'in', 'of', 'new', 'delete', 'void', 'throw', 'instanceof', 'yield', 'await']);

export const LOOP_GUARD = '__practiceLoop';

export const guardLoops = (source, file = '') => {
  const src = String(source);
  const n = src.length;
  const inserts = []; // [position, text]
  let i = 0;
  let prevSignificant = ''; // last non-space character outside comments
  let prevWord = '';

  // Skip a string/template/comment/regex starting at i; returns the end index, or -1 if none starts here
  const skipLiteral = (at, allowRegex) => {
    const c = src[at];
    const next = src[at + 1];
    if (c === '/' && next === '/') { const e = src.indexOf('\n', at); return e === -1 ? n : e; }
    if (c === '/' && next === '*') { const e = src.indexOf('*/', at + 2); return e === -1 ? n : e + 2; }
    if (c === '"' || c === "'") {
      let k = at + 1;
      while (k < n && src[k] !== c && src[k] !== '\n') k += src[k] === '\\' ? 2 : 1;
      return k + 1;
    }
    if (c === '`') return skipTemplate(at);
    if (c === '/' && allowRegex) {
      let k = at + 1;
      let inClass = false;
      while (k < n && src[k] !== '\n') {
        if (src[k] === '\\') { k += 2; continue; }
        if (src[k] === '[') inClass = true;
        else if (src[k] === ']') inClass = false;
        else if (src[k] === '/' && !inClass) break;
        k += 1;
      }
      k += 1;
      while (k < n && /[a-z]/i.test(src[k])) k += 1; // flags
      return k;
    }
    return -1;
  };

  const skipTemplate = (at) => {
    let k = at + 1;
    while (k < n && src[k] !== '`') {
      if (src[k] === '\\') { k += 2; continue; }
      if (src[k] === '$' && src[k + 1] === '{') { k = matchClose(k + 1, '{', '}') + 1; continue; }
      k += 1;
    }
    return k + 1;
  };

  // Given the index of an opening bracket, the index of its closing one
  const matchClose = (open, o, c) => {
    let depth = 0;
    let k = open;
    let prev = o;
    while (k < n) {
      const ch = src[k];
      const lit = skipLiteral(k, ch === '/' && /[(,=:[!&|?{};+\-*%<>~^]/.test(prev));
      if (lit !== -1) { k = lit; prev = 'x'; continue; }
      if (ch === o) depth += 1;
      else if (ch === c) { depth -= 1; if (depth === 0) return k; }
      if (!/\s/.test(ch)) prev = ch;
      k += 1;
    }
    return n - 1;
  };

  // Positions of the top-level ";" inside a for header (between open+1 and close)
  const headerSemicolons = (open, close) => {
    const out = [];
    let depth = 0;
    let k = open + 1;
    let prev = '(';
    while (k < close) {
      const ch = src[k];
      const lit = skipLiteral(k, ch === '/' && /[(,=:[!&|?{};+\-*%<>~^]/.test(prev));
      if (lit !== -1) { k = lit; prev = 'x'; continue; }
      if ('([{'.includes(ch)) depth += 1;
      else if (')]}'.includes(ch)) depth -= 1;
      else if (ch === ';' && depth === 0) out.push(k);
      if (!/\s/.test(ch)) prev = ch;
      k += 1;
    }
    return out;
  };

  while (i < n) {
    const ch = src[i];
    const regexOk = ch === '/' && (prevSignificant === '' || /[(,=:[!&|?{};+\-*%<>~^]/.test(prevSignificant) || BEFORE_REGEX.has(prevWord));
    const lit = skipLiteral(i, regexOk);
    if (lit !== -1) {
      if (!(ch === '/' && (src[i + 1] === '/' || src[i + 1] === '*'))) { prevSignificant = 'x'; prevWord = ''; }
      i = lit;
      continue;
    }
    if (WORD.test(ch)) {
      let k = i;
      while (k < n && WORD.test(src[k])) k += 1;
      const word = src.slice(i, k);
      const afterDot = prevSignificant === '.';
      if (!afterDot && (word === 'while' || word === 'for')) {
        let p = k;
        while (p < n && /\s/.test(src[p])) p += 1;
        if (word === 'for' && src.startsWith('await', p)) { p += 5; while (p < n && /\s/.test(src[p])) p += 1; }
        if (src[p] === '(') {
          const close = matchClose(p, '(', ')');
          const line = src.slice(0, i).split('\n').length;
          const guard = `${LOOP_GUARD}(${JSON.stringify(file)}, ${line})`;
          if (word === 'while') {
            inserts.push([p + 1, `${guard} && (`], [close, ')']);
          } else {
            const semis = headerSemicolons(p, close);
            if (semis.length === 2) {
              const cond = src.slice(semis[0] + 1, semis[1]);
              if (cond.trim()) inserts.push([semis[0] + 1, ` ${guard} && (`], [semis[1], ')']);
              else inserts.push([semis[0] + 1, ` ${guard} `]);
            }
          }
        }
      }
      prevWord = word;
      prevSignificant = 'x';
      i = k;
      continue;
    }
    if (!/\s/.test(ch)) { prevSignificant = ch; prevWord = ''; }
    i += 1;
  }

  if (!inserts.length) return src;
  // Apply from the end so earlier positions stay valid; at the same position, keep the order they were added
  const ordered = inserts.map((ins, order) => [...ins, order]).sort((a, b) => b[0] - a[0] || b[2] - a[2]);
  let out = src;
  for (const [pos, text] of ordered) out = out.slice(0, pos) + text + out.slice(pos);
  return out;
};

// The guard itself, installed in the page by the shim (copied in as source).
// A loop that keeps going within one task for over 2 seconds is stopped. The
// clock restarts whenever the page gets back to its timers, so loops that
// wait between rounds (await sleep(...), fetch) are never stopped.
export function installLoopGuard(win, limitMs) {
  const loops = new Map();
  let resetQueued = false;
  win.__practiceLoop = (file, line) => {
    const id = `${file}:${line}`;
    let s = loops.get(id);
    if (!s) {
      s = { n: 0, start: win.performance.now() };
      loops.set(id, s);
      if (!resetQueued) {
        resetQueued = true;
        win.setTimeout(() => { loops.clear(); resetQueued = false; }, 0);
      }
    }
    s.n += 1;
    if (s.n % 1000 === 0 && win.performance.now() - s.start > limitMs) {
      loops.delete(id);
      const err = new Error(`Stopped a loop that ran for more than ${limitMs / 1000} seconds. Does it ever end?`);
      err.practiceFile = file;
      err.practiceLine = line;
      throw err;
    }
    return true;
  };
}
