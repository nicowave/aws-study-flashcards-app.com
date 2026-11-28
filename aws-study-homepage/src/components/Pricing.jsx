// Small price pieces shared by the cert cards, course cards and plans. Every amount comes from
// src/data/prices.js; a sale (percent off the first payment) shows the full price struck through.
import React, { useId } from 'react';
import { PRODUCT_PRICES, YEARLY_SAVINGS_PERCENT } from '../data/prices';
import { salePrice } from '../services/offers';

/** One amount, at the sale price with the full one struck through while a sale runs. */
export const Amount = ({ price, percent }) => (percent ? (
  <><strong className="mono">{salePrice(price, percent)}</strong> <s className="mono price-was">{price}</s></>
) : <strong className="mono">{price}</strong>);

/** "$11/month or $69/year" for one certification or course. */
export const ProductPrice = ({ percent }) => (
  <>
    <Amount price={PRODUCT_PRICES.month} percent={percent} />/month or{' '}
    <Amount price={PRODUCT_PRICES.year} percent={percent} />/year
  </>
);

/**
 * Monthly or yearly: two native radio buttons, so the keyboard and screen readers work as they
 * expect (arrow keys move between them, the group has a name).
 */
export const IntervalToggle = ({ value, onChange, label = 'Billing period' }) => {
  const name = useId();
  return (
    <fieldset className="interval-toggle">
      <legend className="sr-only">{label}</legend>
      {[
        ['month', 'Monthly', null],
        ['year', 'Yearly', `save ${YEARLY_SAVINGS_PERCENT}%`],
      ].map(([interval, text, note]) => (
        <label key={interval} className={`interval-option${value === interval ? ' selected' : ''}`}>
          <input
            type="radio"
            name={name}
            value={interval}
            checked={value === interval}
            onChange={() => onChange(interval)}
          />
          <span>{text}</span>
          {note && <span className="interval-save">{note}</span>}
        </label>
      ))}
    </fieldset>
  );
};
