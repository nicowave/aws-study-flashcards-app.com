import React from 'react';

// ML Pipeline Diagram - inspired by AWS training flow
export const MLPipelineDiagram = ({ highlighted = null }) => (
  <svg viewBox="0 0 400 80" className="flashcard-diagram">
    <defs>
      <linearGradient id="dataGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0d4f63" />
        <stop offset="100%" stopColor="#0a6b7a" />
      </linearGradient>
      <linearGradient id="algoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0a7c91" />
        <stop offset="100%" stopColor="#0891b2" />
      </linearGradient>
      <linearGradient id="modelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4ade80" />
        <stop offset="100%" stopColor="#22c55e" />
      </linearGradient>
      <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
        <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
      </marker>
    </defs>
    
    {/* Training Data Box */}
    <rect x="10" y="15" width="100" height="50" rx="4" fill="url(#dataGrad)" 
      stroke={highlighted === 'data' ? '#fff' : 'none'} strokeWidth="2" />
    <text x="60" y="45" textAnchor="middle" fill="white" fontSize="11" fontWeight="500">
      Training Data
    </text>
    
    {/* Arrow 1 */}
    <line x1="115" y1="40" x2="145" y2="40" stroke="#64748b" strokeWidth="2" markerEnd="url(#arrowhead)" />
    
    {/* ML Algorithm Box */}
    <rect x="150" y="15" width="100" height="50" rx="4" fill="url(#algoGrad)"
      stroke={highlighted === 'algo' ? '#fff' : 'none'} strokeWidth="2" />
    <text x="200" y="45" textAnchor="middle" fill="white" fontSize="11" fontWeight="500">
      ML Algorithm
    </text>
    
    {/* Arrow 2 */}
    <line x1="255" y1="40" x2="285" y2="40" stroke="#64748b" strokeWidth="2" markerEnd="url(#arrowhead)" />
    
    {/* Model Box */}
    <rect x="290" y="15" width="100" height="50" rx="4" fill="url(#modelGrad)"
      stroke={highlighted === 'model' ? '#fff' : 'none'} strokeWidth="2" />
    <text x="340" y="45" textAnchor="middle" fill="#0f172a" fontSize="11" fontWeight="600">
      Model
    </text>
  </svg>
);

// Supervised Learning Icon - eye watching a book (learning with labels)
export const SupervisedLearningIcon = ({ size = 80 }) => (
  <svg viewBox="0 0 100 100" width={size} height={size} className="ml-type-icon">
    <defs>
      <linearGradient id="supervisedGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0891b2" />
        <stop offset="100%" stopColor="#22c55e" />
      </linearGradient>
    </defs>
    
    {/* Eye */}
    <ellipse cx="50" cy="30" rx="25" ry="15" fill="none" stroke="#1e293b" strokeWidth="3" />
    <circle cx="50" cy="30" r="10" fill="none" stroke="url(#supervisedGrad)" strokeWidth="2.5" />
    <circle cx="50" cy="30" r="4" fill="#1e293b" />
    
    {/* Book with labels */}
    <path d="M25 55 L25 90 Q50 85 50 85 Q50 85 75 90 L75 55 Q50 50 50 50 Q50 50 25 55" 
      fill="none" stroke="#1e293b" strokeWidth="3" />
    <line x1="50" y1="50" x2="50" y2="85" stroke="#1e293b" strokeWidth="2" />
    
    {/* Label lines on book */}
    <line x1="30" y1="62" x2="45" y2="60" stroke="#1e293b" strokeWidth="2" />
    <line x1="30" y1="70" x2="45" y2="68" stroke="url(#supervisedGrad)" strokeWidth="2" />
    <line x1="30" y1="78" x2="42" y2="76" stroke="url(#supervisedGrad)" strokeWidth="2" />
    <line x1="55" y1="60" x2="70" y2="62" stroke="#1e293b" strokeWidth="2" />
    <line x1="55" y1="68" x2="70" y2="70" stroke="url(#supervisedGrad)" strokeWidth="2" />
    <line x1="58" y1="76" x2="70" y2="78" stroke="#1e293b" strokeWidth="2" />
  </svg>
);

// Unsupervised Learning Icon - gears finding patterns in shapes
export const UnsupervisedLearningIcon = ({ size = 80 }) => (
  <svg viewBox="0 0 100 100" width={size} height={size} className="ml-type-icon">
    <defs>
      <linearGradient id="unsupervisedGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0891b2" />
        <stop offset="100%" stopColor="#22c55e" />
      </linearGradient>
    </defs>
    
    {/* Circular arrow */}
    <path d="M20 50 A30 30 0 1 1 50 80" fill="none" stroke="#1e293b" strokeWidth="2.5" />
    <polygon points="15,55 20,45 25,55" fill="#1e293b" />
    <path d="M80 50 A30 30 0 0 1 50 20" fill="none" stroke="#1e293b" strokeWidth="2.5" />
    <polygon points="85,45 80,55 75,45" fill="#1e293b" />
    
    {/* Main gear */}
    <circle cx="50" cy="50" r="15" fill="none" stroke="url(#unsupervisedGrad)" strokeWidth="3" />
    <circle cx="50" cy="50" r="6" fill="none" stroke="#1e293b" strokeWidth="2" />
    {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
      <rect key={i} x="47" y="32" width="6" height="8" rx="1" fill="url(#unsupervisedGrad)"
        transform={`rotate(${angle} 50 50)`} />
    ))}
    
    {/* Small gear */}
    <circle cx="72" cy="35" r="8" fill="none" stroke="url(#unsupervisedGrad)" strokeWidth="2" />
    <circle cx="72" cy="35" r="3" fill="none" stroke="#1e293b" strokeWidth="1.5" />
    
    {/* Random shapes */}
    <rect x="15" y="30" width="10" height="10" fill="none" stroke="#1e293b" strokeWidth="2" />
    <polygon points="85,65 80,75 90,75" fill="none" stroke="#1e293b" strokeWidth="2" />
    <polygon points="75,80 70,90 80,90 85,85 80,80" fill="none" stroke="#1e293b" strokeWidth="2" />
    <circle cx="25" cy="75" r="5" fill="none" stroke="#1e293b" strokeWidth="2" />
  </svg>
);

