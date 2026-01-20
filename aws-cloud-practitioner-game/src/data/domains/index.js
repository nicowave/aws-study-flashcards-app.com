// AWS Cloud Practitioner (CLF-C02) Exam Domains
// Domain weights from official exam guide

import { cloudConcepts } from './cloud-concepts';
import { securityCompliance } from './security-compliance';
import { cloudTechnology } from './cloud-technology';
import { billingSupport } from './billing-support';

export const domains = [
  cloudConcepts,      // 24%
  securityCompliance, // 30%
  cloudTechnology,    // 34%
  billingSupport      // 12%
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
