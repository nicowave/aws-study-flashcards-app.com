// A pretend AWS account for the JavaScript and TypeScript courses, shaped
// like the AWS SDK for JavaScript v3: the same client and command names,
// `await client.send(new XCommand(input))`, responses with $metadata, and
// errors whose .name is the real exception name. Nothing leaves the browser.
//
// This file must stay self-contained (no imports): the runner loads it as a
// data: URL module, and every '@aws-sdk/*' import is a small re-export of it.

const STATE = { account: '111122223333', region: 'us-east-1', calls: [] };

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

let requestCounter = 0;
const requestId = () => {
  requestCounter += 1;
  const hex = (requestCounter * 2654435761 >>> 0).toString(16).padStart(8, '0').toUpperCase();
  return `${hex}-0000-4000-8000-${hex}${hex.slice(0, 4)}`;
};

const metadata = (status = 200) => ({ httpStatusCode: status, requestId: requestId(), attempts: 1, totalRetryDelay: 0 });

export class ServiceException extends Error {
  constructor({ name, message, status = 400, fault = 'client', service }) {
    super(message);
    this.name = name;
    this.$fault = fault;
    this.$service = service;
    this.$metadata = metadata(status);
  }
}

// Modeled errors are their own classes, so `err instanceof NoSuchKey` works
// as well as `err.name === 'NoSuchKey'`.
const modeled = (name) => ({ [name]: class extends ServiceException {} })[name];
export const ConditionalCheckFailedException = modeled('ConditionalCheckFailedException');
export const ResourceNotFoundException = modeled('ResourceNotFoundException');
export const NoSuchKey = modeled('NoSuchKey');
export const NoSuchBucket = modeled('NoSuchBucket');
export const NotFound = modeled('NotFound');
export const MessageRejected = modeled('MessageRejected');
export const NoSuchDistribution = modeled('NoSuchDistribution');
const MODELED = { ConditionalCheckFailedException, ResourceNotFoundException, NoSuchKey, NoSuchBucket, NotFound, MessageRejected, NoSuchDistribution };

const fail = (service, name, message, status = 400, fault = 'client') => {
  const Cls = MODELED[name] || ServiceException;
  throw new Cls({ name, message, status, fault, service });
};

// ---------------------------------------------------------------------------
// Clients and commands
// ---------------------------------------------------------------------------

class Command {
  constructor(input = {}) {
    if (input === null || typeof input !== 'object') throw new TypeError(`${this.constructor.name} expects an input object`);
    this.input = input;
  }
}

const CLIENT_NAMES = {};

class BaseClient {
  constructor(config = {}) {
    this.config = { region: config.region || STATE.region, ...config };
  }

  async send(command) {
    if (!(command instanceof Command)) throw new TypeError('send() needs a command, like new PutCommand({ ... })');
    const service = command.constructor.service;
    if (service === 'dynamodb-doc' && this.constructor.service === 'dynamodb') {
      throw new TypeError(`${command.constructor.name} comes from @aws-sdk/lib-dynamodb, so send it with a DynamoDBDocumentClient: DynamoDBDocumentClient.from(new DynamoDBClient({}))`);
    }
    if (service !== this.constructor.service) {
      throw new TypeError(`${command.constructor.name} is a ${service} command, but it was sent to a ${this.constructor.name}. Send it with a ${CLIENT_NAMES[service]}.`);
    }
    STATE.calls.push({ service, command: command.constructor.name, region: this.config.region, input: summary(command.input) });
    await new Promise((r) => setTimeout(r, 0)); // a real call is never synchronous
    const out = await command.constructor.run(command.input, this);
    return { $metadata: metadata(command.constructor.status || 200), ...out };
  }

  destroy() {}
}

const summary = (v, depth = 0) => {
  if (depth > 6) return '…';
  if (typeof v === 'string') return v.length > 300 ? `${v.slice(0, 300)}…` : v;
  if (v instanceof Uint8Array) return `<${v.length} bytes>`;
  if (Array.isArray(v)) return v.slice(0, 20).map((x) => summary(x, depth + 1));
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).slice(0, 30).map(([k, x]) => [k, summary(x, depth + 1)]));
  return v;
};

const required = (service, command, input, names) => {
  for (const n of names) {
    if (input[n] === undefined || input[n] === null || input[n] === '') {
      if (service === 's3' && ['Bucket', 'Key'].includes(n)) throw new Error(`No value provided for input HTTP label: ${n}.`);
      fail(service, 'ValidationException', `1 validation error detected: Value null at '${n.charAt(0).toLowerCase()}${n.slice(1)}' failed to satisfy constraint: Member must not be null`);
    }
  }
};

const makeClient = (name, service) => {
  const C = { [name]: class extends BaseClient {} }[name];
  C.service = service;
  CLIENT_NAMES[service] = name;
  return C;
};

const makeCommand = (name, service, run, status) => {
  const C = { [name]: class extends Command {} }[name];
  C.service = service;
  C.run = run;
  C.status = status;
  return C;
};

// ---------------------------------------------------------------------------
// Expressions (DynamoDB): conditions, key conditions, updates
// ---------------------------------------------------------------------------

