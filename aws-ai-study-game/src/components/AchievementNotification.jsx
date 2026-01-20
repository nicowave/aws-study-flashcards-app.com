import React from 'react';
import './AchievementNotification.css';

const AchievementNotification = ({ achievement }) => {
  if (!achievement) return null;

  return (
    <div className="achievement-notification">
      <div className="achievement-icon">{achievement.icon}</div>
      <div className="achievement-info">
        <div className="achievement-title">Achievement Unlocked!</div>
        <div className="achievement-name">{achievement.name}</div>
      </div>
    </div>
  );
};

export default AchievementNotification;
