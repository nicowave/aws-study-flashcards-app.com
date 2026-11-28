// Pretend presigned URLs for Amazon S3, shaped like the ones the AWS SDK for
// JavaScript v3 makes (Signature Version 4 in the query string):
//   https://<bucket>.s3.<region>.amazonaws.com/<key>?X-Amz-Algorithm=…&X-Amz-Expires=300
//     &X-Amz-Signature=…&X-Amz-SignedHeaders=content-length%3Bcontent-type%3Bhost&x-id=PutObject
// sign() is what getSignedUrl() does; verify() is what S3 does when a request
// arrives: work the signature out again from the request it actually got, and
// compare. A request that differs in anything that was signed (the method, the
// key, a signed header's value) gets SignatureDoesNotMatch, and one that comes
// too late gets "Request has expired". The only pretend part is the secret.
//
// Self-contained: the web runtime puts its source into the page with
// makePresigner.toString(), next to makeFakeFetch.
export function makePresigner() {
  const WEEK = 604800;
  const TOKEN = 'IQoJb3JpZ2luX2VjEPr//////////wEaCXVzLWVhc3QtMSJHMEUCIQDpracticeOnlyNotARealSessionToken';
  const KEY_ID = 'ASIAPRACTICEEXAMPLE7';

  // 64 hex characters that depend on every character of the text, like a real signature does
  const digest = (text) => {
    let out = '';
    for (let seed = 1; seed <= 8; seed += 1) {
      let h = Math.imul(seed, 0x9e3779b1) ^ 0x811c9dc5;
      for (let i = 0; i < text.length; i += 1) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193);
      h ^= h >>> 15;
      h = Math.imul(h, 0x2c1b3c6d);
      h ^= h >>> 12;
      out += (h >>> 0).toString(16).padStart(8, '0');
    }
    return out;
  };

  // S3 escapes each part of a key like encodeURIComponent, plus ! ' ( ) *
  const escapePart = (part) => encodeURIComponent(part).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
  // Like the SDK, which builds the address with the URL parser: "." and ".." parts
  // of a key are resolved, so 'uploads/ana/../ben/x.jpg' is signed as uploads/ben/x.jpg
  const pathOf = (key) => new URL(`https://s3.invalid/${String(key).split('/').map(escapePart).join('/')}`).pathname;
  const stamp = (date) => date.toISOString().replace(/[-:]|\.\d{3}/g, ''); // 20261128T191921Z
  const parseStamp = (text) => {
    const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/.exec(text || '');
    return m ? Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]) : NaN;
  };
  const queryString = (pairs) => pairs.map(([k, v]) => `${escapePart(k)}=${escapePart(String(v))}`).join('&');
  const lower = (headers) => Object.fromEntries(Object.entries(headers || {}).map(([k, v]) => [k.toLowerCase(), String(v).trim().replace(/\s+/g, ' ')]));

  // What the signature covers: the method, the address, every query parameter
  // except the signature itself, and the value of each signed header
  const canonical = (method, host, path, pairs, signed, headers) => [
    'practice-signing-key', method.toUpperCase(), host, path,
    queryString(pairs.filter(([k]) => k !== 'X-Amz-Signature').sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))),
    ...signed.map((name) => `${name}:${name === 'host' ? host : headers[name] ?? ''}`),
  ].join('\n');

  /**
   * method, bucket, key; headers: every header value known when signing;
   * signed: the header names the signature covers ('host' is always one);
   * query: extra parameters the SDK moves into the address (x-amz-meta-…).
   */
  const sign = ({ method = 'GET', bucket, key, region = 'us-east-1', headers = {}, signed = [], query = {}, expiresIn = 900, operation, now = new Date() }) => {
    const host = `${bucket}.s3.${region}.amazonaws.com`;
    const path = pathOf(key);
    const names = [...new Set(['host', ...signed.map((h) => h.toLowerCase())])].sort();
    const pairs = [
      ['X-Amz-Algorithm', 'AWS4-HMAC-SHA256'],
      ['X-Amz-Content-Sha256', 'UNSIGNED-PAYLOAD'],
      ['X-Amz-Credential', `${KEY_ID}/${stamp(now).slice(0, 8)}/${region}/s3/aws4_request`],
      ['X-Amz-Date', stamp(now)],
      ['X-Amz-Expires', expiresIn],
      ['X-Amz-Security-Token', TOKEN],
      ['X-Amz-SignedHeaders', names.join(';')],
      // Lower-case names sort after the X-Amz- ones, as in a real URL
      ...[...Object.entries(query), ...(operation ? [['x-id', operation]] : [])].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)),
    ];
    const signature = digest(canonical(method, host, path, pairs, names, lower(headers)));
    pairs.splice(6, 0, ['X-Amz-Signature', signature]);
    return `https://${host}${path}?${queryString(pairs)}`;
  };

  /** Is this the address of an S3 bucket? { bucket, region, key } or null. */
  const parse = (url) => {
    // <bucket>.s3.<region>.amazonaws.com (or the older s3-<region>); not a website endpoint (s3-website-<region>)
    const m = /^https:\/\/([a-z0-9][a-z0-9.-]*[a-z0-9])\.s3[.-]([a-z]{2}(?:-[a-z]+)+-\d+)\.amazonaws\.com(\/[^?#]*)?(?:[?#]|$)/.exec(url);
    if (!m) return null;
    let key = (m[3] || '/').slice(1);
    try { key = decodeURIComponent(key); } catch (e) { /* keep it as sent */ }
    return { bucket: m[1], region: m[2], key };
  };

  /**
   * What S3 decides about a request to a presigned URL: { ok: true, … } or
   * { ok: false, status, code, message }. headers: what the request really sent.
   */
  const verify = ({ method = 'GET', url, headers = {}, now = new Date() }) => {
    const at = parse(url);
    if (!at) return { ok: false, status: 400, code: 'InvalidRequest', message: 'Not an Amazon S3 address' };
    const qs = url.includes('?') ? url.slice(url.indexOf('?') + 1).replace(/#.*$/, '') : '';
    const decode = (s) => { try { return decodeURIComponent(s.replace(/\+/g, ' ')); } catch (e) { return s; } };
    const pairs = qs.split('&').filter(Boolean).map((p) => {
      const i = p.indexOf('=');
      return i < 0 ? [decode(p), ''] : [decode(p.slice(0, i)), decode(p.slice(i + 1))];
    });
    const param = (name) => (pairs.find(([k]) => k === name) || [])[1];
    const signature = param('X-Amz-Signature');
    // S3 takes a request for a presigned one when it has X-Amz-Algorithm. Without
    // it the request is anonymous, and the bucket is private. With it, all six
    // parameters must be there (checked against the real S3, November 2026).
    if (!param('X-Amz-Algorithm')) return { ok: false, status: 403, code: 'AccessDenied', message: 'Access Denied' };
    const expires = Number(param('X-Amz-Expires'));
    const started = parseStamp(param('X-Amz-Date'));
    if (!signature || !param('X-Amz-Credential') || !param('X-Amz-SignedHeaders') || param('X-Amz-Expires') === undefined || Number.isNaN(expires) || Number.isNaN(started)) {
      return { ok: false, status: 400, code: 'AuthorizationQueryParametersError', message: 'Query-string authentication version 4 requires the X-Amz-Algorithm, X-Amz-Credential, X-Amz-Signature, X-Amz-Date, X-Amz-SignedHeaders, and X-Amz-Expires parameters.' };
    }
    if (expires > WEEK || expires < 0) {
      const message = expires < 0 ? 'X-Amz-Expires must be non-negative' : 'X-Amz-Expires must be less than a week (in seconds); that is, the given X-Amz-Expires must be less than 604800 seconds';
      return { ok: false, status: 400, code: 'AuthorizationQueryParametersError', message };
    }
    if (now.getTime() >= started + expires * 1000) {
      return { ok: false, status: 403, code: 'AccessDenied', message: 'Request has expired', expired: true };
    }
    const host = url.slice('https://'.length).split(/[/?#]/)[0];
    const path = url.slice('https://'.length + host.length).split(/[?#]/)[0] || '/';
    const names = param('X-Amz-SignedHeaders').split(';').filter(Boolean);
    if (digest(canonical(method, host, path, pairs, names, lower(headers))) !== signature) {
      return { ok: false, status: 403, code: 'SignatureDoesNotMatch', message: 'The request signature we calculated does not match the signature you provided. Check your key and signing method.' };
    }
    const meta = Object.fromEntries(pairs.filter(([k]) => k.startsWith('x-amz-meta-')).map(([k, v]) => [k.slice('x-amz-meta-'.length), v]));
    return { ok: true, ...at, signedHeaders: names, expiresAt: new Date(started + expires * 1000).toISOString(), metadata: meta, operation: param('x-id') || null };
  };

  return { sign, verify, parse, WEEK };
}
