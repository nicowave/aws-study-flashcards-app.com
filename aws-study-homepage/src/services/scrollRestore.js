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

// For a short while after the place is back, the page holds it: a scroll the visitor did not make is undone.
// Why: Safari on iOS 27 (not iOS 18, not Chrome) slides the page by itself about a fifth of a second after a reload,
// a line or two down, and now and then all the way to the #section in the address. It starts after the hub's second
// look, so the second look cannot catch it, and it happens with or without the hub's hold on the browser's restore.
// The hold ends the moment the visitor does anything at all (a touch, a click, any key, focus moving), when the
// address changes, when the app scrolls on purpose (letGo), and after KEEP_MS whatever happens.
const KEEP_MS = 2000;
const VISITOR_ACTS = ['wheel', 'touchstart', 'touchmove', 'pointerdown', 'mousedown', 'keydown', 'focusin',
  'hashchange', 'hub:locationchange', 'pagehide'];
// interrupted() is true when the visitor or the app ended the hold (not the clock): then nothing may move the page
// back any more, the second look included. A Tab press counts, because moving focus can scroll the focused element
// into view, and pulling the page back would hide it again.
//
// When the address has no #section, the place is also put back each time the page grows, from a ResizeObserver on
// the body. Why: most of Safari's slide is its scroll anchoring. As the sections above the place finish drawing, it
// moves the page to keep what is on screen still. A scroll event only reports that on the next frame, after the moved
// frame is painted, so undoing it there showed as a flick (up to 120 px, measured on iOS 27). A ResizeObserver runs
// after the page is laid out and before it is painted, so the move is undone before anyone sees it.
// Not with a #section in the address: there, whenever anchoring's move is held off (undone this early, or anchoring
// switched off), Safari glides to that section instead, and the page bounced by up to 960 px. Left to the scroll
// events, it flicks a few dozen pixels at most. Browsers without ResizeObserver keep the scroll events too.
let letGoNow = () => {};
export const holdPlace = (y, ms = KEEP_MS) => {
  let done = false;
  let interrupted = false;
  const putBack = () => {
    if (Math.abs(window.scrollY - y) > 1) jumpTo(y);
  };
  const early = !window.location.hash && typeof ResizeObserver === 'function' && document.body;
  const grows = early ? new ResizeObserver(putBack) : null;
  grows?.observe(document.body);
  const end = () => {
    if (done) return;
    done = true;
    clearTimeout(timer);
    grows?.disconnect();
    window.removeEventListener('scroll', putBack);
    for (const t of VISITOR_ACTS) window.removeEventListener(t, onAct, { capture: true });
    if (letGoNow === onAct) letGoNow = () => {};
  };
  const onAct = () => {
    if (!done) interrupted = true;
    end();
  };
  const timer = setTimeout(end, ms);
  window.addEventListener('scroll', putBack, { passive: true });
  for (const t of VISITOR_ACTS) window.addEventListener(t, onAct, { capture: true, passive: true });
  letGoNow = onAct;
  return { stop: end, interrupted: () => interrupted };
};
// The app calls this just before a scroll it makes on purpose, so the hold does not undo it.
export const letGo = () => letGoNow();

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
