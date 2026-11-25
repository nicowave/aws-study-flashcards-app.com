import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StatsScreen from './StatsScreen';
import { domains } from '../data';
import { achievements } from '../data/achievements';

const stats = {
  level: 2,
  xp: 130,
  totalAnswered: 20,
  totalCorrect: 15,
  maxStreak: 6,
  totalSessions: 4,
  domainProgress: {},
  unlockedAchievements: [],
};

const statValue = (label) => screen.getByText(label, { selector: '.stat-label' }).previousElementSibling;
const domainRow = (domain) => screen.getByText(domain.name).closest('.domain-stat-row');

describe('StatsScreen', () => {
  it('shows overall performance from globalStats', () => {
    render(<StatsScreen globalStats={stats} onBack={() => {}} onReset={() => {}} />);
    expect(screen.getByText('Level 2')).toBeInTheDocument();
    expect(screen.getByText('130 Total XP')).toBeInTheDocument();
    expect(statValue('Accuracy')).toHaveTextContent('75%');
    expect(statValue('Best Streak')).toHaveTextContent('6');
    expect(statValue('Games Played')).toHaveTextContent('4');
    expect(statValue('Correct Answers')).toHaveTextContent('15/20');
  });

  it('handles a learner with no stats yet', () => {
    render(<StatsScreen globalStats={undefined} onBack={() => {}} onReset={() => {}} />);
    expect(screen.getByText('Level 1')).toBeInTheDocument();
    expect(statValue('Accuracy')).toHaveTextContent('0%');
    expect(screen.queryByText(/Achievements \(/)).not.toBeInTheDocument();
  });

  it("lists every domain with its best-score accuracy, and marks mastered ones", () => {
    const [a, b] = domains;
    const domainProgress = { [a.id]: { completed: 3, bestScore: 0.8 }, [b.id]: { completed: 1, bestScore: 0.456 } };
    render(<StatsScreen globalStats={{ ...stats, domainProgress }} onBack={() => {}} onReset={() => {}} />);

    domains.forEach((d) => expect(domainRow(d)).toBeInTheDocument());
    expect(domainRow(a)).toHaveTextContent('80%');
    expect(domainRow(b)).toHaveTextContent('46%');
    domains.slice(2).forEach((d) => expect(domainRow(d)).toHaveTextContent('0%'));
    // "mastered" is the only marker the row has (an icon with no text)
    expect(domainRow(a)).toHaveClass('mastered');
    expect(domainRow(b)).not.toHaveClass('mastered');
  });

  it('counts unlocked achievements', () => {
    const unlocked = achievements.slice(0, 2).map((x) => x.id);
    render(<StatsScreen globalStats={{ ...stats, unlockedAchievements: unlocked }} onBack={() => {}} onReset={() => {}} />);
    expect(screen.getByRole('heading', { name: 'Achievements (2)' })).toBeInTheDocument();
  });

  // Bug: useGameStats stores unlocked achievements as ids ('first_blood'), and the screen
  // prints `achievement.name || achievement`, so learners see the raw id, not the name.
  it.fails('shows unlocked achievements by name, as stored by useGameStats (ids)', () => {
    const first = achievements[0];
    render(<StatsScreen globalStats={{ ...stats, unlockedAchievements: [first.id] }} onBack={() => {}} onReset={() => {}} />);
    expect(screen.getByText(first.name)).toBeInTheDocument();
  });

  it('asks for confirmation before resetting, and cancel keeps the progress', async () => {
    const onReset = vi.fn();
    render(<StatsScreen globalStats={stats} onBack={() => {}} onReset={onReset} />);
    await userEvent.click(screen.getByRole('button', { name: /Reset All Progress/ }));
    expect(screen.getByText(/cannot be undone/)).toBeInTheDocument();
    expect(onReset).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onReset).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /Reset All Progress/ })).toBeInTheDocument();
  });

  it('resets once the learner confirms', async () => {
    const onReset = vi.fn();
    render(<StatsScreen globalStats={stats} onBack={() => {}} onReset={onReset} />);
    await userEvent.click(screen.getByRole('button', { name: /Reset All Progress/ }));
    await userEvent.click(screen.getByRole('button', { name: /Yes, Reset/ }));
    expect(onReset).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(/cannot be undone/)).not.toBeInTheDocument();
  });

  it('goes back from the Back button', async () => {
    const onBack = vi.fn();
    render(<StatsScreen globalStats={stats} onBack={onBack} onReset={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: /Back/ }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  // Bug: same as the menu; each level is 100 XP, but progress is shown out of level * 100.
  it.fails('shows XP progress toward the next level out of 100 XP', () => {
    render(<StatsScreen globalStats={{ ...stats, level: 3, xp: 250 }} onBack={() => {}} onReset={() => {}} />);
    expect(screen.getByText(/to next level/)).toHaveTextContent('50 / 100 XP to next level');
  });
});