const tokenize = (expr) => {
  const re = /\s*((?:attribute_not_exists|attribute_exists|begins_with|contains|if_not_exists|list_append|size|AND|OR|NOT|BETWEEN|IN|SET|REMOVE|ADD|DELETE)\b|<>|<=|>=|[=<>(),+\-]|[#:]?[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*)/iy;
  const out = [];
  let pos = 0;
  while (pos < expr.length) {
    if (!expr.slice(pos).trim()) break;
    re.lastIndex = pos;
    const m = re.exec(expr);
    if (!m) fail('dynamodb', 'ValidationException', `Invalid expression: Syntax error; token: "${expr.slice(pos).trim().slice(0, 12)}", near: "${expr.slice(pos, pos + 20).trim()}"`);
    out.push(m[1]);
    pos = re.lastIndex;
  }
  return out;
};

const KEYWORDS = new Set(['AND', 'OR', 'NOT', 'BETWEEN', 'IN']);

const parseCondition = (expr, names = {}, values = {}, what = 'ConditionExpression') => {
  const t = tokenize(expr);
  let i = 0;
  const err = (msg) => fail('dynamodb', 'ValidationException', `Invalid ${what}: ${msg}`);
  const peek = () => t[i];
  const take = (want) => {
    if (want && (t[i] || '').toUpperCase() !== want.toUpperCase()) err(`Syntax error; expected "${want}"`);
    return t[i++];
  };
  const path = (tok) => {
    if (!tok) err('Syntax error; token: "<EOF>"');
    if (tok.startsWith('#')) {
      if (!(tok in names)) err(`An expression attribute name used in the document path is not defined; attribute name: ${tok}`);
      return names[tok];
    }
    if (tok.startsWith(':') || KEYWORDS.has(tok.toUpperCase())) err(`Syntax error; token: "${tok}"`);
    return tok;
  };
  const value = (tok) => {
    if (!tok || !tok.startsWith(':')) err(`Syntax error; token: "${tok}"`);
    if (!(tok in values)) err(`An expression attribute value used in expression is not defined; attribute value: ${tok}`);
    return values[tok];
  };
  const operand = () => (peek()?.startsWith(':') ? ((v) => () => v)(value(take())) : ((p) => (item) => item[p])(path(take())));

  const atom = () => {
    const tok = peek();
    const low = (tok || '').toLowerCase();
    if (['attribute_not_exists', 'attribute_exists'].includes(low)) {
      take(); take('('); const p = path(take()); take(')');
      return low === 'attribute_exists' ? (item) => p in item : (item) => !(p in item);
    }
    if (['begins_with', 'contains'].includes(low)) {
      take(); take('('); const p = path(take()); take(','); const v = value(take()); take(')');
      return low === 'begins_with'
        ? (item) => typeof item[p] === 'string' && item[p].startsWith(v)
        : (item) => (typeof item[p] === 'string' || Array.isArray(item[p])) && item[p].includes(v);
    }
    if (tok === '(') { take(); const inner = or(); take(')'); return inner; }
    const left = operand();
    const op = take();
    if (!op) err('Syntax error; token: "<EOF>"');
    if (op.toUpperCase() === 'BETWEEN') {
      const lo = operand(); take('AND'); const hi = operand();
      return (item) => left(item) !== undefined && left(item) >= lo(item) && left(item) <= hi(item);
    }
    const right = operand();
    const cmp = { '=': (a, b) => a === b, '<>': (a, b) => a !== b, '<': (a, b) => a < b, '<=': (a, b) => a <= b, '>': (a, b) => a > b, '>=': (a, b) => a >= b }[op];
    if (!cmp) err(`Syntax error; token: "${op}"`);
    return (item) => { const a = left(item); const b = right(item); return a !== undefined && b !== undefined && cmp(a, b); };
  };
  const not = () => { if ((peek() || '').toUpperCase() === 'NOT') { take(); const inner = not(); return (item) => !inner(item); } return atom(); };
  const and = () => { let l = not(); while ((peek() || '').toUpperCase() === 'AND') { take(); const a = l; const b = not(); l = (item) => a(item) && b(item); } return l; };
  const or = () => { let l = and(); while ((peek() || '').toUpperCase() === 'OR') { take(); const a = l; const b = and(); l = (item) => a(item) || b(item); } return l; };
  if (!t.length) err('The expression can not be empty;');
  const fn = or();
  if (i !== t.length) err(`Syntax error; token: "${t[i]}"`);
  return fn;
};

const applyUpdate = (item, expr, names = {}, values = {}) => {
  const t = tokenize(expr);
  let i = 0;
  const err = (msg) => fail('dynamodb', 'ValidationException', `Invalid UpdateExpression: ${msg}`);
  const path = (tok) => {
    if (tok?.startsWith('#')) {
      if (!(tok in names)) err(`An expression attribute name used in the document path is not defined; attribute name: ${tok}`);
      return names[tok];
    }
    if (!tok || tok.startsWith(':')) err(`Syntax error; token: "${tok}"`);
    return tok;
  };
  const value = (tok) => {
    if (!(tok in values)) err(`An expression attribute value used in expression is not defined; attribute value: ${tok}`);
    return values[tok];
  };
  const operand = () => {
    const tok = t[i++];
    const low = (tok || '').toLowerCase();
    if (low === 'if_not_exists') {
      i++; const p = path(t[i++]); i++; const fallback = operand(); i++;
      return p in item ? item[p] : fallback;
    }
    if (low === 'list_append') {
      i++; const a = operand(); i++; const b = operand(); i++;
      return [...(a || []), ...(b || [])];
    }
    if (tok?.startsWith(':')) return value(tok);
    const p = path(tok);
    if (!(p in item)) err('The provided expression refers to an attribute that does not exist in the item');
    return item[p];
  };
  const out = { ...item };
  while (i < t.length) {
    const clause = t[i++].toUpperCase();
    if (!['SET', 'REMOVE', 'ADD', 'DELETE'].includes(clause)) err(`Syntax error; token: "${t[i - 1]}"`);
    do {
      if (t[i] === ',') i++;
      if (clause === 'SET') {
        const p = path(t[i++]);
        if (t[i++] !== '=') err('Syntax error; expected "="');
        let v = operand();
        while (t[i] === '+' || t[i] === '-') {
          const op = t[i++];
          const w = operand();
          if (typeof v !== 'number' || typeof w !== 'number') err('Incorrect operand type for operator or function; operator or function: ' + op);
          v = op === '+' ? v + w : v - w;
        }
        out[p] = v;
      } else if (clause === 'REMOVE') {
        delete out[path(t[i++])];
      } else {
        const p = path(t[i++]);
        const v = value(t[i++]);
        if (clause === 'ADD') {
          if (typeof v === 'number') out[p] = (out[p] ?? 0) + v;
          else if (v instanceof Set) out[p] = new Set([...(out[p] || []), ...v]);
          else err('Incorrect operand type for operator or function; operator: ADD');
        } else if (out[p] instanceof Set) {
          out[p] = new Set([...out[p]].filter((x) => !v.has(x)));
        }
      }
    } while (t[i] === ',');
  }
  return out;
};

// ---------------------------------------------------------------------------
// DynamoDB
// ---------------------------------------------------------------------------

const tables = () => (STATE.dynamodb = STATE.dynamodb || {});

const table = (name) => {
  if (!name) fail('dynamodb', 'ValidationException', "1 validation error detected: Value null at 'tableName' failed to satisfy constraint: Member must not be null");
  const t = tables()[name];
  if (!t) fail('dynamodb', 'ResourceNotFoundException', 'Requested resource not found');
  return t;
};

const clone = (v) => {
  if (v instanceof Set) return new Set([...v]);
  if (v instanceof Uint8Array) return new Uint8Array(v);
  if (Array.isArray(v)) return v.map(clone);
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, clone(x)]));
  return v;
};