// Reinforcement Learning Icon - reward badge
export const ReinforcementLearningIcon = ({ size = 80 }) => (
  <svg viewBox="0 0 100 100" width={size} height={size} className="ml-type-icon">
    <defs>
      <linearGradient id="reinforceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0891b2" />
        <stop offset="100%" stopColor="#22c55e" />
      </linearGradient>
    </defs>
    
    {/* Badge outer ring - starburst */}
    <path d="M50 10 L55 25 L70 20 L62 35 L78 40 L62 48 L70 62 L55 55 L50 70 L45 55 L30 62 L38 48 L22 40 L38 35 L30 20 L45 25 Z"
      fill="none" stroke="#1e293b" strokeWidth="2.5" />
    
    {/* Inner circle */}
    <circle cx="50" cy="40" r="15" fill="none" stroke="url(#reinforceGrad)" strokeWidth="3" />
    
    {/* Ribbons */}
    <path d="M38 55 L35 85 L42 78 L50 88" fill="none" stroke="#1e293b" strokeWidth="2.5" strokeLinejoin="round" />
    <path d="M62 55 L65 85 L58 78 L50 88" fill="none" stroke="#1e293b" strokeWidth="2.5" strokeLinejoin="round" />
  </svg>
);

// Inference Types Comparison Diagram
export const InferenceTypesDiagram = ({ highlighted = null }) => (
  <svg viewBox="0 0 400 120" className="flashcard-diagram">
    <defs>
      <linearGradient id="batchGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#6366f1" />
        <stop offset="100%" stopColor="#8b5cf6" />
      </linearGradient>
      <linearGradient id="realtimeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#ef4444" />
      </linearGradient>
    </defs>
    
    {/* Batch Section */}
    <rect x="10" y="10" width="180" height="100" rx="8" fill="rgba(99, 102, 241, 0.1)" 
      stroke={highlighted === 'batch' ? '#6366f1' : 'rgba(99, 102, 241, 0.3)'} strokeWidth="2" />
    <text x="100" y="35" textAnchor="middle" fill="#6366f1" fontSize="14" fontWeight="600">📦 BATCH</text>
    <text x="100" y="55" textAnchor="middle" fill="#94a3b8" fontSize="10">Large datasets at once</text>
    <text x="100" y="70" textAnchor="middle" fill="#94a3b8" fontSize="10">Scheduled processing</text>
    <text x="100" y="85" textAnchor="middle" fill="#94a3b8" fontSize="10">Accuracy focused</text>
    <text x="100" y="102" textAnchor="middle" fill="#64748b" fontSize="9" fontStyle="italic">Reports, Analysis</text>
    
    {/* Real-time Section */}
    <rect x="210" y="10" width="180" height="100" rx="8" fill="rgba(245, 158, 11, 0.1)"
      stroke={highlighted === 'realtime' ? '#f59e0b' : 'rgba(245, 158, 11, 0.3)'} strokeWidth="2" />
    <text x="300" y="35" textAnchor="middle" fill="#f59e0b" fontSize="14" fontWeight="600">⚡ REAL-TIME</text>
    <text x="300" y="55" textAnchor="middle" fill="#94a3b8" fontSize="10">Immediate processing</text>
    <text x="300" y="70" textAnchor="middle" fill="#94a3b8" fontSize="10">Low latency required</text>
    <text x="300" y="85" textAnchor="middle" fill="#94a3b8" fontSize="10">Speed focused</text>
    <text x="300" y="102" textAnchor="middle" fill="#64748b" fontSize="9" fontStyle="italic">Chatbots, Fraud Detection</text>
  </svg>
);

// Component to render the appropriate diagram based on type
export const FlashcardVisual = ({ visualType, highlighted }) => {
  switch (visualType) {
    case 'training-pipeline':
    case 'ml-pipeline':
      return <MLPipelineDiagram highlighted={highlighted} />;
    case 'inference-types':
      return <InferenceTypesDiagram highlighted={highlighted} />;
    case 'supervised':
      return <SupervisedLearningIcon size={100} />;
    case 'unsupervised':
      return <UnsupervisedLearningIcon size={100} />;
    case 'reinforcement':
      return <ReinforcementLearningIcon size={100} />;
    default:
      return null;
  }
};

export default FlashcardVisual;
