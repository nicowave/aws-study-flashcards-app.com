// The practice shell: runs the Bash subset from parser.js against the
// in-memory file system, a pretend web (for curl) and a pretend AWS account.
// Everything is synchronous; pipes pass each command's full output along.
import { parse, tokenize, ParseError } from './parser';
import { evaluate, ArithError } from './arith';
import { VirtualFs, FsError, HOME, globToRegex, hasGlob } from './fs';
import { COMMANDS, BUILTINS, setParser } from './commands';
import { FakeAws } from './fakeAws';

class ExitSignal { constructor(code) { this.code = code; } }
class ReturnSignal { constructor(code) { this.code = code; } }
class LoopSignal { constructor(kind, depth) { this.kind = kind; this.depth = depth; } }
export class ShellError extends Error {
  constructor(message, code = 1) { super(message); this.code = code; }
}

setParser(parse);

const MAX_STEPS = 20000; // stops runaway loops (while true; do ...; done)
// The folders where the practice shell's own programs (ls, grep, aws ...) "live"
const SYSTEM_DIRS = ['/usr/local/bin', '/usr/bin', '/bin'];

// Commands that never end a script under set -e by themselves
const NO_ERREXIT = new Set(['list', 'andor', 'if', 'case', 'for', 'while', 'group']);

// Builtins that take name=value, and so name=(a b c) too
const DECLARING = new Set(['local', 'declare', 'typeset', 'export', 'readonly']);

// $'...': backslash escapes become the characters they stand for
const ANSI_C = { n: '\n', t: '\t', r: '\r', a: '\u0007', b: '\b', e: '\u001b', f: '\f', v: '\v', '\\': '\\', "'": "'", '"': '"' };

export class Shell {
  /**
   * scenario: {
   *   files: { path: content }, web: { url: { status, body, headers, delayMs } },
   *   disk: [{ fs, size, used, mount }], aws: { buckets, distributions, secrets, account },
   *   now: '2026-10-29T06:00:00', hostname, env: {}
   * }
   */
  constructor(scenario = {}) {
    this.fs = new VirtualFs();
    this.fs.load(scenario.files);
    this.web = scenario.web || {};
    this.disk = scenario.disk || [{ fs: '/dev/xvda1', size: 20, used: 9.4, mount: '/' }];
    this.memory = scenario.memory || { total: 3900, used: 1450 };
    this.aws = new FakeAws(scenario.aws);
    this.clockOffset = scenario.now ? new Date(scenario.now).getTime() - Date.now() : 0;
    this.vars = {
      HOME, USER: 'learner', LOGNAME: 'learner', SHELL: '/bin/bash', HOSTNAME: scenario.hostname || 'practice',
      PWD: HOME, OLDPWD: HOME, PATH: '/usr/local/bin:/usr/bin:/bin', IFS: ' \t\n', TERM: 'xterm-256color',
      AWS_DEFAULT_REGION: 'us-east-1', ...(scenario.env || {}),
    };
    if (scenario.cwd) {
      this.fs.mkdir(scenario.cwd, { parents: true });
      this.fs.cwd = this.fs.resolve(scenario.cwd);
      this.vars.PWD = this.fs.cwd;
    }
    // The variables handed on to programs this shell starts (scripts, bash -c).
    // A plain NAME=value stays in this shell until `export NAME`.
    this.exported = new Set(Object.keys(this.vars));
    this.functions = {};
    this.arrays = {}; // name=(a b c): indexed arrays, kept apart from the text variables
    this.positional = [];
    this.scriptName = 'bash';
    this.status = 0;
    this.options = { errexit: false, nounset: false, pipefail: false, xtrace: false };
    this.crontab = scenario.crontab || '';
    this.history = []; // { command, stdout, stderr, status }
    this.conditionDepth = 0;
    this.loopDepth = 0;
    this.steps = 0;
    this.localStack = [];
  }

  now() { return new Date(Date.now() + this.clockOffset); }

  // Runs one line (or a whole pasted script) typed at the prompt.
  run(source) {
    let stdout = '';
    let stderr = '';
    const transcript = [];
    const io = {
      stdin: '',
      tty: true,
      out: (s) => { stdout += s; transcript.push({ stream: 'out', text: s }); },
      err: (s) => { stderr += s; transcript.push({ stream: 'err', text: s }); },
    };
    this.steps = 0;
    this.topErr = io.err;
    try {
      const ast = parse(source);
      this.status = this.execList(ast, io);
    } catch (e) {
      this.status = this.handleTopLevel(e, io);
    }
    const entry = { command: source, stdout, stderr, status: this.status, transcript };
    this.history.push(entry);
    return entry;
  }

