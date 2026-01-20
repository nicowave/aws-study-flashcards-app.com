import React from 'react';
import { getAllDomains } from '../data';
import { achievements } from '../data/achievements';
import './StatsScreen.css';

const StatsScreen = ({ globalStats, onBack, onReset }) => {
  const domains = getAllDomains();

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all progress? This cannot be undone.')) {
      onReset();
    }
  };

  return (
    <div className="stats-screen">
      <button className="back-button" onClick={onBack}>
        ← Back
      </button>

      <h2 className="section-title">Your Progress</h2>

      <div className="stats-overview">
        <div className="stat-card">
          <div className="stat-card-value">{globalStats.totalAnswered}</div>
          <div className="stat-card-label">Total Questions</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value">
            {globalStats.totalAnswered > 0
              ? Math.round((globalStats.totalCorrect / globalStats.totalAnswered) * 100)
              : 0}%
          </div>
          <div className="stat-card-label">Accuracy</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value">{globalStats.maxStreak}</div>
          <div className="stat-card-label">Best Streak</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value">{globalStats.perfectDomains}</div>
          <div className="stat-card-label">Perfect Sessions</div>
        </div>
      </div>

      <h3 className="subsection-title">Domain Progress</h3>
      <div className="domain-stats-list">
        {domains.map(domain => {
          const progress = globalStats.domainProgress[domain.id];
          return (
            <div key={domain.id} className="domain-stat-item">
              <div className="domain-stat-header">
                <span className="domain-stat-icon" style={{ color: domain.color }}>
                  {domain.icon}
                </span>
                <span className="domain-stat-name">{domain.name}</span>
              </div>
              <div className="domain-stat-bar">
                <div
                  className="domain-stat-fill"
                  style={{
                    width: `${progress?.bestScore ? progress.bestScore * 100 : 0}%`,
                    background: domain.gradient
                  }}
                />
              </div>
              <div className="domain-stat-info">
                {progress?.completed || 0} sessions • Best:{' '}
                {progress?.bestScore ? Math.round(progress.bestScore * 100) : 0}%
              </div>
            </div>
          );
        })}
      </div>

      <h3 className="subsection-title">Achievements</h3>
      <div className="achievements-grid">
        {achievements.map(achievement => {
          const isUnlocked = globalStats.unlockedAchievements.includes(achievement.id);
          return (
            <div
              key={achievement.id}
              className={`achievement-card ${isUnlocked ? 'unlocked' : 'locked'}`}
            >
              <div className="achievement-card-icon">{achievement.icon}</div>
              <div className="achievement-card-name">{achievement.name}</div>
              <div className="achievement-card-desc">{achievement.description}</div>
            </div>
          );
        })}
      </div>

      <button className="reset-button" onClick={handleReset}>
        🗑️ Reset All Progress
      </button>
    </div>
  );
};

export default StatsScreen;
