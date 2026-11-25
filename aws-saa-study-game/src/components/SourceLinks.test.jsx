import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SourceLinks from './SourceLinks';

const doc = { title: 'Lambda quotas', url: 'https://docs.aws.amazon.com/lambda/latest/dg/gettingstarted-limits.html', checked: '2026-11-25' };

describe('SourceLinks', () => {
  it('renders nothing when an item has no sources', () => {
    const { container } = render(<SourceLinks sources={[]} />);
    expect(container).toBeEmptyDOMElement();
    render(<SourceLinks />);
  });

  it('links each source to the AWS page, opening in a new tab', () => {
    render(<SourceLinks sources={[doc]} />);
    const link = screen.getByRole('link', { name: /Lambda quotas/ });
    expect(link).toHaveAttribute('href', doc.url);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
    expect(screen.getByText(/AWS source$/i)).toBeInTheDocument();
  });

  it('says "sources" when there is more than one', () => {
    render(<SourceLinks sources={[doc, { ...doc, title: 'Other page', url: 'https://aws.amazon.com/lambda/' }]} />);
    expect(screen.getAllByRole('link')).toHaveLength(2);
    expect(screen.getByText(/AWS sources/i)).toBeInTheDocument();
  });

  it("doesn't let a click reach the parent (a flashcard would flip)", async () => {
    const onParentClick = vi.fn();
    render(<div onClick={onParentClick}><SourceLinks sources={[doc]} /></div>);
    await userEvent.click(screen.getByText(/AWS source$/i));
    expect(onParentClick).not.toHaveBeenCalled();
  });
});
