// Commands for the practice shell. Each takes a context
// { name, args, stdin, out, err, io, shell, fs } and returns an exit status.
// Output mimics GNU/Linux, since that's what AWS servers run.
import { FsError, baseOf, parentOf, globToRegex } from './fs';
import { runAwk } from './awk';
import { evaluate } from './arith';

export class UsageError extends Error {}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Short/long option parser. spec: { flags: 'abc', values: 'nk', long: { lines: 'n', all: 'a' } }
export function getopts(name, args, { flags = '', values = '', long = {} } = {}) {
  const opts = {};
  const rest = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--') { rest.push(...args.slice(i + 1)); break; }
    if (a.startsWith('--') && a.length > 2) {
      const [key, inline] = a.slice(2).split(/=(.*)/s);
      const short = long[key];
      if (short === undefined) throw new UsageError(`${name}: unrecognized option '--${key}'`);
      if (values.includes(short)) opts[short] = inline ?? args[++i];
      else opts[short] = true;
      continue;
    }
    if (a.startsWith('-') && a.length > 1 && !/^-\d/.test(a)) {
      for (let j = 1; j < a.length; j++) {
        const f = a[j];
        if (values.includes(f)) {
          opts[f] = a.slice(j + 1) || args[++i];
          if (opts[f] === undefined) throw new UsageError(`${name}: option requires an argument -- '${f}'`);
          break;
        }
        if (!flags.includes(f)) throw new UsageError(`${name}: invalid option -- '${f}'`);
        opts[f] = true;
      }
      continue;
    }
    rest.push(a);
  }
  return { opts, rest };
}

const lines = (text) => {
  if (!text) return [];
  const ls = text.split('\n');
  if (ls[ls.length - 1] === '') ls.pop();
  return ls;
};
const joinLines = (ls) => (ls.length ? ls.join('\n') + '\n' : '');

// Reads the named files, or stdin when there are none (or for "-")
function readInputs(ctx, files) {
  if (!files.length) return [{ name: null, text: ctx.stdin }];
  return files.map((f) => (f === '-' ? { name: '-', text: ctx.stdin } : { name: f, text: ctx.fs.read(f) }));
}

const human = (bytes) => {
  if (bytes < 1024) return String(bytes);
  const units = ['K', 'M', 'G', 'T'];
  let v = bytes;
  let u = -1;
  do { v /= 1024; u++; } while (v >= 1024 && u < units.length - 1);
  return (v < 10 ? v.toFixed(1).replace(/\.0$/, '') : Math.round(v)) + units[u];
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAYS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const pad = (n, w = 2, c = '0') => String(n).padStart(w, c);

export function formatDate(d, fmt) {
  return fmt.replace(/%([a-zA-Z%])/g, (_, c) => {
    switch (c) {
      case 'Y': return d.getUTCFullYear();
      case 'y': return pad(d.getUTCFullYear() % 100);
      case 'm': return pad(d.getUTCMonth() + 1);
      case 'd': return pad(d.getUTCDate());
      case 'e': return pad(d.getUTCDate(), 2, ' ');
      case 'H': return pad(d.getUTCHours());
      case 'I': return pad(d.getUTCHours() % 12 || 12);
      case 'p': return d.getUTCHours() < 12 ? 'AM' : 'PM';
      case 'M': return pad(d.getUTCMinutes());
      case 'S': return pad(d.getUTCSeconds());
      case 'F': return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
      case 'T': return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
      case 'R': return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
      case 'D': return `${pad(d.getUTCMonth() + 1)}/${pad(d.getUTCDate())}/${pad(d.getUTCFullYear() % 100)}`;
      case 's': return Math.floor(d.getTime() / 1000);
      case 'a': return DAYS[d.getUTCDay()];
      case 'A': return DAYS_LONG[d.getUTCDay()];
      case 'b': case 'h': return MONTHS[d.getUTCMonth()];
      case 'B': return MONTHS_LONG[d.getUTCMonth()];
      case 'u': return d.getUTCDay() || 7;
      case 'w': return d.getUTCDay();
      case 'j': return pad(Math.floor((d - Date.UTC(d.getUTCFullYear(), 0, 1)) / 864e5) + 1, 3);
      case 'Z': return 'UTC';
      case 'z': return '+0000';
      case 'n': return '\n';
      case 't': return '\t';
      case '%': return '%';
      default: return `%${c}`;
    }
  });
}

function parseDateString(s, now) {
  const t = s.trim().toLowerCase();
  const day = 864e5;
  if (t === 'now' || t === 'today') return now;
  if (t === 'yesterday') return new Date(now - day);
  if (t === 'tomorrow') return new Date(+now + day);
  let m;
  if ((m = t.match(/^@(\d+)$/))) return new Date(Number(m[1]) * 1000);
  if ((m = t.match(/^(-?\d+)\s*(second|minute|hour|day|week|month|year)s?(\s+ago)?$/))) {
    const sizes = { second: 1e3, minute: 6e4, hour: 36e5, day, week: 7 * day, month: 30 * day, year: 365 * day };
    const n = Number(m[1]) * sizes[m[2]] * (m[3] ? -1 : 1);
    return new Date(+now + n);
  }
  const parsed = new Date(/z$|[+-]\d\d:?\d\d$/.test(t) ? s : `${s.trim().replace(' ', 'T')}${s.includes(':') ? '' : 'T00:00:00'}Z`);
  if (!isNaN(parsed)) return parsed;
  return null;
}

// Basic/extended POSIX regular expression -> JavaScript RegExp
export function toRegex(pattern, { extended = false, ignoreCase = false, word = false, fixed = false, global = false } = {}) {
  let src;
  if (fixed) src = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  else {
    src = pattern
      .replace(/\[\[:digit:\]\]/g, '[0-9]').replace(/\[:digit:\]/g, '0-9')
      .replace(/\[\[:space:\]\]/g, '\\s').replace(/\[:space:\]/g, '\\s')
      .replace(/\[\[:alpha:\]\]/g, '[A-Za-z]').replace(/\[:alpha:\]/g, 'A-Za-z')
      .replace(/\[\[:alnum:\]\]/g, '[A-Za-z0-9]').replace(/\[:alnum:\]/g, 'A-Za-z0-9')
      .replace(/\[\[:upper:\]\]/g, '[A-Z]').replace(/\[:upper:\]/g, 'A-Z')
      .replace(/\[\[:lower:\]\]/g, '[a-z]').replace(/\[:lower:\]/g, 'a-z')
      .replace(/\[\[:punct:\]\]/g, '[!-/:-@[-`{-~]');
    if (!extended) {
      // In basic regex, + ? | ( ) { } are literal unless backslashed
      let out = '';
      for (let i = 0; i < src.length; i++) {
        const c = src[i];
        if (c === '\\' && i + 1 < src.length) {
          const n = src[++i];
          out += '+?|(){}'.includes(n) ? n : `\\${n}`;
        } else out += '+?|(){}'.includes(c) ? `\\${c}` : c;
      }
      src = out;
    }
  }
  if (word) src = `\\b(?:${src})\\b`;
  return new RegExp(src, (ignoreCase ? 'i' : '') + (global ? 'g' : ''));
}

const modeString = (node) => {
  const m = node.mode;
  const bits = 'rwxrwxrwx'.split('').map((ch, i) => (m & (1 << (8 - i)) ? ch : '-')).join('');
  return (node.type === 'dir' ? 'd' : '-') + bits;
};

const lsDate = (ms, now) => {
  const d = new Date(ms);
  const recent = Math.abs(now - d) < 180 * 864e5;
  return `${MONTHS[d.getUTCMonth()]} ${pad(d.getUTCDate(), 2, ' ')} ${recent ? `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}` : ` ${d.getUTCFullYear()}`}`;
};

const unescapeEcho = (s) =>
  s.replace(/\\(\\|n|t|r|a|b|e|0[0-7]{0,3}|c)/g, (m, c) => ({ '\\': '\\', n: '\n', t: '\t', r: '\r', a: '\x07', b: '\b', e: '\x1b', c: '\u0000STOP' })[c] ?? String.fromCharCode(parseInt(c.slice(1) || '0', 8)));

