import React from 'react';
import { domains } from '../data';
import { ArrowLeftIcon, CheckCircleIcon, LockIcon } from './Icons';

const DomainSelect = ({ globalStats, onSelectDomain, onBack }) => {
  const domainProgress = globalStats?.domainProgress || {};

  const getDomainProgress = (domainId) => {
    const stats = domainProgress[domainId];
    if (!stats) return { sessions: 0, accuracy: 0 };
    return {
      sessions: stats.completed || 0,
      accuracy: stats.bestScore ? Math.round(stats.bestScore * 100) : 0
    };
  };

  return (
    <div className="domain-select">
      <div className="domain-header">
        <button className="back-btn" onClick={onBack}>
          <ArrowLeftIcon size={20} />
          <span>Back</span>
        </button>
        <h2>Select a Domain</h2>
        <p className="domain-subtitle">Choose an AWS AI topic to study</p>
      </div>

      <div className="domain-grid">
        {domains.map((domain) => {
          const progress = getDomainProgress(domain.id);
          const isCompleted = progress.accuracy >= 80 && progress.sessions >= 3;
          
          return (
            <button
              key={domain.id}
              className={`domain-card ${isCompleted ? 'completed' : ''}`}
              onClick={() => onSelectDomain(domain.id)}
            >
              <div className="domain-icon">{domain.icon || '📚'}</div>
              <div className="domain-info">
                <h3 className="domain-name">{domain.name}</h3>
                <p className="domain-description">{domain.description}</p>
              </div>
              
              <div className="domain-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${Math.min(progress.accuracy, 100)}%` }}
                  />
                </div>
                <div className="progress-stats">
                  <span>{progress.sessions} quizzes</span>
                  <span>{progress.accuracy}% accuracy</span>
                </div>
              </div>

              {isCompleted && (
                <div className="completed-badge">
                  <CheckCircleIcon size={16} />
                  <span>Mastered</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DomainSelect;
