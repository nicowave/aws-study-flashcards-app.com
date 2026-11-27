// Search engines and share previews must get the public name, levelupstudyhub.com, from every
// build, because the same build still answers on the old name too.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

// Paths from the app's folder, wherever the tests are started from.
const read = (path) => readFileSync(resolve(fileURLToPath(import.meta.url), '../../..', path), 'utf8');
const html = read('index.html');
const attr = (pattern) => html.match(pattern)?.[1];

// This app's own address, read from its canonical tag so the same file works in every game.
const canonical = attr(/<link rel="canonical" href="([^"]+)"/);

describe('public name in the page head, robots.txt and sitemap.xml', () => {
  it('has a canonical address on a levelupstudyhub.com subdomain', () => {
    expect(canonical).toMatch(/^https:\/\/[a-z]+\.levelupstudyhub\.com\/$/);
  });

  it('uses the same address for og:url', () => {
    expect(attr(/<meta property="og:url" content="([^"]+)"/)).toBe(canonical);
  });

  it("takes the share image from the hub's public name", () => {
    expect(attr(/<meta property="og:image" content="([^"]+)"/)).toMatch(/^https:\/\/levelupstudyhub\.com\/og\/[a-z-]+\.png\?v=\d+$/);
  });

  it('points robots.txt at the sitemap on the same address', () => {
    expect(read('public/robots.txt').split('\n')).toContain(`Sitemap: ${canonical}sitemap.xml`);
  });

  it('lists only pages on that address in the sitemap', () => {
    const pages = [...read('public/sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    expect(pages.length).toBeGreaterThan(0);
    expect(pages.filter((page) => !page.startsWith(canonical))).toEqual([]);
  });

  it('never mentions the old name', () => {
    for (const file of ['index.html', 'public/robots.txt', 'public/sitemap.xml']) {
      expect(read(file), file).not.toContain('aws-study-flashcards-app.com');
    }
  });
});
