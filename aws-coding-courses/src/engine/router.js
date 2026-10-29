// Minimal client-side router: clean paths (/server-health-check/disk-space),
// CloudFront serves index.html for every path.
import { useEffect, useState } from 'react';

const normalize = (p) => (p.length > 1 ? p.replace(/\/+$/, '') : p) || '/';

export const navigate = (path, { replace = false } = {}) => {
  if (normalize(path) === normalize(window.location.pathname) && !path.includes('?')) return;
  window.history[replace ? 'replaceState' : 'pushState'](null, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo(0, 0);
};

export const usePath = () => {
  const [path, setPath] = useState(() => normalize(window.location.pathname));
  useEffect(() => {
    const onPop = () => setPath(normalize(window.location.pathname));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  return path;
};

// <a> that navigates without a page load
export const linkProps = (to) => ({
  href: to,
  onClick: (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    navigate(to);
  },
});
