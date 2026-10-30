import React, { useState } from 'react';
import { ShareIcon } from './Icons';

// "Share my score" after a quiz or practice exam. The link sends friends to
// the hub's free readiness check for this certification, tagged so the hub
// knows the visit came from a share.
const CERT = { id: 'developer-associate', name: 'Developer – Associate', hashtag: 'AWSDeveloper' };

const shareUrl = (campaign) =>
  `https://aws-study-flashcards-app.com/?check=${CERT.id}&utm_source=share&utm_medium=social&utm_campaign=${campaign}#readiness`;

const track = (method, campaign) => {
  try {
    if (typeof window.gtag === 'function') window.gtag('event', 'share', { method, content_type: campaign, item_id: CERT.id });
  } catch { /* analytics blocked */ }
};

const LinkedInIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const XTwitterIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const FacebookIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

/** brag: e.g. "I scored 85% on the Security quiz" (the cert name is added). */
const ShareScore = ({ brag, campaign, label = 'Challenge a friend' }) => {
  const [copied, setCopied] = useState(false);
  const url = shareUrl(campaign);
  const text = `${brag} for AWS ${CERT.name}. Can you beat it? Free 10-question check:`;
  const links = {
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    x: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}&hashtags=AWS,${CERT.hashtag}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  };

  const copy = async () => {
    track('copy', campaign);
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard blocked */ }
  };

  return (
    <div className="share-section">
      <p className="share-label"><ShareIcon size={16} /> {label}</p>
      <div className="share-buttons">
        <a href={links.linkedin} target="_blank" rel="noopener noreferrer" className="share-btn linkedin" onClick={() => track('linkedin', campaign)}>
          <LinkedInIcon size={16} /> LinkedIn
        </a>
        <a href={links.x} target="_blank" rel="noopener noreferrer" className="share-btn x-twitter" onClick={() => track('x', campaign)}>
          <XTwitterIcon size={16} /> X
        </a>
        <a href={links.facebook} target="_blank" rel="noopener noreferrer" className="share-btn facebook" onClick={() => track('facebook', campaign)}>
          <FacebookIcon size={16} /> Facebook
        </a>
        <button type="button" className="share-btn copy" onClick={copy}>
          {copied ? 'Copied' : 'Copy link'}
        </button>
      </div>
    </div>
  );
};

export default ShareScore;
