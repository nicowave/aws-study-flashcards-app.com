// AWS AI Practitioner (AIF-C01) Data Exports
// Re-export domains as array for components that need to map over them

import { domain1, domain2 } from './domains/fundamentals';
import { domain3 } from './domains/applications';
import { domain4, domain5 } from './domains/governance';

// Export as ARRAY (for DomainSelect.jsx, StudyGuide.jsx, StatsScreen.jsx which use .map())
export const domains = [
  domain1,  // Fundamentals of AI and ML - 20%
  domain2,  // Fundamentals of Generative AI - 24%
  domain3,  // Applications of Foundation Models - 28%
  domain4,  // Guidelines for Responsible AI - 14%
  domain5   // Security, Compliance, and Governance - 14%
];

// Also export as object for direct access by ID
export const domainsById = {
  domain1,
  domain2,
  domain3,
  domain4,
  domain5
};

export const getDomainById = (id) => domainsById[id];

export const getAllDomains = () => domains;

export const getDomainCount = () => domains.length;

export const getAllQuestions = () => {
  return domains.flatMap(domain => 
    domain.questions.map(q => ({ ...q, domain: domain.id, domainName: domain.name }))
  );
};

export const getQuestionsByDomain = (domainId) => {
  const domain = getDomainById(domainId);
  return domain ? domain.questions : [];
};
