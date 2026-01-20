import { cloudConcepts } from './domains/cloud-concepts';
import { securityCompliance } from './domains/security-compliance';
import { cloudTechnology } from './domains/cloud-technology';
import { billingSupport } from './domains/billing-support';

export const examDomains = {
  'cloud-concepts': cloudConcepts,
  'security-compliance': securityCompliance,
  'cloud-technology': cloudTechnology,
  'billing-support': billingSupport
};

export const getDomainById = (id) => examDomains[id];

export const getAllDomains = () => Object.values(examDomains);

export const getDomainCount = () => Object.keys(examDomains).length;
