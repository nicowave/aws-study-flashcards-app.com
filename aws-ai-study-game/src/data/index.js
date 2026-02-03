import { domain1, domain2 } from './domains/fundamentals';
import { domain3 } from './domains/applications';
import { domain4, domain5 } from './domains/governance';

export const domains = {
  domain1,
  domain2,
  domain3,
  domain4,
  domain5
};

export const getDomainById = (id) => examDomains[id];

export const getAllDomains = () => Object.values(examDomains);

export const getDomainCount = () => Object.keys(examDomains).length;
