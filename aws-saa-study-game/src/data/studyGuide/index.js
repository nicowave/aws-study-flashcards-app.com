import { secureArchitecturesGuide } from './secure-architectures';
import { resilientArchitecturesGuide } from './resilient-architectures';
import { highPerformingGuide } from './high-performing';
import { costOptimizedGuide } from './cost-optimized';

export const studyGuides = [secureArchitecturesGuide, resilientArchitecturesGuide, highPerformingGuide, costOptimizedGuide];
export const getStudyGuideById = (id) => studyGuides.find(g => g.id === id);