  handleTopLevel(e, io) {
    if (e instanceof ExitSignal) return e.code;
    if (e instanceof ReturnSignal) return e.code;
    if (e instanceof LoopSignal) return 0;
    if (e instanceof ParseError) { io.err(`bash: ${e.message}\n`); return 2; }
    if (e instanceof ShellError || e instanceof ArithError || e instanceof FsError) { io.err(`bash: ${e.message}\n`); return e.code || 1; }
    io.err(`bash: internal error: ${e.message}\n`);
    console.error(e);
    return 1;
  }

  // ------------------------------------------------------------------
  // Execution
  // ------------------------------------------------------------------
  tick() {
    if (++this.steps > MAX_STEPS) throw new ShellError('stopped: this command ran too long (an endless loop?)', 130);
  }

  execList(list, io) {
    let status = 0;
    for (const { node } of list.items) status = this.exec(node, io);
    return status;
  }

  inCondition(fn) {
    this.conditionDepth++;
    try { return fn(); } finally { this.conditionDepth--; }
  }

  exec(node, io) {
    this.tick();
    let status;
    switch (node.type) {
      case 'list': status = this.execList(node, io); break;
      case 'andor': {
        status = this.inCondition(() => this.exec(node.first, io));
        node.rest.forEach(({ op, node: n }, idx) => {
          const last = idx === node.rest.length - 1;
          if ((op === '&&' && status === 0) || (op === '||' && status !== 0)) {
            status = last ? this.exec(n, io) : this.inCondition(() => this.exec(n, io));
          }
        });
        break;
      }
      case 'pipeline': status = this.execPipeline(node, io); break;
      case 'simple': status = this.execSimple(node, io); break;
      case 'if': status = this.withRedirects(node, io, (rio) => this.execIf(node, rio)); break;
      case 'case': status = this.withRedirects(node, io, (rio) => this.execCase(node, rio)); break;
      case 'for': status = this.withRedirects(node, io, (rio) => this.execFor(node, rio)); break;
      case 'while': status = this.withRedirects(node, io, (rio) => this.execWhile(node, rio)); break;
      case 'group': status = this.withRedirects(node, io, (rio) => this.execList(node.body, rio)); break;
      case 'subshell': status = this.withRedirects(node, io, (rio) => this.subshell(() => this.execList(node.body, rio))); break;
      case 'arith': {
        const v = evaluate(this.expandString(node.expr, { arith: true }), this.varAccess());
        status = v === 0 ? 1 : 0;
        break;
      }
      case 'func': this.functions[node.name] = node.body; status = 0; break;
      default: throw new ShellError(`unsupported: ${node.type}`);
    }
    this.status = status;
    // set -e. A failure inside if / for / while / case / { } already stopped the
    // script there, unless it was one Bash ignores (the left side of && or ||).
    // Then the compound command ends non-zero too, and Bash carries on.
    if (status !== 0 && this.options.errexit && this.conditionDepth === 0 && !NO_ERREXIT.has(node.type) && !node.negate) {
      throw new ExitSignal(status);
    }
    return status;
  }

  execIf(node, io) {
    for (const { cond, body } of node.clauses) {
      if (this.inCondition(() => this.execList(cond, io)) === 0) return this.execList(body, io);
    }
    return node.elseBody ? this.execList(node.elseBody, io) : 0;
  }

  // Runs the commands of the first pattern that matches (* ? [abc] are wildcards)
  execCase(node, io) {
    const text = (raw) => this.expandWord(raw, { split: false, glob: false }).join('');
    const value = text(node.word);
    const anything = (glob) => new RegExp(globToRegex(glob).source.replace(/\[\^\/\]/g, '[^]'));
    for (const { patterns, body } of node.clauses) {
      if (patterns.some((p) => anything(text(p)).test(value))) return this.execList(body, io);
    }
    return 0;
  }

  execFor(node, io) {
    const items = node.words === null ? [...this.positional] : node.words.flatMap((w) => this.expandWord(w));
    let status = 0;
    this.loopDepth++;
    try {
      for (const item of items) {
        this.setVar(node.name, item);
        try {
          status = this.execList(node.body, io);
        } catch (e) {
          if (!(e instanceof LoopSignal)) throw e;
          if (e.depth > 1) { e.depth--; throw e; }
          if (e.kind === 'break') break;
        }
      }
    } finally { this.loopDepth--; }
    return status;
  }

  execWhile(node, io) {
    let status = 0;
    // `while read line` consumes the loop's stdin one line at a time
    const input = { text: io.stdin };
    const loopIo = { ...io, input };
    this.loopDepth++;
    try {
      for (;;) {
        this.tick();
        const c = this.inCondition(() => this.execList(node.cond, loopIo));
        if (node.until ? c === 0 : c !== 0) break;
        try {
          status = this.execList(node.body, { ...io, stdin: '' });
        } catch (e) {
          if (!(e instanceof LoopSignal)) throw e;
          if (e.depth > 1) { e.depth--; throw e; }
          if (e.kind === 'break') break;
        }
      }
    } finally { this.loopDepth--; }
    return status;
  }

