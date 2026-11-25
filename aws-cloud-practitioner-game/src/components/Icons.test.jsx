import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import * as Icons from './Icons';

// Every export, so a new icon is covered without editing this file.
const icons = Object.entries(Icons);

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
  });

  it.each(icons)('%s passes size, className and other props through', (_name, Icon) => {
    const { container } = render(<Icon size={16} className="my-icon" aria-label="label" data-testid="icon" />);
    const svg = container.firstChild;
    expect(svg).toHaveAttribute('width', '16');
    expect(svg).toHaveAttribute('height', '16');
    expect(svg).toHaveClass('my-icon');
    expect(svg).toHaveAttribute('aria-label', 'label');
    expect(svg).toHaveAttribute('data-testid', 'icon');
  });
});
