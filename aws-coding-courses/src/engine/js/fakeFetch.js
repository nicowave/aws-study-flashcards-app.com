// A pretend internet for fetch(), from a step's scenario:
//   { 'https://status.example.com/api.json': { status: 200, json: {...}, ms: 300 },
//     'https://down.example.com': { status: 503 }, 'https://slow.example.com': { hang: true },
//     'https://gone.example.com': { error: 'dns' } }
// Delays use real timers, scaled down (300 ms waits 30 ms) so pages feel
// real but tests stay fast. Self-contained: the web runtime puts its source
// into the page with makeFakeFetch.toString().
//
// An address can answer one method only ('POST https://api.example.com/uploads'),
// and an entry can work its answer out from the request, like a small back end:
//   { respond: "return request.json?.size > 100 ? { status: 400, json: { message: 'Too big' } } : { json: { ok: true } };" }
// respond is the body of a function (request, s3): request is { url, method,
// headers, body, json, query }; its return value is an entry like the ones above.
//
// Amazon S3 buckets answer at their own address when the runner hands in a
// presigner (presign.js). A bucket is one the pretend AWS account has (the
// node runtime) or one the scenario declares as a site:
//   { 'https://photos.s3.us-east-1.amazonaws.com': { s3: { 'uploads/a.jpg': { size: 48211, contentType: 'image/jpeg', modified: '2026-11-20T18:02:11Z' } } } }
// A request to a presigned URL is checked the way S3 checks it (expiry, then
// the signature against the method and the signed headers the request really
// carries), a PUT stores the object, and anything unsigned gets AccessDenied.
// A presigned request that also has an Authorization header gets S3's 400
// ("Only one auth mechanism allowed"). Server code asking for a bucket that
// isn't there gets 404 NoSuchBucket; a page in a browser gets no answer at
// all, as it would without CORS headers.
// In respond, s3 is { presign({ method, bucket, key, contentType, contentLength, expiresIn }), list(bucket, prefix), has(bucket) }.
export function makeFakeFetch(web, log, scale = 0.1, extras = {}) {
  class FakeHeaders {
    constructor(init) { this.map = {}; for (const [k, v] of Object.entries(init || {})) this.map[k.toLowerCase()] = String(v); }
    get(name) { return this.map[String(name).toLowerCase()] ?? null; }
    has(name) { return String(name).toLowerCase() in this.map; }
    forEach(fn) { for (const [k, v] of Object.entries(this.map)) fn(v, k, this); }
  }
  class FakeResponse {
    constructor(body, { status = 200, statusText = '', headers = {}, url = '' } = {}) {
      this.bodyText = body;
      this.status = status;
      this.statusText = statusText;
      this.ok = status >= 200 && status < 300;
      this.headers = new FakeHeaders(headers);
      this.url = url;
      this.bodyUsed = false;
      this.redirected = false;
      this.type = 'basic';
    }
    use() {
      if (this.bodyUsed) throw new TypeError('Body has already been consumed.');
      this.bodyUsed = true;
      return this.bodyText;
    }
    async text() { return this.use(); }
    async json() {
      const text = this.use();
      if (!text.trim()) throw new SyntaxError('Unexpected end of JSON input'); // an empty body, as browsers and Node word it
      try { return JSON.parse(text); } catch (e) {
        throw new SyntaxError(`Unexpected token '${text.trim().charAt(0) || ' '}', "${text.slice(0, 30)}" is not valid JSON`);
      }
    }
    clone() { return new FakeResponse(this.bodyText, { status: this.status, statusText: this.statusText, headers: this.headers.map, url: this.url }); }
  }
  const STATUS = { 200: 'OK', 201: 'Created', 204: 'No Content', 400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden', 404: 'Not Found', 405: 'Method Not Allowed', 429: 'Too Many Requests', 500: 'Internal Server Error', 502: 'Bad Gateway', 503: 'Service Unavailable', 504: 'Gateway Timeout' };
  // The entry for an address, and the key it was found under: its own method first
  const lookup = (url, method) => {
    const bare = url.replace(/[?#].*$/, '');
    for (const address of [url, bare, bare.replace(/\/$/, '')]) {
      for (const key of [`${method} ${address}`, address]) if (web[key]) return [web[key], key];
    }
    return [null, null];
  };
  const abortError = (signal) => {
    const reason = signal && signal.reason;
    if (reason instanceof Error) return reason;
    const e = new Error('This operation was aborted');
    e.name = 'AbortError';
    return e;
  };

  // What the request carries: its body's size and kind, and its headers by
  // lower-case name, with the Content-Type a browser fills in by itself
  const utf8Length = (text) => {
    let n = 0;
    for (let i = 0; i < text.length; i += 1) {
      const c = text.charCodeAt(i);
      if (c < 0x80) n += 1;
      else if (c < 0x800) n += 2;
      else if (c >= 0xd800 && c < 0xdc00) { n += 4; i += 1; } else n += 3;
    }
    return n;
  };
  const describeBody = (body) => {
    if (body === undefined || body === null) return { size: 0, type: null };
    if (typeof body === 'string') return { size: utf8Length(body), type: 'text/plain;charset=UTF-8', text: body };
    if (typeof body.size === 'number' && typeof body.type === 'string') return { size: body.size, type: body.type || null, name: typeof body.name === 'string' ? body.name : null, blob: body }; // a File or Blob
    if (typeof body.byteLength === 'number') return { size: body.byteLength, type: null, bytes: body };
    if (typeof body.append === 'function' && typeof body.getAll === 'function') {
      return typeof body.sort === 'function'
        ? { size: utf8Length(String(body)), type: 'application/x-www-form-urlencoded;charset=UTF-8', text: String(body) } // URLSearchParams
        : { size: null, type: 'multipart/form-data; boundary=----PracticeFormBoundary', form: true }; // FormData
    }
    return { size: 0, type: null };
  };
  const sentHeaders = (given, body) => {
    const out = {};
    if (given && typeof given.forEach === 'function' && !Array.isArray(given)) given.forEach((v, k) => { out[String(k).toLowerCase()] = String(v); });
    else for (const [k, v] of Array.isArray(given) ? given : Object.entries(given || {})) out[String(k).toLowerCase()] = String(v);
    if (!('content-type' in out) && body.type) out['content-type'] = body.type;
    return out;
  };

  // Amazon S3, reached through presigned URLs
  const presigner = extras.presigner || null;
  const etagOf = (size) => `"${(size * 2654435761 >>> 0).toString(16).padStart(8, '0')}${Number(size).toString(16).padStart(8, '0')}"`;
  const declared = {};
  if (presigner) {
    for (const [address, site] of Object.entries(web)) {
      const at = site && site.s3 && presigner.parse(address);
      if (!at) continue;
      declared[at.bucket] = {};
      for (const [key, value] of Object.entries(site.s3)) {
        const o = typeof value === 'string' ? { body: value } : value || {};
        const size = o.size ?? utf8Length(o.body || '');
        declared[at.bucket][key] = { size, type: o.contentType || 'binary/octet-stream', text: o.body || '', modified: new Date(o.modified || Date.now()).toISOString(), etag: etagOf(size), meta: { ...(o.metadata || {}) } };
      }
    }
  }
  const declaredStore = {
    has: (bucket) => bucket in declared,
    put: (bucket, key, { size = 0, type, text, meta, blob }) => {
      declared[bucket][key] = { size, type: type || 'binary/octet-stream', text: text || '', modified: new Date().toISOString(), etag: etagOf(size), meta: { ...(meta || {}) }, blob: blob || null };
      return { etag: declared[bucket][key].etag };
    },
    get: (bucket, key) => declared[bucket][key] || null,
    remove: (bucket, key) => { delete declared[bucket][key]; },
    list: (bucket, prefix = '') => Object.keys(declared[bucket] || {}).filter((k) => k.startsWith(prefix)).sort()
      .map((k) => ({ key: k, size: declared[bucket][k].size, type: declared[bucket][k].type, modified: declared[bucket][k].modified })),
  };
  const storeFor = (bucket) => [extras.store, declaredStore].find((s) => s && s.has(bucket)) || null;
  let s3Requests = 0;
  const s3Error = (status, code, message, extra = '') => {
    s3Requests += 1;
    const id = (s3Requests * 2654435761 >>> 0).toString(16).toUpperCase().padStart(8, '0');
    return {
      status,
      headers: { 'content-type': 'application/xml' },
      body: `<?xml version="1.0" encoding="UTF-8"?>\n<Error><Code>${code}</Code><Message>${message}</Message>${extra}<RequestId>${id}EXAMPLE</RequestId><HostId>practice/${id}=</HostId></Error>`,
    };
  };
  const s3Decide = (url, method, headers, body) => {
    const at = presigner && presigner.parse(url);
    if (!at) return null;
    const store = storeFor(at.bucket);
    if (!store) {
      // A page in a browser gets no answer it may read (S3 sends no CORS headers
      // for a bucket it doesn't have): fetch fails. Server code gets S3's own answer.
      if (!extras.store) return null;
      return extras.store.denied && extras.store.denied(at.bucket)
        ? s3Error(403, 'AccessDenied', 'Access Denied')
        : s3Error(404, 'NoSuchBucket', 'The specified bucket does not exist', `<BucketName>${at.bucket}</BucketName>`);
    }
    // A presigned URL is the permission. S3 refuses a request that also carries an Authorization header.
    if (headers.authorization !== undefined && /[?&]X-Amz-(Algorithm|Signature)=/.test(url)) {
      const value = String(headers.authorization).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return s3Error(400, 'InvalidArgument', 'Only one auth mechanism allowed; only the X-Amz-Algorithm query parameter, Signature query string parameter or the Authorization header should be specified',
        `<ArgumentName>Authorization</ArgumentName><ArgumentValue>${value}</ArgumentValue>`);
    }
    // The Content-Length a browser or Node adds by itself is part of what S3 sees
    const sent = { ...headers, ...(body.size === null ? {} : { 'content-length': String(body.size) }) };
    const verdict = presigner.verify({ method, url, headers: sent });
    if (!verdict.ok) return s3Error(verdict.status, verdict.code, verdict.message);
    if (method === 'PUT') {
      const { etag } = store.put(at.bucket, at.key, { size: body.size || 0, type: sent['content-type'], text: body.text, bytes: body.bytes, blob: body.blob, meta: verdict.metadata });
      return { status: 200, body: '', headers: { etag, 'content-type': null }, ms: 400 };
    }
    if (method === 'DELETE') { store.remove(at.bucket, at.key); return { status: 204, body: '', headers: { 'content-type': null } }; }
    const found = store.get(at.bucket, at.key);
    if (!found) return s3Error(404, 'NoSuchKey', 'The specified key does not exist.', `<Key>${at.key}</Key>`);
    return { status: 200, body: found.text || '', headers: { 'content-type': found.type, 'content-length': String(found.size), etag: found.etag, 'last-modified': new Date(found.modified).toUTCString() } };
  };
  // An answer to HEAD never has a body, errors included: only the status and the headers
  const s3Answer = (url, method, headers, body) => {
    const answer = s3Decide(url, method, headers, body);
    return answer && method === 'HEAD' ? { ...answer, body: '' } : answer;
  };
  const s3Helper = {
    has: (bucket) => !!storeFor(bucket),
    list: (bucket, prefix = '') => (storeFor(bucket) ? storeFor(bucket).list(bucket, prefix) : []),
    presign: ({ method = 'PUT', bucket, key, region, contentType, contentLength, expiresIn = 900 }) => presigner.sign({
      method, bucket, key, region, expiresIn, operation: { PUT: 'PutObject', GET: 'GetObject', DELETE: 'DeleteObject' }[method],
      headers: { ...(contentType === undefined ? {} : { 'content-type': contentType }), ...(contentLength === undefined ? {} : { 'content-length': String(contentLength) }) },
      signed: [...(contentType === undefined ? [] : ['content-type']), ...(contentLength === undefined ? [] : ['content-length'])],
    }),
  };
  // An entry that works its answer out from the request
  const respond = (site, request) => {
    if (!site || !site.respond) return site;
    try {
      const fn = typeof site.respond === 'function' ? site.respond : new Function('request', 's3', site.respond); // eslint-disable-line no-new-func
      return { ...site, ...(fn(request, s3Helper) || {}) };
    } catch (e) {
      return { status: 500, json: { message: 'Internal Server Error' }, failed: String(e && e.message ? e.message : e) };
    }
  };

  const fetch = function fetch(input, init = {}) {
    const url = typeof input === 'string' ? input : input && input.url ? input.url : String(input);
    const method = (init.method || (input && input.method) || 'GET').toUpperCase();
    const signal = init.signal || (input && input.signal);
    const body = describeBody(init.body);
    const headers = sentHeaders(init.headers, body);
    const entry = {
      url, method, body: typeof init.body === 'string' ? init.body : init.body ? '[body]' : null, headers: init.headers || null, hasSignal: !!signal, result: null,
      sent: headers, bodySize: body.size, bodyType: body.type, fileName: body.name ?? null,
    };
    log.push(entry);
    return new Promise((resolve, reject) => {
      if (signal && signal.aborted) { entry.result = 'aborted'; reject(abortError(signal)); return; }
      let [site, foundAs] = lookup(url, method);
      // { sequence: [first answer, second, ...] }: a flaky endpoint; the last answer repeats
      if (site && site.sequence) {
        const asked = log.filter((e) => e.url === url && (!foundAs.startsWith(`${method} `) || e.method === method)).length;
        site = site.sequence[Math.min(asked - 1, site.sequence.length - 1)];
      }
      let timer = null;
      const finish = (fn) => { if (timer) clearTimeout(timer); if (signal) signal.removeEventListener('abort', onAbort); fn(); };
      const onAbort = () => finish(() => { entry.result = 'aborted'; reject(abortError(signal)); });
      if (signal) signal.addEventListener('abort', onAbort);
      if (!/^https?:\/\//.test(url)) { finish(() => { entry.result = 'error'; reject(new TypeError(`Failed to parse URL from ${url}`)); }); return; }
      // A bucket's own objects, unless the scenario gave that exact address its own answer
      if (!site || site.s3) site = s3Answer(url, method, headers, body) || (site && !site.s3 ? site : null);
      if (!site || site.error) {
        timer = setTimeout(() => finish(() => { entry.result = site ? site.error : 'dns'; reject(new TypeError('Failed to fetch')); }), 20);
        return;
      }
      if (site.hang) { entry.result = 'hang'; return; } // only a timeout or abort ends this
      if (site.respond) {
        let json = null;
        try { json = typeof init.body === 'string' ? JSON.parse(init.body) : null; } catch (e) { json = null; }
        const query = {};
        const qs = url.includes('?') ? url.slice(url.indexOf('?') + 1).replace(/#.*$/, '') : '';
        for (const pair of qs.split('&').filter(Boolean)) {
          const [k, v = ''] = pair.split('=');
          try { query[decodeURIComponent(k)] = decodeURIComponent(v.replace(/\+/g, ' ')); } catch (e) { query[k] = v; }
        }
        site = respond(site, { url, method, headers, body: body.text ?? null, json, query });
        if (site.failed) entry.failed = site.failed;
      }
      const text = site.json !== undefined ? JSON.stringify(typeof site.json === 'function' ? site.json(entry) : site.json) : site.body ?? '';
      const answerHeaders = { 'content-type': site.json !== undefined ? 'application/json' : 'text/html; charset=utf-8', ...(site.headers || {}) };
      for (const k of Object.keys(answerHeaders)) if (answerHeaders[k] === null) delete answerHeaders[k];
      const status = site.status || 200;
      timer = setTimeout(() => finish(() => {
        entry.result = status;
        resolve(new FakeResponse(text, { status, statusText: STATUS[status] || '', headers: answerHeaders, url }));
      }), Math.max(1, Math.round((site.ms ?? 120) * scale)));
    });
  };
  // For the check: what the buckets declared as sites hold now
  fetch.buckets = () => Object.fromEntries(Object.entries(declared).map(([name, objects]) => [name, Object.fromEntries(Object.entries(objects).map(([k, o]) => [k, { size: o.size, contentType: o.type, metadata: { ...o.meta } }]))]));
  return fetch;
}
