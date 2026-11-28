import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { Amount, ProductPrice, IntervalToggle } from './Pricing';
import { PRODUCT_MONTHLY, PRODUCT_YEARLY, YEARLY_SAVINGS_PERCENT } from '../data/prices';

// Independent of offers.js: whole cents, discount rounded to the cent (as Stripe does).
const discounted = (price, percent) => {
  const c = Math.round(Number(price.replace('$', '')) * 100);
  return `$${((c - Math.round((c * percent) / 100)) / 100).toFixed(2)}`;
};

describe('Amount', () => {
  it('prints the price, or the sale price with the full one struck through', () => {
    const { container, rerender } = render(<Amount price={PRODUCT_MONTHLY} />);
    expect(container).toHaveTextContent(PRODUCT_MONTHLY);
    expect(container.querySelector('s')).toBeNull();
    rerender(<Amount price={PRODUCT_MONTHLY} percent={31} />);
    expect(screen.getByText(discounted(PRODUCT_MONTHLY, 31))).toBeInTheDocument();
    expect(container.querySelector('s')).toHaveTextContent(PRODUCT_MONTHLY);
  });
});

describe('ProductPrice', () => {
  it('names both periods', () => {
    const { container } = render(<p><ProductPrice /></p>);
    expect(container).toHaveTextContent(`${PRODUCT_MONTHLY}/month or ${PRODUCT_YEARLY}/year`);
  });
});

describe('IntervalToggle', () => {
  const Harness = ({ onChange = () => {} }) => {
    const [value, setValue] = useState('month');
    return <IntervalToggle value={value} onChange={(v) => { setValue(v); onChange(v); }} />;
  };

  it('is a named group of two radio buttons, the yearly one showing the computed saving', () => {
    render(<Harness />);
    const group = screen.getByRole('group', { name: 'Billing period' });
    const radios = within(group).getAllByRole('radio');
    expect(radios.map((r) => r.value)).toEqual(['month', 'year']);
    expect(within(group).getByRole('radio', { name: 'Monthly' })).toBeChecked();
    expect(within(group).getByRole('radio', { name: `Yearly save ${YEARLY_SAVINGS_PERCENT}%` })).not.toBeChecked();
  });

  it('reports the period picked by click or keyboard', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    await user.click(screen.getByRole('radio', { name: /yearly/i }));
    expect(onChange).toHaveBeenLastCalledWith('year');
    expect(screen.getByRole('radio', { name: /yearly/i })).toBeChecked();
    await user.keyboard('{ArrowLeft}');
    expect(onChange).toHaveBeenLastCalledWith('month');
    expect(screen.getByRole('radio', { name: 'Monthly' })).toBeChecked();
  });

  it('keeps two toggles on one page apart', async () => {
    const user = userEvent.setup();
    render(<><Harness /><Harness /></>);
    const [first, second] = screen.getAllByRole('group', { name: 'Billing period' });
    await user.click(within(first).getByRole('radio', { name: /yearly/i }));
    expect(within(first).getByRole('radio', { name: /yearly/i })).toBeChecked();
    expect(within(second).getByRole('radio', { name: 'Monthly' })).toBeChecked();
  });
});