  execPipeline(node, io) {
    let input = io.stdin;
    const statuses = [];
    node.cmds.forEach((cmd, i) => {
      const last = i === node.cmds.length - 1;
      let captured = '';
      const pio = { stdin: input, tty: last && io.tty, out: last ? io.out : (s) => { captured += s; }, err: io.err };
      // Each side of a pipe runs in its own subshell, like real Bash
      const run = () => this.subshell(() => this.exec(cmd, pio));
      statuses.push(node.cmds.length > 1 ? this.inCondition(run) : this.exec(cmd, pio));
      input = captured;
    });
    let status = statuses[statuses.length - 1];
    if (this.options.pipefail) status = [...statuses].reverse().find((s) => s !== 0) ?? 0;
    return node.negate ? +(status === 0) : status;
  }

  // Runs fn with a copy of the shell's variables and directory, then restores them
  subshell(fn) {
    const arrays = Object.fromEntries(Object.entries(this.arrays).map(([k, v]) => [k, [...v]]));
    const saved = { vars: { ...this.vars }, exported: new Set(this.exported), arrays, cwd: this.fs.cwd, functions: { ...this.functions }, options: { ...this.options }, positional: [...this.positional] };
    try {
      return fn();
    } catch (e) {
      if (e instanceof ExitSignal) return e.code;
      throw e;
    } finally {
      Object.assign(this, { vars: saved.vars, exported: saved.exported, arrays: saved.arrays, functions: saved.functions, options: saved.options, positional: saved.positional });
      this.fs.cwd = saved.cwd;
    }
  }

  // Runs fn as a new program would run (./script.sh, bash -c '...'): it starts
  // with the exported variables only, and without this shell's functions,
  // arrays and `set` options. Nothing it changes comes back.
  childProcess(fn) {
    const locals = this.localStack;
    try {
      return this.subshell(() => {
        this.vars = Object.fromEntries(Object.entries(this.vars).filter(([name]) => this.exported.has(name)));
        this.arrays = {};
        this.functions = {};
        this.options = { errexit: false, nounset: false, pipefail: false, xtrace: false };
        this.localStack = [];
        return fn();
      });
    } finally {
      this.localStack = locals;
    }
  }

  // Applies redirects to a compound command's output
  withRedirects(node, io, fn) {
    if (!node.redirs?.length) return fn(io);
    const { io: rio, flush } = this.applyRedirects(node.redirs, io);
    try { return fn(rio); } finally { flush(); }
  }

  applyRedirects(redirs, io) {
    const sinks = { 1: io.out, 2: io.err };
    let stdin = io.stdin;
    let input = io.input;
    const files = [];
    for (const r of redirs) {
      const target = this.expandWord(r.target, { split: false })[0] ?? '';
      if (r.op === '<') {
        stdin = this.fs.read(target);
        input = undefined;
        continue;
      }
      // cmd <<< "text": the text, plus a line break, is the command's input
      if (r.op === '<<<') {
        stdin = `${target}\n`;
        input = undefined;
        continue;
      }
      if (r.op === '>&') {
        const fd = Number(target);
        if (!sinks[fd]) throw new ShellError(`${target}: bad file descriptor`);
        sinks[r.fd] = sinks[fd];
        continue;
      }
      const append = r.op === '>>';
      const both = r.op === '&>';
      if (target === '/dev/null') {
        sinks[r.fd] = () => {};
        if (both) sinks[2] = sinks[1];
        continue;
      }
      if (target === '/dev/stderr') { sinks[r.fd] = io.err; continue; }
      if (target === '/dev/stdout') { sinks[r.fd] = io.out; continue; }
      const buf = { path: target, text: '', append };
      if (!append) this.fs.write(target, '');
      else if (!this.fs.exists(target)) this.fs.write(target, '');
      files.push(buf);
      sinks[r.fd] = (s) => { buf.text += s; };
      if (both) sinks[2] = sinks[1];
    }
    return {
      io: { stdin, input, tty: io.tty && sinks[1] === io.out, out: sinks[1], err: sinks[2] },
      flush: () => { for (const f of files) this.fs.write(f.path, f.text, { append: true }); },
    };
  }

