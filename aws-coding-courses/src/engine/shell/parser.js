// Tokenizer + parser for the practice shell's Bash subset: pipes, && || ;,
// redirects, if/elif/else, for, while/until, { } groups, ( ) subshells,
// functions and (( )) arithmetic. Words keep their raw quoting; the
// interpreter expands them when the command runs.

export class ParseError extends Error {}

const OPS = ['&&', '||', ';;', '>>', '&>', '|', ';', '&', '>', '<', '(', ')'];
const RESERVED = new Set(['if', 'then', 'elif', 'else', 'fi', 'for', 'in', 'do', 'done', 'while', 'until', '{', '}', 'function', '!']);

// Copies a balanced $( ... ) / $(( ... )) starting at src[i] === '(' and
// returns the index just after the closing paren.
const skipParens = (src, i) => {
  let depth = 0;
  for (; i < src.length; i++) {
    const c = src[i];
    if (c === '\\') { i++; continue; }
    if (c === "'") { i = src.indexOf("'", i + 1); if (i === -1) throw new ParseError("unexpected end of input: missing '"); continue; }
    if (c === '"') { i = skipDouble(src, i + 1) - 1; continue; }
    if (c === '(') depth++;
    else if (c === ')' && --depth === 0) return i + 1;
  }
  throw new ParseError('unexpected end of input: missing )');
};

// i points just after an opening "; returns the index after the closing "
const skipDouble = (src, i) => {
  for (; i < src.length; i++) {
    const c = src[i];
    if (c === '\\') { i++; continue; }
    if (c === '"') return i + 1;
    if (c === '$' && src[i + 1] === '(') { i = skipParens(src, i + 1) - 1; continue; }
    if (c === '`') { i = src.indexOf('`', i + 1); if (i === -1) break; }
  }
  throw new ParseError('unexpected end of input: missing "');
};

export function tokenize(src) {
  const tokens = [];
  let i = 0;
  let inTest = false; // inside [[ ... ]]: && || < > are plain words
  let atCommandStart = true;

  const push = (tok) => {
    tokens.push(tok);
    if (tok.t === 'word') {
      if (tok.v === '[[') inTest = true;
      else if (tok.v === ']]') inTest = false;
    }
    atCommandStart = tok.t !== 'word' || RESERVED.has(tok.v);
  };

  while (i < src.length) {
    const c = src[i];
    if (c === ' ' || c === '\t' || c === '\r') { i++; continue; }
    if (c === '\\' && src[i + 1] === '\n') { i += 2; continue; }
    if (c === '\n') { push({ t: 'nl' }); i++; continue; }
    if (c === '#') { while (i < src.length && src[i] !== '\n') i++; continue; }

    // (( arithmetic )) as a command
    if (atCommandStart && src.startsWith('((', i)) {
      const end = src.indexOf('))', i + 2);
      if (end === -1) throw new ParseError('unexpected end of input: missing ))');
      push({ t: 'arith', v: src.slice(i + 2, end) });
      i = end + 2;
      continue;
    }

    if (!inTest) {
      const op = OPS.find((o) => src.startsWith(o, i));
      if (op) { push({ t: 'op', v: op }); i += op.length; continue; }
    }

    // A word: runs until unquoted whitespace or an operator
    let start = i;
    while (i < src.length) {
      const ch = src[i];
      if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') break;
      if (!inTest && OPS.some((o) => src.startsWith(o, i))) {
        // 2>file, 2>>file, 2>&1: a single-digit word right before > is a file descriptor
        if ((ch === '>' || ch === '<') && i - start === 1 && /[0-9]/.test(src[start])) {
          const fd = src[start];
          let op = src.startsWith('>>', i) ? '>>' : src[i];
          i += op.length;
          if (src[i] === '&') { op += '&'; i++; }
          push({ t: 'op', v: op, fd: Number(fd) });
          start = -1;
        }
        break;
      }
      if (ch === '\\') { i += 2; continue; }
      if (ch === "'") {
        const end = src.indexOf("'", i + 1);
        if (end === -1) throw new ParseError("unexpected end of input: missing '");
        i = end + 1;
        continue;
      }
      if (ch === '"') { i = skipDouble(src, i + 1); continue; }
      if (ch === '$' && src[i + 1] === '(') { i = skipParens(src, i + 1); continue; }
      if (ch === '$' && src[i + 1] === '{') {
        const end = src.indexOf('}', i);
        if (end === -1) throw new ParseError('unexpected end of input: missing }');
        i = end + 1;
        continue;
      }
      if (ch === '`') {
        const end = src.indexOf('`', i + 1);
        if (end === -1) throw new ParseError('unexpected end of input: missing `');
        i = end + 1;
        continue;
      }
      i++;
    }
    if (start !== -1 && i > start) push({ t: 'word', v: src.slice(start, i) });
  }
  return tokens;
}

