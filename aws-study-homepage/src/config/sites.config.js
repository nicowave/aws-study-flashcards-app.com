// Site Configuration for AWS Study Hub
// All sites share the same Firebase project for unified authentication

export const SITES = {
  hub: {
    name: 'AWS Study Hub',
    url: 'https://aws-study-flashcards.app',
    domain: 'aws-study-flashcards.app'
  },
  cloudPractitioner: {
    name: 'Cloud Practitioner',
    url: 'https://cloud.aws-study-flashcards.app',
    domain: 'cloud.aws-study-flashcards.app'
  },
  aiPractitioner: {
    name: 'AI Practitioner', 
    url: 'https://ai.aws-study-flashcards-app.com',
    domain: 'ai.aws-study-flashcards-app.com'
  }
};

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
