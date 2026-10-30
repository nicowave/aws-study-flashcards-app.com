// A small awk for the practice shell: patterns, BEGIN/END, fields, NR/NF,
// variables, associative arrays, if/for/while, print/printf (with > file),
// and the common string functions. Enough for log digging, not a full awk.

class AwkError extends Error {}
class NextSignal {}
class ExitSignal { constructor(code) { this.code = code; } }

const KEYWORDS = new Set(['BEGIN', 'END', 'print', 'printf', 'if', 'else', 'for', 'in', 'while', 'do', 'next', 'exit', 'delete', 'getline', 'function', 'return']);
const BUILTIN_FUNCS = new Set(['length', 'substr', 'index', 'split', 'tolower', 'toupper', 'sprintf', 'int', 'gsub', 'sub', 'match', 'sqrt', 'rand', 'srand', 'systime', 'strftime']);

function tokenize(src) {
  const toks = [];
  let i = 0;
  const operandEnd = () => {
    const t = toks[toks.length - 1];
    return t && (t.t === 'num' || t.t === 'str' || t.t === 'name' || t.t === 'builtin' || (t.t === 'op' && [')', ']', '$', '++', '--'].includes(t.v)));
  };
  while (i < src.length) {
    const c = src[i];
    if (c === ' ' || c === '\t' || c === '\r') { i++; continue; }
    if (c === '\\' && src[i + 1] === '\n') { i += 2; continue; }
    if (c === '#') { while (i < src.length && src[i] !== '\n') i++; continue; }
    if (c === '\n' || c === ';') { toks.push({ t: 'sep', v: c }); i++; continue; }
    if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(src[i + 1] ?? ''))) {
      const m = src.slice(i).match(/^(\d+\.?\d*(?:[eE][-+]?\d+)?|\.\d+)/);
      toks.push({ t: 'num', v: Number(m[1]) });
      i += m[1].length;
      continue;
    }
    if (c === '"') {
      let s = '';
      i++;
      while (i < src.length && src[i] !== '"') {
        if (src[i] === '\\') {
          const n = src[++i];
          s += { n: '\n', t: '\t', '"': '"', '\\': '\\', '/': '/', r: '\r' }[n] ?? `\\${n}`;
        } else s += src[i];
        i++;
      }
      toks.push({ t: 'str', v: s });
      i++;
      continue;
    }
    if (c === '/' && !operandEnd()) {
      let s = '';
      i++;
      while (i < src.length && src[i] !== '/') {
        if (src[i] === '\\' && src[i + 1] === '/') { s += '/'; i += 2; continue; }
        s += src[i++];
      }
      toks.push({ t: 'regex', v: s });
      i++;
      continue;
    }
    const name = src.slice(i).match(/^[A-Za-z_][A-Za-z0-9_]*/);
    if (name) {
      const v = name[0];
      toks.push({ t: KEYWORDS.has(v) ? 'kw' : BUILTIN_FUNCS.has(v) ? 'builtin' : 'name', v });
      i += v.length;
      continue;
    }
    const op = ['+=', '-=', '*=', '/=', '%=', '^=', '==', '!=', '<=', '>=', '&&', '||', '++', '--', '!~', '>>'].find((o) => src.startsWith(o, i)) ?? c;
    if (!'{}()[],;+-*/%^!<>=~?:$|'.includes(op[0])) throw new AwkError(`syntax error at source line 1: unexpected character '${c}'`);
    toks.push({ t: 'op', v: op });
    i += op.length;
  }
  return toks;
}

