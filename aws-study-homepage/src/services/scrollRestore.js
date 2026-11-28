// A reload or a Back/Forward visit puts the visitor back where they were on the page.
//
// Why this exists: the hub shows a short loading screen until the first sign-in check finishes. When the browser
// tries to put a reloaded or revisited page back at its old scroll position, the page is only that loading screen,
// so the browser clamps the position to the top, and it gives up before the sections are drawn. (Measured in Chrome:
// signed in, every Back visit and most reloads ended at the top.) So the hub keeps the position itself: it is saved
// for each history entry when the page is left, and put back once the sections are drawn.
//
// While the hub puts the place back, the browser is asked to stand aside (history.scrollRestoration = 'manual'):
// when its own attempt comes up short, Chrome falls back to the #section in the address and glides off there.
// It is handed back ('auto') as soon as the place is back, because the setting passes on to new history entries,
// and the browser's restore is what makes Back/Forward between in-page #section jumps work.

const STORE_KEY = 'hub:scrollY'; // sessionStorage (this tab only): { [history entry id]: scrollY }
const MAX_SAVED = 30; // a long visit must not grow the store forever
const ENTRY = 'hubEntry'; // our id inside history.state, so two entries with the same address keep their own place

// 'reload' or 'back_forward': the browser is bringing back a page the visitor already had open.
export const isReturnVisit = () => {
  try {
    const type = performance.getEntriesByType?.('navigation')?.[0]?.type;
    return type === 'reload' || type === 'back_forward';
  } catch {
    return false;
  }
};

const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

// Give the current history entry an id, once. history.state survives a reload and Back/Forward, so the id finds the
// same entry again; an entry that already has one (every return visit) is left alone.
export const tagEntry = () => {
  try {
    const state = window.history.state;
    if (state && typeof state === 'object' && state[ENTRY]) return state[ENTRY];
    const id = newId();
    window.history.replaceState({ ...(state && typeof state === 'object' ? state : {}), [ENTRY]: id }, '');
    return id;
  } catch {
    return null;
  }
};

const entryId = () => {
  const state = window.history.state;
  return state && typeof state === 'object' ? state[ENTRY] || null : null;
};

// sessionStorage can be blocked (private windows, strict settings): then the browser's own restore is all there is.
const readStore = () => {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(STORE_KEY));
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};
const writeStore = (store) => {
  try {
    const ids = Object.keys(store);
    for (const id of ids.slice(0, Math.max(0, ids.length - MAX_SAVED))) delete store[id];
    sessionStorage.setItem(STORE_KEY, JSON.stringify(store));
  } catch { /* nothing to keep it in */ }
};

// Called as the page is left (pagehide). y = null forgets the entry's place instead.
export const saveScroll = (y = window.scrollY) => {
  const id = entryId();
  if (!id) return;
  const store = readStore();
  delete store[id]; // re-added last, so the oldest entries are the ones dropped
  if (y != null) store[id] = Math.max(0, Math.round(y));
  writeStore(store);
};

export const savedScroll = () => {
  const id = entryId();
  const y = id ? readStore()[id] : undefined;
  return Number.isFinite(y) ? y : null;
};

// Called once as the app loads, before the page has finished parsing: that is when the browser decides whether to
// restore or to jump to the #section. Only on a return visit that has a place saved; otherwise the browser's own
// restore is all there is, so it is left alone.
let held = false;
export const holdBrowserRestore = () => {
  try {
    if (!isReturnVisit() || !(savedScroll() > 0) || !('scrollRestoration' in window.history)) return;
    window.history.scrollRestoration = 'manual';
    held = true;
  } catch { /* an old browser without the setting: nothing to hold */ }
};
export const releaseBrowserRestore = () => {
  if (!held) return;
  held = false;
  try { window.history.scrollRestoration = 'auto'; } catch { /* as above */ }
};

// Straight there, never gliding: the page scrolls smoothly when motion is allowed, but a restore is not a jump
// the visitor asked for, and the browser's own restore is instant too.
export const jumpTo = (y) => {
  const root = document.documentElement;
  const inline = root.style.scrollBehavior;
  root.style.scrollBehavior = 'auto';
  try {
    window.scrollTo({ top: y, left: 0, behavior: 'instant' });
  } catch {
    window.scrollTo(0, y);
  }
  root.style.scrollBehavior = inline;
};

// True once the visitor has moved the page themselves (wheel, touch, scroll keys, a press on the scrollbar).
// Scroll events cannot tell: the browser's own restore and our jump fire them too.
const SCROLL_KEYS = new Set(['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ', 'Spacebar']);
export const watchVisitor = () => {
  let moved = false;
  const onInput = (e) => {
    if (e.type !== 'keydown' || SCROLL_KEYS.has(e.key)) moved = true;
  };
  const types = ['wheel', 'touchmove', 'mousedown', 'keydown'];
  for (const t of types) window.addEventListener(t, onInput, { capture: true, passive: true });
  return {
    moved: () => moved,
    stop: () => { for (const t of types) window.removeEventListener(t, onInput, { capture: true }); },
  };
};
