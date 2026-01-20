import React from 'react';
import './ParticleExplosion.css';

const ParticleExplosion = ({ active, color }) => {
  if (!active) return null;

  return (
    <div className="particle-container">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="particle"
          style={{
            '--angle': `${(i / 20) * 360}deg`,
            '--distance': `${80 + Math.random() * 60}px`,
            '--delay': `${Math.random() * 0.1}s`,
            '--size': `${4 + Math.random() * 6}px`,
            backgroundColor: color
          }}
        />
      ))}
    </div>
  );
};

export default ParticleExplosion;
