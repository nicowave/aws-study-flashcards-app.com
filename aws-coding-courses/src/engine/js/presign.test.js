// Pretend presigned URLs: signed like the SDK signs them, checked like S3 checks them.
import { describe, it, expect } from 'vitest';
import { makePresigner } from './presign';

const presigner = makePresigner();
const NOW = new Date('2026-11-28T19:19:21.400Z');
const sign = (extra = {}) => presigner.sign({
  method: 'PUT', bucket: 'study-photos', key: 'uploads/ana/new photo (1).jpg', expiresIn: 300, operation: 'PutObject', now: NOW,
  headers: { 'content-type': 'image/jpeg', 'content-length': '48211' }, signed: ['content-type', 'content-length'], ...extra,
});
const good = { 'content-type': 'image/jpeg', 'content-length': '48211' };
const at = (seconds) => new Date(NOW.getTime() + seconds * 1000);

describe('presigned URLs', () => {
  it('have the parts of a Signature Version 4 URL, in the SDK\'s order', () => {
    const url = sign({ query: { 'x-amz-meta-shot': 'whiteboard' } });
    expect(url.split('?')[0]).toBe('https://study-photos.s3.us-east-1.amazonaws.com/uploads/ana/new%20photo%20%281%29.jpg');
    const params = [...new URL(url).searchParams];
    expect(params.map(([k]) => k)).toEqual([
      'X-Amz-Algorithm', 'X-Amz-Content-Sha256', 'X-Amz-Credential', 'X-Amz-Date', 'X-Amz-Expires', 'X-Amz-Security-Token', 'X-Amz-Signature',
      'X-Amz-SignedHeaders', 'x-amz-meta-shot', 'x-id',
    ]);
    const get = (name) => new URL(url).searchParams.get(name);
    expect(get('X-Amz-Date')).toBe('20261128T191921Z');
    expect(get('X-Amz-Credential')).toMatch(/^ASIA[A-Z0-9]+\/20261128\/us-east-1\/s3\/aws4_request$/);
    expect(get('X-Amz-SignedHeaders')).toBe('content-length;content-type;host');
    expect(get('X-Amz-Signature')).toMatch(/^[0-9a-f]{64}$/);
    expect(presigner.parse(url)).toEqual({ bucket: 'study-photos', region: 'us-east-1', key: 'uploads/ana/new photo (1).jpg' });
    expect(presigner.parse('https://api.example.com/uploads')).toBeNull();
  });

  it('are accepted for the request that was signed, until they expire', () => {
    const url = sign();
    expect(presigner.verify({ method: 'PUT', url, headers: good, now: at(1) })).toMatchObject({
      ok: true, bucket: 'study-photos', key: 'uploads/ana/new photo (1).jpg', operation: 'PutObject', expiresAt: '2026-11-28T19:24:21.000Z',
    });
    expect(presigner.verify({ method: 'PUT', url, headers: { 'Content-Type': ' image/jpeg ', 'Content-Length': '48211' }, now: at(299) }).ok).toBe(true);
    expect(presigner.verify({ method: 'PUT', url, headers: good, now: at(300) })).toMatchObject({ ok: false, status: 403, code: 'AccessDenied', message: 'Request has expired' });
  });

  it('are refused when anything that was signed is different', () => {
    const url = sign();
    const refused = { ok: false, status: 403, code: 'SignatureDoesNotMatch' };
    const now = at(10);
    expect(presigner.verify({ method: 'PUT', url, headers: { ...good, 'content-type': 'text/html' }, now })).toMatchObject(refused);
    expect(presigner.verify({ method: 'PUT', url, headers: { ...good, 'content-length': '48212' }, now })).toMatchObject(refused);
    expect(presigner.verify({ method: 'PUT', url, headers: { 'content-length': '48211' }, now })).toMatchObject(refused); // a signed header left out
    expect(presigner.verify({ method: 'GET', url, headers: good, now })).toMatchObject(refused);
    expect(presigner.verify({ method: 'PUT', url: url.replace('/ana/', '/ben/'), headers: good, now })).toMatchObject(refused);
    expect(presigner.verify({ method: 'PUT', url: url.replace('X-Amz-Expires=300', 'X-Amz-Expires=3000'), headers: good, now })).toMatchObject(refused);
    expect(presigner.verify({ method: 'PUT', url: url.replace('study-photos.s3', 'other-bucket.s3'), headers: good, now })).toMatchObject(refused);
    expect(presigner.verify({ method: 'PUT', url: url.split('?')[0], headers: good, now })).toMatchObject({ ok: false, status: 403, code: 'AccessDenied', message: 'Access Denied' });
  });

  it('are refused with a 400 when the signing parameters are missing or out of range', () => {
    const url = sign();
    const now = at(10);
    const bad = { ok: false, status: 400, code: 'AuthorizationQueryParametersError' };
    expect(presigner.verify({ method: 'PUT', url: url.replace(/&X-Amz-Expires=300/, ''), headers: good, now })).toMatchObject(bad);
    expect(presigner.verify({ method: 'PUT', url: url.replace(/&X-Amz-Date=[^&]+/, ''), headers: good, now })).toMatchObject(bad);
    expect(presigner.verify({ method: 'PUT', url: url.replace('X-Amz-Expires=300', 'X-Amz-Expires=-5'), headers: good, now })).toMatchObject({ ...bad, message: 'X-Amz-Expires must be non-negative' });
    expect(presigner.verify({ method: 'PUT', url: url.replace('X-Amz-Expires=300', 'X-Amz-Expires=604801'), headers: good, now }).message).toMatch(/less than a week/);
    expect(presigner.verify({ method: 'PUT', url: url.replace('X-Amz-Expires=300', 'X-Amz-Expires=soon'), headers: good, now })).toMatchObject(bad);
    expect(presigner.verify({ method: 'PUT', url: 'https://api.example.com/uploads?X-Amz-Signature=abc', headers: good, now })).toMatchObject({ ok: false, status: 400 });
    // As the real S3 answers: X-Amz-Algorithm marks a presigned request, and then the signature must be there too
    expect(presigner.verify({ method: 'PUT', url: url.replace(/&X-Amz-Signature=[^&]+/, ''), headers: good, now })).toMatchObject(bad);
    expect(presigner.verify({ method: 'PUT', url: url.replace(/&X-Amz-Credential=[^&]+/, ''), headers: good, now })).toMatchObject(bad);
    // Without X-Amz-Algorithm the request is anonymous: the private bucket refuses it
    expect(presigner.verify({ method: 'PUT', url: url.replace(/X-Amz-Algorithm=[^&]+&/, ''), headers: good, now })).toMatchObject({ ok: false, status: 403, code: 'AccessDenied', message: 'Access Denied' });
  });

  it('cover the date and every query parameter, so neither can be changed or added', () => {
    const url = sign({ query: { 'x-amz-meta-shot': 'whiteboard' } });
    const now = at(10);
    const refused = { ok: false, status: 403, code: 'SignatureDoesNotMatch' };
    expect(presigner.verify({ method: 'PUT', url, headers: good, now })).toMatchObject({ ok: true, metadata: { shot: 'whiteboard' }, signedHeaders: ['content-length', 'content-type', 'host'] });
    expect(presigner.verify({ method: 'PUT', url: url.replace('X-Amz-Date=20261128T191921Z', 'X-Amz-Date=20261128T201921Z'), headers: good, now })).toMatchObject(refused); // a later start
    expect(presigner.verify({ method: 'PUT', url: url.replace('whiteboard', 'selfie'), headers: good, now })).toMatchObject(refused);
    expect(presigner.verify({ method: 'PUT', url: `${url}&x-amz-acl=public-read`, headers: good, now })).toMatchObject(refused);
    expect(presigner.verify({ method: 'PUT', url: url.replace('us-east-1.amazonaws', 'eu-west-1.amazonaws'), headers: good, now })).toMatchObject(refused);
    // The same address after a trip through the URL parser is the same request
    expect(presigner.verify({ method: 'PUT', url: new URL(url).toString(), headers: good, now }).ok).toBe(true);
  });

  it('resolve "." and ".." in a key, as the SDK does: a file name can climb out of its folder', () => {
    const url = sign({ key: 'uploads/carla/../ben/./mine-now.png' });
    expect(url.split('?')[0]).toBe('https://study-photos.s3.us-east-1.amazonaws.com/uploads/ben/mine-now.png');
    expect(presigner.verify({ method: 'PUT', url, headers: good, now: at(1) })).toMatchObject({ ok: true, key: 'uploads/ben/mine-now.png' });
  });

  it('escape a key the way S3 does, and read it back', () => {
    const key = 'uploads/a+b &c/ñ ü?#=%.jpg';
    const url = sign({ key });
    expect(url.split('?')[0]).toBe('https://study-photos.s3.us-east-1.amazonaws.com/uploads/a%2Bb%20%26c/%C3%B1%20%C3%BC%3F%23%3D%25.jpg');
    expect(presigner.parse(url).key).toBe(key);
    expect(presigner.verify({ method: 'PUT', url, headers: good, now: at(1) })).toMatchObject({ ok: true, key });
  });

  it('only take bucket addresses for buckets', () => {
    expect(presigner.parse('https://study-photos.s3.eu-west-1.amazonaws.com/a.jpg')).toEqual({ bucket: 'study-photos', region: 'eu-west-1', key: 'a.jpg' });
    expect(presigner.parse('https://study-photos.s3-us-west-2.amazonaws.com/a.jpg')).toMatchObject({ bucket: 'study-photos', region: 'us-west-2' }); // the older spelling
    expect(presigner.parse('https://my.dotted.bucket.s3.us-gov-west-1.amazonaws.com/')).toEqual({ bucket: 'my.dotted.bucket', region: 'us-gov-west-1', key: '' });
    expect(presigner.parse('https://study-photos.s3-website-us-east-1.amazonaws.com/index.html')).toBeNull(); // a website endpoint
    expect(presigner.parse('https://s3.us-east-1.amazonaws.com/study-photos/a.jpg')).toBeNull(); // path-style: not modeled
    expect(presigner.parse('http://study-photos.s3.us-east-1.amazonaws.com/a.jpg')).toBeNull();
    expect(presigner.parse('https://study-photos.s3.us-east-1.amazonaws.com.evil.example/a.jpg')).toBeNull();
  });

  it('leave headers that were not signed free', () => {
    const url = sign({ signed: [] });
    expect(new URL(url).searchParams.get('X-Amz-SignedHeaders')).toBe('host');
    expect(presigner.verify({ method: 'PUT', url, headers: { 'content-type': 'text/html', 'content-length': '9999999' }, now: at(5) }).ok).toBe(true);
  });
});