function printfFormat(fmt, args) {
  const f = unescapeEcho(fmt);
  let out = '';
  let ai = 0;
  const spec = /%([-+ 0#]*)(\d+|\*)?(?:\.(\d+))?([sdifxXoceEgG%b])/g;
  do {
    let consumed = false;
    out += f.replace(spec, (_, flags, width, prec, conv) => {
      if (conv === '%') return '%';
      consumed = true;
      let arg = args[ai++];
      let s;
      switch (conv) {
        case 's': s = arg ?? ''; if (prec !== undefined) s = s.slice(0, Number(prec)); break;
        case 'b': s = unescapeEcho(arg ?? ''); break;
        case 'c': s = (arg ?? '').charAt(0); break;
        case 'd': case 'i': {
          const n = Math.trunc(Number(arg ?? 0)) || 0;
          s = String(Math.abs(n));
          if (prec !== undefined) s = s.padStart(Number(prec), '0');
          s = (n < 0 ? '-' : flags.includes('+') ? '+' : flags.includes(' ') ? ' ' : '') + s;
          break;
        }
        case 'f': case 'e': case 'E': case 'g': case 'G': {
          const n = Number(arg ?? 0) || 0;
          const p = prec === undefined ? 6 : Number(prec);
          s = conv === 'f' ? n.toFixed(p) : conv.toLowerCase() === 'e' ? n.toExponential(p) : String(Number(n.toPrecision(p || 1)));
          if (conv === 'E' || conv === 'G') s = s.toUpperCase();
          if (flags.includes('+') && n >= 0) s = `+${s}`;
          break;
        }
        case 'x': s = (Math.trunc(Number(arg ?? 0)) || 0).toString(16); break;
        case 'X': s = (Math.trunc(Number(arg ?? 0)) || 0).toString(16).toUpperCase(); break;
        case 'o': s = (Math.trunc(Number(arg ?? 0)) || 0).toString(8); break;
        default: s = '';
      }
      const w = width ? Number(width) : 0;
      if (s.length < w) {
        if (flags.includes('-')) s = s.padEnd(w);
        else if (flags.includes('0') && /[dfieEgGxXo]/.test(conv)) {
          const sign = /^[-+ ]/.test(s) ? s[0] : '';
          s = sign + s.slice(sign.length).padStart(w - sign.length, '0');
        } else s = s.padStart(w);
      }
      return s;
    });
    if (!consumed) break;
  } while (ai < args.length);
  const stop = out.indexOf('\u0000STOP');
  return stop === -1 ? out : out.slice(0, stop);
}

// ---------------------------------------------------------------------------
// test / [ / [[
// ---------------------------------------------------------------------------
function evalTest(ctx, args, extended) {
  const { fs } = ctx;
  let pos = 0;
  const peek = () => args[pos];
  const next = () => args[pos++];
  const toInt = (s) => {
    if (!/^\s*-?\d+\s*$/.test(s ?? '')) throw new UsageError(`${extended ? '[[' : '['}: ${s}: integer expression expected`);
    return Number(s);
  };
  const unary = {
    '-e': (a) => fs.exists(a), '-f': (a) => fs.isFile(a), '-d': (a) => fs.isDir(a),
    '-s': (a) => fs.isFile(a) && fs.read(a).length > 0, '-r': (a) => fs.exists(a), '-w': (a) => fs.exists(a),
    '-x': (a) => !!(fs.node(a) && fs.node(a).mode & 0o100), '-z': (a) => a.length === 0, '-n': (a) => a.length > 0,
    '-L': () => false, '-h': () => false,
  };
  const binary = {
    '=': (a, b) => (extended ? globToRegex(b).test(a) : a === b),
    '==': (a, b) => (extended ? globToRegex(b).test(a) : a === b),
    '!=': (a, b) => (extended ? !globToRegex(b).test(a) : a !== b),
    '=~': (a, b) => new RegExp(b).test(a),
    '<': (a, b) => a < b, '>': (a, b) => a > b,
    '-eq': (a, b) => toInt(a) === toInt(b), '-ne': (a, b) => toInt(a) !== toInt(b),
    '-lt': (a, b) => toInt(a) < toInt(b), '-le': (a, b) => toInt(a) <= toInt(b),
    '-gt': (a, b) => toInt(a) > toInt(b), '-ge': (a, b) => toInt(a) >= toInt(b),
    '-nt': (a, b) => (fs.node(a)?.mtime ?? 0) > (fs.node(b)?.mtime ?? 0),
    '-ot': (a, b) => (fs.node(a)?.mtime ?? 0) < (fs.node(b)?.mtime ?? 0),
  };
  const OR = extended ? '||' : '-o';
  const AND = extended ? '&&' : '-a';

  function orExpr() {
    let v = andExpr();
    while (peek() === OR) { next(); const r = andExpr(); v = v || r; }
    return v;
  }
  function andExpr() {
    let v = notExpr();
    while (peek() === AND) { next(); const r = notExpr(); v = v && r; }
    return v;
  }
  function notExpr() {
    if (peek() === '!') { next(); return !notExpr(); }
    return primary();
  }
  function primary() {
    const a = next();
    if (a === undefined) return false;
    if (a === '(') {
      const v = orExpr();
      if (next() !== ')') throw new UsageError(`${extended ? '[[' : '['}: missing ')'`);
      return v;
    }
    if (unary[a] && peek() !== undefined && !binary[peek()]) return unary[a](next());
    if (binary[peek()]) {
      const op = next();
      const b = next();
      if (b === undefined) throw new UsageError(`${extended ? '[[' : '['}: ${op}: argument expected`);
      return binary[op](a, b);
    }
    if (unary[a] && peek() === undefined) return true; // [ -n ] is true: "-n" is a non-empty string
    return a.length > 0;
  }
  const result = orExpr();
  if (pos < args.length) throw new UsageError(`${extended ? '[[' : '['}: too many arguments`);
  return result;
}

const testCmd = (ctx, args, extended = false) => {
  try {
    return evalTest(ctx, args, extended) ? 0 : 1;
  } catch (e) {
    if (e instanceof UsageError) { ctx.err(`bash: ${e.message}\n`); return 2; }
    throw e;
  }
};

// ---------------------------------------------------------------------------
// find
// ---------------------------------------------------------------------------
function findCmd(ctx) {
  const { args, fs, shell } = ctx;
  const paths = [];
  let i = 0;
  while (i < args.length && !args[i].startsWith('-') && args[i] !== '!' && args[i] !== '(') paths.push(args[i++]);
  if (!paths.length) paths.push('.');
  const tests = [];
  let maxdepth = Infinity;
  let mindepth = 0;
  let action = null;
  let negateNext = false;
  for (; i < args.length; i++) {
    const a = args[i];
    const val = () => {
      const v = args[++i];
      if (v === undefined) throw new UsageError(`find: missing argument to '${a}'`);
      return v;
    };
    let t = null;
    switch (a) {
      case '!': case '-not': negateNext = true; continue;
      case '-name': { const re = globToRegex(val()); t = (p) => re.test(baseOf(p.path)); break; }
      case '-iname': { const re = new RegExp(globToRegex(val()).source, 'i'); t = (p) => re.test(baseOf(p.path)); break; }
      case '-path': { const re = new RegExp(globToRegex(val()).source.replace(/\[\^\/\]\*/g, '.*')); t = (p) => re.test(p.shown); break; }
      case '-type': { const ty = val(); t = (p) => (ty === 'd' ? p.node.type === 'dir' : p.node.type === 'file'); break; }
      case '-mtime': case '-mmin': {
        const v = val();
        const unit = a === '-mtime' ? 864e5 : 6e4;
        const n = Number(v.replace(/^[+-]/, ''));
        t = (p) => {
          const age = Math.floor((shell.now() - p.node.mtime) / unit);
          return v.startsWith('+') ? age > n : v.startsWith('-') ? age < n : age === n;
        };
        break;
      }
      case '-size': {
        const v = val();
        const m = v.match(/^([+-]?)(\d+)([ckMG]?)$/);
        if (!m) throw new UsageError(`find: invalid -size '${v}'`);
        const mult = { c: 1, k: 1024, M: 1024 ** 2, G: 1024 ** 3, '': 512 }[m[3]];
        t = (p) => {
          const size = p.node.type === 'file' ? p.node.content.length : 0;
          const lim = Number(m[2]) * mult;
          return m[1] === '+' ? size > lim : m[1] === '-' ? size < lim : Math.ceil(size / mult) === Number(m[2]);
        };
        break;
      }
      case '-empty': t = (p) => (p.node.type === 'file' ? !p.node.content.length : !Object.keys(p.node.children).length); break;
      case '-newer': { const ref = fs.node(val()); t = (p) => p.node.mtime > (ref?.mtime ?? 0); break; }
      case '-maxdepth': maxdepth = Number(val()); continue;
      case '-mindepth': mindepth = Number(val()); continue;
      case '-print': action = action || 'print'; continue;
      case '-delete': action = 'delete'; continue;
      case '-exec': {
        const cmd = [];
        while (++i < args.length && args[i] !== ';' && args[i] !== '+') cmd.push(args[i]);
        action = { exec: cmd, batch: args[i] === '+' };
        continue;
      }
      default: throw new UsageError(`find: unknown predicate '${a}'`);
    }
    if (negateNext) { const inner = t; t = (p) => !inner(p); negateNext = false; }
    tests.push(t);
  }

  const matches = [];
  for (const start of paths) {
    if (!fs.exists(start)) { ctx.err(`find: '${start}': No such file or directory\n`); continue; }
    const startAbs = fs.resolve(start);
    for (const { path, node } of fs.walk(start)) {
      const rel = path === startAbs ? start : start.replace(/\/$/, '') + path.slice(startAbs.length === 1 ? 0 : startAbs.length);
      const depth = path === startAbs ? 0 : path.slice(startAbs.length).split('/').filter(Boolean).length;
      if (depth > maxdepth || depth < mindepth) continue;
      const p = { path, node, shown: rel };
      if (tests.every((t) => t(p))) matches.push(p);
    }
  }
  if (action === 'delete') {
    for (const p of [...matches].reverse()) { if (fs.exists(p.path)) fs.remove(p.path, { recursive: true }); }
    return 0;
  }
  if (action?.exec) {
    let status = 0;
    const run = (files) => {
      const words = action.exec.flatMap((w) => (w === '{}' ? files : [w]));
      const s = shell.invoke(words, ctx.io);
      if (s !== 0) status = s;
    };
    if (action.batch) run(matches.map((m) => m.shown));
    else for (const m of matches) run([m.shown]);
    return status;
  }
  ctx.out(joinLines(matches.map((m) => m.shown)));
  return 0;
}

// ---------------------------------------------------------------------------
// tar (archives are stored as JSON inside the fake file)
// ---------------------------------------------------------------------------
const TAR_MAGIC = '\u0000PRACTICE-TAR\u0000';

function tarCmd(ctx) {
  const { fs } = ctx;
  let args = [...ctx.args];
  // "tar czf x.tgz dir" (no dash) is common
  if (args[0] && !args[0].startsWith('-') && /^[cxtzvfC]+$/.test(args[0])) args[0] = `-${args[0]}`;
  const { opts, rest } = getopts('tar', args, { flags: 'cxtzvjp', values: 'fC', long: { create: 'c', extract: 'x', list: 't', gzip: 'z', verbose: 'v', file: 'f', directory: 'C' } });
  if (!opts.f) throw new UsageError('tar: Refusing to write archive contents to terminal (missing -f option?)');
  if (opts.c) {
    if (!rest.length) throw new UsageError('tar: Cowardly refusing to create an empty archive');
    const base = opts.C ? fs.resolve(opts.C) : fs.cwd;
    const entries = {};
    for (const item of rest) {
      const abs = fs.resolve(item, base);
      if (!fs.exists(abs)) { ctx.err(`tar: ${item}: Cannot stat: No such file or directory\n`); continue; }
      const absBase = fs.resolve(item.startsWith('/') ? '/' : '.', base);
      for (const { path, node } of fs.walk(abs)) {
        const rel = path.slice(absBase === '/' ? 1 : absBase.length + 1) + (node.type === 'dir' ? '/' : '');
        entries[rel] = node.type === 'dir' ? null : node.content;
        if (opts.v) ctx.out(`${rel}\n`);
      }
    }
    // A gzip'd archive is about a third of the size for text
    const body = JSON.stringify(entries);
    const padding = opts.z ? '' : ' '.repeat(Math.round(body.length * 0.2));
    fs.write(opts.f, TAR_MAGIC + body + padding);
    return 0;
  }
  const raw = fs.read(opts.f);
  if (!raw.startsWith(TAR_MAGIC)) throw new UsageError(`tar: ${opts.f}: This does not look like a tar archive`);
  const entries = JSON.parse(raw.slice(TAR_MAGIC.length).trimEnd());
  if (opts.t) { ctx.out(joinLines(Object.keys(entries))); return 0; }
  if (opts.x) {
    const base = opts.C ? fs.resolve(opts.C) : fs.cwd;
    for (const [rel, content] of Object.entries(entries)) {
      const abs = fs.resolve(rel, base);
      if (content === null) fs.mkdir(abs, { parents: true });
      else { fs.mkdir(parentOf(abs), { parents: true }); fs.write(abs, content); }
      if (opts.v) ctx.out(`${rel}\n`);
    }
    return 0;
  }
  throw new UsageError('tar: You must specify one of the -c, -t, -x options');
}

// ---------------------------------------------------------------------------
// curl against the scenario's pretend web
// ---------------------------------------------------------------------------
function curlCmd(ctx) {
  const { shell, fs } = ctx;
  const { opts, rest } = getopts('curl', ctx.args, {
    flags: 'sSIifLkvO', values: 'owmXHdAu',
    long: { silent: 's', 'show-error': 'S', head: 'I', include: 'i', fail: 'f', location: 'L', insecure: 'k', output: 'o', 'write-out': 'w', 'max-time': 'm', 'connect-timeout': 'm', request: 'X', header: 'H', data: 'd', 'user-agent': 'A', verbose: 'v', 'remote-name': 'O' },
  });
  const url = rest[0];
  const fail = (code, msg) => {
    if (!opts.s || opts.S) ctx.err(`curl: (${code}) ${msg}\n`);
    return code;
  };
  if (!url) { ctx.err("curl: try 'curl --help' for more information\n"); return 2; }
  const normalized = url.replace(/^(?!https?:\/\/)/, 'http://');
  const site = shell.web[normalized] ?? shell.web[normalized.replace(/\/$/, '')] ?? shell.web[`${normalized.replace(/\/$/, '')}/`];
  if (!site) return fail(6, `Could not resolve host: ${normalized.replace(/^https?:\/\//, '').split('/')[0]}`);
  const ms = site.ms ?? 120;
  const maxTime = opts.m ? Number(opts.m) * 1000 : Infinity;
  if (site.timeout || ms > maxTime) return fail(28, `Operation timed out after ${Math.min(ms, maxTime)} milliseconds with 0 bytes received`);
  const status = site.status ?? 200;
  const body = site.body ?? '';
  const headers = { 'content-type': 'text/html; charset=utf-8', ...(site.headers || {}) };
  const headerText = `HTTP/2 ${status}\r\n${Object.entries(headers).map(([k, v]) => `${k}: ${v}`).join('\r\n')}\r\n\r\n`;
  if (opts.f && status >= 400) {
    const code = fail(22, `The requested URL returned error: ${status}`);
    if (opts.w) ctx.out(writeOut(opts.w, { status, ms, size: 0, url: normalized }));
    return code;
  }
  const payload = opts.I ? headerText : (opts.i ? headerText : '') + body;
  if (opts.o) { if (opts.o !== '/dev/null') fs.write(opts.o, payload); }
  else if (opts.O) fs.write(baseOf(normalized) || 'index.html', payload);
  else ctx.out(payload);
  if (opts.w) ctx.out(writeOut(opts.w, { status, ms, size: body.length, url: normalized }));
  return 0;
}

const writeOut = (fmt, r) =>
  unescapeEcho(fmt).replace(/%\{(\w+)\}/g, (m, k) => ({
    http_code: String(r.status), response_code: String(r.status), time_total: (r.ms / 1000).toFixed(6),
    size_download: String(r.size), url_effective: r.url,
  })[k] ?? m);

// ---------------------------------------------------------------------------
// jq (just enough: paths, [], |, keys, length, -r)
// ---------------------------------------------------------------------------
function jqCmd(ctx) {
  const { opts, rest } = getopts('jq', ctx.args, { flags: 'rcne', long: { 'raw-output': 'r', 'compact-output': 'c' } });
  const filter = rest[0] ?? '.';
  const inputs = readInputs(ctx, rest.slice(1));
  const results = [];
  const applyPath = (values, segment) => {
    segment = segment.trim();
    if (segment === '.' || segment === '') return values;
    if (segment === 'keys') return values.map((v) => Object.keys(v).sort());
    if (segment === 'length') return values.map((v) => (v == null ? 0 : typeof v === 'object' ? Object.keys(v).length : String(v).length));
    if (!segment.startsWith('.')) throw new UsageError(`jq: error: unsupported filter '${segment}'`);
    const parts = segment.slice(1).match(/[^.[\]]+|\[\d*\]/g) || [];
    let cur = values;
    for (const part of parts) {
      if (part === '[]') cur = cur.flatMap((v) => (v && typeof v === 'object' ? Object.values(v) : []));
      else if (/^\[\d+\]$/.test(part)) cur = cur.map((v) => v?.[Number(part.slice(1, -1))] ?? null);
      else cur = cur.map((v) => (v && typeof v === 'object' ? v[part.replace(/^"|"$/g, '')] ?? null : null));
    }
    return cur;
  };
  for (const { text } of inputs) {
    let docs;
    try {
      docs = [JSON.parse(text)];
    } catch {
      ctx.err('jq: error: input is not valid JSON\n');
      return 2;
    }
    for (const seg of filter.split('|')) docs = applyPath(docs, seg);
    results.push(...docs);
  }
  for (const v of results) {
    if (opts.r && typeof v === 'string') ctx.out(`${v}\n`);
    else ctx.out(`${JSON.stringify(v, null, opts.c ? 0 : 2)}\n`);
  }
  return 0;
}

// ---------------------------------------------------------------------------
// sed (s, d, p with optional address)
// ---------------------------------------------------------------------------
function sedCmd(ctx) {
  const { opts, rest } = getopts('sed', ctx.args, { flags: 'nEri', values: 'e', long: { quiet: 'n', 'in-place': 'i', 'regexp-extended': 'E', expression: 'e' } });
  const script = opts.e ?? rest.shift();
  if (script === undefined) throw new UsageError('sed: no script given');
  const extended = opts.E || opts.r;
  const commands = splitSed(script).map((c) => parseSedCommand(c.trim(), extended)).filter(Boolean);
  const process = (text) => {
    const out = [];
    const ls = lines(text);
    ls.forEach((line, idx) => {
      let deleted = false;
      let printedExtra = [];
      for (const c of commands) {
        if (!c.match(line, idx + 1, idx === ls.length - 1)) continue;
        if (c.op === 'd') { deleted = true; break; }
        if (c.op === 'p') printedExtra.push(line);
        if (c.op === 's') {
          const before = line;
          line = line.replace(c.re, c.replacement);
          if (c.print && before !== line) printedExtra.push(line);
        }
      }
      if (!deleted) {
        out.push(...printedExtra);
        if (!opts.n) out.push(line);
      }
    });
    return joinLines(out);
  };
  if (opts.i) {
    for (const f of rest) ctx.fs.write(f, process(ctx.fs.read(f)));
    return 0;
  }
  for (const { text } of readInputs(ctx, rest)) ctx.out(process(text));
  return 0;
}

const splitSed = (script) => {
  const parts = [];
  let cur = '';
  let inS = 0;
  for (let i = 0; i < script.length; i++) {
    const c = script[i];
    if (c === '\\') { cur += c + (script[++i] ?? ''); continue; }
    if (inS === 0 && c === 's' && /^[^a-zA-Z0-9\s\\]/.test(script[i + 1] ?? '') && !/[a-zA-Z]$/.test(cur.trim())) { inS = 3; cur += c; const d = script[++i]; cur += d; parts.delim = d; continue; }
    if (inS > 0 && c === parts.delim) { inS--; cur += c; if (inS === 1) inS = 0; continue; }
    if (inS === 0 && (c === ';' || c === '\n')) { parts.push(cur); cur = ''; continue; }
    cur += c;
  }
  parts.push(cur);
  return parts;
};

function parseSedCommand(cmd, extended) {
  if (!cmd) return null;
  let match = () => true;
  let m;
  if ((m = cmd.match(/^\/((?:\\.|[^/])*)\//))) {
    const re = toRegex(m[1], { extended });
    match = (line) => re.test(line);
    cmd = cmd.slice(m[0].length).trim();
  } else if ((m = cmd.match(/^(\d+|\$)(?:,(\d+|\$))?/))) {
    const a = m[1];
    const b = m[2];
    match = (line, n, last) => {
      const at = (x) => (x === '$' ? last : n === Number(x));
      if (b === undefined) return at(a);
      const lo = a === '$' ? Infinity : Number(a);
      return n >= lo && (b === '$' || n <= Number(b));
    };
    cmd = cmd.slice(m[0].length).trim();
  }
  if (cmd === 'd' || cmd === 'p') return { op: cmd, match };
  if (cmd.startsWith('s')) {
    const delim = cmd[1];
    const parts = [];
    let cur = '';
    for (let i = 2; i < cmd.length; i++) {
      if (cmd[i] === '\\' && cmd[i + 1] === delim) { cur += delim; i++; continue; }
      if (cmd[i] === delim) { parts.push(cur); cur = ''; continue; }
      cur += cmd[i];
    }
    parts.push(cur);
    const [pattern, replacement = '', flags = ''] = parts;
    const re = toRegex(pattern, { extended, ignoreCase: flags.includes('i') || flags.includes('I'), global: flags.includes('g') });
    // sed uses & and \1; JavaScript uses $& and $1
    const jsReplacement = replacement.replace(/\$/g, '$$$$').replace(/\\([0-9])/g, '$$$1').replace(/(^|[^\\])&/g, '$1$$&').replace(/\\&/g, '&').replace(/\\n/g, '\n').replace(/\\\//g, '/');
    return { op: 's', match, re, replacement: jsReplacement, print: flags.includes('p') };
  }
  throw new UsageError(`sed: unsupported command: ${cmd}`);
}

// ---------------------------------------------------------------------------
// tr
// ---------------------------------------------------------------------------
const expandTrSet = (set) => {
  const s = set
    .replace(/\[:upper:\]/g, 'A-Z').replace(/\[:lower:\]/g, 'a-z').replace(/\[:digit:\]/g, '0-9')
    .replace(/\[:alpha:\]/g, 'a-zA-Z').replace(/\[:alnum:\]/g, 'a-zA-Z0-9').replace(/\[:space:\]/g, ' \t\n\r')
    .replace(/\[:punct:\]/g, '!-/:-@[-`{-~');
  const chars = [];
  const unesc = unescapeEcho(s);
  for (let i = 0; i < unesc.length; i++) {
    if (unesc[i + 1] === '-' && i + 2 < unesc.length) {
      for (let c = unesc.charCodeAt(i); c <= unesc.charCodeAt(i + 2); c++) chars.push(String.fromCharCode(c));
      i += 2;
    } else chars.push(unesc[i]);
  }
  return chars;
};

// ---------------------------------------------------------------------------
// The command table
// ---------------------------------------------------------------------------
const wrap = (fn) => (ctx) => {
  try {
    return fn(ctx);
  } catch (e) {
    if (e instanceof UsageError) { ctx.err(`${e.message}\n`); return 2; }
    if (e instanceof FsError) { ctx.err(`${ctx.name}: ${e.message}\n`); return 1; }
    throw e;
  }
};

const C = {};

C.echo = (ctx) => {
  const args = [...ctx.args];
  let newline = true;
  let escapes = false;
  while (args[0] && /^-[neE]+$/.test(args[0])) {
    const f = args.shift();
    if (f.includes('n')) newline = false;
    if (f.includes('e')) escapes = true;
    if (f.includes('E')) escapes = false;
  }
  let text = args.join(' ');
  if (escapes) {
    text = unescapeEcho(text);
    const stop = text.indexOf('\u0000STOP');
    if (stop !== -1) { ctx.out(text.slice(0, stop)); return 0; }
  }
  ctx.out(text + (newline ? '\n' : ''));
  return 0;
};

C.printf = (ctx) => {
  const [fmt, ...args] = ctx.args;
  if (fmt === undefined) { ctx.err('printf: usage: printf format [arguments]\n'); return 2; }
  ctx.out(printfFormat(fmt, args));
  return 0;
};

C.pwd = (ctx) => { ctx.out(`${ctx.fs.cwd}\n`); return 0; };

C.cd = (ctx) => {
  const { fs, shell } = ctx;
  let target = ctx.args[0] ?? shell.vars.HOME;
  if (target === '-') { target = shell.vars.OLDPWD; ctx.out(`${target}\n`); }
  if (!fs.exists(target)) { ctx.err(`bash: cd: ${target}: No such file or directory\n`); return 1; }
  if (!fs.isDir(target)) { ctx.err(`bash: cd: ${target}: Not a directory\n`); return 1; }
  shell.vars.OLDPWD = fs.cwd;
  fs.cwd = fs.resolve(target);
  shell.vars.PWD = fs.cwd;
  return 0;
};

C.ls = wrap((ctx) => {
  const { fs, shell } = ctx;
  const { opts, rest } = getopts('ls', ctx.args, { flags: 'lahtr1dRS', long: { all: 'a', 'human-readable': 'h' } });
  const targets = rest.length ? rest : ['.'];
  const now = shell.now();
  let status = 0;
  const blocks = [];
  const fileTargets = [];
  const dirTargets = [];
  for (const t of targets) {
    if (!fs.exists(t)) { ctx.err(`ls: cannot access '${t}': No such file or directory\n`); status = 2; continue; }
    (fs.isDir(t) && !opts.d ? dirTargets : fileTargets).push(t);
  }
  const fmtEntries = (entries) => {
    let sorted = entries;
    if (opts.t) sorted = [...entries].sort((a, b) => b.node.mtime - a.node.mtime);
    if (opts.S) sorted = [...entries].sort((a, b) => (b.node.content?.length ?? 4096) - (a.node.content?.length ?? 4096));
    if (opts.r) sorted = [...sorted].reverse();
    if (!opts.l) {
      const names = sorted.map((e) => e.name);
      return ctx.io.tty && !opts['1'] ? (names.length ? names.join('  ') + '\n' : '') : joinLines(names);
    }
    const rows = sorted.map(({ name, node }) => {
      const size = node.type === 'dir' ? 4096 : node.content.length;
      return [modeString(node), '1', 'learner', 'learner', opts.h ? human(size) : String(size), lsDate(node.mtime, now), name];
    });
    const width = Math.max(1, ...rows.map((r) => r[4].length));
    return joinLines(rows.map((r) => `${r[0]} ${r[1]} ${r[2]} ${r[3]} ${r[4].padStart(width)} ${r[5]} ${r[6]}`));
  };
  if (fileTargets.length) blocks.push(fmtEntries(fileTargets.map((t) => ({ name: t, node: fs.node(t) }))));
  for (const d of dirTargets) {
    let names = fs.list(d);
    if (!opts.a) names = names.filter((n) => !n.startsWith('.'));
    const entries = names.map((n) => ({ name: n, node: fs.node(`${fs.resolve(d)}/${n}`) }));
    let block = '';
    if (targets.length > 1) block += `${d}:\n`;
    if (opts.l) {
      const blocksUsed = entries.reduce((s, e) => s + Math.ceil((e.node.type === 'dir' ? 4096 : e.node.content.length) / 4096) * 4, 0);
      block += `total ${blocksUsed}\n`;
    }
    block += fmtEntries(entries);
    blocks.push(block);
  }
  ctx.out(blocks.join(targets.length > 1 ? '\n' : ''));
  return status;
});

C.cat = wrap((ctx) => {
  const { opts, rest } = getopts('cat', ctx.args, { flags: 'nA' });
  let status = 0;
  let n = 0;
  for (const f of rest.length ? rest : ['-']) {
    let text;
    try {
      text = f === '-' ? ctx.stdin : ctx.fs.read(f);
    } catch (e) {
      ctx.err(`cat: ${e.message}\n`);
      status = 1;
      continue;
    }
    if (opts.n) text = joinLines(lines(text).map((l) => `${String(++n).padStart(6)}\t${l}`));
    ctx.out(text);
  }
  return status;
});

const headTail = (which) => wrap((ctx) => {
  const args = ctx.args.map((a) => (/^-\d+$/.test(a) ? `-n${a.slice(1)}` : a));
  const { opts, rest } = getopts(which, args, { flags: 'qvf', values: 'nc', long: { lines: 'n', bytes: 'c', follow: 'f' } });
  const inputs = readInputs(ctx, rest);
  inputs.forEach(({ name, text }, i) => {
    if (inputs.length > 1) ctx.out(`${i ? '\n' : ''}==> ${name} <==\n`);
    if (opts.c) {
      const c = Number(opts.c);
      ctx.out(which === 'head' ? text.slice(0, c) : text.slice(-c));
      return;
    }
    const nSpec = String(opts.n ?? '10');
    const ls = lines(text);
    let picked;
    if (which === 'head') {
      const n = Number(nSpec);
      picked = n < 0 ? ls.slice(0, Math.max(0, ls.length + n)) : ls.slice(0, n);
    } else if (nSpec.startsWith('+')) picked = ls.slice(Math.max(0, Number(nSpec.slice(1)) - 1));
    else picked = ls.slice(Math.max(0, ls.length - Math.abs(Number(nSpec))));
    ctx.out(joinLines(picked));
  });
  if (which === 'tail' && opts.f) ctx.err('tail: (practice shell) -f would keep watching the file here; press Ctrl+C on a real server to stop\n');
  return 0;
});
C.head = headTail('head');
C.tail = headTail('tail');

C.wc = wrap((ctx) => {
  const { opts, rest } = getopts('wc', ctx.args, { flags: 'lwcm', long: { lines: 'l', words: 'w', bytes: 'c', chars: 'm' } });
  const which = opts.l || opts.w || opts.c || opts.m ? opts : { l: true, w: true, c: true };
  const inputs = readInputs(ctx, rest);
  const totals = { l: 0, w: 0, c: 0 };
  const rows = inputs.map(({ name, text }) => {
    const counts = { l: (text.match(/\n/g) || []).length, w: (text.match(/\S+/g) || []).length, c: text.length };
    for (const k of Object.keys(totals)) totals[k] += counts[k];
    return { name, counts };
  });
  if (inputs.length > 1) rows.push({ name: 'total', counts: totals });
  const keys = ['l', 'w', 'c'].filter((k) => which[k] || (k === 'c' && which.m));
  const single = keys.length === 1 && inputs.length === 1;
  const width = single ? 0 : Math.max(...rows.flatMap((r) => keys.map((k) => String(r.counts[k]).length)), inputs[0].name === null ? 7 : 1);
  for (const r of rows) {
    ctx.out(keys.map((k) => String(r.counts[k]).padStart(width)).join(' ') + (r.name ? ` ${r.name}` : '') + '\n');
  }
  return 0;
});

C.grep = wrap((ctx) => {
  const { opts, rest } = getopts('grep', ctx.args, {
    flags: 'ivcnEFoqwlLrhHsx', values: 'eABCm',
    long: { 'ignore-case': 'i', 'invert-match': 'v', count: 'c', 'line-number': 'n', 'extended-regexp': 'E', 'fixed-strings': 'F', 'only-matching': 'o', quiet: 'q', silent: 'q', 'word-regexp': 'w', 'files-with-matches': 'l', recursive: 'r', 'no-filename': 'h', 'with-filename': 'H', 'max-count': 'm', regexp: 'e' },
  });
  const patterns = opts.e !== undefined ? [opts.e] : [rest.shift()];
  if (patterns[0] === undefined) throw new UsageError('Usage: grep [OPTION]... PATTERNS [FILE]...');
  const re = toRegex(patterns.join('|'), { extended: opts.E || patterns.length > 1, ignoreCase: opts.i, word: opts.w, fixed: opts.F });
  const lineRe = opts.x ? new RegExp(`^(?:${re.source})$`, re.flags) : re;
  let files = rest;
  if (opts.r) {
    files = (files.length ? files : ['.']).flatMap((f) => (ctx.fs.isDir(f) ? ctx.fs.walk(f).filter((w) => w.node.type === 'file').map((w) => (f === '.' ? w.path.slice(ctx.fs.cwd.length + 1) : f.replace(/\/$/, '') + w.path.slice(ctx.fs.resolve(f).length))) : [f]));
  }
  const showName = !opts.h && (opts.H || files.length > 1 || opts.r);
  let any = false;
  let status = 0;
  for (const f of files.length ? files : ['-']) {
    let text;
    try {
      text = f === '-' ? ctx.stdin : ctx.fs.read(f);
    } catch (e) {
      if (!opts.s) ctx.err(`grep: ${e.message}\n`);
      status = 2;
      continue;
    }
    let count = 0;
    const prefix = showName ? `${f === '-' ? '(standard input)' : f}:` : '';
    const ls = lines(text);
    for (let i = 0; i < ls.length; i++) {
      const line = ls[i];
      const hit = lineRe.test(line) !== !!opts.v;
      if (!hit) continue;
      count++;
      any = true;
      if (opts.q || opts.c || opts.l || opts.L) continue;
      const num = opts.n ? `${i + 1}:` : '';
      if (opts.o && !opts.v) {
        for (const m of line.matchAll(new RegExp(re.source, re.flags + 'g'))) if (m[0]) ctx.out(`${prefix}${num}${m[0]}\n`);
      } else ctx.out(`${prefix}${num}${line}\n`);
      if (opts.m && count >= Number(opts.m)) break;
    }
    if (opts.c) ctx.out(`${prefix}${count}\n`);
    if (opts.l && count) ctx.out(`${f}\n`);
    if (opts.L && !count) ctx.out(`${f}\n`);
  }
  if (status === 2 && !any) return 2;
  return any ? 0 : 1;
});
C.egrep = (ctx) => C.grep({ ...ctx, args: ['-E', ...ctx.args] });

const humanValue = (s) => {
  const m = String(s).trim().match(/^(-?[\d.]+)([KMGTP]?)/i);
  if (!m) return 0;
  return Number(m[1]) * 1024 ** ' KMGTP'.indexOf((m[2] || ' ').toUpperCase());
};

C.sort = wrap((ctx) => {
  const { opts, rest } = getopts('sort', ctx.args, { flags: 'nruhfbVM', values: 'kto', long: { numeric: 'n', reverse: 'r', unique: 'u', 'human-numeric-sort': 'h', 'ignore-case': 'f', key: 'k', 'field-separator': 't', output: 'o' } });
  const all = readInputs(ctx, rest).flatMap(({ text }) => lines(text));
  const sep = opts.t;
  const keyOf = (line) => {
    if (!opts.k) return line;
    const [startSpec, endSpec] = String(opts.k).split(',');
    const start = parseInt(startSpec, 10);
    const end = endSpec ? parseInt(endSpec, 10) : null;
    const fields = sep ? line.split(sep) : line.trim().split(/\s+/);
    return fields.slice(start - 1, end ?? undefined).join(sep || ' ');
  };
  const numeric = opts.n || /n/.test(String(opts.k ?? ''));
  const humanSort = opts.h || /h/.test(String(opts.k ?? ''));
  const reverseKey = /r/.test(String(opts.k ?? '').replace(/^\d+/, ''));
  const cmp = (a, b) => {
    let ka = keyOf(a);
    let kb = keyOf(b);
    let r;
    if (humanSort) r = humanValue(ka) - humanValue(kb);
    else if (numeric) r = (parseFloat(ka) || 0) - (parseFloat(kb) || 0);
    else {
      if (opts.f) { ka = ka.toLowerCase(); kb = kb.toLowerCase(); }
      r = ka < kb ? -1 : ka > kb ? 1 : 0;
    }
    if (r === 0 && opts.k && !opts.u) r = a < b ? -1 : a > b ? 1 : 0;
    return (opts.r || reverseKey) ? -r : r;
  };
  let sorted = [...all].sort(cmp);
  if (opts.u) sorted = sorted.filter((l, i) => i === 0 || cmp(sorted[i - 1], l) !== 0);
  if (opts.o) ctx.fs.write(opts.o, joinLines(sorted));
  else ctx.out(joinLines(sorted));
  return 0;
});

C.uniq = wrap((ctx) => {
  const { opts, rest } = getopts('uniq', ctx.args, { flags: 'cdui', long: { count: 'c', repeated: 'd', unique: 'u', 'ignore-case': 'i' } });
  const ls = readInputs(ctx, rest.slice(0, 1)).flatMap(({ text }) => lines(text));
  const groups = [];
  for (const l of ls) {
    const last = groups[groups.length - 1];
    const same = last && (opts.i ? last.line.toLowerCase() === l.toLowerCase() : last.line === l);
    if (same) last.count++;
    else groups.push({ line: l, count: 1 });
  }
  const out = groups
    .filter((g) => (opts.d ? g.count > 1 : opts.u ? g.count === 1 : true))
    .map((g) => (opts.c ? `${String(g.count).padStart(7)} ${g.line}` : g.line));
  if (rest[1]) ctx.fs.write(rest[1], joinLines(out));
  else ctx.out(joinLines(out));
  return 0;
});

const parseRanges = (spec) => spec.split(',').map((part) => {
  const [a, b] = part.split('-');
  if (!part.includes('-')) return [Number(a), Number(a)];
  return [a ? Number(a) : 1, b ? Number(b) : Infinity];
});

C.cut = wrap((ctx) => {
  const { opts, rest } = getopts('cut', ctx.args, { flags: 's', values: 'dfcb', long: { delimiter: 'd', fields: 'f', characters: 'c', bytes: 'b' } });
  const ranges = parseRanges(opts.f ?? opts.c ?? opts.b ?? (() => { throw new UsageError('cut: you must specify a list of bytes, characters, or fields'); })());
  const inRange = (n) => ranges.some(([a, b]) => n >= a && n <= b);
  const delim = opts.d ?? '\t';
  const out = [];
  for (const { text } of readInputs(ctx, rest)) {
    for (const line of lines(text)) {
      if (opts.f) {
        if (!line.includes(delim)) { if (!opts.s) out.push(line); continue; }
        out.push(line.split(delim).filter((_, i) => inRange(i + 1)).join(delim));
      } else out.push([...line].filter((_, i) => inRange(i + 1)).join(''));
    }
  }
  ctx.out(joinLines(out));
  return 0;
});

C.tr = wrap((ctx) => {
  const { opts, rest } = getopts('tr', ctx.args, { flags: 'dsc', long: { delete: 'd', 'squeeze-repeats': 's' } });
  const set1 = expandTrSet(rest[0] ?? '');
  const set2 = rest[1] !== undefined ? expandTrSet(rest[1]) : null;
  let text = ctx.stdin;
  if (opts.d) {
    text = [...text].filter((c) => !set1.includes(c)).join('');
    if (opts.s && set2) text = text.replace(new RegExp(`([${set2.map((c) => c.replace(/[\]\\^-]/g, '\\$&')).join('')}])\\1+`, 'g'), '$1');
  } else {
    if (set2) {
      const map = new Map(set1.map((c, i) => [c, set2[Math.min(i, set2.length - 1)]]));
      text = [...text].map((c) => map.get(c) ?? c).join('');
    }
    if (opts.s) {
      const squeeze = set2 ?? set1;
      text = [...text].filter((c, i, arr) => !(i && c === arr[i - 1] && squeeze.includes(c))).join('');
    }
  }
  ctx.out(text);
  return 0;
});

C.sed = wrap(sedCmd);
C.awk = wrap((ctx) => runAwk(ctx, { getopts, readInputs, printfFormat }));
C.find = wrap(findCmd);
C.tar = wrap(tarCmd);
C.curl = wrap(curlCmd);
C.jq = wrap(jqCmd);

C.date = wrap((ctx) => {
  const { shell } = ctx;
  const args = [...ctx.args];
  let d = shell.now();
  let fmt = null;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith('+')) fmt = a.slice(1);
    else if (a === '-u' || a === '--utc') continue;
    else if (a === '-I' || a === '--iso-8601') fmt = '%F';
    else if (a === '-Iseconds') fmt = '%FT%T+00:00';
    else if (a === '-d' || a === '--date') {
      const parsed = parseDateString(args[++i] ?? '', d);
      if (!parsed) { ctx.err(`date: invalid date '${args[i]}'\n`); return 1; }
      d = parsed;
    } else if (a.startsWith('--date=') || a.startsWith('-d')) {
      const v = a.startsWith('--date=') ? a.slice(7) : a.slice(2);
      const parsed = parseDateString(v, d);
      if (!parsed) { ctx.err(`date: invalid date '${v}'\n`); return 1; }
      d = parsed;
    } else { ctx.err(`date: invalid option '${a}'\n`); return 1; }
  }
  ctx.out(`${formatDate(d, fmt ?? '%a %b %e %T %Z %Y')}\n`);
  return 0;
});

C.sleep = () => 0;
C.true = () => 0;
C[':'] = () => 0;
C.false = () => 1;

C.exit = (ctx) => ctx.shell.exit(ctx.args[0] !== undefined ? Number(ctx.args[0]) & 255 : ctx.shell.status);
C.return = (ctx) => ctx.shell.doReturn(ctx.args[0] !== undefined ? Number(ctx.args[0]) & 255 : ctx.shell.status);
C.break = (ctx) => { ctx.shell.loopControl('break', Number(ctx.args[0] ?? 1)); return 0; };
C.continue = (ctx) => { ctx.shell.loopControl('continue', Number(ctx.args[0] ?? 1)); return 0; };

const assignArgs = (ctx, fn) => {
  for (const a of ctx.args) {
    if (a.startsWith('-')) continue;
    const m = a.match(/^([A-Za-z_][A-Za-z0-9_]*)(?:=(.*))?$/s);
    if (!m) { ctx.err(`bash: ${ctx.name}: \`${a}': not a valid identifier\n`); return 1; }
    fn(m[1], m[2]);
  }
  return 0;
};
C.export = (ctx) => assignArgs(ctx, (n, v) => { if (v !== undefined) ctx.shell.setVar(n, v); });
C.readonly = C.export;
C.declare = C.export;
C.local = (ctx) => {
  try {
    return assignArgs(ctx, (n, v) => ctx.shell.declareLocal(n, v));
  } catch (e) {
    ctx.err(`bash: ${e.message}\n`);
    return 1;
  }
};
C.unset = (ctx) => { for (const a of ctx.args) if (!a.startsWith('-')) { delete ctx.shell.vars[a]; delete ctx.shell.functions[a]; } return 0; };

C.set = (ctx) => {
  const { shell } = ctx;
  const args = [...ctx.args];
  if (!args.length) {
    ctx.out(joinLines(Object.entries(shell.vars).sort().map(([k, v]) => `${k}=${/[\s'"$]/.test(v) ? `'${v}'` : v}`)));
    return 0;
  }
  const names = { e: 'errexit', u: 'nounset', x: 'xtrace' };
  while (args.length) {
    const a = args.shift();
    if (a === '--') { shell.positional = args.splice(0); break; }
    if (a === '-o' || a === '+o') {
      const opt = args.shift();
      if (!['errexit', 'nounset', 'pipefail', 'xtrace'].includes(opt)) { ctx.err(`bash: set: ${opt}: invalid option name\n`); return 1; }
      shell.options[opt] = a === '-o';
      continue;
    }
    if (/^[-+][a-zA-Z]+$/.test(a)) {
      for (const f of a.slice(1)) {
        if (f === 'o') {
          // set -euo pipefail: -o takes the next word
          const opt = args.shift();
          if (!['errexit', 'nounset', 'pipefail', 'xtrace'].includes(opt)) { ctx.err(`bash: set: ${opt}: invalid option name\n`); return 1; }
          shell.options[opt] = a[0] === '-';
          continue;
        }
        if (!names[f]) { ctx.err(`bash: set: -${f}: invalid option\n`); return 2; }
        shell.options[names[f]] = a[0] === '-';
      }
      continue;
    }
    shell.positional = [a, ...args.splice(0)];
  }
  return 0;
};

C.shift = (ctx) => {
  const n = Number(ctx.args[0] ?? 1);
  if (n > ctx.shell.positional.length) return 1;
  ctx.shell.positional = ctx.shell.positional.slice(n);
  return 0;
};

C.read = (ctx) => {
  const { opts, rest } = getopts('read', ctx.args, { flags: 'rs', values: 'pa' });
  if (opts.p && ctx.io.tty) ctx.err(opts.p);
  let line;
  if (ctx.io.input) {
    const t = ctx.io.input.text;
    if (!t) return 1;
    const nl = t.indexOf('\n');
    line = nl === -1 ? t : t.slice(0, nl);
    ctx.io.input.text = nl === -1 ? '' : t.slice(nl + 1);
  } else if (ctx.stdin) {
    const nl = ctx.stdin.indexOf('\n');
    line = nl === -1 ? ctx.stdin : ctx.stdin.slice(0, nl);
  } else {
    if (ctx.io.tty) ctx.err('read: (practice shell) there is no keyboard input here; set the variable directly instead, e.g. NAME=value\n');
    for (const n of rest.length ? rest : ['REPLY']) ctx.shell.setVar(n, '');
    return 1;
  }
  if (!opts.r) line = line.replace(/\\(.)/g, '$1');
  const names = rest.length ? rest : ['REPLY'];
  const ifs = ctx.shell.vars.IFS ?? ' \t\n';
  if (names.length === 1 && names[0] === 'REPLY' && !rest.length) { ctx.shell.setVar('REPLY', line); return 0; }
  const isWs = (c) => ifs.includes(c) && ' \t\n'.includes(c);
  let fields;
  if ([...ifs].every((c) => ' \t\n'.includes(c))) fields = line.trim().split(/[ \t\n]+/).filter((x, i, a) => x !== '' || a.length === 1);
  else fields = line.split(new RegExp(`[${ifs.replace(/[\]\\^-]/g, '\\$&')}]`));
  names.forEach((n, i) => {
    if (i === names.length - 1) {
      // The last variable gets the rest of the line
      let restText = fields.slice(i).join(ifs[0] === ' ' ? ' ' : ifs[0]);
      if ([...restText].length && isWs(restText[0])) restText = restText.trim();
      ctx.shell.setVar(n, restText);
    } else ctx.shell.setVar(n, fields[i] ?? '');
  });
  return 0;
};

C.test = (ctx) => testCmd(ctx, ctx.args);
C['['] = (ctx) => {
  if (ctx.args[ctx.args.length - 1] !== ']') { ctx.err("bash: [: missing `]'\n"); return 2; }
  return testCmd(ctx, ctx.args.slice(0, -1));
};
C['[['] = (ctx) => {
  if (ctx.args[ctx.args.length - 1] !== ']]') { ctx.err("bash: syntax error: missing `]]'\n"); return 2; }
  return testCmd(ctx, ctx.args.slice(0, -1), true);
};

C.source = (ctx) => {
  const [file, ...args] = ctx.args;
  if (!file) { ctx.err('bash: source: filename argument required\n'); return 2; }
  return ctx.shell.runScriptFile(file, args, ctx.io, { source: true });
};
C['.'] = C.source;

C.bash = (ctx) => {
  const args = [...ctx.args];
  const flags = [];
  while (args[0]?.startsWith('-') && args[0] !== '-c') flags.push(args.shift());
  if (args[0] === '-c') {
    const src = args[1] ?? '';
    const { shell } = ctx;
    return shell.subshell(() => {
      shell.positional = args.slice(3);
      const res = shell.execList(parseOrThrow(src), ctx.io);
      return res;
    });
  }
  if (!args.length) { ctx.err('bash: (practice shell) you are already in bash. Run a script with: bash script.sh\n'); return 0; }
  if (flags.includes('-n')) {
    try {
      parseOrThrow(ctx.fs.read(args[0]));
      return 0;
    } catch (e) {
      ctx.err(`${args[0]}: ${e.message}\n`);
      return 2;
    }
  }
  const { shell } = ctx;
  if (flags.includes('-x')) {
    return shell.subshell(() => {
      shell.options.xtrace = true;
      return shell.runScriptFile(args[0], args.slice(1), ctx.io, { source: true });
    });
  }
  return shell.runScriptFile(args[0], args.slice(1), ctx.io);
};
C.sh = C.bash;
C.zsh = C.bash;

let parseOrThrow = null;
export const setParser = (fn) => { parseOrThrow = fn; };

C.type = (ctx) => {
  let status = 0;
  for (const n of ctx.args) {
    if (ctx.shell.functions[n]) ctx.out(`${n} is a function\n`);
    else if (BUILTINS.has(n)) ctx.out(`${n} is a shell builtin\n`);
    else if (COMMANDS[n]) ctx.out(`${n} is /usr/bin/${n}\n`);
    else { ctx.err(`bash: type: ${n}: not found\n`); status = 1; }
  }
  return status;
};
C.which = (ctx) => {
  let status = 0;
  for (const n of ctx.args) {
    if (COMMANDS[n] && !BUILTINS.has(n)) ctx.out(`/usr/bin/${n}\n`);
    else status = 1;
  }
  return status;
};
C.command = (ctx) => {
  if (ctx.args[0] === '-v') {
    const n = ctx.args[1];
    if (ctx.shell.functions[n] || BUILTINS.has(n)) { ctx.out(`${n}\n`); return 0; }
    if (COMMANDS[n]) { ctx.out(`/usr/bin/${n}\n`); return 0; }
    return 1;
  }
  return ctx.shell.invoke(ctx.args, ctx.io);
};

C.mkdir = wrap((ctx) => {
  const { opts, rest } = getopts('mkdir', ctx.args, { flags: 'pv', long: { parents: 'p' } });
  let status = 0;
  for (const d of rest) {
    try {
      ctx.fs.mkdir(d, { parents: !!opts.p });
      if (opts.v) ctx.out(`mkdir: created directory '${d}'\n`);
    } catch (e) {
      ctx.err(`mkdir: ${e.message}\n`);
      status = 1;
    }
  }
  return status;
});

C.touch = wrap((ctx) => { for (const f of ctx.args.filter((a) => !a.startsWith('-'))) ctx.fs.touch(f); return 0; });

C.rm = wrap((ctx) => {
  const { opts, rest } = getopts('rm', ctx.args, { flags: 'rRfvid', long: { recursive: 'r', force: 'f' } });
  let status = 0;
  for (const f of rest) {
    if (!ctx.fs.exists(f)) { if (!opts.f) { ctx.err(`rm: cannot remove '${f}': No such file or directory\n`); status = 1; } continue; }
    try {
      ctx.fs.remove(f, { recursive: !!(opts.r || opts.R) });
      if (opts.v) ctx.out(`removed '${f}'\n`);
    } catch (e) {
      ctx.err(`rm: ${e.message}\n`);
      status = 1;
    }
  }
  return status;
});
C.rmdir = wrap((ctx) => {
  for (const d of ctx.args) {
    if (Object.keys(ctx.fs.node(d)?.children ?? { x: 1 }).length) { ctx.err(`rmdir: failed to remove '${d}': Directory not empty\n`); return 1; }
    ctx.fs.remove(d, { recursive: true });
  }
  return 0;
});

C.cp = wrap((ctx) => {
  const { opts, rest } = getopts('cp', ctx.args, { flags: 'rRavpf', long: { recursive: 'r' } });
  const dest = rest.pop();
  if (!rest.length) throw new UsageError(`cp: missing destination file operand after '${dest ?? ''}'`);
  for (const src of rest) ctx.fs.copy(src, dest, { recursive: !!(opts.r || opts.R || opts.a) });
  return 0;
});
C.mv = wrap((ctx) => {
  const { rest } = getopts('mv', ctx.args, { flags: 'fvin' });
  const dest = rest.pop();
  if (!rest.length) throw new UsageError(`mv: missing destination file operand after '${dest ?? ''}'`);
  for (const src of rest) ctx.fs.move(src, dest);
  return 0;
});

C.chmod = wrap((ctx) => {
  const args = ctx.args.filter((a) => a !== '-R');
  const [mode, ...files] = args;
  if (!files.length) throw new UsageError(`chmod: missing operand after '${mode ?? ''}'`);
  for (const f of files) {
    const node = ctx.fs.node(f);
    if (!node) { ctx.err(`chmod: cannot access '${f}': No such file or directory\n`); return 1; }
    if (/^[0-7]{3,4}$/.test(mode)) { node.mode = parseInt(mode, 8); continue; }
    for (const clause of mode.split(',')) {
      const m = clause.match(/^([ugoa]*)([+-=])([rwx]*)$/);
      if (!m) throw new UsageError(`chmod: invalid mode: '${mode}'`);
      const who = m[1] || 'a';
      const bits = { r: 4, w: 2, x: 1 };
      let mask = 0;
      for (const p of m[3]) for (const w of who === 'a' ? 'ugo' : who) mask |= bits[p] << ({ u: 6, g: 3, o: 0 }[w]);
      if (m[2] === '+') node.mode |= mask;
      else if (m[2] === '-') node.mode &= ~mask;
      else node.mode = mask;
    }
  }
  return 0;
});
C.chown = () => 0;
C.ln = (ctx) => { ctx.err('ln: (practice shell) links are not supported here\n'); return 1; };

C.basename = (ctx) => {
  const [p, suffix] = ctx.args;
  if (p === undefined) { ctx.err('basename: missing operand\n'); return 1; }
  let b = p.replace(/\/+$/, '').split('/').pop() || '/';
  if (suffix && b.endsWith(suffix) && b !== suffix) b = b.slice(0, -suffix.length);
  ctx.out(`${b}\n`);
  return 0;
};
C.dirname = (ctx) => {
  const p = (ctx.args[0] ?? '').replace(/\/+$/, '');
  ctx.out(`${p.includes('/') ? p.replace(/\/[^/]*$/, '') || '/' : '.'}\n`);
  return 0;
};
C.realpath = (ctx) => { for (const a of ctx.args) ctx.out(`${ctx.fs.resolve(a)}\n`); return 0; };

C.seq = wrap((ctx) => {
  const { opts, rest } = getopts('seq', ctx.args, { flags: 'w', values: 's' });
  const nums = rest.map(Number);
  const [first, step, last] = nums.length === 1 ? [1, 1, nums[0]] : nums.length === 2 ? [nums[0], 1, nums[1]] : nums;
  const out = [];
  for (let n = first; step > 0 ? n <= last : n >= last; n += step) {
    out.push(opts.w ? String(n).padStart(String(last).length, '0') : String(n));
    if (out.length > 100000) break;
  }
  ctx.out(out.length ? out.join(opts.s ?? '\n') + '\n' : '');
  return 0;
});

C.tee = wrap((ctx) => {
  const { opts, rest } = getopts('tee', ctx.args, { flags: 'a' });
  for (const f of rest) ctx.fs.write(f, ctx.stdin, { append: !!opts.a });
  ctx.out(ctx.stdin);
  return 0;
});

C.xargs = wrap((ctx) => {
  const { opts, rest } = getopts('xargs', ctx.args, { flags: 'r0t', values: 'nI' });
  const cmd = rest.length ? rest : ['echo'];
  const items = ctx.stdin.split(opts['0'] ? '\0' : /\s+/).filter(Boolean);
  if (!items.length && opts.r) return 0;
  let status = 0;
  const run = (words) => {
    if (opts.t) ctx.err(`${words.join(' ')}\n`);
    const s = ctx.shell.invoke(words, { ...ctx.io, stdin: '' });
    if (s !== 0) status = 123;
  };
  if (opts.I) {
    for (const line of lines(ctx.stdin)) run(cmd.map((w) => w.split(opts.I).join(line)));
  } else if (opts.n) {
    const n = Number(opts.n);
    for (let i = 0; i < items.length; i += n) run([...cmd, ...items.slice(i, i + n)]);
  } else run([...cmd, ...items]);
  return status;
});

C.du = wrap((ctx) => {
  const { opts, rest } = getopts('du', ctx.args, { flags: 'shac', values: 'd', long: { summarize: 's', 'human-readable': 'h', 'max-depth': 'd' } });
  const fmt = (bytes) => (opts.h ? human(Math.max(bytes, 4096)) : String(Math.ceil(Math.max(bytes, 4096) / 1024)));
  for (const t of rest.length ? rest : ['.']) {
    if (!ctx.fs.exists(t)) { ctx.err(`du: cannot access '${t}': No such file or directory\n`); continue; }
    if (opts.s || !ctx.fs.isDir(t)) { ctx.out(`${fmt(ctx.fs.size(t))}\t${t}\n`); continue; }
    const base = ctx.fs.resolve(t);
    const maxDepth = opts.d !== undefined ? Number(opts.d) : Infinity;
    const dirs = ctx.fs.walk(t).filter((w) => w.node.type === 'dir');
    for (const w of dirs.reverse()) {
      const depth = w.path === base ? 0 : w.path.slice(base.length).split('/').filter(Boolean).length;
      if (depth > maxDepth) continue;
      ctx.out(`${fmt(ctx.fs.size(w.path))}\t${w.path === base ? t : t.replace(/\/$/, '') + w.path.slice(base.length)}\n`);
    }
  }
  return 0;
});

C.df = wrap((ctx) => {
  const { opts, rest } = getopts('df', ctx.args, { flags: 'hPkTm', long: { 'human-readable': 'h' } });
  let disks = ctx.shell.disk;
  if (rest.length) {
    const target = ctx.fs.resolve(rest[0]);
    const best = [...disks].sort((a, b) => b.mount.length - a.mount.length).find((d) => target === d.mount || target.startsWith(d.mount === '/' ? '/' : `${d.mount}/`));
    disks = best ? [best] : [];
  }
  const gb = (v) => (opts.h ? `${v >= 10 ? Math.round(v) : v.toFixed(1)}G` : String(Math.round(v * 1024 * 1024)));
  const rows = [['Filesystem', opts.h ? 'Size' : '1K-blocks', 'Used', opts.h ? 'Avail' : 'Available', 'Use%', 'Mounted on']];
  for (const d of disks) {
    rows.push([d.fs, gb(d.size), gb(d.used), gb(d.size - d.used), `${Math.ceil((d.used / d.size) * 100)}%`, d.mount]);
  }
  const widths = rows[0].map((_, i) => Math.max(...rows.map((r) => r[i].length)));
  ctx.out(joinLines(rows.map((r) => r.map((c, i) => (i === 0 || i === 5 ? c.padEnd(widths[i]) : c.padStart(widths[i]))).join(' ').trimEnd())));
  return 0;
});

C.free = wrap((ctx) => {
  const { opts } = getopts('free', ctx.args, { flags: 'hmgk' });
  const { total, used } = ctx.shell.memory;
  const f = (mb) => (opts.h ? (mb >= 1024 ? `${(mb / 1024).toFixed(1)}Gi` : `${mb}Mi`) : opts.m ? String(mb) : String(mb * 1024));
  const free = Math.round((total - used) * 0.4);
  const cache = total - used - free;
  ctx.out(`               total        used        free      shared  buff/cache   available\n`);
  ctx.out(`Mem:   ${[f(total), f(used), f(free), f('12'), f(cache), f(total - used)].map((x) => x.padStart(12)).join('')}\n`);
  ctx.out(`Swap:  ${[f(0), f(0), f(0)].map((x) => x.padStart(12)).join('')}\n`);
  return 0;
});

C.uptime = (ctx) => {
  ctx.out(` ${formatDate(ctx.shell.now(), '%T')} up 12 days,  3:41,  1 user,  load average: 0.08, 0.12, 0.10\n`);
  return 0;
};
C.whoami = (ctx) => { ctx.out(`${ctx.shell.vars.USER}\n`); return 0; };
C.hostname = (ctx) => { ctx.out(`${ctx.shell.vars.HOSTNAME}\n`); return 0; };
C.uname = (ctx) => { ctx.out(ctx.args.includes('-a') ? `Linux ${ctx.shell.vars.HOSTNAME} 6.1.0-amzn #1 SMP x86_64 GNU/Linux\n` : 'Linux\n'); return 0; };
C.id = (ctx) => { ctx.out('uid=1000(learner) gid=1000(learner) groups=1000(learner)\n'); return 0; };
C.nproc = (ctx) => { ctx.out('2\n'); return 0; };
C.env = (ctx) => { ctx.out(joinLines(Object.entries(ctx.shell.vars).filter(([k]) => /^[A-Z_]+$/.test(k)).map(([k, v]) => `${k}=${v}`))); return 0; };
C.printenv = (ctx) => {
  if (!ctx.args.length) return C.env(ctx);
  const v = ctx.shell.vars[ctx.args[0]];
  if (v === undefined) return 1;
  ctx.out(`${v}\n`);
  return 0;
};

C.logger = (ctx) => {
  const msg = ctx.args.filter((a, i, arr) => !a.startsWith('-') && !(i > 0 && arr[i - 1] === '-t')).join(' ');
  const tagIdx = ctx.args.indexOf('-t');
  const tag = tagIdx !== -1 ? ctx.args[tagIdx + 1] : 'learner';
  ctx.fs.write('/var/log/syslog', `${formatDate(ctx.shell.now(), '%b %e %T')} ${ctx.shell.vars.HOSTNAME} ${tag}: ${msg}\n`, { append: true });
  return 0;
};

C.crontab = (ctx) => {
  const { shell } = ctx;
  const a = ctx.args[0];
  if (a === '-l') {
    if (!shell.crontab) { ctx.err('no crontab for learner\n'); return 1; }
    ctx.out(shell.crontab);
    return 0;
  }
  if (a === '-r') { shell.crontab = ''; return 0; }
  if (a === '-e') { ctx.err('crontab: (practice shell) there is no editor here. Write the schedule to a file, then run: crontab myjobs.txt\n'); return 1; }
  if (a === undefined) { ctx.err('usage: crontab file | crontab -l | crontab -r\n'); return 1; }
  const text = a === '-' ? ctx.stdin : ctx.fs.read(a);
  for (const line of lines(text)) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    if (!/^(@(reboot|hourly|daily|weekly|monthly|yearly)|(\S+\s+){4}\S+)\s+\S/.test(line.trim())) {
      ctx.err(`crontab: bad schedule line: "${line}"\nerrors in crontab file, can't install.\n`);
      return 1;
    }
  }
  shell.crontab = text.endsWith('\n') || !text ? text : `${text}\n`;
  return 0;
};

C.aws = (ctx) => ctx.shell.aws.run(ctx);

C.history = (ctx) => {
  ctx.out(joinLines(ctx.shell.history.map((h, i) => `${String(i + 1).padStart(5)}  ${h.command}`)));
  return 0;
};

C.clear = (ctx) => { ctx.out('\u001bc'); return 0; };

const EDITORS = ['nano', 'vim', 'vi', 'code', 'emacs'];
for (const e of EDITORS) {
  C[e] = (ctx) => {
    ctx.err(`${e}: (practice shell) edit files in the Editor panel next to this terminal. On your own computer, ${e} works as usual.\n`);
    return 1;
  };
}
C.man = (ctx) => { ctx.err(`man: (practice shell) no manual pages here. Try: ${ctx.args[0] ?? 'grep'} --help on a real terminal, or type help\n`); return 1; };
C.sudo = (ctx) => (ctx.args.length ? ctx.shell.invoke(ctx.args, ctx.io) : 1);
C.ssh = (ctx) => { ctx.err('ssh: (practice shell) you are already "on the server" here\n'); return 255; };
C.ping = (ctx) => {
  const host = ctx.args.filter((a) => !a.startsWith('-') && !/^\d+$/.test(a)).pop();
  if (!host) { ctx.err('ping: usage error: Destination address required\n'); return 2; }
  ctx.out(`PING ${host}: 56 data bytes\n64 bytes from ${host}: icmp_seq=0 ttl=57 time=11.2 ms\n\n--- ${host} ping statistics ---\n1 packets transmitted, 1 packets received, 0.0% packet loss\n`);
  return 0;
};
C.expr = (ctx) => {
  try {
    const v = evaluate(ctx.args.join(' ').replace(/\\\*/g, '*'), ctx.shell.varAccess());
    ctx.out(`${v}\n`);
    return v === 0 ? 1 : 0;
  } catch (e) {
    ctx.err(`expr: ${e.message}\n`);
    return 2;
  }
};

C.help = (ctx) => {
  ctx.out(
    'This practice shell understands the Bash you need for these tutorials:\n\n' +
    '  files      ls cd pwd cat head tail touch mkdir cp mv rm chmod find du tar\n' +
    '  text       echo printf grep sort uniq wc cut tr sed awk tee xargs jq\n' +
    '  system     date df free uptime whoami hostname env sleep crontab logger\n' +
    '  web        curl\n' +
    '  aws        aws s3, aws cloudfront, aws secretsmanager, aws sts (a pretend account)\n' +
    '  scripts    bash file.sh, ./file.sh, source, if, for, while, functions, $(( ))\n\n' +
    'Nothing here touches your real computer or a real AWS account.\n'
  );
  return 0;
};

const BUILTINS = new Set(['echo', 'printf', 'cd', 'pwd', 'exit', 'return', 'break', 'continue', 'export', 'readonly', 'declare', 'local', 'unset', 'set', 'shift', 'read', 'test', '[', '[[', 'source', '.', 'type', 'command', 'true', 'false', ':', 'help', 'history']);

export const COMMANDS = C;
export const COMMAND_NAMES = Object.keys(C).sort();
