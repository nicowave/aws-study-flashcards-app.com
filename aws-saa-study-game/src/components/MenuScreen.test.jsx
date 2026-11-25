import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MenuScreen from './MenuScreen';

const props = (over = {}) => ({
  globalStats: { level: 2, xp: 140, totalAnswered: 8, totalCorrect: 6, maxStreak: 4 },
  isGuest: false,
  onStartGame: vi.fn(),
  onStartExam: vi.fn(),
  onViewStats: vi.fn(),
  onStudyGuide: vi.fn(),
  soundEnabled: true,
  onToggleSound: vi.fn(),
  ...over,
});

const statValue = (label) => screen.getByText(label, { selector: '.stat-label' }).previousElementSibling;

describe('MenuScreen', () => {
  it('names the game and shows level, accuracy, best streak and questions answered', () => {
    render(<MenuScreen {...props()} />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/\w/);
    expect(screen.getByText(/AWS Certification Quiz Game/)).toBeInTheDocument();
    expect(screen.getByText('Level').nextElementSibling).toHaveTextContent('2');
    expect(statValue('Accuracy')).toHaveTextContent('75%');
    expect(statValue('Best Streak')).toHaveTextContent('4');
    expect(statValue('Questions')).toHaveTextContent('8');
  });

  it('starts a new learner at level 1 with 0% accuracy', () => {
    render(<MenuScreen {...props({ globalStats: undefined })} />);
    expect(screen.getByText('Level').nextElementSibling).toHaveTextContent('1');
    expect(statValue('Accuracy')).toHaveTextContent('0%');
  });

  it.each([
    ['Start Quiz', 'onStartGame'],
    ['Exam Simulator', 'onStartExam'],
    ['Study Guide', 'onStudyGuide'],
    ['View Stats', 'onViewStats'],
  ])('"%s" calls %s and nothing else', async (label, callback) => {
    const p = props();
    render(<MenuScreen {...p} />);
    await userEvent.click(screen.getByRole('button', { name: new RegExp(label) }));
    expect(p[callback]).toHaveBeenCalledTimes(1);
    ['onStartGame', 'onStartExam', 'onStudyGuide', 'onViewStats', 'onToggleSound']
      .filter((name) => name !== callback)
      .forEach((name) => expect(p[name]).not.toHaveBeenCalled());
  });

  it('shows a lock on the Exam Simulator for guests, but still lets them click it (App shows the upsell)', async () => {
    const p = props({ isGuest: true });
    render(<MenuScreen {...p} />);
    const exam = screen.getByRole('button', { name: /Exam Simulator/ });
    expect(exam).toHaveTextContent('🔒');
    await userEvent.click(exam);
    expect(p.onStartExam).toHaveBeenCalledTimes(1);
  });

  it('shows no lock on the Exam Simulator for signed-in users', () => {
    render(<MenuScreen {...props()} />);
    expect(screen.getByRole('button', { name: /Exam Simulator/ })).not.toHaveTextContent('🔒');
  });

  it('shows the sound state and toggles it', async () => {
    const p = props();
    const { rerender } = render(<MenuScreen {...p} />);
    await userEvent.click(screen.getByRole('button', { name: /Sound On/ }));
    expect(p.onToggleSound).toHaveBeenCalledTimes(1);
    rerender(<MenuScreen {...p} soundEnabled={false} />);
    expect(screen.getByRole('button', { name: /Sound Off/ })).toBeInTheDocument();
  });

  // Bug: levels are 100 XP apart (XP_PER_LEVEL), but the text divides by level * 100,
  // so a level-3 learner halfway to level 4 reads "50 / 300 XP" instead of "50 / 100 XP".
  it.fails('shows XP progress toward the next level out of the 100 XP each level needs', () => {
    render(<MenuScreen {...props({ globalStats: { level: 3, xp: 250 } })} />);
    expect(screen.getByText(/XP$/, { selector: '.xp-text' })).toHaveTextContent('50 / 100 XP');
  });
});
