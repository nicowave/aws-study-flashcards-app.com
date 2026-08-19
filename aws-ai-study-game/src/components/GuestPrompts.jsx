import React from 'react';
import { LockIcon } from './Icons';
import './GuestPrompts.css';

// Slim banner shown at the top of every screen while in guest mode.
export const GuestBanner = ({ onSignUp }) => (
  <div className="guest-banner">
    <span className="guest-banner-text">
      👋 You&apos;re previewing as a guest — the first domain and flashcard deck are free.
    </span>
    <button className="guest-banner-cta" onClick={onSignUp}>
      Create Free Account
    </button>
  </div>
);

// Full-screen upsell shown when a guest opens a locked feature (e.g. Exam Simulator).
export const GuestUpsell = ({ feature, bullets, onSignUp, onBack }) => (
  <div className="guest-upsell">
    <div className="guest-upsell-lock">
      <LockIcon size={40} />
    </div>
    <h2>{feature} is free with an account</h2>
    <ul className="guest-upsell-bullets">
      {bullets.map((b, i) => (
        <li key={i}>{b}</li>
      ))}
    </ul>
    <p className="guest-upsell-note">
      Creating an account is free — no card, no catch. Your guest progress
      carries over automatically.
    </p>
    <div className="guest-upsell-actions">
      <button className="guest-upsell-primary" onClick={onSignUp}>
        Create Free Account
      </button>
      <button className="guest-upsell-secondary" onClick={onBack}>
        Back to Menu
      </button>
    </div>
  </div>
);