const keyOf = (t, item, what = 'item') => {
  const out = [];
  for (const name of t.key) {
    const v = item[name];
    if (v === undefined) {
      fail('dynamodb', 'ValidationException', what === 'item'
        ? `One or more parameter values were invalid: Missing the key ${name} in the item`
        : 'The provided key element does not match the schema');
    }
    const want = (t.types || {})[name] || 'S';
    const got = typeof v === 'string' ? 'S' : typeof v === 'number' ? 'N' : 'B';
    if (got !== want) fail('dynamodb', 'ValidationException', `One or more parameter values were invalid: Type mismatch for key ${name} expected: ${want} actual: ${got}`);
    if (v === '') fail('dynamodb', 'ValidationException', `One or more parameter values are not valid. The AttributeValue for a key attribute cannot contain an empty string value. Key: ${name}`);
    out.push(v);
  }
  return JSON.stringify(out);
};

const checkUndefined = (value, client, path = 'Item') => {
  if (client?.translateConfig?.marshallOptions?.removeUndefinedValues) return;
  const walk = (v) => {
    if (v === undefined) throw new Error('Pass options.removeUndefinedValues=true to remove undefined values from map/array/set.');
    if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === 'object' && !(v instanceof Set) && !(v instanceof Uint8Array)) Object.values(v).forEach(walk);
  };
  walk(value);
};

const stripUndefined = (v) => {
  if (Array.isArray(v)) return v.filter((x) => x !== undefined).map(stripUndefined);
  if (v && typeof v === 'object' && !(v instanceof Set) && !(v instanceof Uint8Array)) {
    return Object.fromEntries(Object.entries(v).filter(([, x]) => x !== undefined).map(([k, x]) => [k, stripUndefined(x)]));
  }
  return v;
};

const docPut = (input, client) => {
  required('dynamodb', 'PutCommand', input, ['TableName', 'Item']);
  checkUndefined(input.Item, client);
  const t = table(input.TableName);
  const item = clone(stripUndefined(input.Item));
  const k = keyOf(t, item);
  const existing = t.items.find((x) => keyOf(t, x) === k);
  if (input.ConditionExpression) {
    const cond = parseCondition(input.ConditionExpression, input.ExpressionAttributeNames, input.ExpressionAttributeValues);
    if (!cond(existing || {})) fail('dynamodb', 'ConditionalCheckFailedException', 'The conditional request failed');
  }
  if (existing) t.items.splice(t.items.indexOf(existing), 1);
  t.items.push(item);
  return input.ReturnValues === 'ALL_OLD' && existing ? { Attributes: clone(existing) } : {};
};

const docGet = (input) => {
  required('dynamodb', 'GetCommand', input, ['TableName', 'Key']);
  const t = table(input.TableName);
  const k = keyOf(t, input.Key, 'key');
  const found = t.items.find((x) => keyOf(t, x) === k);
  return found ? { Item: clone(found) } : {}; // a missing item is no Item key, not an error
};

const docDelete = (input) => {
  required('dynamodb', 'DeleteCommand', input, ['TableName', 'Key']);
  const t = table(input.TableName);
  const k = keyOf(t, input.Key, 'key');
  const existing = t.items.find((x) => keyOf(t, x) === k);
  if (input.ConditionExpression) {
    const cond = parseCondition(input.ConditionExpression, input.ExpressionAttributeNames, input.ExpressionAttributeValues);
    if (!cond(existing || {})) fail('dynamodb', 'ConditionalCheckFailedException', 'The conditional request failed');
  }
  if (existing) t.items.splice(t.items.indexOf(existing), 1);
  return input.ReturnValues === 'ALL_OLD' && existing ? { Attributes: clone(existing) } : {};
};

