import React from 'react';
import { currentPromotion, salePrice } from '../services/offers';
import './PromoBanner.css';

// A sale about to start, or running: one line at the top of the app.
// Checkout applies the discount itself; this only tells people about it.
const PromoBanner = () => {
  const sale = currentPromotion();
  if (!sale) return null;
  const { promo, live } = sale;
  const offer = `${promo.single}% off your first month or year of this certification, ${promo.pro}% off your first year of Pro`;
  return (
    <div className="promo-banner" role="note">
      <span aria-hidden="true">🎃</span>
      {live ? (
        <span>
          <strong>{promo.label}:</strong> {offer}, until {promo.ends}. Applied at checkout.
        </span>
      ) : (
        <span>
          <strong>{promo.label}</strong> starts {promo.starts}: {offer}, for one week.
        </span>
      )}
    </div>
  );
};

/**
 * While a sale runs, { promo, price, salePrice } for a full price like '$11'; otherwise null
 * (also while the sale is only teased, since checkout gives no discount yet).
 * kind: 'single' for this certification, 'pro' for Pro.
 */
export const saleFor = (price, kind = 'single') => {
  const sale = currentPromotion();
  const percent = sale?.promo[kind];
  if (!sale?.live || !percent || !/\$\d/.test(price || '')) return null;
  return { promo: sale.promo, price, salePrice: salePrice(price, percent) };
};

export default PromoBanner;
