// AWS Certified Developer – Associate (DVA-C02) Exam Domains
// Domain weights from the official exam guide

import { development } from './development';
import { security } from './security';
import { deployment } from './deployment';
import { troubleshooting } from './troubleshooting';

export const domains = [
  development,     // 32%
  security,        // 26%
  deployment,      // 24%
  troubleshooting, // 18%
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
