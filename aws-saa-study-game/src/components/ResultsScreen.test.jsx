import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ResultsScreen from './ResultsScreen';

const domain = { id: 'fake-domain', name: 'Fake Domain', icon: '🧪' };
const props = (over = {}) => ({
  domain,
  sessionStats: { correct: 4, total: 5, streak: 3, xpEarned: 47 },
  totalQuestions: 5,
  onRetry: vi.fn(),
  onSelectDomain: vi.fn(),
  onMainMenu: vi.fn(),
  ...over,
});

// Reads the value shown above a stat label ("Correct", "XP Earned", ...).
const statValue = (label) => screen.getByText(label, { selector: '.stat-label' }).previousElementSibling;

describe('ResultsScreen', () => {
  it('shows the score, accuracy, streak and XP from the session', () => {
    render(<ResultsScreen {...props()} />);
    expect(screen.getByRole('heading', { name: /Quiz Complete/ })).toBeInTheDocument();
    expect(screen.getByText('80%')).toBeInTheDocument();
    expect(statValue('Correct')).toHaveTextContent('4/5');
    expect(statValue('Best Streak')).toHaveTextContent('3');
    expect(statValue('XP Earned')).toHaveTextContent('+47');
    expect(screen.getByText(domain.name)).toBeInTheDocument();
  });

  it('rounds the accuracy to a whole percent', () => {
    render(<ResultsScreen {...props({ sessionStats: { correct: 2, total: 3, streak: 1, xpEarned: 20 } })} />);
    expect(screen.getByText('67%')).toBeInTheDocument();
  });

  it('shows 0% rather than dividing by zero when nothing was answered', () => {
    render(<ResultsScreen {...props({ sessionStats: undefined })} />);
    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(statValue('Correct')).toHaveTextContent('0/0');
    expect(screen.getByText(/Keep practicing/)).toBeInTheDocument();
  });

  it.each([
    [5, 5, /Outstanding/],
    [4, 5, /Great job/],
    [7, 10, /Good work/],
    [3, 5, /Not bad/],
    [1, 5, /Keep practicing/],
  ])('gives feedback that matches the score (%i/%i)', (correct, total, message) => {
    render(<ResultsScreen {...props({ sessionStats: { correct, total, streak: 0, xpEarned: 0 } })} />);
    expect(screen.getByText(message)).toBeInTheDocument();
  });

  it('wires Try Again, Other Domains and Main Menu to their callbacks', async () => {
    const p = props();
    render(<ResultsScreen {...p} />);
    await userEvent.click(screen.getByRole('button', { name: /Try Again/ }));
    expect(p.onRetry).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByRole('button', { name: /Other Domains/ }));
    expect(p.onSelectDomain).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByRole('button', { name: /Main Menu/ }));
    expect(p.onMainMenu).toHaveBeenCalledTimes(1);
    expect(p.onRetry).toHaveBeenCalledTimes(1);
  });
});