const docUpdate = (input, client) => {
  required('dynamodb', 'UpdateCommand', input, ['TableName', 'Key', 'UpdateExpression']);
  checkUndefined(input.ExpressionAttributeValues, client);
  const t = table(input.TableName);
  const k = keyOf(t, input.Key, 'key');
  const existing = t.items.find((x) => keyOf(t, x) === k);
  if (input.ConditionExpression) {
    const cond = parseCondition(input.ConditionExpression, input.ExpressionAttributeNames, input.ExpressionAttributeValues);
    if (!cond(existing || {})) fail('dynamodb', 'ConditionalCheckFailedException', 'The conditional request failed');
  }
  const base = existing ? clone(existing) : clone(input.Key);
  const updated = applyUpdate(base, input.UpdateExpression, input.ExpressionAttributeNames, input.ExpressionAttributeValues);
  for (const name of t.key) if (updated[name] !== base[name]) fail('dynamodb', 'ValidationException', `One or more parameter values were invalid: Cannot update attribute ${name}. This attribute is part of the key`);
  if (existing) t.items.splice(t.items.indexOf(existing), 1);
  t.items.push(updated);
  const rv = input.ReturnValues;
  if (rv === 'ALL_NEW') return { Attributes: clone(updated) };
  if (rv === 'ALL_OLD' && existing) return { Attributes: clone(existing) };
  if (rv === 'UPDATED_NEW') return { Attributes: Object.fromEntries(Object.entries(updated).filter(([key, v]) => JSON.stringify(v) !== JSON.stringify(existing?.[key]))) };
  return {};
};

const sortKey = (t, a, b) => {
  const sk = t.key[1];
  if (!sk) return 0;
  return a[sk] < b[sk] ? -1 : a[sk] > b[sk] ? 1 : 0;
};

const docQuery = (input) => {
  required('dynamodb', 'QueryCommand', input, ['TableName', 'KeyConditionExpression']);
  const t = table(input.TableName);
  if (input.IndexName) fail('dynamodb', 'ValidationException', `The table does not have the specified index: ${input.IndexName}`);
  const keyCond = parseCondition(input.KeyConditionExpression, input.ExpressionAttributeNames, input.ExpressionAttributeValues, 'KeyConditionExpression');
  const filter = input.FilterExpression ? parseCondition(input.FilterExpression, input.ExpressionAttributeNames, input.ExpressionAttributeValues, 'FilterExpression') : null;
  let items = t.items.filter(keyCond).sort((a, b) => sortKey(t, a, b));
  if (input.ScanIndexForward === false) items.reverse();
  if (input.Limit) items = items.slice(0, input.Limit);
  const scanned = items.length;
  items = items.filter((x) => !filter || filter(x));
  return { Items: items.map(clone), Count: items.length, ScannedCount: scanned };
};

const docScan = (input) => {
  required('dynamodb', 'ScanCommand', input, ['TableName']);
  const t = table(input.TableName);
  const filter = input.FilterExpression ? parseCondition(input.FilterExpression, input.ExpressionAttributeNames, input.ExpressionAttributeValues, 'FilterExpression') : null;
  const items = t.items.filter((x) => !filter || filter(x));
  return { Items: items.map(clone), Count: items.length, ScannedCount: t.items.length };
};

// Low-level attribute values ({ S: 'x' }, { N: '1' }) for DynamoDBClient
export const marshall = (obj, options = {}) => {
  const one = (v) => {
    if (v === null) return { NULL: true };
    if (typeof v === 'string') return { S: v };
    if (typeof v === 'number') return { N: String(v) };
    if (typeof v === 'boolean') return { BOOL: v };
    if (v instanceof Uint8Array) return { B: v };
    if (v instanceof Set) {
      const xs = [...v];
      return typeof xs[0] === 'number' ? { NS: xs.map(String) } : { SS: xs };
    }
    if (Array.isArray(v)) return { L: v.map(one) };
    if (typeof v === 'object') return { M: marshall(v, options) };
    if (v === undefined) throw new Error('Pass options.removeUndefinedValues=true to remove undefined values from map/array/set.');
    throw new Error(`Unsupported type passed: ${v}`);
  };
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => !(v === undefined && options.removeUndefinedValues)).map(([k, v]) => [k, one(v)]));
};

export const unmarshall = (obj) => {
  const one = (av) => {
    if ('S' in av) return av.S;
    if ('N' in av) return Number(av.N);
    if ('BOOL' in av) return av.BOOL;
    if ('NULL' in av) return null;
    if ('B' in av) return av.B;
    if ('SS' in av) return new Set(av.SS);
    if ('NS' in av) return new Set(av.NS.map(Number));
    if ('L' in av) return av.L.map(one);
    if ('M' in av) return unmarshall(av.M);
    throw new Error(`Unsupported attribute value: ${JSON.stringify(av)}`);
  };
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, one(v)]));
};

const lowValues = (input) => (input.ExpressionAttributeValues ? unmarshall(input.ExpressionAttributeValues) : undefined);
const checkLowItem = (item) => {
  for (const [k, v] of Object.entries(item || {})) {
    if (!v || typeof v !== 'object' || Array.isArray(v)) {
      fail('dynamodb', 'SerializationException', `Start of structure or map found where not expected (attribute "${k}" must look like { S: "text" } or { N: "1" }; the document client takes plain values)`);
    }
  }
};

