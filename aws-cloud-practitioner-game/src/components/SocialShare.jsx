import React from 'react';

// Social media icons as thin-line SVGs
const LinkedInIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const TwitterIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4l11.733 16h4.267l-11.733-16z" />
    <path d="M4 20l6.768-6.768m2.46-2.46L20 4" />
  </svg>
);

const FacebookIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const ShareIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);

const SocialShare = ({ score, total, certName, siteUrl }) => {
  const percentage = Math.round((score / total) * 100);
  
  const getMessage = () => {
    if (percentage >= 90) return `I scored ${percentage}% on the ${certName} quiz!`;
    if (percentage >= 70) return `I scored ${percentage}% on the ${certName} quiz!`;
    if (percentage >= 50) return `I'm studying for ${certName} - scored ${percentage}%!`;
    return `Practicing for ${certName} certification!`;
  };

  const shareText = getMessage();
  
  const handleShare = (platform) => {
    let url;
    
    switch (platform) {
      case 'linkedin':
        // LinkedIn uses a simpler share URL format
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(siteUrl)}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(siteUrl)}&hashtags=AWS,CloudComputing,AWSCertification`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(siteUrl)}`;
        break;
      default:
        return;
    }
    
    window.open(url, '_blank', 'width=600,height=400,noopener,noreferrer');
  };

  // Only show if score is decent (50%+)
  if (percentage < 50) return null;

  return (
    <div className="social-share">
      <div className="share-label">
        <ShareIcon size={16} />
        <span>Share your progress</span>
      </div>
      <div className="share-buttons">
        <button 
          className="share-btn linkedin" 
          onClick={() => handleShare('linkedin')}
          title="Share on LinkedIn"
        >
          <LinkedInIcon size={18} />
        </button>
        <button 
          className="share-btn twitter" 
          onClick={() => handleShare('twitter')}
          title="Share on X (Twitter)"
        >
          <TwitterIcon size={18} />
        </button>
        <button 
          className="share-btn facebook" 
          onClick={() => handleShare('facebook')}
          title="Share on Facebook"
        >
          <FacebookIcon size={18} />
        </button>
      </div>
    </div>
  );
};

export default SocialShare;
