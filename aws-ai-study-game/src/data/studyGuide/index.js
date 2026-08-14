import { domain1Guide } from './domain1';
import { domain2Guide } from './domain2';
import { domain3Guide } from './domain3';
import { domain4Guide } from './domain4';
import { domain5Guide } from './domain5';

export const studyGuides = [domain1Guide, domain2Guide, domain3Guide, domain4Guide, domain5Guide];
export const getStudyGuideById = (id) => studyGuides.find(g => g.id === id);