export const DynamoDBClient = makeClient('DynamoDBClient', 'dynamodb');
export const PutItemCommand = makeCommand('PutItemCommand', 'dynamodb', (input) => {
  checkLowItem(input.Item);
  const out = docPut({ ...input, Item: input.Item && unmarshall(input.Item), ExpressionAttributeValues: lowValues(input) });
  return out.Attributes ? { Attributes: marshall(out.Attributes) } : {};
});
export const GetItemCommand = makeCommand('GetItemCommand', 'dynamodb', (input) => {
  checkLowItem(input.Key);
  const out = docGet({ ...input, Key: input.Key && unmarshall(input.Key) });
  return out.Item ? { Item: marshall(out.Item) } : {};
});
export const DeleteItemCommand = makeCommand('DeleteItemCommand', 'dynamodb', (input) => {
  docDelete({ ...input, Key: input.Key && unmarshall(input.Key), ExpressionAttributeValues: lowValues(input) });
  return {};
});
export const LowQueryCommand = makeCommand('QueryCommand', 'dynamodb', (input) => {
  const out = docQuery({ ...input, ExpressionAttributeValues: lowValues(input) });
  return { ...out, Items: out.Items.map((x) => marshall(x)) };
});
export const LowScanCommand = makeCommand('ScanCommand', 'dynamodb', (input) => {
  const out = docScan({ ...input, ExpressionAttributeValues: lowValues(input) });
  return { ...out, Items: out.Items.map((x) => marshall(x)) };
});
export const DescribeTableCommand = makeCommand('DescribeTableCommand', 'dynamodb', (input) => {
  required('dynamodb', 'DescribeTableCommand', input, ['TableName']);
  const t = table(input.TableName);
  return {
    Table: {
      TableName: input.TableName, TableStatus: 'ACTIVE', ItemCount: t.items.length,
      KeySchema: t.key.map((name, n) => ({ AttributeName: name, KeyType: n === 0 ? 'HASH' : 'RANGE' })),
      BillingModeSummary: { BillingMode: 'PAY_PER_REQUEST' },
    },
  };
});
export const ListTablesCommand = makeCommand('ListTablesCommand', 'dynamodb', () => ({ TableNames: Object.keys(tables()).sort() }));

// lib-dynamodb: the document client takes plain JavaScript values
export class DynamoDBDocumentClient extends DynamoDBClient {
  static from(client, translateConfig = {}) {
    if (!(client instanceof DynamoDBClient)) throw new TypeError('DynamoDBDocumentClient.from() needs a DynamoDBClient: DynamoDBDocumentClient.from(new DynamoDBClient({}))');
    const doc = new DynamoDBDocumentClient(client.config);
    doc.translateConfig = translateConfig;
    return doc;
  }

  async send(command) {
    if (command instanceof Command && command.constructor.service === 'dynamodb-doc') {
      STATE.calls.push({ service: 'dynamodb', command: command.constructor.name, region: this.config.region, input: summary(command.input) });
      await new Promise((r) => setTimeout(r, 0));
      return { $metadata: metadata(), ...command.constructor.run(command.input, this) };
    }
    return super.send(command);
  }
}
DynamoDBDocumentClient.service = 'dynamodb';

export const PutCommand = makeCommand('PutCommand', 'dynamodb-doc', docPut);
export const GetCommand = makeCommand('GetCommand', 'dynamodb-doc', docGet);
export const QueryCommand = makeCommand('QueryCommand', 'dynamodb-doc', docQuery);
export const ScanCommand = makeCommand('ScanCommand', 'dynamodb-doc', docScan);
export const UpdateCommand = makeCommand('UpdateCommand', 'dynamodb-doc', docUpdate);
export const DeleteCommand = makeCommand('DeleteCommand', 'dynamodb-doc', docDelete);
CLIENT_NAMES['dynamodb-doc'] = 'DynamoDBDocumentClient';

// ---------------------------------------------------------------------------
// S3
// ---------------------------------------------------------------------------

const buckets = () => (STATE.s3 = STATE.s3 || {});
const bucket = (name) => {
  // A bucket that exists in someone else's account: S3 says AccessDenied, not NoSuchBucket
  if ((STATE.s3Denied || []).includes(name)) fail('s3', 'AccessDenied', 'Access Denied', 403);
  const b = buckets()[name];
  if (!b) fail('s3', 'NoSuchBucket', 'The specified bucket does not exist', 404);
  return b;
};

const encoder = new TextEncoder();
const toBytes = (body) => {
  if (body === undefined || body === null) return new Uint8Array();
  if (typeof body === 'string') return encoder.encode(body);
  if (body instanceof Uint8Array) return body;
  if (body instanceof ArrayBuffer) return new Uint8Array(body);
  throw new TypeError('Body must be a string or a Uint8Array in the practice account');
};

const etag = (bytes) => {
  let h = 2166136261;
  for (const b of bytes) h = Math.imul(h ^ b, 16777619);
  return `"${(h >>> 0).toString(16).padStart(8, '0')}${bytes.length.toString(16).padStart(8, '0')}"`;
};

const object = (data, contentType = 'application/octet-stream', meta = {}, modified = new Date()) => ({ data, type: contentType, meta: { ...meta }, modified, etag: etag(data) });

const body = (bytes) => ({
  transformToString: async (encoding = 'utf-8') => new TextDecoder(encoding).decode(bytes),
  transformToByteArray: async () => new Uint8Array(bytes),
  async *[Symbol.asyncIterator]() { yield new Uint8Array(bytes); },
});