function parse(src) {
  const toks = tokenize(src);
  let pos = 0;
  const peek = (o = 0) => toks[pos + o];
  const isOp = (v, o = 0) => peek(o)?.t === 'op' && peek(o).v === v;
  const isKw = (v) => peek()?.t === 'kw' && peek().v === v;
  const expectOp = (v) => {
    if (!isOp(v)) throw new AwkError(`syntax error: expected '${v}'${peek() ? ` near '${peek().v}'` : ' at end of program'}`);
    pos++;
  };
  const skipSeps = () => { while (peek()?.t === 'sep') pos++; };
  const skipNl = () => { while (peek()?.t === 'sep' && peek().v === '\n') pos++; };

  const items = [];
  skipSeps();
  while (pos < toks.length) {
    if (isKw('BEGIN') || isKw('END')) {
      const kind = toks[pos++].v;
      skipNl();
      items.push({ kind, body: block() });
    } else if (isOp('{')) {
      items.push({ kind: 'main', pattern: null, body: block() });
    } else {
      const pattern = expr();
      skipNl();
      items.push({ kind: 'main', pattern, body: isOp('{') ? block() : null });
    }
    skipSeps();
  }
  return items;

  function block() {
    expectOp('{');
    const stmts = [];
    skipSeps();
    while (!isOp('}')) {
      if (!peek()) throw new AwkError("syntax error: missing '}'");
      stmts.push(statement());
      skipSeps();
    }
    pos++;
    return { type: 'block', stmts };
  }

  function simpleOrBlock() {
    skipNl();
    if (isOp('{')) return block();
    const s = statement();
    if (peek()?.t === 'sep' && peek().v === ';') pos++;
    return s;
  }

  function statement() {
    if (isOp('{')) return block();
    const t = peek();
    if (t.t === 'kw') {
      switch (t.v) {
        case 'print': case 'printf': {
          pos++;
          let args = [];
          const parens = isOp('(') && closesBeforeRedirect();
          if (parens) { pos++; args = exprList(true); expectOp(')'); }
          else if (!(peek()?.t === 'sep' || isOp('}') || isOp('>') || isOp('>>') || isOp('|'))) args = exprList(false);
          let redirect = null;
          if (isOp('>') || isOp('>>')) { const op = toks[pos++].v; redirect = { op, target: concat(false) }; }
          return { type: t.v, args, redirect };
        }
        case 'if': {
          pos++;
          expectOp('(');
          const cond = expr();
          expectOp(')');
          const then = simpleOrBlock();
          skipSeps();
          let otherwise = null;
          if (isKw('else')) { pos++; otherwise = simpleOrBlock(); }
          else {
            // put back separators we may have eaten so the caller sees them
            while (pos > 0 && toks[pos - 1].t === 'sep') pos--;
          }
          return { type: 'if', cond, then, otherwise };
        }
        case 'while': {
          pos++;
          expectOp('(');
          const cond = expr();
          expectOp(')');
          return { type: 'while', cond, body: simpleOrBlock() };
        }
        case 'for': {
          pos++;
          expectOp('(');
          if (peek()?.t === 'name' && peek(1)?.t === 'kw' && peek(1).v === 'in') {
            const v = toks[pos].v;
            pos += 2;
            const arr = toks[pos++].v;
            expectOp(')');
            return { type: 'forin', v, arr, body: simpleOrBlock() };
          }
          const init = isSep(';') ? null : expr();
          expectSep();
          const cond = isSep(';') ? null : expr();
          expectSep();
          const incr = isOp(')') ? null : expr();
          expectOp(')');
          return { type: 'for', init, cond, incr, body: simpleOrBlock() };
        }
        case 'next': pos++; return { type: 'next' };
        case 'exit': {
          pos++;
          const code = peek() && peek().t !== 'sep' && !isOp('}') ? expr() : null;
          return { type: 'exit', code };
        }
        case 'delete': {
          pos++;
          const name = toks[pos++].v;
          let key = null;
          if (isOp('[')) { pos++; key = exprList(false); expectOp(']'); }
          return { type: 'delete', name, key };
        }
        default: throw new AwkError(`syntax error: unsupported '${t.v}'`);
      }
    }
    return { type: 'expr', e: expr() };
  }

  function isSep(v) { return peek()?.t === 'sep' && peek().v === v; }
  function expectSep() { if (!isSep(';')) throw new AwkError("syntax error: expected ';' in for(...)"); pos++; }

  // print (a, b) > "f": are the parens the whole argument list?
  function closesBeforeRedirect() {
    let depth = 0;
    for (let k = pos; k < toks.length; k++) {
      const tk = toks[k];
      if (tk.t === 'op' && tk.v === '(') depth++;
      if (tk.t === 'op' && tk.v === ')' && --depth === 0) {
        const after = toks[k + 1];
        return !after || after.t === 'sep' || (after.t === 'op' && ['}', '>', '>>', '|'].includes(after.v));
      }
    }
    return false;
  }

  function exprList(allowGt) {
    const list = [allowGt ? expr() : ternary(false)];
    while (isOp(',')) { pos++; skipNl(); list.push(allowGt ? expr() : ternary(false)); }
    return list;
  }

  function expr() { return ternary(true); }

  function ternary(gt) {
    const cond = assignment(gt);
    if (isOp('?')) {
      pos++;
      const a = ternary(gt);
      expectOp(':');
      const b = ternary(gt);
      return { type: 'cond', cond, a, b };
    }
    return cond;
  }

  function assignment(gt) {
    const start = pos;
    const left = or(gt);
    if (['=', '+=', '-=', '*=', '/=', '%=', '^='].some((o) => isOp(o)) && ['var', 'index', 'field'].includes(left.type)) {
      const op = toks[pos++].v;
      return { type: 'assign', op, target: left, value: ternary(gt) };
    }
    void start;
    return left;
  }

  function or(gt) {
    let l = and(gt);
    while (isOp('||')) { pos++; skipNl(); l = { type: 'bin', op: '||', l, r: and(gt) }; }
    return l;
  }
  function and(gt) {
    let l = inExpr(gt);
    while (isOp('&&')) { pos++; skipNl(); l = { type: 'bin', op: '&&', l, r: inExpr(gt) }; }
    return l;
  }
  function inExpr(gt) {
    let l = match(gt);
    while (isKw('in')) { pos++; l = { type: 'in', key: l, arr: toks[pos++].v }; }
    return l;
  }
  function match(gt) {
    let l = compare(gt);
    while (isOp('~') || isOp('!~')) {
      const op = toks[pos++].v;
      l = { type: 'match', neg: op === '!~', l, r: compare(gt) };
    }
    return l;
  }
  function compare(gt) {
    let l = concat(gt);
    while (['<', '<=', '==', '!=', '>=', ...(gt ? ['>'] : [])].some((o) => isOp(o))) {
      const op = toks[pos++].v;
      l = { type: 'bin', op, l, r: concat(gt) };
    }
    return l;
  }
  function startsOperand() {
    const t = peek();
    if (!t) return false;
    if (['num', 'str', 'name', 'builtin', 'regex'].includes(t.t)) return true;
    return t.t === 'op' && ['$', '(', '!', '++', '--'].includes(t.v);
  }
  function concat(gt) {
    let l = additive();
    while (startsOperand() && !isKw('in')) l = { type: 'concat', l, r: additive() };
    void gt;
    return l;
  }
  function additive() {
    let l = mult();
    while (isOp('+') || isOp('-')) { const op = toks[pos++].v; l = { type: 'bin', op, l, r: mult() }; }
    return l;
  }
  function mult() {
    let l = unary();
    while (isOp('*') || isOp('/') || isOp('%')) { const op = toks[pos++].v; l = { type: 'bin', op, l, r: unary() }; }
    return l;
  }
  function unary() {
    if (isOp('!')) { pos++; return { type: 'not', e: unary() }; }
    if (isOp('-')) { pos++; return { type: 'neg', e: unary() }; }
    if (isOp('+')) { pos++; return { type: 'num', e: unary() }; }
    return power();
  }
  function power() {
    const base = postfix();
    if (isOp('^')) { pos++; return { type: 'bin', op: '^', l: base, r: unary() }; }
    return base;
  }
  function postfix() {
    if (isOp('++') || isOp('--')) {
      const op = toks[pos++].v;
      return { type: 'incr', op, prefix: true, target: primary() };
    }
    const p = primary();
    if ((isOp('++') || isOp('--')) && ['var', 'index', 'field'].includes(p.type)) {
      const op = toks[pos++].v;
      return { type: 'incr', op, prefix: false, target: p };
    }
    return p;
  }
  function primary() {
    const t = toks[pos++];
    if (!t) throw new AwkError('syntax error: unexpected end of program');
    if (t.t === 'num') return { type: 'lit', v: t.v };
    if (t.t === 'str') return { type: 'lit', v: t.v };
    if (t.t === 'regex') return { type: 'regex', v: t.v };
    if (t.t === 'op' && t.v === '$') return { type: 'field', e: primaryForField() };
    if (t.t === 'op' && t.v === '(') {
      const e = expr();
      if (isOp(',')) { // (a, b) in arr
        const keys = [e];
        while (isOp(',')) { pos++; keys.push(expr()); }
        expectOp(')');
        return { type: 'group', keys };
      }
      expectOp(')');
      return e;
    }
    if (t.t === 'builtin') {
      const args = [];
      if (isOp('(')) {
        pos++;
        if (!isOp(')')) args.push(...exprList(true));
        expectOp(')');
      }
      return { type: 'call', name: t.v, args };
    }
    if (t.t === 'name') {
      if (isOp('[')) {
        pos++;
        const key = exprList(true);
        expectOp(']');
        return { type: 'index', name: t.v, key };
      }
      return { type: 'var', name: t.v };
    }
    throw new AwkError(`syntax error near '${t.v}'`);
  }
  function primaryForField() {
    if (isOp('(')) return primary();
    const t = toks[pos++];
    if (t.t === 'num') return { type: 'lit', v: t.v };
    if (t.t === 'name') return { type: 'var', name: t.v };
    if (t.t === 'op' && (t.v === '++' || t.v === '--')) return { type: 'incr', op: t.v, prefix: true, target: primary() };
    throw new AwkError(`syntax error near '$${t.v}'`);
  }
}