  execSimple(node, io) {
    this.lastSubstStatus = undefined;
    // [[ ... ]] doesn't split words or expand wildcards
    const literal = node.words[0] === '[[' ? { split: false, glob: false } : undefined;
    // local list=(a "b c"): the items are read here, from the word as written, for assign()
    const arrayLiterals = {};
    const declaring = DECLARING.has(node.words[0]);
    const words = node.words.flatMap((w) => {
      const m = declaring && w.match(/^([A-Za-z_][A-Za-z0-9_]*)=(\(.*\))$/s);
      if (!m) return this.expandWord(w, literal);
      arrayLiterals[m[1]] = this.arrayItems(m[2]);
      return [`${m[1]}=()`];
    });
    const assigns = node.assigns.map((a) => (/^\(.*\)$/s.test(a.raw)
      ? { ...a, items: this.arrayItems(a.raw) }
      : { ...a, value: this.expandWord(a.raw, { split: false, glob: false }).join('') }));

    if (!words.length) {
      for (const a of assigns) {
        if (a.items) this.setArray(a.name, a.items, a.append);
        else if (a.index !== undefined) this.setElement(a.name, a.index, a.value, a.append);
        else this.setVar(a.name, a.append ? (this.getVar(a.name) ?? '') + a.value : a.value);
      }
      if (node.redirs.length) this.applyRedirects(node.redirs, io).flush();
      return this.lastSubstStatus ?? 0;
    }

    if (this.options.xtrace) io.err(`+ ${words.join(' ')}\n`);
    const { io: rio, flush } = this.applyRedirects(node.redirs, io);
    // VAR=value cmd: the assignment only lasts for that command. Only the
    // names set in front are put back, so what a function or `read` assigns stays.
    // For that command the variable is exported too: the program started sees it.
    const saved = assigns.map((a) => ({ name: a.name, had: a.name in this.vars, value: this.vars[a.name], exported: this.exported.has(a.name) }));
    for (const a of assigns) {
      this.vars[a.name] = a.value ?? a.items.join(' ');
      this.exported.add(a.name);
    }
    this.arrayLiterals = arrayLiterals;
    try {
      return this.invoke(words, rio);
    } finally {
      this.arrayLiterals = {};
      flush();
      for (const v of saved) {
        if (v.had) this.vars[v.name] = v.value;
        else delete this.vars[v.name];
        if (!v.exported) this.exported.delete(v.name);
      }
    }
  }

  invoke(words, io) {
    const [name, ...args] = words;
    if (this.functions[name]) return this.callFunction(name, args, io);
    if (name.includes('/')) return this.runScriptFile(name, args, io, { needsExec: true });
    const found = this.locate(name);
    if (found?.kind === 'file') return this.runScriptFile(found.path, args, io, { needsExec: true });
    const cmd = found && COMMANDS[name];
    if (!cmd) {
      io.err(`bash: ${name}: command not found\n`);
      return 127;
    }
    try {
      const status = cmd({ name, args, io, stdin: io.stdin, out: io.out, err: io.err, shell: this, fs: this.fs });
      return status ?? 0;
    } catch (e) {
      if (e instanceof FsError) { io.err(`${name}: ${e.message}\n`); return 1; }
      if (e instanceof ArithError) { io.err(`bash: ${e.message}\n`); return 1; }
      throw e;
    }
  }

  // Where a command name leads, the way Bash decides: a function, a shell
  // builtin, or the first match in the folders of $PATH, left to right. A
  // runnable file in one of those folders wins over a program of the same
  // name further along, which is how a test puts a pretend `aws` in front.
  locate(name) {
    if (this.functions[name]) return { kind: 'function' };
    if (BUILTINS.has(name)) return { kind: 'builtin' };
    for (const dir of (this.vars.PATH ?? '').split(':')) {
      const path = `${dir || '.'}/${name}`.replace(/\/{2,}/g, '/');
      const node = this.fs.node(path);
      if (node && node.type !== 'dir' && node.mode & 0o111) return { kind: 'file', path };
      if (SYSTEM_DIRS.includes(dir.replace(/\/+$/, '')) && COMMANDS[name]) return { kind: 'program', path: `/usr/bin/${name}` };
    }
    return null;
  }

  callFunction(name, args, io) {
    const savedPositional = this.positional;
    this.positional = args;
    this.localStack.push({});
    try {
      return this.exec(this.functions[name], io);
    } catch (e) {
      if (e instanceof ReturnSignal) return e.code;
      throw e;
    } finally {
      const locals = this.localStack.pop();
      for (const [k, was] of Object.entries(locals)) {
        if (was.value === undefined) delete this.vars[k];
        else this.vars[k] = was.value;
        if (was.items === undefined) delete this.arrays[k];
        else this.arrays[k] = was.items;
      }
      this.positional = savedPositional;
    }
  }

