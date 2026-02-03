import React, { useState } from 'react';
import { domains } from '../data';
import { 
  ArrowLeftIcon, 
  TrophyIcon, 
  TargetIcon, 
  FlameIcon, 
  TrashIcon,
  StarIcon,
  CheckCircleIcon
} from './Icons';

const StatsScreen = ({ globalStats, onBack, onReset }) => {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  
  const {
    level = 1,
    xp = 0,
    totalAnswered = 0,
    totalCorrect = 0,
    maxStreak = 0,
    gamesPlayed = 0,
    domainStats = {},
    achievements = []
  } = globalStats || {};

  const accuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
  const xpForNextLevel = level * 100;
  const xpProgress = (xp % 100);

  const handleResetClick = () => {
    setShowResetConfirm(true);
  };

  const handleConfirmReset = () => {
    onReset();
    setShowResetConfirm(false);
  };

  return (
    <div className="stats-screen">
      <div className="stats-header">
        <button className="back-btn" onClick={onBack}>
          <ArrowLeftIcon size={20} />
          <span>Back</span>
        </button>
        <h2>Your Statistics</h2>
      </div>

      {/* Level & XP */}
      <div className="level-card">
        <div className="level-info">
          <span className="level-badge">Level {level}</span>
          <div className="xp-bar-large">
            <div 
              className="xp-fill" 
              style={{ width: `${(xpProgress / xpForNextLevel) * 100}%` }}
            />
          </div>
          <span className="xp-text">{xpProgress} / {xpForNextLevel} XP to next level</span>
        </div>
        <div className="total-xp">
          <StarIcon size={24} />
          <span>{xp} Total XP</span>
        </div>
      </div>

      {/* Overall Stats */}
      <div className="overall-stats">
        <h3>Overall Performance</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <TargetIcon size={28} />
            <span className="stat-value">{accuracy}%</span>
            <span className="stat-label">Accuracy</span>
          </div>
          <div className="stat-card">
            <FlameIcon size={28} />
            <span className="stat-value">{maxStreak}</span>
            <span className="stat-label">Best Streak</span>
          </div>
          <div className="stat-card">
            <TrophyIcon size={28} />
            <span className="stat-value">{gamesPlayed}</span>
            <span className="stat-label">Games Played</span>
          </div>
          <div className="stat-card">
            <CheckCircleIcon size={28} />
            <span className="stat-value">{totalCorrect}/{totalAnswered}</span>
            <span className="stat-label">Correct Answers</span>
          </div>
        </div>
      </div>

      {/* Domain Progress */}
      <div className="domain-stats">
        <h3>Domain Progress</h3>
        <div className="domain-list">
          {domains.map((domain) => {
            const stats = domainStats[domain.id] || {};
            const domainAccuracy = stats.totalAnswered > 0
              ? Math.round((stats.totalCorrect / stats.totalAnswered) * 100)
              : 0;
            const isMastered = domainAccuracy >= 80 && (stats.totalAnswered || 0) >= 5;

            return (
              <div key={domain.id} className={`domain-stat-row ${isMastered ? 'mastered' : ''}`}>
                <div className="domain-info">
                  <span className="domain-icon">{domain.icon || '📚'}</span>
                  <span className="domain-name">{domain.name}</span>
                </div>
                <div className="domain-progress">
                  <div className="mini-progress-bar">
                    <div 
                      className="mini-progress-fill"
                      style={{ width: `${domainAccuracy}%` }}
                    />
                  </div>
                  <span className="domain-accuracy">{domainAccuracy}%</span>
                </div>
                {isMastered && (
                  <CheckCircleIcon size={16} className="mastered-icon" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Achievements */}
      {achievements.length > 0 && (
        <div className="achievements-section">
          <h3>Achievements ({achievements.length})</h3>
          <div className="achievements-grid">
            {achievements.map((achievement, index) => (
              <div key={index} className="achievement-card">
                <span className="achievement-icon">🏆</span>
                <span className="achievement-name">{achievement.name || achievement}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reset Button */}
      <div className="reset-section">
        {!showResetConfirm ? (
          <button className="reset-btn" onClick={handleResetClick}>
            <TrashIcon size={16} />
            <span>Reset All Progress</span>
          </button>
        ) : (
          <div className="reset-confirm">
            <p>Are you sure? This cannot be undone.</p>
            <div className="confirm-buttons">
              <button className="confirm-yes" onClick={handleConfirmReset}>
                Yes, Reset
              </button>
              <button className="confirm-no" onClick={() => setShowResetConfirm(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsScreen;
