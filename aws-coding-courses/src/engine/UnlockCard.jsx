// "Unlock the course" card: sign in first, then Stripe Checkout. Shows a
// running sale's price, and the Developer Path bundle as the other option.
import React, { useState } from 'react';
import { startCheckout } from '../services/billing';
import { DEVELOPER_PATH, currentPromotion, salePrice } from '../services/offers';
import { useT } from './i18n';

const Price = ({ price, percent }) => (percent ? (
  <>
    <span className="price">{salePrice(price, percent)}</span>
    <s className="was">{price}</s>
  </>
) : <span className="price">{price}</span>);

const UnlockCard = ({ course, user, onSignIn, returnPath, compact = false }) => {
  const t = useT(course);
  const [busy, setBusy] = useState(null); // the plan being checked out
  const [error, setError] = useState('');
  const paid = course.tutorials.filter((t) => !t.free);
  const count = course.tutorials.filter((t) => t.number > 0).length;
  const sale = currentPromotion();
  const live = sale?.live ? sale.promo : null;

  const buy = async (plan) => {
    if (!user) { onSignIn(t('unlock.signInNote')); return; }
    setBusy(plan);
    setError('');
    try {
      await startCheckout(plan, returnPath);
    } catch (e) {
      setBusy(null);
      setError(/not available/i.test(e.message)
        ? t('unlock.soon')
        : t('unlock.failed'));
    }
  };

  return (
    <div className={`unlock ${compact ? 'compact' : ''}`}>
      {live && <p className="sale-tag">{t('unlock.sale', live.label, live.single, live.ends)}</p>}
      <div className="unlock-price">
        <Price price={course.price} percent={live?.single} />
        <span className="once">{t('unlock.once')}</span>
      </div>
      {!compact && (
        <ul className="unlock-list">
          <li>{t('unlock.allTutorials', count, paid.map((tut) => `“${tut.title}”`).join(', '))}</li>
          <li>{t('unlock.everyTask')}</li>
          <li>{t('unlock.project')}</li>
          <li>{t('unlock.progress')}</li>
        </ul>
      )}
      <button type="button" className="btn big" onClick={() => buy(course.id)} disabled={!!busy}>
        {busy === course.id ? t('unlock.opening') : user ? t('unlock.unlock', course.title) : t('unlock.signInToUnlock')}
      </button>
      {!compact && course.bundle !== false && (
        <div className="bundle">
          <div className="bundle-head">
            <strong>{t('unlock.orBundle', DEVELOPER_PATH.title)}</strong>
            <span className="bundle-price"><Price price={DEVELOPER_PATH.price} percent={live?.bundle} /></span>
          </div>
          <p>{t('unlock.bundleSeparately', DEVELOPER_PATH.includes, DEVELOPER_PATH.separately)}</p>
          <button type="button" className="btn ghost" onClick={() => buy(DEVELOPER_PATH.plan)} disabled={!!busy}>
            {busy === DEVELOPER_PATH.plan ? t('unlock.opening') : t('unlock.getBundle', DEVELOPER_PATH.title)}
          </button>
        </div>
      )}
      {error && <p className="unlock-error">{error}</p>}
      <p className="unlock-fine">{t('unlock.fine')}{live ? t('unlock.fineSale') : ''}</p>
    </div>
  );
};

export default UnlockCard;
