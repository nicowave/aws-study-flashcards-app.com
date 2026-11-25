// Runs before every test file. Why: components use browser APIs that jsdom (the
// simulated browser the tests run in) doesn't have, and each test must start clean.
import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// jsdom has no layout engine, so these browser APIs are missing; give them harmless stand-ins.
class FakeIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() { return []; }
}
globalThis.IntersectionObserver ??= FakeIntersectionObserver;
Element.prototype.scrollIntoView ??= function scrollIntoView() {};
window.scrollTo = () => {};
window.matchMedia ??= (query) => ({
  matches: false, media: query, onchange: null,
  addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent() { return false; },
});

afterEach(() => {
  cleanup(); // unmount what each test rendered
  localStorage.clear(); // progress, stats and settings live here; don't leak between tests
  sessionStorage.clear();
  vi.useRealTimers();
  vi.restoreAllMocks();
});