  // bash script.sh / ./script.sh / source script.sh
  runScriptFile(path, args, io, { needsExec = false, source = false } = {}) {
    const node = this.fs.node(path);
    if (!node) { io.err(`bash: ${path}: No such file or directory\n`); return 127; }
    if (node.type === 'dir') { io.err(`bash: ${path}: Is a directory\n`); return 126; }
    if (needsExec && !(node.mode & 0o100)) { io.err(`bash: ${path}: Permission denied\n`); return 126; }
    let ast;
    try {
      ast = parse(node.content);
    } catch (e) {
      if (e instanceof ParseError) { io.err(`${path}: ${e.message}\n`); return 2; }
      throw e;
    }
    const run = () => {
      const savedPositional = this.positional;
      const savedName = this.scriptName;
      if (!source || args.length) this.positional = args;
      this.scriptName = path;
      try {
        return this.execList(ast, io);
      } catch (e) {
        if (e instanceof ReturnSignal && source) return e.code;
        throw e;
      } finally {
        this.positional = savedPositional;
        this.scriptName = savedName;
      }
    };
    if (source) return run();
    // A script runs in a child process: its variables and cd don't leak out,
    // and it only receives the variables that were exported
    return this.childProcess(run);
  }

  // ------------------------------------------------------------------
  // Builtin hooks used by commands.js
  // ------------------------------------------------------------------
  exit(code) { throw new ExitSignal(code); }
  doReturn(code) {
    if (!this.localStack.length && this.scriptName === 'bash') throw new ShellError('return: can only `return\' from a function or sourced script');
    throw new ReturnSignal(code);
  }
  loopControl(kind, depth = 1) {
    if (!this.loopDepth) return false;
    throw new LoopSignal(kind, depth);
  }
  declareLocal(name, value) {
    const frame = this.localStack[this.localStack.length - 1];
    if (!frame) throw new ShellError('local: can only be used in a function');
    if (!(name in frame)) {
      frame[name] = { value: this.vars[name], items: this.arrays[name] };
      delete this.arrays[name];
    }
    if (value !== undefined) this.assign(name, value);
    else if (!(name in this.vars)) this.vars[name] = '';
  }

  setVar(name, value) {
    if (this.arrays[name]) this.arrays[name][0] = String(value);
    else this.vars[name] = String(value);
  }

  // name=value as `local`, `declare` and `export` receive it. Written as
  // name=(a b), it makes an array (execSimple kept the items).
  assign(name, value) {
    if (this.arrayLiterals?.[name]) this.setArray(name, this.arrayLiterals[name]);
    else this.setVar(name, value);
  }

  // ------------------------------------------------------------------
  // Indexed arrays: name=(a b c), name+=(d), name[2]=x
  // ------------------------------------------------------------------

  // The words between the parentheses of name=( ... ), expanded like arguments
  arrayItems(raw) {
    return tokenize(raw.slice(1, -1)).filter((t) => t.t === 'word').flatMap((t) => this.expandWord(t.v));
  }

  // The items of an array. A plain variable counts as an array of one.
  itemsOf(name) {
    if (this.arrays[name]) return this.arrays[name];
    return this.vars[name] ? [this.vars[name]] : [];
  }

  setArray(name, items, append = false) {
    this.arrays[name] = append ? [...this.itemsOf(name), ...items] : [...items];
    delete this.vars[name];
  }

  setElement(name, index, value, append = false) {
    const items = [...this.itemsOf(name)];
    const i = evaluate(this.expandString(index, { arith: true }), this.varAccess());
    if (i < 0) throw new ShellError(`${name}[${index}]: bad array subscript`);
    items[i] = append ? (items[i] ?? '') + value : value;
    this.arrays[name] = Array.from(items, (x) => x ?? '');
    delete this.vars[name];
  }

  // What "$*" and "${name[*]}" put between the items: the first character of IFS
  joiner() {
    return this.vars.IFS === undefined ? ' ' : this.vars.IFS.slice(0, 1);
  }