const pageOf = (items, token, limit) => {
  const start = token ? parseInt(token, 36) : 0;
  const chunk = items.slice(start, start + limit);
  const next = start + limit < items.length ? (start + limit).toString(36) : undefined;
  return [chunk, next];
};

export const S3Client = makeClient('S3Client', 's3');
export const ListBucketsCommand = makeCommand('ListBucketsCommand', 's3', () => ({
  Buckets: Object.keys(buckets()).sort().map((Name) => ({ Name, CreationDate: new Date('2026-01-05T09:00:00Z') })),
  Owner: { ID: 'a1b2c3d4e5f6example' },
}));
export const ListObjectsV2Command = makeCommand('ListObjectsV2Command', 's3', (input) => {
  required('s3', 'ListObjectsV2Command', input, ['Bucket']);
  const objects = bucket(input.Bucket);
  const prefix = input.Prefix || '';
  let keys = Object.keys(objects).filter((k) => k.startsWith(prefix) && (!input.StartAfter || k > input.StartAfter)).sort();
  const prefixes = [];
  if (input.Delimiter) {
    keys = keys.filter((k) => {
      const rest = k.slice(prefix.length);
      const at = rest.indexOf(input.Delimiter);
      if (at < 0) return true;
      const p = prefix + rest.slice(0, at + input.Delimiter.length);
      if (!prefixes.includes(p)) prefixes.push(p);
      return false;
    });
  }
  const [chunk, next] = pageOf(keys, input.ContinuationToken, Math.min(input.MaxKeys || 1000, 1000));
  const out = { IsTruncated: !!next, Name: input.Bucket, Prefix: prefix, MaxKeys: input.MaxKeys || 1000, KeyCount: chunk.length };
  if (chunk.length) {
    out.Contents = chunk.map((Key) => ({ Key, LastModified: objects[Key].modified, ETag: objects[Key].etag, Size: objects[Key].data.length, StorageClass: 'STANDARD' }));
  }
  if (prefixes.length) out.CommonPrefixes = prefixes.map((Prefix) => ({ Prefix }));
  if (input.ContinuationToken) out.ContinuationToken = input.ContinuationToken;
  if (next) out.NextContinuationToken = next;
  return out;
});
export const GetObjectCommand = makeCommand('GetObjectCommand', 's3', (input) => {
  required('s3', 'GetObjectCommand', input, ['Bucket', 'Key']);
  const o = bucket(input.Bucket)[input.Key];
  if (!o) fail('s3', 'NoSuchKey', 'The specified key does not exist.', 404);
  return { Body: body(o.data), ContentLength: o.data.length, ContentType: o.type, ETag: o.etag, LastModified: o.modified, Metadata: { ...o.meta } };
});
export const HeadObjectCommand = makeCommand('HeadObjectCommand', 's3', (input) => {
  required('s3', 'HeadObjectCommand', input, ['Bucket', 'Key']);
  const o = bucket(input.Bucket)[input.Key];
  if (!o) fail('s3', 'NotFound', 'UnknownError', 404); // HEAD has no body, so the SDK only knows "NotFound"
  return { ContentLength: o.data.length, ContentType: o.type, ETag: o.etag, LastModified: o.modified, Metadata: { ...o.meta } };
});
export const PutObjectCommand = makeCommand('PutObjectCommand', 's3', (input) => {
  required('s3', 'PutObjectCommand', input, ['Bucket', 'Key']);
  const o = object(toBytes(input.Body), input.ContentType || 'application/octet-stream', input.Metadata);
  bucket(input.Bucket)[input.Key] = o;
  return { ETag: o.etag };
});
export const DeleteObjectCommand = makeCommand('DeleteObjectCommand', 's3', (input) => {
  required('s3', 'DeleteObjectCommand', input, ['Bucket', 'Key']);
  delete bucket(input.Bucket)[input.Key];
  return {};
}, 204);
export const CopyObjectCommand = makeCommand('CopyObjectCommand', 's3', (input) => {
  required('s3', 'CopyObjectCommand', input, ['Bucket', 'Key', 'CopySource']);
  const [srcBucket, ...rest] = decodeURIComponent(String(input.CopySource).replace(/^\//, '')).split('/');
  const src = bucket(srcBucket)[rest.join('/')];
  if (!src) fail('s3', 'NoSuchKey', 'The specified key does not exist.', 404);
  const o = object(src.data, input.ContentType || src.type, input.MetadataDirective === 'REPLACE' ? input.Metadata : src.meta);
  bucket(input.Bucket)[input.Key] = o;
  return { CopyObjectResult: { ETag: o.etag, LastModified: o.modified } };
});

const paginator = (Client, Cmd, tokenIn, tokenOut, limitKey) => async function* paginate(config, input = {}) {
  if (!(config?.client instanceof Client)) throw new TypeError(`The first argument must be { client: a ${Client.name} }`);
  let token = config.startingToken;
  do {
    const page = await config.client.send(new Cmd({ ...input, ...(config.pageSize ? { [limitKey]: config.pageSize } : {}), ...(token ? { [tokenIn]: token } : {}) }));
    yield page;
    token = page[tokenOut];
  } while (token);
};

export const paginateListObjectsV2 = paginator(S3Client, ListObjectsV2Command, 'ContinuationToken', 'NextContinuationToken', 'MaxKeys');

// ---------------------------------------------------------------------------
// SES (v2)
// ---------------------------------------------------------------------------

const emailIdentityOk = (address) => {
  const ses = STATE.ses || {};
  const verified = ses.verified || [];
  const domain = String(address).split('@')[1];
  return verified.includes(address) || verified.includes(domain);
};

const bareAddress = (a) => (String(a).match(/<([^>]+)>/)?.[1] || String(a)).trim();

export const SESv2Client = makeClient('SESv2Client', 'sesv2');
export const SendEmailCommand = makeCommand('SendEmailCommand', 'sesv2', (input) => {
  if (!input.Content) fail('sesv2', 'BadRequestException', 'Content is required');
  if (!input.FromEmailAddress) fail('sesv2', 'BadRequestException', 'Missing FromEmailAddress');
  const to = input.Destination?.ToAddresses || [];
  if (!to.length) fail('sesv2', 'BadRequestException', 'Missing final destination');
  const simple = input.Content.Simple;
  if (simple && !simple.Subject?.Data) fail('sesv2', 'BadRequestException', 'Missing required parameter Subject.Data');
  if (simple && !simple.Body?.Text?.Data && !simple.Body?.Html?.Data) fail('sesv2', 'BadRequestException', 'Missing required parameter Body');
  const from = bareAddress(input.FromEmailAddress);
  const sandbox = (STATE.ses || {}).sandbox !== false;
  const unverified = [from, ...(sandbox ? to.map(bareAddress) : [])].filter((a) => !emailIdentityOk(a));
  if (unverified.length) {
    fail('sesv2', 'MessageRejected', `Email address is not verified. The following identities failed the check in region ${STATE.region.toUpperCase()}: ${unverified.join(', ')}`);
  }
  const MessageId = `0100019a${requestId().toLowerCase().replace(/-/g, '')}-000000`;
  (STATE.ses = STATE.ses || {}).sent = [...(STATE.ses.sent || []), {
    id: MessageId, from: input.FromEmailAddress, to, replyTo: input.ReplyToAddresses || [],
    subject: simple?.Subject?.Data ?? null, text: simple?.Body?.Text?.Data ?? null, html: simple?.Body?.Html?.Data ?? null,
  }];
  return { MessageId };
});

// ---------------------------------------------------------------------------
// STS, CloudFront, EC2
// ---------------------------------------------------------------------------

export const STSClient = makeClient('STSClient', 'sts');
export const GetCallerIdentityCommand = makeCommand('GetCallerIdentityCommand', 'sts', () => ({
  UserId: 'AIDAEXAMPLEUSERID1234', Account: STATE.account, Arn: `arn:aws:iam::${STATE.account}:user/${STATE.user || 'learner'}`,
}));

export const CloudFrontClient = makeClient('CloudFrontClient', 'cloudfront');
const distribution = (id) => {
  const d = (STATE.cloudfront?.distributions || []).find((x) => x.id === id);
  if (!d) fail('cloudfront', 'NoSuchDistribution', 'The specified distribution does not exist.', 404);
  return d;
};
export const CreateInvalidationCommand = makeCommand('CreateInvalidationCommand', 'cloudfront', (input) => {
  required('cloudfront', 'CreateInvalidationCommand', input, ['DistributionId', 'InvalidationBatch']);
  const d = distribution(input.DistributionId);
  const batch = input.InvalidationBatch;
  const items = batch.Paths?.Items || [];
  if (!batch.CallerReference) fail('cloudfront', 'InvalidArgument', 'CallerReference is required');
  if (batch.Paths?.Quantity !== items.length) fail('cloudfront', 'InconsistentQuantities', 'The value of Quantity and the size of Items don\'t match.');
  if (items.some((p) => !String(p).startsWith('/'))) fail('cloudfront', 'InvalidArgument', 'Your request contains one or more invalid invalidation paths.');
  const Id = `I${requestId().replace(/-/g, '').slice(0, 13)}`;
  const inv = { Id, Status: 'InProgress', CreateTime: new Date(), InvalidationBatch: { Paths: { Quantity: items.length, Items: [...items] }, CallerReference: batch.CallerReference } };
  d.invalidations = [...(d.invalidations || []), inv];
  return { Location: `https://cloudfront.amazonaws.com/2020-05-31/distribution/${d.id}/invalidation/${Id}`, Invalidation: inv };
}, 201);
export const GetInvalidationCommand = makeCommand('GetInvalidationCommand', 'cloudfront', (input) => {
  const inv = (distribution(input.DistributionId).invalidations || []).find((x) => x.Id === input.Id);
  if (!inv) fail('cloudfront', 'NoSuchInvalidation', 'The specified invalidation does not exist.', 404);
  inv.Status = 'Completed';
  return { Invalidation: inv };
});
export const ListDistributionsCommand = makeCommand('ListDistributionsCommand', 'cloudfront', () => {
  const items = (STATE.cloudfront?.distributions || []).map((d) => ({
    Id: d.id, DomainName: d.domain || `d${d.id.toLowerCase().slice(0, 12)}.cloudfront.net`, Status: 'Deployed', Enabled: true,
    Aliases: { Quantity: (d.aliases || []).length, Items: d.aliases || [] }, Comment: d.comment || '',
  }));
  return { DistributionList: { Items: items, Quantity: items.length, IsTruncated: false, MaxItems: 100 } };
});

export const EC2Client = makeClient('EC2Client', 'ec2');
const STATE_CODES = { pending: 0, running: 16, 'shutting-down': 32, terminated: 48, stopping: 64, stopped: 80 };
const instanceView = (i, region) => {
  const v = {
    InstanceId: i.id, InstanceType: i.type || 't3.micro', ImageId: i.image || 'ami-0abcdef1234567890',
    LaunchTime: new Date(i.launched || '2026-01-05T09:00:00Z'), State: { Code: STATE_CODES[i.state || 'running'], Name: i.state || 'running' },
    Placement: { AvailabilityZone: i.az || `${region}a`, Tenancy: 'default' }, PrivateIpAddress: i.privateIp || '10.0.1.10',
    StateTransitionReason: i.stoppedAt ? `User initiated (${new Date(i.stoppedAt).toISOString().replace('T', ' ').slice(0, 19)} GMT)` : '',
  };
  if (i.publicIp && (i.state || 'running') === 'running') v.PublicIpAddress = i.publicIp;
  if (i.tags && Object.keys(i.tags).length) v.Tags = Object.entries(i.tags).map(([Key, Value]) => ({ Key, Value })); // untagged: no Tags key
  return v;
};
export const DescribeInstancesCommand = makeCommand('DescribeInstancesCommand', 'ec2', (input, client) => {
  const region = client.config.region;
  const all = STATE.ec2?.[region]?.instances || [];
  const match = (i) => (input.Filters || []).every((f) => {
    const values = f.Values || [];
    const actual = f.Name === 'instance-state-name' ? i.state || 'running'
      : f.Name === 'instance-type' ? i.type || 't3.micro'
        : f.Name.startsWith('tag:') ? i.tags?.[f.Name.slice(4)]
          : f.Name === 'instance-id' ? i.id
            : fail('ec2', 'InvalidParameterValue', `The filter '${f.Name}' is invalid`);
    return values.some((v) => actual !== undefined && new RegExp(`^${String(v).replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.')}$`).test(actual));
  });
  for (const id of input.InstanceIds || []) if (!all.some((i) => i.id === id)) fail('ec2', 'InvalidInstanceID.NotFound', `The instance ID '${id}' does not exist`);
  const found = all.filter((i) => (!input.InstanceIds || input.InstanceIds.includes(i.id)) && match(i));
  const [chunk, next] = pageOf(found, input.NextToken, input.MaxResults || found.length || 1);
  const out = { Reservations: chunk.map((i) => ({ ReservationId: `r-0${i.id.slice(3, 19)}`, OwnerId: STATE.account, Groups: [], Instances: [instanceView(i, region)] })) };
  if (next) out.NextToken = next;
  return out;
});
export const paginateDescribeInstances = paginator(EC2Client, DescribeInstancesCommand, 'NextToken', 'NextToken', 'MaxResults');

// ---------------------------------------------------------------------------
// Scenario in, snapshot out
// ---------------------------------------------------------------------------

export const reset = (scenario = {}) => {
  const s = JSON.parse(JSON.stringify(scenario || {}));
  for (const k of Object.keys(STATE)) delete STATE[k];
  Object.assign(STATE, { account: s.account || '111122223333', region: s.region || 'us-east-1', user: s.user || 'learner', calls: [] });
  STATE.dynamodb = Object.fromEntries(Object.entries(s.dynamodb || {}).map(([name, t]) => [name, { key: t.key, types: t.types || {}, items: t.items || [] }]));
  STATE.s3 = Object.fromEntries(Object.entries(s.s3 || {}).map(([b, objects]) => [b, Object.fromEntries(Object.entries(objects).map(([k, v]) => {
    const o = typeof v === 'string' ? { body: v } : v;
    // { size } makes an object of that many bytes without spelling out its contents
    const data = o.size !== undefined ? new Uint8Array(o.size) : encoder.encode(o.body || '');
    const made = object(data, o.contentType || 'text/plain', o.metadata, o.modified ? new Date(o.modified) : new Date());
    if (o.size !== undefined) made.sized = true;
    return [k, made];
  }))]));
  STATE.s3Denied = s.s3Denied || [];
  STATE.ses = { sandbox: s.ses?.sandbox !== false, verified: s.ses?.verified || [], sent: [] };
  STATE.cloudfront = { distributions: (s.cloudfront?.distributions || []).map((d) => (typeof d === 'string' ? { id: d } : { ...d })) };
  STATE.ec2 = s.ec2 || {};
};

const plain = (v) => {
  if (v instanceof Set) return [...v];
  if (v instanceof Date) return v.toISOString();
  if (v instanceof Uint8Array) return new TextDecoder().decode(v);
  if (Array.isArray(v)) return v.map(plain);
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, plain(x)]));
  return v;
};

export const snapshot = () => ({
  account: STATE.account,
  dynamodb: Object.fromEntries(Object.entries(STATE.dynamodb || {}).map(([name, t]) => [name, plain(t.items)])),
  s3: Object.fromEntries(Object.entries(STATE.s3 || {}).map(([b, objects]) => [b, Object.fromEntries(Object.entries(objects).map(([k, o]) => [k, {
    size: o.data.length, contentType: o.type, metadata: { ...o.meta }, ...(o.data.length <= 20000 && !o.sized ? { text: new TextDecoder().decode(o.data) } : {}),
  }]))])),
  ses: { sent: plain(STATE.ses?.sent || []) },
  cloudfront: Object.fromEntries((STATE.cloudfront?.distributions || []).map((d) => [d.id, { invalidations: plain(d.invalidations || []) }])),
  calls: plain(STATE.calls.slice(-400)),
  callCount: STATE.calls.length,
});

export const state = STATE;
