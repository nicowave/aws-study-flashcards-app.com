// AWS Solutions Architect Associate (SAA-C03) Exam Domains
// Domain weights from official exam guide

import { secureArchitectures } from './secure-architectures';
import { resilientArchitectures } from './resilient-architectures';
import { highPerforming } from './high-performing';
import { costOptimized } from './cost-optimized';

export const domains = [
  secureArchitectures,    // 30%
  resilientArchitectures, // 26%
  highPerforming,         // 24%
  costOptimized           // 20%
];

export const getAllQuestions = () => {
  return domains.flatMap(domain =>
    domain.questions.map(q => ({ ...q, domain: domain.id, domainName: domain.name }))
  );
};

export const getDomainById = (id) => domains.find(d => d.id === id);

export const getQuestionsByDomain = (domainId) => {
  const domain = getDomainById(domainId);
  return domain ? domain.questions : [];
};
