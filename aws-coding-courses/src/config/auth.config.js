// AWS sign-in (Amazon Cognito) + API settings for Level Up Study Hub.
// None of these are secret: they ship in every app bundle. Override per build
// with VITE_* variables if the backend is ever redeployed elsewhere.

export const AWS_REGION = 'us-east-1';

// Cognito user pool app client (public, no secret)
export const COGNITO_CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID || '8att6q0026f6sb44qn4il7tu8';

// Branded sign-in domain (Google sign-in and the token endpoint)
export const COGNITO_AUTH_URL = import.meta.env.VITE_COGNITO_AUTH_URL || 'https://auth.aws-study-flashcards-app.com';

// HTTP API: /v1/* (profile, progress) and /callable/* (payments)
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'https://vaj7alg0f6.execute-api.us-east-1.amazonaws.com';
export const CALLABLE_BASE_URL = `${API_BASE_URL}/callable`;

// One sign-in for every subdomain: the session cookie lives on the root domain.
// The same build is served under both names while Study Hub moves to
// levelupstudyhub.com, so the root domain is read from the address the page
// was opened on, never fixed at build time.
export const ROOT_DOMAINS = ['levelupstudyhub.com', 'aws-study-flashcards-app.com'];

/**
 * Cookie domain for a host name: '.levelupstudyhub.com' for that name and its
 * subdomains, '.aws-study-flashcards-app.com' likewise, and null for any other
 * host (preview or CloudFront addresses, or a name ending in a dot), which then
 * gets a host-only cookie.
 */
export const cookieDomainFor = (hostname) => {
  const host = String(hostname || '').toLowerCase();
  // The browser treats 'levelupstudyhub.com.' as a host of its own and refuses
  // domain=.levelupstudyhub.com there, so keep that cookie on the exact host.
  if (host.endsWith('.')) return null;
  const root = ROOT_DOMAINS.find((d) => host === d || host.endsWith(`.${d}`));
  return root ? `.${root}` : null;
};

// Study Hub sites that answer under both names. Only links to these follow the
// page's name. The sign-in address (auth.) and any site not listed keep the
// name they were written with, so a link can never point at a door that does
// not exist. A new site joins this list once it has a door under both names.
export const SITE_SUBDOMAINS = ['', 'cloud', 'ai', 'architect', 'developer', 'bash', 'python', 'js', 'typescript', 'tutorials'];

const SITE_LINK = new RegExp(
  `^https://(?:([a-z0-9-]+)\\.)?(?:${ROOT_DOMAINS.map((d) => d.replace(/\./g, '\\.')).join('|')})(?=[/?#]|$)`,
  'i',
);

/**
 * A link to another Study Hub site, moved onto the name this page was opened
 * on. Each name keeps its own sign-in, so a link written with the old name must
 * not carry a visitor from levelupstudyhub.com back to the old name, signed out.
 * Path, query and fragment are kept. On any other host (localhost, previews)
 * and for any other address the link is returned as written.
 */
export const onThisName = (url, hostname = typeof window === 'undefined' ? '' : window.location.hostname) => {
  const here = cookieDomainFor(hostname);
  const match = here && typeof url === 'string' ? SITE_LINK.exec(url) : null;
  if (!match || !SITE_SUBDOMAINS.includes((match[1] || '').toLowerCase())) return url;
  const sub = match[1] ? `${match[1].toLowerCase()}.` : '';
  return `https://${sub}${here.slice(1)}${url.slice(match[0].length)}`;
};

/** True for an address on either Study Hub name, e.g. a referrer from our own pages. */
export const isStudyHubAddress = (url) => {
  try {
    return cookieDomainFor(new URL(url).hostname) !== null;
  } catch {
    return false;
  }
};
