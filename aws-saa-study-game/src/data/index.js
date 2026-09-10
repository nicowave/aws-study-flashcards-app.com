// AWS Solutions Architect Associate (SAA-C03) Data Exports
// Re-export domains as array for components that need to map over them

import { secureArchitectures } from './domains/secure-architectures';
import { resilientArchitectures } from './domains/resilient-architectures';
import { highPerforming } from './domains/high-performing';
import { costOptimized } from './domains/cost-optimized';

// Export as ARRAY (for DomainSelect.jsx which uses .map())
export const domains = [
  secureArchitectures,    // 30%
  resilientArchitectures, // 26%
  highPerforming,         // 24%
  costOptimized           // 20%
];

// Also export as object for direct access by ID
export const domainsById = {
  'secure-architectures': secureArchitectures,
  'resilient-architectures': resilientArchitectures,
  'high-performing': highPerforming,
  'cost-optimized': costOptimized
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
