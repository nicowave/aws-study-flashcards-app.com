import React from 'react';
import { TrophyIcon, StarIcon, CheckIcon, BookIcon, RefreshIcon, HomeIcon, ClockIcon, FireIcon } from './Icons';
import SocialShare from './SocialShare';
import './ResultsScreen.css';
import './Navigation.css';

const ResultsScreen = ({
  domain,
  sessionStats,
  totalQuestions,
  onRetry,
  onSelectDomain,
  onMainMenu
}) => {
  const percentage = Math.round((sessionStats.correct / totalQuestions) * 100);

  const getResultIcon = () => {
    if (percentage === 100) return <TrophyIcon size={48} />;
    if (percentage >= 80) return <StarIcon size={48} />;
    if (percentage >= 60) return <CheckIcon size={48} />;
    return <BookIcon size={48} />;
  };

  const getResultMessage = () => {
    if (percentage === 100) return 'Perfect Score!';
    if (percentage >= 80) return 'Great Job!';
    if (percentage >= 60) return 'Good Effort!';
    return 'Keep Practicing!';
  };

  return (
    <div className="results-screen" style={{ '--domain-color': domain?.color }}>
      <div className="results-card">
        <div className="results-icon">{getResultIcon()}</div>
        <h2 className="results-title">{getResultMessage()}</h2>

        <div className="results-score">
          <span className="score-num">{sessionStats.correct}</span>
          <span className="score-divider">/</span>
          <span className="score-total">{totalQuestions}</span>
        </div>

        <div className="results-percentage">{percentage}% Correct</div>

        <div className="results-stats">
          <div className="result-stat">
            <span className="stat-icon"><ClockIcon size={18} /></span>
            <span className="stat-info">
              {Math.round((Date.now() - sessionStats.startTime) / 1000)}s
            </span>
          </div>
          <div className="result-stat">
            <span className="stat-icon"><FireIcon size={18} /></span>
            <span className="stat-info">Best Streak: {sessionStats.streak}</span>
          </div>
        </div>

        <div className="results-share">
          <SocialShare 
            score={sessionStats.correct}
            total={totalQuestions}
            certName="AWS Cloud Practitioner"
            siteUrl="https://cloud.aws-study-flashcards-app.com"
          />
        </div>

        <div className="results-actions">
          <button
            className="result-button primary"
            onClick={onRetry}
            style={{ background: domain?.gradient }}
          >
            <RefreshIcon size={18} /> Try Again
          </button>
          <button className="result-button secondary" onClick={onSelectDomain}>
            <BookIcon size={18} /> Other Domains
          </button>
          <button className="result-button tertiary" onClick={onMainMenu}>
            <HomeIcon size={18} /> Main Menu
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultsScreen;
