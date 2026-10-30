// Integer arithmetic for $(( )) and (( )): + - * / % **, comparisons,
// && || !, parentheses, and assignments (= += -= *= /= ++ --) on shell
// variables. `vars` is { get(name) -> string, set(name, value) }.

export class ArithError extends Error {}

const TOKEN = /\s*(\d+|[A-Za-z_][A-Za-z0-9_]*|\$\{?[A-Za-z_][A-Za-z0-9_]*\}?|\$[0-9#?]|\*\*=?|\+\+|--|[-+*/%]=|<=|>=|==|!=|&&|\|\||[-+*/%<>=!()?:])/y;

export function evaluate(expr, vars) {
  const tokens = [];
  TOKEN.lastIndex = 0;
  const src = expr.trim();
  while (TOKEN.lastIndex < src.length) {
    const start = TOKEN.lastIndex;
    const m = TOKEN.exec(src);
    if (!m) throw new ArithError(`${src}: syntax error in expression (error token is "${src.slice(start).trim()}")`);
    tokens.push(m[1]);
  }
  let pos = 0;
  const peek = () => tokens[pos];
  const next = () => tokens[pos++];

  const varName = (t) => t.replace(/^\$\{?|\}$/g, '');
  const isName = (t) => /^\$?\{?[A-Za-z_]/.test(t || '');
  const valueOf = (name) => {
    const raw = (vars.get(name) ?? '').trim();
    if (raw === '') return 0;
    if (/^-?\d+$/.test(raw)) return Number(raw);
    if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(raw)) return valueOf(raw);
    throw new ArithError(`${raw}: syntax error in expression`);
  };
  const truncate = (n) => Math.trunc(n);

  const BINARY = [
    ['||'], ['&&'], ['==', '!='], ['<', '>', '<=', '>='], ['+', '-'], ['*', '/', '%'],
  ];

  function assignment() {
    const t = peek();
    if (isName(t) && !/^\$[0-9#?]$/.test(t)) {
      const op = tokens[pos + 1];
      if (['=', '+=', '-=', '*=', '/=', '%='].includes(op)) {
        pos += 2;
        const name = varName(t);
        const rhs = assignment();
        const cur = op === '=' ? 0 : valueOf(name);
        const v = op === '=' ? rhs : apply(op[0], cur, rhs);
        vars.set(name, String(v));
        return v;
      }
    }
    return ternary();
  }

  function ternary() {
    const cond = binary(0);
    if (peek() !== '?') return cond;
    pos++;
    const a = assignment();
    if (next() !== ':') throw new ArithError('expected `:` in conditional expression');
    const b = assignment();
    return cond ? a : b;
  }

  function apply(op, a, b) {
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '*': return a * b;
      case '/': if (b === 0) throw new ArithError('division by 0'); return truncate(a / b);
      case '%': if (b === 0) throw new ArithError('division by 0'); return a % b;
      case '<': return +(a < b);
      case '>': return +(a > b);
      case '<=': return +(a <= b);
      case '>=': return +(a >= b);
      case '==': return +(a === b);
      case '!=': return +(a !== b);
      case '&&': return +(!!a && !!b);
      case '||': return +(!!a || !!b);
      default: throw new ArithError(`unknown operator ${op}`);
    }
  }

  function binary(level) {
    if (level === BINARY.length) return power();
    let left = binary(level + 1);
    while (BINARY[level].includes(peek())) {
      const op = next();
      left = apply(op, left, binary(level + 1));
    }
    return left;
  }

  function power() {
    const base = unary();
    if (peek() === '**') { pos++; return base ** power(); }
    return base;
  }

  function unary() {
    const t = peek();
    if (t === '-') { pos++; return -unary(); }
    if (t === '+') { pos++; return unary(); }
    if (t === '!') { pos++; return +!unary(); }
    if (t === '++' || t === '--') {
      pos++;
      const name = varName(next() || '');
      const v = valueOf(name) + (t === '++' ? 1 : -1);
      vars.set(name, String(v));
      return v;
    }
    return postfix();
  }

  function postfix() {
    const t = next();
    if (t === undefined) throw new ArithError(`${src}: syntax error: operand expected`);
    if (t === '(') {
      const v = assignment();
      if (next() !== ')') throw new ArithError('missing `)`');
      return v;
    }
    if (/^\d+$/.test(t)) return Number(t);
    if (t === '$#' || t === '$?' || /^\$[0-9]$/.test(t)) return valueOf(t.slice(1));
    if (isName(t)) {
      const name = varName(t);
      if (peek() === '++' || peek() === '--') {
        const op = next();
        const v = valueOf(name);
        vars.set(name, String(v + (op === '++' ? 1 : -1)));
        return v;
      }
      return valueOf(name);
    }
    throw new ArithError(`${src}: syntax error: operand expected (error token is "${t}")`);
  }

  if (!tokens.length) return 0;
  const result = assignment();
  if (pos < tokens.length) throw new ArithError(`${src}: syntax error in expression (error token is "${tokens.slice(pos).join(' ')}")`);
  return result;
}
