import React from 'react';
import { TrophyIcon, TargetIcon, FlameIcon, RefreshIcon, HomeIcon, GridIcon, ShareIcon } from './Icons';

// Share configuration for this certification app
const SHARE_CONFIG = {
  certName: 'Cloud Practitioner',
  certHashtag: 'CloudPractitioner',
  siteUrl: 'https://cloud.aws-study-flashcards-app.com'
};

// Branded social media icons (inline — only used here)
const LinkedInIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const XTwitterIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const FacebookIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const ResultsScreen = ({
  domain,
  sessionStats,
  totalQuestions,
  onRetry,
  onSelectDomain,
  onMainMenu
}) => {
  const { correct = 0, total = 0, streak = 0, xpEarned = 0 } = sessionStats || {};
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  
  // Determine performance level
  let performanceLevel = 'needs-work';
  let performanceMessage = 'Keep practicing!';
  let performanceEmoji = '📚';
  
  if (accuracy >= 90) {
    performanceLevel = 'excellent';
    performanceMessage = 'Outstanding! You\'re an AI expert!';
    performanceEmoji = '🏆';
  } else if (accuracy >= 80) {
    performanceLevel = 'great';
    performanceMessage = 'Great job! Almost perfect!';
    performanceEmoji = '🌟';
  } else if (accuracy >= 70) {
    performanceLevel = 'good';
    performanceMessage = 'Good work! Keep it up!';
    performanceEmoji = '👍';
  } else if (accuracy >= 60) {
    performanceLevel = 'okay';
    performanceMessage = 'Not bad! Room for improvement.';
    performanceEmoji = '💪';
  }

  return (
    <div className="results-screen">
      <div className="results-header">
        <span className="results-emoji">{performanceEmoji}</span>
        <h1 className="results-title">Quiz Complete!</h1>
        <p className={`results-message ${performanceLevel}`}>{performanceMessage}</p>
      </div>

      {/* Domain info */}
      <div className="results-domain">
        <span className="domain-icon">{domain?.icon || '📚'}</span>
        <span className="domain-name">{domain?.name || 'Quiz'}</span>
      </div>

      {/* Score display */}
      <div className="score-display">
        <div className="score-circle">
          <svg viewBox="0 0 100 100">
            <circle
              className="score-bg"
              cx="50"
              cy="50"
              r="45"
              fill="none"
              strokeWidth="8"
            />
            <circle
              className="score-fill"
              cx="50"
              cy="50"
              r="45"
              fill="none"
              strokeWidth="8"
              strokeDasharray={`${accuracy * 2.83} 283`}
              transform="rotate(-90 50 50)"
            />
          </svg>
          <div className="score-text">
            <span className="score-value">{accuracy}%</span>
            <span className="score-label">Accuracy</span>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="results-stats">
        <div className="result-stat">
          <TargetIcon size={24} />
          <span className="stat-value">{correct}/{total}</span>
          <span className="stat-label">Correct</span>
        </div>
        <div className="result-stat">
          <FlameIcon size={24} />
          <span className="stat-value">{streak}</span>
          <span className="stat-label">Best Streak</span>
        </div>
        <div className="result-stat">
          <TrophyIcon size={24} />
          <span className="stat-value">+{xpEarned}</span>
          <span className="stat-label">XP Earned</span>
        </div>
      </div>

      {/* Actions */}
      <div className="results-actions">
        <button className="action-btn primary" onClick={onRetry}>
          <RefreshIcon size={18} />
          <span>Try Again</span>
        </button>
        <button className="action-btn secondary" onClick={onSelectDomain}>
          <GridIcon size={18} />
          <span>Other Domains</span>
        </button>
        <button className="action-btn tertiary" onClick={onMainMenu}>
          <HomeIcon size={18} />
          <span>Main Menu</span>
        </button>
      </div>

      {/* Share section — only shown for scores >= 70% */}
      {accuracy >= 70 && (() => {
        const shareText = `I scored ${accuracy}% on the ${domain?.name || 'Quiz'} quiz for AWS ${SHARE_CONFIG.certName}! 🎯\nStudying with AWS Study Hub — free interactive study tools for AWS certifications.\n${SHARE_CONFIG.siteUrl}\n#AWS #CloudComputing #${SHARE_CONFIG.certHashtag}`;
        const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(SHARE_CONFIG.siteUrl)}`;
        const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(SHARE_CONFIG.siteUrl)}&quote=${encodeURIComponent(shareText)}`;

        return (
          <div className="share-section">
            <p className="share-label"><ShareIcon size={16} /> Share Your Achievement</p>
            <div className="share-buttons">
              <a href={linkedInUrl} target="_blank" rel="noopener noreferrer" className="share-btn linkedin">
                <LinkedInIcon size={16} /> LinkedIn
              </a>
              <a href={xUrl} target="_blank" rel="noopener noreferrer" className="share-btn x-twitter">
                <XTwitterIcon size={16} /> X
              </a>
              <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className="share-btn facebook">
                <FacebookIcon size={16} /> Facebook
              </a>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default ResultsScreen;