const ASSIGN = /^([A-Za-z_][A-Za-z0-9_]*)(\+?)=/;

export function parse(src) {
  const tokens = tokenize(src);
  let pos = 0;

  const peek = () => tokens[pos];
  const next = () => tokens[pos++];
  const isWord = (v) => peek()?.t === 'word' && peek().v === v;
  const isOp = (v) => peek()?.t === 'op' && peek().v === v;
  const skipNewlines = () => { while (peek()?.t === 'nl') pos++; };
  const expectWord = (v) => {
    skipNewlines();
    if (!isWord(v)) throw new ParseError(`syntax error: expected '${v}'${peek() ? ` near '${peek().v ?? 'newline'}'` : ' before the end'}`);
    pos++;
  };

  // A list of commands, stopping at any reserved word in `stops` or a ')'
  function parseList(stops = []) {
    const items = [];
    for (;;) {
      while (peek() && (peek().t === 'nl' || isOp(';'))) pos++;
      const tok = peek();
      if (!tok) break;
      if (tok.t === 'word' && stops.includes(tok.v)) break;
      if (tok.t === 'op' && tok.v === ')') break;
      const node = parseAndOr();
      let background = false;
      if (isOp('&')) { pos++; background = true; }
      items.push({ node, background });
    }
    return { type: 'list', items };
  }

  function parseAndOr() {
    const first = parsePipeline();
    const rest = [];
    while (isOp('&&') || isOp('||')) {
      const op = next().v;
      skipNewlines();
      rest.push({ op, node: parsePipeline() });
    }
    return rest.length ? { type: 'andor', first, rest } : first;
  }

  function parsePipeline() {
    let negate = false;
    if (isWord('!')) { pos++; negate = true; }
    const cmds = [parseCommand()];
    while (isOp('|')) {
      pos++;
      skipNewlines();
      cmds.push(parseCommand());
    }
    return cmds.length === 1 && !negate ? cmds[0] : { type: 'pipeline', cmds, negate };
  }

  function parseRedirects(node) {
    node.redirs = node.redirs || [];
    while (peek()?.t === 'op' && /^[<>]|^&>/.test(peek().v)) node.redirs.push(parseRedirect());
    return node;
  }

  function parseRedirect() {
    const tok = next();
    const fd = tok.fd ?? (tok.v.startsWith('<') ? 0 : 1);
    let op = tok.v;
    if (!tok.fd && op === '>' && isOp('&')) { pos++; op = '>&'; }
    const target = next();
    if (!target || target.t !== 'word') throw new ParseError(`syntax error near unexpected token '${target?.v ?? 'newline'}'`);
    return { op, fd, target: target.v };
  }

  function parseCommand() {
    const tok = peek();
    if (!tok) throw new ParseError('syntax error: unexpected end of input');
    if (tok.t === 'arith') { pos++; return parseRedirects({ type: 'arith', expr: tok.v }); }
    if (tok.t === 'op' && tok.v === '(') {
      pos++;
      const body = parseList();
      if (!isOp(')')) throw new ParseError("syntax error: expected ')'");
      pos++;
      return parseRedirects({ type: 'subshell', body });
    }
    if (tok.t === 'word') {
      switch (tok.v) {
        case 'if': return parseRedirects(parseIf());
        case 'for': return parseRedirects(parseFor());
        case 'while':
        case 'until': return parseRedirects(parseWhile());
        case '{': {
          pos++;
          const body = parseList(['}']);
          expectWord('}');
          return parseRedirects({ type: 'group', body });
        }
        case 'function': {
          pos++;
          const name = next().v;
          if (isOp('(')) { pos++; if (!isOp(')')) throw new ParseError("syntax error: expected ')'"); pos++; }
          skipNewlines();
          return { type: 'func', name, body: parseCommand() };
        }
        case 'then': case 'elif': case 'else': case 'fi': case 'do': case 'done': case '}':
          throw new ParseError(`syntax error near unexpected token '${tok.v}'`);
        default:
          // name() { ... }
          if (tokens[pos + 1]?.t === 'op' && tokens[pos + 1].v === '(' && tokens[pos + 2]?.t === 'op' && tokens[pos + 2].v === ')') {
            const name = tok.v;
            pos += 3;
            skipNewlines();
            return { type: 'func', name, body: parseCommand() };
          }
      }
    }
    return parseSimple();
  }

  function parseSimple() {
    const node = { type: 'simple', assigns: [], words: [], redirs: [] };
    for (;;) {
      const tok = peek();
      if (!tok) break;
      if (tok.t === 'op' && (/^[<>]/.test(tok.v) || tok.v === '&>')) { node.redirs.push(parseRedirect()); continue; }
      if (tok.t !== 'word') break;
      const m = !node.words.length && tok.v.match(ASSIGN);
      if (m) {
        node.assigns.push({ name: m[1], append: !!m[2], raw: tok.v.slice(m[0].length) });
      } else {
        node.words.push(tok.v);
      }
      pos++;
    }
    if (!node.words.length && !node.assigns.length && !node.redirs.length) {
      const tok = peek();
      throw new ParseError(`syntax error near unexpected token '${tok?.v ?? 'newline'}'`);
    }
    return node;
  }

  function parseIf() {
    pos++; // if
    const clauses = [];
    const cond = parseList(['then']);
    expectWord('then');
    clauses.push({ cond, body: parseList(['elif', 'else', 'fi']) });
    let elseBody = null;
    for (;;) {
      skipNewlines();
      if (isWord('elif')) {
        pos++;
        const c = parseList(['then']);
        expectWord('then');
        clauses.push({ cond: c, body: parseList(['elif', 'else', 'fi']) });
      } else if (isWord('else')) {
        pos++;
        elseBody = parseList(['fi']);
      } else break;
    }
    expectWord('fi');
    return { type: 'if', clauses, elseBody };
  }

  function parseFor() {
    pos++; // for
    const name = next()?.v;
    if (!name || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) throw new ParseError(`syntax error: '${name}' is not a valid loop variable name`);
    let words = null;
    skipNewlines();
    if (isWord('in')) {
      pos++;
      words = [];
      while (peek()?.t === 'word') words.push(next().v);
    }
    while (peek()?.t === 'nl' || isOp(';')) pos++;
    expectWord('do');
    const body = parseList(['done']);
    expectWord('done');
    return { type: 'for', name, words, body };
  }

  function parseWhile() {
    const until = next().v === 'until';
    const cond = parseList(['do']);
    expectWord('do');
    const body = parseList(['done']);
    expectWord('done');
    return { type: 'while', until, cond, body };
  }

  const list = parseList();
  if (pos < tokens.length) {
    const tok = peek();
    throw new ParseError(`syntax error near unexpected token '${tok.v ?? 'newline'}'`);
  }
  return list;
}

// True when the input ends inside an unfinished if/for/while or quote, so the
// terminal can ask for another line (the "> " prompt) instead of failing.
export function isIncomplete(src) {
  try {
    parse(src);
    return false;
  } catch (err) {
    return /unexpected end of input|before the end|expected '(then|fi|do|done|\})'/.test(err.message) && !/near '/.test(err.message);
  }
}
