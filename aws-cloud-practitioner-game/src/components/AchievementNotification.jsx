import React from 'react';

const AchievementNotification = ({ achievement }) => {
  if (!achievement) return null;

  return (
    <div className="achievement-notification">
      <div className="achievement-content">
        <span className="achievement-icon">🏆</span>
        <div className="achievement-text">
          <span className="achievement-label">Achievement Unlocked!</span>
          <span className="achievement-name">{achievement.name}</span>
          {achievement.xpReward && (
            <span className="achievement-xp">+{achievement.xpReward} XP</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default AchievementNotification;
