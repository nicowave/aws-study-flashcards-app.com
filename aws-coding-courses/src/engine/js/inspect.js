// Show values the way Node's console does: { a: 1, b: 'x' }, [ 1, 2 ].
// Self-contained (no imports, no outer variables): the web runtime also puts
// its source into the page with inspect.toString().
export function inspect(value, depth = 0, seen = new Set()) {
  const ind = (n) => '  '.repeat(n);
  const quote = (s) => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n')}'`;
  const key = (k) => (/^[A-Za-z_$][\w$]*$/.test(k) ? k : quote(k));
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  const t = typeof value;
  if (t === 'string') return depth === 0 ? value : quote(value);
  if (t === 'number' || t === 'boolean') return Object.is(value, -0) ? '-0' : String(value);
  if (t === 'bigint') return `${value}n`;
  if (t === 'symbol') return value.toString();
  if (t === 'function') return /^class\s/.test(Function.prototype.toString.call(value)) ? `[class ${value.name || '(anonymous)'}]` : `[Function: ${value.name || '(anonymous)'}]`;
  if (seen.has(value)) return '[Circular *1]';
  if (value instanceof Error) return value.stack && depth === 0 ? value.stack : `[${value.name}: ${value.message}]`;
  if (value instanceof Date) return isNaN(value) ? 'Invalid Date' : value.toISOString();
  if (value instanceof RegExp) return String(value);
  if (typeof Promise !== 'undefined' && value instanceof Promise) return 'Promise { <pending> }';
  if (depth > 4) return Array.isArray(value) ? '[Array]' : '[Object]';
  seen.add(value);
  try {
    const nested = (v) => inspect(v, depth + 1, seen);
    const wrap = (open, parts, close, prefix = '') => {
      if (!parts.length) return `${prefix}${open}${close}`;
      const one = `${prefix}${open} ${parts.join(', ')} ${close}`;
      if (one.length <= 72 && !parts.some((p) => p.includes('\n'))) return one;
      // nested values already indent their own inner lines
      return `${prefix}${open}\n${parts.map((p) => ind(depth + 1) + p).join(',\n')}\n${ind(depth)}${close}`;
    };
    if (Array.isArray(value)) {
      const items = value.slice(0, 100).map(nested);
      if (value.length > 100) items.push(`... ${value.length - 100} more items`);
      return wrap('[', items, ']');
    }
    if (value instanceof Map) return wrap('{', [...value].map(([k, v]) => `${nested(k)} => ${nested(v)}`), '}', `Map(${value.size}) `);
    if (value instanceof Set) return wrap('{', [...value].map(nested), '}', `Set(${value.size}) `);
    if (typeof Uint8Array !== 'undefined' && value instanceof Uint8Array) return `Uint8Array(${value.length}) [ ${[...value.slice(0, 20)].join(', ')}${value.length > 20 ? ', ...' : ''} ]`;
    const proto = Object.getPrototypeOf(value);
    const name = proto && proto !== Object.prototype && proto.constructor && proto.constructor.name ? `${proto.constructor.name} ` : proto === null ? '[Object: null prototype] ' : '';
    if (typeof Element !== 'undefined' && value instanceof Element) return `<${value.tagName.toLowerCase()}${value.id ? `#${value.id}` : ''}${value.className && typeof value.className === 'string' ? `.${value.className.trim().split(/\s+/).join('.')}` : ''}>`;
    return wrap('{', Object.keys(value).map((k) => `${key(k)}: ${nested(value[k])}`), '}', name);
  } finally {
    seen.delete(value);
  }
}

// console.log('a', 1, {b: 2}) -> "a 1 { b: 2 }"
export function formatArgs(args) {
  return args.map((a) => (typeof a === 'string' ? a : inspect(a))).join(' ');
}
