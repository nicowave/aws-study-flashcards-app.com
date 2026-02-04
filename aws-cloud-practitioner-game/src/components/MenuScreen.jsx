import React from 'react';
import { TrophyIcon, TargetIcon, FlameIcon, VolumeIcon, VolumeOffIcon, BookOpenIcon, ChartIcon } from './Icons';

const MenuScreen = ({ 
  globalStats, 
  onStartGame, 
  onViewStats,
  onStudyGuide,
  soundEnabled, 
  onToggleSound 
}) => {
  const { level = 1, xp = 0, totalAnswered = 0, totalCorrect = 0, maxStreak = 0 } = globalStats || {};
  const accuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
  const xpForNextLevel = level * 100;
  const xpProgress = (xp % 100) / 100 * 100;

  return (
    <div className="menu-screen">
      <div className="menu-header">
        <h1 className="game-title">
          <span className="title-icon">🤖</span>
          Cloud Practitioner
        </h1>
        <p className="game-subtitle">AWS Certification Quiz Game</p>
      </div>

      {/* Stats Overview */}
      <div className="stats-overview">
        <div className="level-display">
          <span className="level-label">Level</span>
          <span className="level-value">{level}</span>
          <div className="xp-bar">
            <div className="xp-fill" style={{ width: `${xpProgress}%` }}></div>
          </div>
          <span className="xp-text">{xp % 100} / {xpForNextLevel} XP</span>
        </div>

        <div className="quick-stats">
          <div className="stat-item">
            <TargetIcon size={20} />
            <span className="stat-value">{accuracy}%</span>
            <span className="stat-label">Accuracy</span>
          </div>
          <div className="stat-item">
            <FlameIcon size={20} />
            <span className="stat-value">{maxStreak}</span>
            <span className="stat-label">Best Streak</span>
          </div>
          <div className="stat-item">
            <TrophyIcon size={20} />
            <span className="stat-value">{totalAnswered}</span>
            <span className="stat-label">Questions</span>
          </div>
        </div>
      </div>

      {/* Menu Actions */}
      <div className="menu-actions">
        <button className="menu-btn primary" onClick={onStartGame}>
          <span className="btn-icon">🎮</span>
          Start Quiz
        </button>
        <button className="menu-btn secondary" onClick={onStudyGuide}>
          <span className="btn-icon">📖</span>
          Study Guide
        </button>
        <button className="menu-btn secondary" onClick={onViewStats}>
          <span className="btn-icon">📊</span>
          View Stats
        </button>
      </div>

      {/* Sound Toggle */}
      <button className="sound-toggle" onClick={onToggleSound}>
        {soundEnabled ? <VolumeIcon size={20} /> : <VolumeOffIcon size={20} />}
        <span>{soundEnabled ? 'Sound On' : 'Sound Off'}</span>
      </button>
    </div>
  );
};

export default MenuScreen;
