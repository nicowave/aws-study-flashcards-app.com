import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import * as Icons from './Icons';

// Every export (the named icons and the default base Icon), so a new icon is
// covered without editing this file.
const icons = Object.entries(Icons);
// KeyIcon is hand-written instead of using the base Icon, and only takes size and className.
const passesEverything = icons.filter(([name]) => name !== 'KeyIcon');

describe('Icons', () => {
  it('exports icons', () => {
    expect(icons.length).toBeGreaterThan(1);
  });

  it.each(icons)('%s renders an svg at the default size of 24', (_name, Icon) => {
    const { container } = render(<Icon />);
    const svg = container.firstChild;
    expect(svg.tagName.toLowerCase()).toBe('svg');
    expect(svg).toHaveAttribute('width', '24');
    expect(svg).toHaveAttribute('height', '24');
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
  });

  it.each(icons)('%s passes size and className through', (_name, Icon) => {
    const { container } = render(<Icon size={16} className="my-icon" />);
    const svg = container.firstChild;
    expect(svg).toHaveAttribute('width', '16');
    expect(svg).toHaveAttribute('height', '16');
    expect(svg).toHaveClass('my-icon');
  });

  it.each(passesEverything)('%s passes style and other props through', (_name, Icon) => {
    const { container } = render(<Icon style={{ marginRight: 6 }} aria-label="label" data-testid="icon" />);
    const svg = container.firstChild;
    expect(svg).toHaveStyle({ marginRight: '6px' });
    expect(svg).toHaveAttribute('aria-label', 'label');
    expect(svg).toHaveAttribute('data-testid', 'icon');
  });

  // Regression: KeyIcon once ignored every prop but size and className, so App.jsx's
  // <KeyIcon style={{ marginRight: 6 }} /> in the sign-in modal lost its spacing.
  it('KeyIcon passes style and other props through', () => {
    const { container } = render(<Icons.KeyIcon style={{ marginRight: 6 }} aria-label="label" />);
    const svg = container.firstChild;
    expect(svg).toHaveStyle({ marginRight: '6px' });
    expect(svg).toHaveAttribute('aria-label', 'label');
  });
});
