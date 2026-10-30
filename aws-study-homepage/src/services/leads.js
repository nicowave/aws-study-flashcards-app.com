// Readiness check emails, where visitors came from, and unsubscribe links.
// The backend side is aws-backend/lambda/api/leads.js.
import { API_BASE_URL } from '../config/auth.config';

const SOURCE_KEY = 'awsHub_source';
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign'];

/** Remember which tracked link this visit came from (call once on load). */
export const captureSource = () => {
  try {
    const q = new URLSearchParams(window.location.search);
    // Keep the first source of the visit unless a new tracked link was opened
    if (sessionStorage.getItem(SOURCE_KEY) && !q.get('utm_source')) return;
    const source = Object.fromEntries(UTM_KEYS.map((k) => [k, q.get(k) || '']));
    source.referrer = document.referrer && !document.referrer.includes('aws-study-flashcards-app.com') ? document.referrer : '';
    sessionStorage.setItem(SOURCE_KEY, JSON.stringify(source));
  } catch { /* storage blocked */ }
};

const getSource = () => {
  try {
    return JSON.parse(sessionStorage.getItem(SOURCE_KEY)) || {};
  } catch {
    return {};
  }
};

/** Google Analytics event (no-op when analytics is off or blocked). */
export const track = (name, params = {}) => {
  try {
    if (typeof window.gtag === 'function') window.gtag('event', name, params);
  } catch { /* ignore */ }
};

const post = async (path, body) => {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
  return data;
};

/** Save the email and score; the backend emails the study plan. */
export const submitReadiness = ({ email, certId, score, total, domains, website }) =>
  post('/v1/leads', { email, certId, score, total, domains, website, source: getSource() });

export const unsubscribe = (email, token) => post('/v1/leads/unsubscribe', { email, token });
