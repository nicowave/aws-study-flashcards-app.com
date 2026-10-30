import React from 'react';
import { LockIcon } from './Icons';
import { BILLING_ENABLED, CERT_PRICE_LABEL } from '../services/billing';
import { certSale } from './PromoBanner';
import './GuestPrompts.css';

// "$9.99 one-time", or the sale price while a sale runs
const unlockPriceText = () => {
  const sale = certSale(CERT_PRICE_LABEL);
  return sale ? `${sale.salePrice} during the ${sale.promo.label}, normally ${sale.price}` : CERT_PRICE_LABEL;
};

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
    <h2>{BILLING_ENABLED ? `Unlock ${feature}` : `${feature} is free with an account`}</h2>
    <ul className="guest-upsell-bullets">
      {bullets.map((b, i) => (
        <li key={i}>{b}</li>
      ))}
    </ul>
    <p className="guest-upsell-note">
      {BILLING_ENABLED ? (
        <>
          Start with a free account — no card needed, and your guest progress carries
          over automatically. It includes every flashcard deck and your first full quiz.
          The exam simulator and every quiz domain come with this certification&apos;s
          one-time unlock ({unlockPriceText()}).
        </>
      ) : (
        <>
          Creating an account is free — no card, no catch. Your guest progress
          carries over automatically.
        </>
      )}
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