  // ${name[@]}, ${name[*]}, ${#name[@]}, ${!name[@]}, ${name[2]}, ${#name[2]},
  // and after the brackets: :-default, :+other, :start and :start:count
  arrayParam([, prefix, name, index, rest = ''], quoted) {
    const bad = () => new ShellError(`\${${prefix ?? ''}${name}[${index}]${rest}}: bad substitution`);
    if (rest && prefix) throw bad();
    const word = rest.match(/^:?([-+])(.*)$/s);
    const slice = !word && rest.match(/^:(-?\d+)(?::(\d+))?$/);
    if (rest && !word && !slice) throw bad();
    let items = this.itemsOf(name);
    if (index === '@' || index === '*') {
      if (prefix === '#') return { text: String(items.length) };
      if (word) {
        if ((word[1] === '-') === (items.length === 0)) return { text: this.expandString(word[2]) };
        if (word[1] === '+') return { text: '' };
      }
      if (slice) {
        const start = Number(slice[1]) < 0 ? Math.max(0, items.length + Number(slice[1])) : Number(slice[1]);
        items = items.slice(start, slice[2] === undefined ? undefined : start + Number(slice[2]));
      }
      const list = prefix === '!' ? items.map((_, i) => String(i)) : items;
      if (index === '@' && quoted) return { fields: [...list] };
      return { text: list.join(index === '*' && quoted ? this.joiner() : ' ') };
    }
    if (slice) throw bad();
    const i = evaluate(this.expandString(index, { arith: true }), this.varAccess());
    const value = items[i < 0 ? items.length + i : i];
    if (word) {
      const missing = rest[0] === ':' ? !value : value === undefined;
      if ((word[1] === '-') === missing) return { text: this.expandString(word[2]) };
      return { text: word[1] === '+' ? '' : value };
    }
    if (value === undefined && this.options.nounset) throw new ShellError(`${name}[${index}]: unbound variable`);
    return { text: prefix === '#' ? String((value ?? '').length) : value ?? '' };
  }

  getVar(name) {
    if (/^[0-9]+$/.test(name)) {
      const n = Number(name);
      return n === 0 ? this.scriptName : this.positional[n - 1];
    }
    switch (name) {
      case '?': return String(this.status);
      case '#': return String(this.positional.length);
      case '@': return this.positional.join(' ');
      case '*': return this.positional.join(this.joiner());
      case '$': return '4242';
      case '!': return '4243';
      case 'RANDOM': return String(Math.floor(Math.random() * 32768));
      case 'PWD': return this.fs.cwd;
      case 'SECONDS': return String(Math.floor((Date.now() - (this.startedAt ??= Date.now())) / 1000));
      default: return this.arrays[name] ? this.arrays[name][0] : this.vars[name];
    }
  }

  varAccess() {
    return { get: (n) => this.getVar(n), set: (n, v) => this.setVar(n, v) };
  }

  // ------------------------------------------------------------------
  // Expansion
  // ------------------------------------------------------------------

