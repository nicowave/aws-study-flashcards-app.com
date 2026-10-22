import { developmentGuide } from './development';
import { securityGuide } from './security';
import { deploymentGuide } from './deployment';
import { troubleshootingGuide } from './troubleshooting';

export const studyGuides = [developmentGuide, securityGuide, deploymentGuide, troubleshootingGuide];
export const getStudyGuideById = (id) => studyGuides.find(g => g.id === id);
