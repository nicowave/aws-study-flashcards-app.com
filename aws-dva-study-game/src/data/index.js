// AWS Certified Developer – Associate (DVA-C02) Data Exports
// Re-export domains as array for components that need to map over them

import { development } from './domains/development';
import { security } from './domains/security';
import { deployment } from './domains/deployment';
import { troubleshooting } from './domains/troubleshooting';

// Export as ARRAY (for DomainSelect.jsx which uses .map())
export const domains = [
  development,     // 32%
  security,        // 26%
  deployment,      // 24%
  troubleshooting, // 18%
];

// Also export as object for direct access by ID
export const domainsById = {
  'development': development,
  'security': security,
  'deployment': deployment,
  'troubleshooting': troubleshooting
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
