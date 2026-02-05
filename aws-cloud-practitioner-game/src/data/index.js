// AWS Cloud Practitioner (CLF-C02) Data Exports
// Re-export domains as array for components that need to map over them

import { cloudConcepts } from './domains/cloud-concepts';
import { securityCompliance } from './domains/security-compliance';
import { cloudTechnology } from './domains/cloud-technology';
import { billingSupport } from './domains/billing-support';

// Export as ARRAY (for DomainSelect.jsx which uses .map())
export const domains = [
  cloudConcepts,      // 24%
  securityCompliance, // 30%
  cloudTechnology,    // 34%
  billingSupport      // 12%
];

// Also export as object for direct access by ID
export const domainsById = {
  'cloud-concepts': cloudConcepts,
  'security-compliance': securityCompliance,
  'cloud-technology': cloudTechnology,
  'billing-support': billingSupport
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
