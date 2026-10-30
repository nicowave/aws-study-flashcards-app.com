// A pretend internet for fetch(), from a step's scenario:
//   { 'https://status.example.com/api.json': { status: 200, json: {...}, ms: 300 },
//     'https://down.example.com': { status: 503 }, 'https://slow.example.com': { hang: true },
//     'https://gone.example.com': { error: 'dns' } }
// Delays use real timers, scaled down (300 ms waits 30 ms) so pages feel
// real but tests stay fast. Self-contained: the web runtime puts its source
// into the page with makeFakeFetch.toString().
export function makeFakeFetch(web, log, scale = 0.1) {
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
      try { return JSON.parse(text); } catch (e) {
        throw new SyntaxError(`Unexpected token '${text.trim().charAt(0) || ' '}', "${text.slice(0, 30)}" is not valid JSON`);
      }
    }
    clone() { return new FakeResponse(this.bodyText, { status: this.status, statusText: this.statusText, headers: this.headers.map, url: this.url }); }
  }
  const STATUS = { 200: 'OK', 201: 'Created', 204: 'No Content', 400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden', 404: 'Not Found', 429: 'Too Many Requests', 500: 'Internal Server Error', 502: 'Bad Gateway', 503: 'Service Unavailable', 504: 'Gateway Timeout' };
  const lookup = (url) => {
    if (web[url]) return web[url];
    const bare = url.replace(/[?#].*$/, '');
    if (web[bare]) return web[bare];
    if (web[bare.replace(/\/$/, '')]) return web[bare.replace(/\/$/, '')];
    return null;
  };
  const abortError = (signal) => {
    const reason = signal && signal.reason;
    if (reason instanceof Error) return reason;
    const e = new Error('This operation was aborted');
    e.name = 'AbortError';
    return e;
  };
  return function fetch(input, init = {}) {
    const url = typeof input === 'string' ? input : input && input.url ? input.url : String(input);
    const method = (init.method || (input && input.method) || 'GET').toUpperCase();
    const signal = init.signal || (input && input.signal);
    const entry = { url, method, body: typeof init.body === 'string' ? init.body : init.body ? '[body]' : null, headers: init.headers || null, hasSignal: !!signal, result: null };
    log.push(entry);
    return new Promise((resolve, reject) => {
      if (signal && signal.aborted) { entry.result = 'aborted'; reject(abortError(signal)); return; }
      const site = lookup(url);
      let timer = null;
      const finish = (fn) => { if (timer) clearTimeout(timer); if (signal) signal.removeEventListener('abort', onAbort); fn(); };
      const onAbort = () => finish(() => { entry.result = 'aborted'; reject(abortError(signal)); });
      if (signal) signal.addEventListener('abort', onAbort);
      if (!/^https?:\/\//.test(url)) { finish(() => { entry.result = 'error'; reject(new TypeError(`Failed to parse URL from ${url}`)); }); return; }
      if (!site || site.error) {
        timer = setTimeout(() => finish(() => { entry.result = site ? site.error : 'dns'; reject(new TypeError('Failed to fetch')); }), 20);
        return;
      }
      if (site.hang) { entry.result = 'hang'; return; } // only a timeout or abort ends this
      const body = site.json !== undefined ? JSON.stringify(typeof site.json === 'function' ? site.json(entry) : site.json) : site.body ?? '';
      const headers = { 'content-type': site.json !== undefined ? 'application/json' : 'text/html; charset=utf-8', ...(site.headers || {}) };
      const status = site.status || 200;
      timer = setTimeout(() => finish(() => {
        entry.result = status;
        resolve(new FakeResponse(body, { status, statusText: STATUS[status] || '', headers, url }));
      }), Math.max(1, Math.round((site.ms ?? 120) * scale)));
    });
  };
}
