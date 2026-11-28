// "Unlock the course" card: sign in first, then Stripe Checkout. The course is a subscription,
// monthly or yearly (the buyer picks here); Pro (yearly) is the other option. Shows a running
// sale's price. Every amount comes from services/prices.js.
import React, { useId, useState } from 'react';
import { startCheckout } from '../services/billing';
import { currentPromotion, salePrice } from '../services/offers';
import { PRODUCT_PRICES, PRO_PLAN, PRO_TRIAL_DAYS, PRO_YEARLY, YEARLY_SAVINGS_PERCENT } from '../services/prices';
import { onThisName } from '../config/auth.config';
import { useT } from './i18n';

// Written with the old name; onThisName keeps a visitor on the name they opened.
const TERMS_URL = 'https://aws-study-flashcards-app.com/terms.html';
const PRIVACY_URL = 'https://aws-study-flashcards-app.com/privacy.html';

/** An amount with its period; while a sale runs, the sale price, the full one struck, "first month". */
const Price = ({ price, percent, interval, t }) => (
  <>
    {percent ? (
      <>
        <span className="price">{salePrice(price, percent)}</span>
        <s className="was">{price}</s>
      </>
    ) : <span className="price">{price}</span>}
    <span className="per">
      {percent
        ? t(interval === 'month' ? 'unlock.firstMonth' : 'unlock.firstYear')
        : t(interval === 'month' ? 'unlock.perMonth' : 'unlock.perYear')}
    </span>
  </>
);

const UnlockCard = ({ course, user, onSignIn, returnPath, compact = false }) => {
  const t = useT(course);
  const name = useId();
  const [interval, setBillingInterval] = useState('year');
  const [busy, setBusy] = useState(null); // the plan being checked out
  const [error, setError] = useState('');
  const paid = course.tutorials.filter((t) => !t.free);
  const count = course.tutorials.filter((t) => t.number > 0).length;
  const sale = currentPromotion();
  const live = sale?.live ? sale.promo : null;

  const buy = async (plan, billing) => {
    if (!user) { onSignIn(t('unlock.signInNote')); return; }
    setBusy(plan);
    setError('');
    try {
      await startCheckout(plan, billing, returnPath);
    } catch (e) {
      setBusy(null);
      setError(/not available/i.test(e.message)
        ? t('unlock.soon')
        : /other sign-in/i.test(e.message) ? t('unlock.otherSignIn') : t('unlock.failed'));
    }
  };

  return (
    <div className={`unlock ${compact ? 'compact' : ''}`}>
      {live && <p className="sale-tag">{t('unlock.sale', live.label, live.single, live.ends)}</p>}
      <fieldset className="interval-toggle">
        <legend className="sr-only">{t('unlock.billing')}</legend>
        {[
          ['month', t('unlock.monthly'), null],
          ['year', t('unlock.yearly'), t('unlock.save', YEARLY_SAVINGS_PERCENT)],
        ].map(([value, label, save]) => (
          <label key={value} className={`interval-option${interval === value ? ' selected' : ''}`}>
            <input
              type="radio"
              name={name}
              value={value}
              checked={interval === value}
              onChange={() => setBillingInterval(value)}
              disabled={!!busy}
            />
            <span>{label}</span>
            {save && <span className="interval-save">{save}</span>}
          </label>
        ))}
      </fieldset>
      <div className="unlock-price">
        <Price price={PRODUCT_PRICES[interval]} percent={live?.single} interval={interval} t={t} />
      </div>
      {!compact && (
        <ul className="unlock-list">
          <li>{t('unlock.allTutorials', count, paid.map((tut) => `“${tut.title}”`).join(', '))}</li>
          <li>{t('unlock.everyTask')}</li>
          <li>{t('unlock.project')}</li>
          <li>{t('unlock.progress')}</li>
          <li>{t('unlock.renews')}</li>
        </ul>
      )}
      <button type="button" className="btn big" onClick={() => buy(course.id, interval)} disabled={!!busy}>
        {busy === course.id ? t('unlock.opening') : user ? t('unlock.unlock', course.title) : t('unlock.signInToUnlock')}
      </button>
      {!compact && (
        <div className="unlock-pro">
          <p className="unlock-pro-title"><strong>{t('unlock.orPro')}</strong></p>
          <div className="unlock-pro-price">
            <Price price={PRO_YEARLY} percent={live?.pro} interval="year" t={t} />
          </div>
          <p className="unlock-pro-note">{t('unlock.proTrial', PRO_TRIAL_DAYS)}</p>
          <button type="button" className="btn ghost" onClick={() => buy(PRO_PLAN, 'year')} disabled={!!busy}>
            {busy === PRO_PLAN ? t('unlock.opening') : t('unlock.getPro')}
          </button>
        </div>
      )}
      {error && <p className="unlock-error" role="alert">{error}</p>}
      <p className="unlock-fine">
        {t('unlock.fine')}{live ? t('unlock.fineSale') : ''}{' '}
        <a href={onThisName(TERMS_URL)} target="_blank" rel="noopener noreferrer">{t('unlock.terms')}</a>
        {' · '}
        <a href={onThisName(PRIVACY_URL)} target="_blank" rel="noopener noreferrer">{t('unlock.privacy')}</a>
      </p>
    </div>
  );
};

export default UnlockCard;
