import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DomainSelect from './DomainSelect';
import { domains } from '../data';

const cardFor = (domain) => screen.getByRole('heading', { name: domain.name }).closest('button');

describe('DomainSelect', () => {
  it('lists every domain in this app', () => {
    render(<DomainSelect globalStats={{}} onSelectDomain={() => {}} onBack={() => {}} />);
    expect(domains.length).toBeGreaterThan(1);
    domains.forEach((d) => {
      expect(cardFor(d)).toBeInTheDocument();
      // Not every app's domains have a description (AI Practitioner's don't)
      if (d.description) expect(within(cardFor(d)).getByText(d.description)).toBeInTheDocument();
    });
  });

  it('every domain in the data carries its exam weight', () => {
    // The card doesn't show the weight (yet); make sure the data has it for the screens that do.
    domains.forEach((d) => expect(d.weight).toMatch(/^\d+%$/));
  });

  it('calls onSelectDomain with the domain id for a signed-in user', async () => {
    const onSelectDomain = vi.fn();
    render(<DomainSelect globalStats={{}} onSelectDomain={onSelectDomain} onBack={() => {}} />);
    for (const d of domains) {
      await userEvent.click(cardFor(d));
      expect(onSelectDomain).toHaveBeenLastCalledWith(d.id);
    }
    expect(onSelectDomain).toHaveBeenCalledTimes(domains.length);
    expect(screen.queryByText(/Sign in free to unlock/)).not.toBeInTheDocument();
  });

  it('lets guests play only the first domain and sends the rest to sign-up', async () => {
    const onSelectDomain = vi.fn();
    const onGuestUnlock = vi.fn();
    render(<DomainSelect globalStats={{}} onSelectDomain={onSelectDomain} onBack={() => {}} isGuest onGuestUnlock={onGuestUnlock} />);

    expect(within(cardFor(domains[0])).queryByText(/Sign in free to unlock/)).not.toBeInTheDocument();
    domains.slice(1).forEach((d) => expect(within(cardFor(d)).getByText(/Sign in free to unlock/)).toBeInTheDocument());

    await userEvent.click(cardFor(domains[1]));
    expect(onGuestUnlock).toHaveBeenCalledTimes(1);
    expect(onSelectDomain).not.toHaveBeenCalled();

    await userEvent.click(cardFor(domains[0]));
    expect(onSelectDomain).toHaveBeenCalledWith(domains[0].id);
  });

  it('shows each domain\'s quizzes and best score, and "Mastered" at 80%+ over 3+ quizzes', () => {
    const [a, b] = domains;
    const globalStats = { domainProgress: { [a.id]: { completed: 3, bestScore: 0.8 }, [b.id]: { completed: 5, bestScore: 0.6 } } };
    render(<DomainSelect globalStats={globalStats} onSelectDomain={() => {}} onBack={() => {}} />);
    expect(within(cardFor(a)).getByText('3 quizzes')).toBeInTheDocument();
    expect(within(cardFor(a)).getByText('80% accuracy')).toBeInTheDocument();
    expect(within(cardFor(a)).getByText('Mastered')).toBeInTheDocument();
    expect(within(cardFor(b)).getByText('60% accuracy')).toBeInTheDocument();
    expect(within(cardFor(b)).queryByText('Mastered')).not.toBeInTheDocument();
    // A domain never played starts at zero
    domains.slice(2).forEach((d) => expect(within(cardFor(d)).getByText('0 quizzes')).toBeInTheDocument());
  });

  it('goes back from the Back button', async () => {
    const onBack = vi.fn();
    render(<DomainSelect globalStats={{}} onSelectDomain={() => {}} onBack={onBack} />);
    await userEvent.click(screen.getByRole('button', { name: /Back/ }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
