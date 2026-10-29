// "Unlock the course" card: sign in first, then Stripe Checkout.
import React, { useState } from 'react';
import { startCheckout } from '../services/billing';

const UnlockCard = ({ course, user, onSignIn, returnPath, compact = false }) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const paid = course.tutorials.filter((t) => !t.free);
  const count = course.tutorials.filter((t) => t.number > 0).length;

  const buy = async () => {
    if (!user) { onSignIn('Sign in or create a free account, then come back here to unlock the course.'); return; }
    setBusy(true);
    setError('');
    try {
      await startCheckout(course.id, returnPath);
    } catch (e) {
      setBusy(false);
      setError(/not available/i.test(e.message)
        ? 'Purchases open very soon. The free tutorials are ready now.'
        : 'Checkout could not start. Please try again in a minute.');
    }
  };

  return (
    <div className={`unlock ${compact ? 'compact' : ''}`}>
      <div className="unlock-price">
        <span className="price">{course.price}</span>
        <span className="once">one time, yours to keep</span>
      </div>
      {!compact && (
        <ul className="unlock-list">
          <li>All {count} tutorials, including {paid.map((t) => `“${t.title}”`).join(', ')}</li>
          <li>Every practice task, quiz and flashcard deck</li>
          <li>The real-AWS project at the end of each tutorial, for your GitHub portfolio</li>
          <li>Progress saved to your Study Hub account on every device</li>
        </ul>
      )}
      <button type="button" className="btn big" onClick={buy} disabled={busy}>
        {busy ? 'Opening secure checkout…' : user ? `Unlock ${course.title}` : `Sign in to unlock`}
      </button>
      {error && <p className="unlock-error">{error}</p>}
      <p className="unlock-fine">Secure payment through Stripe. One sign-in works across every AWS Study Hub site.</p>
    </div>
  );
};

export default UnlockCard;