// ---------------------------------------------------------------------------

const looksNumeric = (v) => typeof v === 'number' || /^\s*[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?\s*$/.test(v);
const toNum = (v) => {
  if (typeof v === 'number') return v;
  const m = String(v ?? '').match(/^\s*[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?/);
  return m ? Number(m[0]) : 0;
};
const toStr = (v) => {
  if (typeof v !== 'number') return v ?? '';
  if (Number.isInteger(v)) return String(v);
  return String(Number(v.toPrecision(6)));
};
const truthy = (v) => (typeof v === 'number' ? v !== 0 : v !== '' && !(looksNumeric(v) && toNum(v) === 0 && v.trim() !== ''));

export function runAwk(ctx, { getopts, readInputs, printfFormat }) {
  const args = [...ctx.args];
  const vars = { FS: ' ', OFS: ' ', ORS: '\n', NR: 0, NF: 0, FNR: 0, SUBSEP: '\u001c', RSTART: 0, RLENGTH: -1 };
  // -F, and -v name=value
  const rest = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '-F') vars.FS = args[++i];
    else if (a.startsWith('-F')) vars.FS = a.slice(2);
    else if (a === '-v') {
      const [k, ...v] = args[++i].split('=');
      vars[k] = v.join('=');
    } else rest.push(a);
  }
  void getopts;
  if (vars.FS === '\\t' || vars.FS === 't') vars.FS = '\t';
  const program = rest.shift();
  if (program === undefined) { ctx.err('usage: awk [-F fs][-v var=value] [prog | -f progfile][file ...]\n'); return 2; }
  let items;
  try {
    items = parse(program);
  } catch (e) {
    if (e instanceof AwkError) { ctx.err(`awk: ${e.message}\n source line number 1\n`); return 2; }
    throw e;
  }

  const arrays = {};
  const outFiles = {};
  let fields = [''];
  const regexCache = {};
  const re = (s) => (regexCache[s] ??= new RegExp(s));

  const splitRecord = (line) => {
    const fs = vars.FS;
    if (fs === ' ') return line.trim() === '' ? [] : line.trim().split(/[ \t]+/);
    if (fs.length === 1) return line === '' ? [] : line.split(fs);
    return line === '' ? [] : line.split(new RegExp(fs));
  };
  const setRecord = (line) => {
    fields = [line, ...splitRecord(line)];
    vars.NF = fields.length - 1;
  };
  const rebuildRecord = () => { fields[0] = fields.slice(1).join(toStr(vars.OFS)); };

  const getField = (i) => {
    i = Math.trunc(toNum(i));
    if (i < 0) throw new AwkError(`trying to access out of range field ${i}`);
    return fields[i] ?? '';
  };
  const setField = (i, v) => {
    i = Math.trunc(toNum(i));
    if (i === 0) { setRecord(toStr(v)); return; }
    while (fields.length <= i) fields.push('');
    fields[i] = toStr(v);
    vars.NF = fields.length - 1;
    rebuildRecord();
  };

  const keyOf = (list) => list.map((k) => toStr(evalE(k))).join(vars.SUBSEP);
  const arr = (name) => {
    if (typeof vars[name] !== 'undefined' && !arrays[name]) throw new AwkError(`can't use scalar ${name} as array`);
    return (arrays[name] ??= new Map());
  };

  const getVar = (name) => (name === 'NF' ? vars.NF : vars[name] ?? '');
  const setVar = (name, v) => {
    if (name === 'NF') {
      const n = Math.trunc(toNum(v));
      fields = fields.slice(0, n + 1);
      while (fields.length < n + 1) fields.push('');
      vars.NF = n;
      rebuildRecord();
      return;
    }
    vars[name] = v;
  };

  const lvalue = (t) => {
    switch (t.type) {
      case 'var': return { get: () => getVar(t.name), set: (v) => setVar(t.name, v) };
      case 'index': {
        const k = keyOf(t.key);
        const m = arr(t.name);
        return { get: () => m.get(k) ?? '', set: (v) => m.set(k, v) };
      }
      case 'field': {
        const i = evalE(t.e);
        return { get: () => getField(i), set: (v) => setField(i, v) };
      }
      default: throw new AwkError('invalid assignment target');
    }
  };

  const compareValues = (a, b) => {
    if (looksNumeric(a) && looksNumeric(b)) return toNum(a) - toNum(b);
    const sa = toStr(a);
    const sb = toStr(b);
    return sa < sb ? -1 : sa > sb ? 1 : 0;
  };

  function evalE(e) {
    switch (e.type) {
      case 'lit': return e.v;
      case 'regex': return re(e.v).test(fields[0]) ? 1 : 0;
      case 'field': return getField(evalE(e.e));
      case 'var': return getVar(e.name);
      case 'index': return arr(e.name).get(keyOf(e.key)) ?? '';
      case 'group': return keyOf(e.keys);
      case 'in': {
        const key = e.key.type === 'group' ? keyOf(e.key.keys) : toStr(evalE(e.key));
        return arr(e.arr).has(key) ? 1 : 0;
      }
      case 'assign': {
        const lv = lvalue(e.target);
        let v = evalE(e.value);
        if (e.op !== '=') {
          const cur = toNum(lv.get());
          const r = toNum(v);
          v = { '+=': cur + r, '-=': cur - r, '*=': cur * r, '/=': cur / r, '%=': cur % r, '^=': cur ** r }[e.op];
        }
        lv.set(v);
        return v;
      }
      case 'incr': {
        const lv = lvalue(e.target);
        const old = toNum(lv.get());
        const nv = e.op === '++' ? old + 1 : old - 1;
        lv.set(nv);
        return e.prefix ? nv : old;
      }
      case 'cond': return truthy(evalE(e.cond)) ? evalE(e.a) : evalE(e.b);
      case 'not': return truthy(evalE(e.e)) ? 0 : 1;
      case 'neg': return -toNum(evalE(e.e));
      case 'num': return toNum(evalE(e.e));
      case 'concat': return toStr(evalE(e.l)) + toStr(evalE(e.r));
      case 'match': {
        const r = e.r.type === 'regex' ? re(e.r.v) : re(toStr(evalE(e.r)));
        const hit = r.test(toStr(evalE(e.l)));
        return hit !== e.neg ? 1 : 0;
      }
      case 'bin': {
        if (e.op === '&&') return truthy(evalE(e.l)) && truthy(evalE(e.r)) ? 1 : 0;
        if (e.op === '||') return truthy(evalE(e.l)) || truthy(evalE(e.r)) ? 1 : 0;
        const l = evalE(e.l);
        const r = evalE(e.r);
        switch (e.op) {
          case '+': return toNum(l) + toNum(r);
          case '-': return toNum(l) - toNum(r);
          case '*': return toNum(l) * toNum(r);
          case '/': if (toNum(r) === 0) throw new AwkError('division by zero'); return toNum(l) / toNum(r);
          case '%': return toNum(l) % toNum(r);
          case '^': return toNum(l) ** toNum(r);
          case '<': return compareValues(l, r) < 0 ? 1 : 0;
          case '<=': return compareValues(l, r) <= 0 ? 1 : 0;
          case '>': return compareValues(l, r) > 0 ? 1 : 0;
          case '>=': return compareValues(l, r) >= 0 ? 1 : 0;
          case '==': return compareValues(l, r) === 0 ? 1 : 0;
          case '!=': return compareValues(l, r) !== 0 ? 1 : 0;
        }
        throw new AwkError(`unknown operator ${e.op}`);
      }
      case 'call': return callBuiltin(e);
      default: throw new AwkError(`cannot evaluate ${e.type}`);
    }
  }

  function regexArg(node) {
    return node.type === 'regex' ? new RegExp(node.v) : new RegExp(toStr(evalE(node)));
  }

  function callBuiltin(e) {
    const a = e.args;
    switch (e.name) {
      case 'length': {
        if (!a.length) return fields[0].length;
        if (a[0].type === 'var' && arrays[a[0].name]) return arrays[a[0].name].size;
        return toStr(evalE(a[0])).length;
      }
      case 'substr': {
        const s = toStr(evalE(a[0]));
        let start = Math.round(toNum(evalE(a[1])));
        let len = a[2] ? Math.round(toNum(evalE(a[2]))) : Infinity;
        if (start < 1) { len += start - 1; start = 1; }
        return len <= 0 ? '' : s.substr(start - 1, len === Infinity ? undefined : len);
      }
      case 'index': return toStr(evalE(a[0])).indexOf(toStr(evalE(a[1]))) + 1;
      case 'split': {
        const s = toStr(evalE(a[0]));
        const name = a[1].name;
        const sep = a[2] ? (a[2].type === 'regex' ? new RegExp(a[2].v) : toStr(evalE(a[2]))) : vars.FS;
        const parts = s === '' ? [] : sep === ' ' ? s.trim().split(/[ \t]+/) : s.split(sep);
        const m = new Map();
        parts.forEach((p, i) => m.set(String(i + 1), p));
        arrays[name] = m;
        return parts.length;
      }
      case 'tolower': return toStr(evalE(a[0])).toLowerCase();
      case 'toupper': return toStr(evalE(a[0])).toUpperCase();
      case 'sprintf': return printfFormat(toStr(evalE(a[0])), a.slice(1).map((x) => toStr(evalE(x))));
      case 'int': return Math.trunc(toNum(evalE(a[0])));
      case 'sqrt': return Math.sqrt(toNum(evalE(a[0])));
      case 'rand': return Math.random();
      case 'srand': return 0;
      case 'systime': return Math.floor(ctx.shell.now().getTime() / 1000);
      case 'match': {
        const s = toStr(evalE(a[0]));
        const m = regexArg(a[1]).exec(s);
        vars.RSTART = m ? m.index + 1 : 0;
        vars.RLENGTH = m ? m[0].length : -1;
        return vars.RSTART;
      }
      case 'sub': case 'gsub': {
        const r = regexArg(a[0]);
        const repl = toStr(evalE(a[1])).replace(/\$/g, '$$$$').replace(/\\&/g, '\u0001').replace(/&/g, '$&').replace(/\u0001/g, '&');
        const target = a[2] ?? { type: 'field', e: { type: 'lit', v: 0 } };
        const lv = lvalue(target);
        const s = toStr(lv.get());
        let count = 0;
        const out = s.replace(new RegExp(r.source, e.name === 'gsub' ? 'g' : ''), (...m) => {
          count++;
          return m[0].replace(/[\s\S]*/, () => repl.replace(/\$&/g, m[0]).replace(/\$\$/g, '$'));
        });
        if (count) lv.set(out);
        return count;
      }
      case 'strftime': return new Date().toISOString();
      default: throw new AwkError(`function ${e.name} not supported`);
    }
  }

  const emit = (text, redirect) => {
    if (!redirect) { ctx.out(text); return; }
    const file = toStr(evalE(redirect.target));
    if (!(file in outFiles)) {
      outFiles[file] = true;
      if (redirect.op === '>') ctx.fs.write(file, '');
    }
    ctx.fs.write(file, text, { append: true });
  };

  function execS(s) {
    switch (s.type) {
      case 'block': for (const x of s.stmts) execS(x); return;
      case 'expr': evalE(s.e); return;
      case 'print': {
        const parts = s.args.length ? s.args.map((x) => {
          const v = evalE(x);
          return typeof v === 'number' ? (Number.isInteger(v) ? String(v) : String(Number(v.toPrecision(6)))) : v;
        }) : [fields[0]];
        emit(parts.join(toStr(vars.OFS)) + toStr(vars.ORS), s.redirect);
        return;
      }
      case 'printf': {
        if (!s.args.length) throw new AwkError('printf: no format');
        const [fmt, ...rest] = s.args.map((x) => toStr(evalE(x)));
        emit(printfFormat(fmt, rest), s.redirect);
        return;
      }
      case 'if': if (truthy(evalE(s.cond))) execS(s.then); else if (s.otherwise) execS(s.otherwise); return;
      case 'while': { let n = 0; while (truthy(evalE(s.cond))) { if (++n > 100000) throw new AwkError('loop ran too long'); execS(s.body); } return; }
      case 'for': {
        let n = 0;
        for (s.init && evalE(s.init); s.cond ? truthy(evalE(s.cond)) : true; s.incr && evalE(s.incr)) {
          if (++n > 100000) throw new AwkError('loop ran too long');
          execS(s.body);
        }
        return;
      }
      case 'forin': {
        for (const k of [...arr(s.arr).keys()]) { setVar(s.v, k); execS(s.body); }
        return;
      }
      case 'next': throw new NextSignal();
      case 'exit': throw new ExitSignal(s.code ? toNum(evalE(s.code)) : 0);
      case 'delete': {
        if (s.key) arr(s.name).delete(keyOf(s.key));
        else arr(s.name).clear();
        return;
      }
      default: throw new AwkError(`cannot run ${s.type}`);
    }
  }

  let exitCode = 0;
  const runItems = (kind) => {
    for (const it of items) if (it.kind === kind) execS(it.body);
  };
  try {
    try {
      setRecord('');
      runItems('BEGIN');
      const hasMain = items.some((it) => it.kind !== 'BEGIN');
      if (hasMain) {
        const inputs = readInputs(ctx, rest.filter((r) => !/^[A-Za-z_]\w*=/.test(r)));
        for (const { name, text } of inputs) {
          vars.FILENAME = name ?? '';
          vars.FNR = 0;
          const ls = text ? text.split('\n') : [];
          if (ls[ls.length - 1] === '') ls.pop();
          for (const line of ls) {
            vars.NR++;
            vars.FNR++;
            setRecord(line);
            try {
              for (const it of items) {
                if (it.kind !== 'main') continue;
                if (it.pattern && !truthy(evalE(it.pattern))) continue;
                if (it.body) execS(it.body);
                else ctx.out(fields[0] + toStr(vars.ORS));
              }
            } catch (e) {
              if (!(e instanceof NextSignal)) throw e;
            }
          }
        }
      }
    } catch (e) {
      if (!(e instanceof ExitSignal)) throw e;
      exitCode = e.code;
    }
    runItems('END');
  } catch (e) {
    if (e instanceof ExitSignal) return e.code;
    if (e instanceof AwkError) { ctx.err(`awk: ${e.message}\n`); return 2; }
    throw e;
  }
  return exitCode;
}
