import { cloudConcepts } from './domains/cloud-concepts';
import { securityCompliance } from './domains/security-compliance';
import { cloudTechnology } from './domains/cloud-technology';
import { billingSupport } from './domains/billing-support';

export const domains = {
  'cloud-concepts': cloudConcepts,
  'security-compliance': securityCompliance,
  'cloud-technology': cloudTechnology,
  'billing-support': billingSupport
};

export const getDomainById = (id) => domains[id];

export const getAllDomains = () => Object.values(domains);

export const getDomainCount = () => Object.keys(domains).length;