  // Expands one raw word into zero or more fields (quotes removed).
  expandWord(raw, { split = true, glob = true } = {}) {
    // Each field is a list of chars tagged quoted/unquoted
    const fields = [[]];
    let sawQuotes = false;
    let vanished = false; // "$@" or "${list[@]}" with nothing in it: no word at all
    const add = (text, quoted) => {
      const f = fields[fields.length - 1];
      for (const ch of text) f.push({ ch, quoted });
    };
    const newField = () => fields.push([]);

    let i = 0;
    while (i < raw.length) {
      const c = raw[i];
      if (c === "'") {
        const end = raw.indexOf("'", i + 1);
        add(raw.slice(i + 1, end), true);
        sawQuotes = true;
        i = end + 1;
      } else if (c === '"') {
        sawQuotes = true;
        i = this.expandDouble(raw, i + 1, add, newField, () => { vanished = true; });
      } else if (c === '\\') {
        add(raw[i + 1] ?? '', true);
        i += 2;
      } else if (c === '$' && raw[i + 1] === "'") {
        // $'...': a quoted string where \n is a line break, \t a tab
        let text = '';
        let j = i + 2;
        for (; j < raw.length && raw[j] !== "'"; j++) {
          if (raw[j] !== '\\' || j + 1 >= raw.length) { text += raw[j]; continue; }
          // \033 and \x1b (the start of a colour code), \u00e9
          const code = raw.slice(j + 1).match(/^(?:([0-7]{1,3})|x([0-9A-Fa-f]{1,2})|u([0-9A-Fa-f]{1,4}))/);
          if (code) {
            text += String.fromCodePoint(code[1] ? parseInt(code[1], 8) : parseInt(code[2] ?? code[3], 16));
            j += code[0].length;
          } else {
            j++;
            text += ANSI_C[raw[j]] ?? `\\${raw[j]}`;
          }
        }
        add(text, true);
        sawQuotes = true;
        i = j + 1;
      } else if (c === '$' || c === '`') {
        const { text, end, fields: multi } = this.expandDollar(raw, i, false);
        if (multi) {
          multi.forEach((f, idx) => { if (idx) newField(); add(f, false); });
        } else add(text, false);
        i = end;
      } else if (c === '~' && i === 0 && (raw.length === 1 || raw[1] === '/')) {
        add(HOME, true);
        i++;
      } else {
        add(c, false);
        i++;
      }
    }

    const ifs = this.vars.IFS ?? ' \t\n';
    const words = [];
    for (const field of fields) {
      let cur = null;
      for (const { ch, quoted } of field) {
        if (!quoted && split && ifs.includes(ch)) {
          if (cur) words.push(cur);
          cur = null;
        } else {
          (cur ??= []).push({ ch, quoted });
        }
      }
      if (cur) words.push(cur);
      else if (sawQuotes && !vanished && field.length === 0 && fields.length === 1) words.push([]);
    }

    return words.flatMap((w) => {
      const text = w.map((x) => x.ch).join('');
      if (!glob || !w.some((x) => !x.quoted && /[*?[]/.test(x.ch))) return [text];
      const pattern = w.map((x) => (x.quoted ? x.ch.replace(/[*?[\]]/g, '\\$&') : x.ch)).join('');
      const matches = this.glob(pattern);
      return matches.length ? matches : [text];
    });
  }

  // Inside "...": expands $ and `, keeps everything else literal.
  // Returns the index after the closing quote.
  expandDouble(raw, i, add, newField, onNoFields) {
    while (i < raw.length && raw[i] !== '"') {
      const c = raw[i];
      if (c === '\\' && '$`"\\\n'.includes(raw[i + 1])) {
        add(raw[i + 1], true);
        i += 2;
      } else if (c === '$' || c === '`') {
        const { text, end, fields: multi } = this.expandDollar(raw, i, true);
        if (multi) {
          if (!multi.length) onNoFields?.();
          multi.forEach((f, idx) => { if (idx) newField(); add(f, true); });
        } else add(text, true);
        i = end;
      } else {
        add(c, true);
        i++;
      }
    }
    return i + 1;
  }

  // Expands the $... or `...` starting at raw[i]. Returns { text, end } or,
  // for "$@", { fields: [...] }.
  expandDollar(raw, i, quoted) {
    if (raw[i] === '`') {
      const end = raw.indexOf('`', i + 1);
      return { text: this.commandSubst(raw.slice(i + 1, end)), end: end + 1 };
    }
    const n = raw[i + 1];
    if (n === '(' && raw[i + 2] === '(') {
      const end = findClose(raw, i + 1);
      const expr = raw.slice(i + 3, end - 2);
      return { text: String(evaluate(this.expandString(expr, { arith: true }), this.varAccess())), end };
    }
    if (n === '(') {
      const end = findClose(raw, i + 1);
      return { text: this.commandSubst(raw.slice(i + 2, end - 1)), end };
    }
    if (n === '{') {
      const end = raw.indexOf('}', i);
      const element = raw.slice(i + 2, end).match(/^([#!])?([A-Za-z_][A-Za-z0-9_]*)\[([^\]]+)\](.*)$/s);
      if (element) return { ...this.arrayParam(element, quoted), end: end + 1 };
      return { text: this.braceParam(raw.slice(i + 2, end), quoted), end: end + 1, ...(raw.slice(i + 2, end) === '@' && quoted ? { fields: [...this.positional] } : {}) };
    }
    if (n === '@' && quoted) return { fields: [...this.positional], end: i + 2 };
    const m = raw.slice(i + 1).match(/^([A-Za-z_][A-Za-z0-9_]*|[0-9?#@*$!])/);
    if (!m) return { text: '$', end: i + 1 };
    return { text: this.lookup(m[1]), end: i + 1 + m[1].length };
  }

  lookup(name) {
    const v = this.getVar(name);
    if (v === undefined && this.options.nounset && !/^[@*#?$!]$/.test(name)) {
      throw new ShellError(`${name}: unbound variable`);
    }
    return v ?? '';
  }

  braceParam(body) {
    if (body.startsWith('#') && body.length > 1) return String(this.lookup(body.slice(1)).length);
    const m = body.match(/^([A-Za-z_][A-Za-z0-9_]*|[0-9]+|[?#@*$!])(.*)$/s);
    if (!m) throw new ShellError(`\${${body}}: bad substitution`);
    const [, name, rest] = m;
    const value = this.getVar(name);
    const expandArg = (s) => this.expandString(s);
    if (!rest) return this.lookup(name);
    let op;
    if ((op = rest.match(/^:?-(.*)$/s)) && (rest[0] === '-' || rest.startsWith(':-'))) {
      const useDefault = rest[0] === ':' ? !value : value === undefined;
      return useDefault ? expandArg(op[1]) : value;
    }
    if (rest.startsWith(':=') || rest.startsWith('=')) {
      const arg = rest.replace(/^:?=/, '');
      if (rest[0] === ':' ? !value : value === undefined) { this.setVar(name, expandArg(arg)); return this.vars[name]; }
      return value;
    }
    if (rest.startsWith(':?') || rest.startsWith('?')) {
      if (rest[0] === ':' ? !value : value === undefined) throw new ShellError(`${name}: ${expandArg(rest.replace(/^:?\?/, '')) || 'parameter null or not set'}`);
      return value;
    }
    if (rest.startsWith(':+') || rest.startsWith('+')) {
      return (rest[0] === ':' ? value : value !== undefined) ? expandArg(rest.replace(/^:?\+/, '')) : '';
    }
    const v = this.lookup(name);
    if (rest === '^^') return v.toUpperCase();
    if (rest === ',,') return v.toLowerCase();
    if ((op = rest.match(/^(%%|%|##|#)(.*)$/s))) {
      const pattern = expandArg(op[2]);
      const re = globToRegex(pattern).source.slice(1, -1);
      switch (op[1]) {
        case '#': return v.replace(new RegExp(`^${re.replace(/\[\^\/\]\*/g, '.*?')}`, 's'), '');
        case '##': return v.replace(new RegExp(`^${re.replace(/\[\^\/\]\*/g, '.*')}`, 's'), '');
        case '%': {
          for (let k = v.length; k >= 0; k--) if (new RegExp(`^${re.replace(/\[\^\/\]\*/g, '.*')}$`, 's').test(v.slice(k))) return v.slice(0, k);
          return v;
        }
        case '%%': {
          for (let k = 0; k <= v.length; k++) if (new RegExp(`^${re.replace(/\[\^\/\]\*/g, '.*')}$`, 's').test(v.slice(k))) return v.slice(0, k);
          return v;
        }
      }
    }
    if ((op = rest.match(/^(\/\/?)([^/]*)\/?(.*)$/s))) {
      const re = new RegExp(globToRegex(expandArg(op[2])).source.slice(1, -1).replace(/\[\^\/\]\*/g, '.*'), op[1] === '//' ? 'g' : '');
      return v.replace(re, expandArg(op[3]));
    }
    if ((op = rest.match(/^:(-?\d+)(?::(\d+))?$/))) {
      let start = Number(op[1]);
      if (start < 0) start = Math.max(0, v.length + start);
      return op[2] !== undefined ? v.substr(start, Number(op[2])) : v.slice(start);
    }
    throw new ShellError(`\${${body}}: bad substitution`);
  }

  // Expands $... inside a string without splitting (used for arithmetic and ${x:-...} words)
  expandString(s, { arith = false } = {}) {
    let out = '';
    let i = 0;
    while (i < s.length) {
      const c = s[i];
      if (c === '$' || c === '`') {
        const { text, end, fields } = this.expandDollar(s, i, true);
        out += fields ? fields.join(' ') : text;
        i = end;
      } else if (!arith && c === "'" ) {
        const end = s.indexOf("'", i + 1);
        out += s.slice(i + 1, end === -1 ? undefined : end);
        i = end === -1 ? s.length : end + 1;
      } else if (!arith && c === '"') {
        i++;
      } else {
        out += c;
        i++;
      }
    }
    return out;
  }

  commandSubst(src) {
    let captured = '';
    const io = { stdin: '', out: (s) => { captured += s; }, err: (s) => this.topErr?.(s) };
    this.lastSubstStatus = this.subshell(() => {
      try {
        return this.execList(parse(src), io);
      } catch (e) {
        if (e instanceof ParseError) throw new ShellError(`command substitution: ${e.message}`, 2);
        throw e;
      }
    });
    this.status = this.lastSubstStatus;
    return captured.replace(/\n+$/, '');
  }

  glob(pattern) {
    const abs = pattern.startsWith('/');
    const parts = pattern.split('/').filter(Boolean);
    let candidates = [abs ? '/' : ''];
    for (const part of parts) {
      const nextC = [];
      for (const base of candidates) {
        const dirPath = base || '.';
        if (!hasGlob(part.replace(/\\[*?[\]]/g, ''))) {
          const p = base ? (base === '/' ? `/${unescape(part)}` : `${base}/${unescape(part)}`) : unescape(part);
          if (this.fs.exists(p)) nextC.push(p);
          continue;
        }
        if (!this.fs.isDir(dirPath)) continue;
        const re = globToRegex(part);
        for (const name of this.fs.list(dirPath)) {
          if (name.startsWith('.') && !part.startsWith('.')) continue;
          if (re.test(name)) nextC.push(base ? (base === '/' ? `/${name}` : `${base}/${name}`) : name);
        }
      }
      candidates = nextC;
    }
    return candidates.filter((c) => c && c !== '/').sort();
  }
}

const unescape = (s) => s.replace(/\\([*?[\]])/g, '$1');

// Index after the ")" matching the "(" at raw[i]
function findClose(raw, i) {
  let depth = 0;
  for (; i < raw.length; i++) {
    const c = raw[i];
    if (c === "'") { i = raw.indexOf("'", i + 1); continue; }
    if (c === '\\') { i++; continue; }
    if (c === '(') depth++;
    else if (c === ')' && --depth === 0) return i + 1;
  }
  throw new ShellError('unexpected end of input: missing )', 2);
}
