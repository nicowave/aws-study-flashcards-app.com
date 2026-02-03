import React from 'react';
import { TrophyIcon, TargetIcon, FlameIcon, RefreshIcon, HomeIcon, GridIcon } from './Icons';

const ResultsScreen = ({
  domain,
  sessionStats,
  totalQuestions,
  onRetry,
  onSelectDomain,
  onMainMenu
}) => {
  const { correct = 0, answered = 0, maxStreak = 0, xpEarned = 0 } = sessionStats || {};
  const accuracy = answered > 0 ? Math.round((correct / answered) * 100) : 0;
  
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
          <span className="stat-value">{correct}/{answered}</span>
          <span className="stat-label">Correct</span>
        </div>
        <div className="result-stat">
          <FlameIcon size={24} />
          <span className="stat-value">{maxStreak}</span>
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
    </div>
  );
};

export default ResultsScreen;
