// Site Configuration for AWS Study Hub
// All sites share the same Firebase project for unified authentication
// IMPORTANT: All sites must be on the same root domain for cookie sharing

export const SITES = {
  hub: {
    name: 'AWS Study Hub',
    url: 'https://aws-study-flashcards-app.com',
    domain: 'aws-study-flashcards-app.com'
  },
  cloudPractitioner: {
    name: 'Cloud Practitioner',
    url: 'https://cloud.aws-study-flashcards-app.com',
    domain: 'cloud.aws-study-flashcards-app.com'
  },
  aiPractitioner: {
    name: 'AI Practitioner', 
    url: 'https://ai.aws-study-flashcards-app.com',
    domain: 'ai.aws-study-flashcards-app.com'
  }
};

// Root domain for cookies (with leading dot for subdomain access)
export const ROOT_DOMAIN = '.aws-study-flashcards-app.com';

// Hub URL for redirects
export const HUB_URL = SITES.hub.url;

// Get current site based on hostname
export const getCurrentSite = () => {
  const hostname = window.location.hostname;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'development';
  }
  
  for (const [key, site] of Object.entries(SITES)) {
    if (hostname === site.domain || hostname === `www.${site.domain}`) {
      return key;
    }
  }
  
  return 'unknown';
};

// Check if current site is the hub
export const isHubSite = () => {
  const site = getCurrentSite();
  return site === 'hub' || site === 'development';
};

// Get URL for a specific site
export const getSiteUrl = (siteKey) => {
  return SITES[siteKey]?.url || HUB_URL;
};
