import React from 'react';
import { domains } from '../data';
import { ArrowLeftIcon, CheckCircleIcon, LockIcon } from './Icons';

const DomainSelect = ({ globalStats, onSelectDomain, onBack }) => {
  const domainStats = globalStats?.domainStats || {};

  const getDomainProgress = (domainId) => {
    const stats = domainStats[domainId];
    if (!stats) return { completed: 0, total: 0, accuracy: 0 };
    return {
      completed: stats.totalAnswered || 0,
      total: stats.totalQuestions || 10,
      accuracy: stats.totalAnswered > 0 
        ? Math.round((stats.totalCorrect / stats.totalAnswered) * 100) 
        : 0
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
          const isCompleted = progress.accuracy >= 80 && progress.completed >= 5;
          
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
                  <span>{progress.completed} answered</span>
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
