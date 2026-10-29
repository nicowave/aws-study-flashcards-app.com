// In-memory file system for the practice shell. Paths are Unix-style; every
// node keeps a modification time so `ls -l` and `find -mtime` have something
// to show. Nothing here touches the learner's real computer.

export const HOME = '/home/learner';

const now = () => Date.now();

const dirNode = (mtime = now()) => ({ type: 'dir', children: {}, mtime, mode: 0o755 });
const fileNode = (content = '', mtime = now(), mode = 0o644) => ({ type: 'file', content, mtime, mode });

export class FsError extends Error {}

export class VirtualFs {
  constructor() {
    this.root = dirNode();
    this.cwd = HOME;
    for (const d of ['/home', HOME, '/tmp', '/var', '/var/log', '/etc', '/usr', '/usr/bin', '/bin']) this.mkdir(d, { parents: true });
  }

  // Seed from { 'path': 'content' | { content, mtime, mode } | null (empty dir) }.
  // Relative paths are under the home directory.
  load(files = {}) {
    for (const [path, spec] of Object.entries(files)) {
      const abs = this.resolve(path.startsWith('/') ? path : `${HOME}/${path}`);
      if (spec === null) {
        this.mkdir(abs, { parents: true });
        continue;
      }
      const { content = '', mtime, mode } = typeof spec === 'string' ? { content: spec } : spec;
      this.mkdir(parentOf(abs), { parents: true });
      this.write(abs, content);
      const node = this.node(abs);
      if (mtime !== undefined) node.mtime = mtime;
      if (mode !== undefined) node.mode = mode;
    }
  }

  resolve(path, base = this.cwd) {
    if (path === '~' || path.startsWith('~/')) path = HOME + path.slice(1);
    const parts = (path.startsWith('/') ? path : `${base}/${path}`).split('/');
    const out = [];
    for (const p of parts) {
      if (!p || p === '.') continue;
      if (p === '..') out.pop();
      else out.push(p);
    }
    return '/' + out.join('/');
  }

  node(path) {
    const abs = this.resolve(path);
    let cur = this.root;
    for (const part of abs.split('/').filter(Boolean)) {
      if (cur.type !== 'dir' || !cur.children[part]) return null;
      cur = cur.children[part];
    }
    return cur;
  }

  exists(path) { return !!this.node(path); }
  isDir(path) { return this.node(path)?.type === 'dir'; }
  isFile(path) { return this.node(path)?.type === 'file'; }

  read(path) {
    const n = this.node(path);
    if (!n) throw new FsError(`${path}: No such file or directory`);
    if (n.type === 'dir') throw new FsError(`${path}: Is a directory`);
    return n.content;
  }

  write(path, content, { append = false } = {}) {
    const abs = this.resolve(path);
    const parent = this.node(parentOf(abs));
    if (!parent || parent.type !== 'dir') throw new FsError(`${path}: No such file or directory`);
    const name = baseOf(abs);
    const existing = parent.children[name];
    if (existing?.type === 'dir') throw new FsError(`${path}: Is a directory`);
    if (existing) {
      existing.content = append ? existing.content + content : content;
      existing.mtime = now();
    } else {
      parent.children[name] = fileNode(content);
    }
    parent.mtime = now();
  }

  touch(path) {
    const n = this.node(path);
    if (n) n.mtime = now();
    else this.write(path, '');
  }

  mkdir(path, { parents = false } = {}) {
    const abs = this.resolve(path);
    let cur = this.root;
    const parts = abs.split('/').filter(Boolean);
    parts.forEach((part, i) => {
      const last = i === parts.length - 1;
      if (!cur.children[part]) {
        if (!last && !parents) throw new FsError(`cannot create directory '${path}': No such file or directory`);
        cur.children[part] = dirNode();
      } else if (cur.children[part].type !== 'dir') {
        throw new FsError(`cannot create directory '${path}': Not a directory`);
      } else if (last && !parents) {
        throw new FsError(`cannot create directory '${path}': File exists`);
      }
      cur = cur.children[part];
    });
  }

  list(path) {
    const n = this.node(path);
    if (!n) throw new FsError(`cannot access '${path}': No such file or directory`);
    if (n.type === 'file') return [baseOf(this.resolve(path))];
    return Object.keys(n.children).sort();
  }

  remove(path, { recursive = false } = {}) {
    const abs = this.resolve(path);
    const n = this.node(abs);
    if (!n) throw new FsError(`cannot remove '${path}': No such file or directory`);
    if (n.type === 'dir' && !recursive) throw new FsError(`cannot remove '${path}': Is a directory`);
    if (abs === '/') throw new FsError(`it is dangerous to operate recursively on '/'`);
    delete this.node(parentOf(abs)).children[baseOf(abs)];
  }

  copy(src, dest, { recursive = false } = {}) {
    const from = this.node(src);
    if (!from) throw new FsError(`cannot stat '${src}': No such file or directory`);
    if (from.type === 'dir' && !recursive) throw new FsError(`-r not specified; omitting directory '${src}'`);
    let target = this.resolve(dest);
    if (this.isDir(target)) target = `${target}/${baseOf(this.resolve(src))}`;
    const parent = this.node(parentOf(target));
    if (!parent || parent.type !== 'dir') throw new FsError(`cannot create '${dest}': No such file or directory`);
    parent.children[baseOf(target)] = structuredClone(from);
    parent.children[baseOf(target)].mtime = now();
  }

  move(src, dest) {
    this.copy(src, dest, { recursive: true });
    this.remove(src, { recursive: true });
  }

  // Every path under `path` (itself included), depth first.
  walk(path) {
    const abs = this.resolve(path);
    const n = this.node(abs);
    if (!n) throw new FsError(`'${path}': No such file or directory`);
    const out = [{ path: abs, node: n }];
    if (n.type === 'dir') {
      for (const name of Object.keys(n.children).sort()) {
        out.push(...this.walk(abs === '/' ? `/${name}` : `${abs}/${name}`));
      }
    }
    return out;
  }

  // Bytes in a file or a whole tree (what `du` reports)
  size(path) {
    return this.walk(path).reduce((sum, { node }) => sum + (node.type === 'file' ? node.content.length : 0), 0);
  }
}

export const parentOf = (abs) => abs.replace(/\/[^/]*$/, '') || '/';
export const baseOf = (abs) => abs.split('/').filter(Boolean).pop() || '/';

// Shell-style wildcard (* ? [abc]) to a regular expression
export const globToRegex = (glob) => {
  let re = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '\\' && i + 1 < glob.length) re += glob[++i].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    else if (c === '*') re += '[^/]*';
    else if (c === '?') re += '[^/]';
    else if (c === '[') {
      const end = glob.indexOf(']', i + 1);
      if (end === -1) re += '\\[';
      else {
        re += '[' + glob.slice(i + 1, end).replace(/^!/, '^') + ']';
        i = end;
      }
    } else re += c.replace(/[.+^${}()|\\]/g, '\\$&');
  }
  return new RegExp(`^${re}$`);
};

export const hasGlob = (s) => /[*?[]/.test(s);
