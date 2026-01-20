import React from 'react';
import { getAllDomains } from '../data';
import { ArrowRightIcon, RobotIcon, GearIcon, ShieldIcon, CloudIcon, SecurityIcon } from './Icons';
import './DomainSelect.css';

// Map domain IDs to icons
const domainIconMap = {
  'fundamentals': RobotIcon,
  'applications': GearIcon,
  'governance': ShieldIcon,
  // Add more as needed
};

const DomainSelect = ({ globalStats, onSelectDomain, onBack }) => {
  const domains = getAllDomains();

  return (
    <div className="domain-select-screen">
      <button className="back-button" onClick={onBack}>
        ← Back
      </button>
      <h2 className="section-title">Select a Domain</h2>
      <p className="section-subtitle">Choose a topic to study today</p>

      <div className="domain-grid">
        {domains.map(domain => {
          const progress = globalStats.domainProgress[domain.id];
          const completionPercent = progress?.bestScore 
            ? Math.round(progress.bestScore * 100) 
            : 0;
          const IconComponent = domainIconMap[domain.id] || CloudIcon;

          return (
            <button
              key={domain.id}
              className="domain-card"
              onClick={() => onSelectDomain(domain.id)}
              style={{ 
                '--domain-color': domain.color, 
                '--domain-gradient': domain.gradient 
              }}
            >
              <div className="domain-icon"><IconComponent size={28} /></div>
              <div className="domain-name">{domain.name}</div>
              <div className="domain-weight">Exam Weight: {domain.weight}</div>
              <div className="domain-progress-bar">
                <div
                  className="domain-progress-fill"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
              <div className="domain-sessions">
                {progress?.completed || 0} sessions • Best: {completionPercent}%
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DomainSelect;
