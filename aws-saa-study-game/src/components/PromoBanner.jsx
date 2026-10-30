import React from 'react';
import { currentPromotion, salePrice } from '../services/offers';
import './PromoBanner.css';

// A sale about to start, or running: one line at the top of the app.
// Checkout applies the discount itself; this only tells people about it.
const PromoBanner = () => {
  const sale = currentPromotion();
  if (!sale) return null;
  const { promo, live } = sale;
  return (
    <div className="promo-banner" role="note">
      <span aria-hidden="true">🎃</span>
      {live ? (
        <span>
          <strong>{promo.label}:</strong> {promo.single}% off this certification, {promo.bundle}% off Pro, until {promo.ends}. Applied at checkout.
        </span>
      ) : (
        <span>
          <strong>{promo.label}</strong> starts {promo.starts}: {promo.single}% off this certification, {promo.bundle}% off Pro, for one week.
        </span>
      )}
    </div>
  );
};

/** The running sale's price for a label like "$9.99 one-time", or null. */
export const certSale = (label) => {
  const sale = currentPromotion();
  const price = label.match(/\$[\d.]+/)?.[0];
  if (!sale?.live || !price) return null;
  return { promo: sale.promo, price, salePrice: salePrice(price, sale.promo.single) };
};

export default PromoBanner;
