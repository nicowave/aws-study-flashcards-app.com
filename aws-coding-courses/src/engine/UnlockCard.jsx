// "Unlock the course" card: sign in first, then Stripe Checkout. Shows a
// running sale's price, and the Developer Path bundle as the other option.
import React, { useState } from 'react';
import { startCheckout } from '../services/billing';
import { DEVELOPER_PATH, currentPromotion, salePrice } from '../services/offers';

const Price = ({ price, percent }) => (percent ? (
  <>
    <span className="price">{salePrice(price, percent)}</span>
    <s className="was">{price}</s>
  </>
) : <span className="price">{price}</span>);

const UnlockCard = ({ course, user, onSignIn, returnPath, compact = false }) => {
  const [busy, setBusy] = useState(null); // the plan being checked out
  const [error, setError] = useState('');
  const paid = course.tutorials.filter((t) => !t.free);
  const count = course.tutorials.filter((t) => t.number > 0).length;
  const sale = currentPromotion();
  const live = sale?.live ? sale.promo : null;

  const buy = async (plan) => {
    if (!user) { onSignIn('Sign in or create a free account, then come back here to unlock the course.'); return; }
    setBusy(plan);
    setError('');
    try {
      await startCheckout(plan, returnPath);
    } catch (e) {
      setBusy(null);
      setError(/not available/i.test(e.message)
        ? 'Purchases open very soon. The free tutorials are ready now.'
        : 'Checkout could not start. Please try again in a minute.');
    }
  };

  return (
    <div className={`unlock ${compact ? 'compact' : ''}`}>
      {live && <p className="sale-tag">{live.label}: {live.single}% off until {live.ends}</p>}
      <div className="unlock-price">
        <Price price={course.price} percent={live?.single} />
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
      <button type="button" className="btn big" onClick={() => buy(course.id)} disabled={!!busy}>
        {busy === course.id ? 'Opening secure checkout…' : user ? `Unlock ${course.title}` : 'Sign in to unlock'}
      </button>
      {!compact && (
        <div className="bundle">
          <div className="bundle-head">
            <strong>Or the {DEVELOPER_PATH.title}</strong>
            <span className="bundle-price"><Price price={DEVELOPER_PATH.price} percent={live?.bundle} /></span>
          </div>
          <p>{DEVELOPER_PATH.includes}. {DEVELOPER_PATH.separately} if bought one by one.</p>
          <button type="button" className="btn ghost" onClick={() => buy(DEVELOPER_PATH.plan)} disabled={!!busy}>
            {busy === DEVELOPER_PATH.plan ? 'Opening secure checkout…' : `Get the ${DEVELOPER_PATH.title}`}
          </button>
        </div>
      )}
      {error && <p className="unlock-error">{error}</p>}
      <p className="unlock-fine">Secure payment through Stripe. One sign-in works across every AWS Study Hub site.{live ? ' The discount is applied at checkout automatically.' : ''}</p>
    </div>
  );
};

export default UnlockCard;
