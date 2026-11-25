import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QuizGame from './QuizGame.jsx';
import { topics } from '../data/devTrackQuestions.js';

// Questions are shuffled and so are their options; find the original by its text.
const byQuestion = new Map(topics.flatMap((t) => t.questions.map((q) => [q.question, { ...q, topicId: t.id }])));
const rightText = (q) => q.options[q.correctAnswer];
const wrongText = (q) => q.options.find((_, i) => i !== q.correctAnswer);

// ---- Helpers that read the UI ----
const lead = () => screen.getByRole('heading', { level: 2 }).parentElement.querySelector('.lead').textContent;
const readRules = () => {
  const text = lead();
  return {
    runLength: Number(text.match(/(\d+)-question run/)[1]),
    xp: Number(text.match(/\+(\d+) XP per right answer/)[1]),
    bonus: Number(text.match(/\+(\d+) bonus on every (\w+) in a row/)[1]),
  };
};
const topicButton = (t) => screen.getByRole('button', { name: (n) => n.startsWith(t.title) });
const currentQuestion = () => byQuestion.get(screen.getByRole('heading', { level: 3 }).textContent);
const optionButtons = () => within(screen.getByRole('group', { name: 'Answer options' })).getAllByRole('button');
const optionText = (b) => b.textContent.slice(1).trim(); // drop the A/B/C/D letter
const optionButton = (text) => optionButtons().find((b) => optionText(b) === text);
const progressLine = () => screen.getByText(/ · \d+ \/ \d+ · streak \d+$/).textContent;
const stats = () => {
  const box = screen.getByLabelText('Your progress');
  const value = (label) => within(box).getByText(label).previousElementSibling.textContent;
  const bar = within(box).getByRole('progressbar');
  return {
    level: Number(value('Level')),
    accuracy: value('Accuracy'),
    bestStreak: Number(value('Best streak')),
    xpInLevel: Number(bar.getAttribute('aria-valuenow')),
    xpPerLevel: Number(bar.getAttribute('aria-valuemax')),
    xpText: within(box).getByText(/ XP$/).textContent,
  };
};
const savedKey = () => Object.keys(localStorage).find((k) => /quiz/.test(k));
const saved = () => JSON.parse(localStorage.getItem(savedKey()));

const setup = () => {
  const user = userEvent.setup();
  const view = render(<QuizGame />);
  return { user, ...view };
};
const answer = async (user, choice) => {
  const q = currentQuestion();
  await user.click(optionButton(choice === 'right' ? rightText(q) : wrongText(q)));
  return q;
};
const next = (user) => user.click(screen.getByRole('button', { name: /^(Next question|See results)$/ }));
// plan(n) -> 'right' | 'wrong' for question n (1-based). Returns the rules and the questions seen.
const playTopic = async (user, t, plan) => {
  const rules = readRules();
  await user.click(topicButton(t));
  const seen = [];
  for (let n = 1; n <= rules.runLength; n++) {
    seen.push((await answer(user, plan(n))).question);
    await next(user);
  }
  return { ...rules, seen };
};

describe('QuizGame: topic list', () => {
  it('shows every topic with its question count and no best score yet, plus fresh stats', () => {
    setup();
    for (const t of topics) {
      const b = topicButton(t);
      expect(b).toHaveTextContent(`${t.questions.length} questions`);
      expect(b).toHaveTextContent('best –');
    }
    const s = stats();
    expect(s).toMatchObject({ level: 1, accuracy: '0%', bestStreak: 0, xpInLevel: 0 });
    expect(s.xpText).toBe(`0 / ${s.xpPerLevel} XP`);
  });
});

describe('QuizGame: a run', () => {
  it('starts a run of the stated length with questions from the chosen topic only', async () => {
    const { user } = setup();
    const t = topics[2];
    const { runLength } = readRules();
    await user.click(topicButton(t));
    expect(progressLine()).toBe(`${t.title} · 1 / ${runLength} · streak 0`);
    const q = currentQuestion();
    expect(q).toBeDefined();
    expect(q.topicId).toBe(t.id);
    expect(optionButtons().map(optionText).sort()).toEqual([...q.options].sort());
    expect(optionButtons().map((b) => b.textContent[0])).toEqual(q.options.map((_, i) => String.fromCharCode(65 + i)));
  });

  it('a right answer says Correct, shows the explanation and locks the options', async () => {
    const { user } = setup();
    await user.click(topicButton(topics[0]));
    const q = await answer(user, 'right');
    expect(screen.getByText('Correct.')).toBeInTheDocument();
    expect(screen.getByText(q.explanation)).toBeInTheDocument();
    optionButtons().forEach((b) => expect(b).toBeDisabled());
    expect(optionButton(rightText(q))).toHaveAttribute('aria-pressed', 'true');
    expect(progressLine()).toMatch(/streak 1$/);
  });

  it('a wrong answer names the right letter and shows the explanation', async () => {
    const { user } = setup();
    await user.click(topicButton(topics[0]));
    const q = await answer(user, 'wrong');
    const letter = optionButton(rightText(q)).textContent[0];
    expect(screen.getByText(`Not quite. The answer is ${letter}.`)).toBeInTheDocument();
    expect(screen.getByText(q.explanation)).toBeInTheDocument();
    expect(optionButton(wrongText(q))).toHaveAttribute('aria-pressed', 'true');
    optionButtons().forEach((b) => expect(b).toBeDisabled());
    expect(progressLine()).toMatch(/streak 0$/);
  });

  it('only counts the first pick of a question', async () => {
    const { user } = setup();
    await user.click(topicButton(topics[0]));
    const q = await answer(user, 'wrong');
    await user.click(optionButton(rightText(q))); // disabled; must not change anything
    expect(screen.queryByText('Correct.')).not.toBeInTheDocument();
    expect(saved()).toMatchObject({ answered: 1, correct: 0 });
  });

  it('the Next button only appears after answering, and moves to a new question', async () => {
    const { user } = setup();
    const { runLength } = readRules();
    await user.click(topicButton(topics[0]));
    expect(screen.queryByRole('button', { name: 'Next question' })).not.toBeInTheDocument();
    const first = await answer(user, 'right');
    await next(user);
    expect(progressLine()).toMatch(new RegExp(` · 2 / ${runLength} · `));
    expect(currentQuestion().question).not.toBe(first.question);
    expect(screen.queryByText('Correct.')).not.toBeInTheDocument();
    optionButtons().forEach((b) => expect(b).toBeEnabled());
  });

  it('Quit goes back to the topic list', async () => {
    const { user } = setup();
    await user.click(topicButton(topics[0]));
    await user.click(screen.getByRole('button', { name: 'Quit' }));
    expect(screen.getByRole('heading', { level: 2, name: 'Quiz game' })).toBeInTheDocument();
    expect(topicButton(topics[0])).toBeInTheDocument();
  });
});

describe('QuizGame: score, XP and results', () => {
  it('a perfect run: score, never repeats a question, XP with streak bonus, level up and best %', async () => {
    const { user } = setup();
    const t = topics[0];
    const { runLength, xp, bonus, seen } = await playTopic(user, t, () => 'right');

    expect(new Set(seen).size).toBe(runLength);
    expect(screen.getByRole('heading', { level: 2, name: `${t.title}: ${runLength} / ${runLength}` })).toBeInTheDocument();
    const earned = runLength * xp + Math.floor(runLength / 3) * bonus;
    expect(screen.getByText(new RegExp(`You earned ${earned} XP\\.`))).toBeInTheDocument();
    expect(screen.getByText(/Strong run\./)).toBeInTheDocument();

    const s = stats();
    expect(s.accuracy).toBe('100%');
    expect(s.bestStreak).toBe(runLength);
    expect(s.level).toBe(Math.floor(earned / s.xpPerLevel) + 1);
    expect(s.xpInLevel).toBe(earned % s.xpPerLevel);

    await user.click(screen.getByRole('button', { name: 'All topics' }));
    expect(topicButton(t)).toHaveTextContent('best 100%');
    expect(topicButton(topics[1])).toHaveTextContent('best –');
  });

  it('a mixed run: score, results message, accuracy and best streak', async () => {
    const { user } = setup();
    const t = topics[1];
    const { runLength } = readRules();
    // right, right, wrong, then right for the rest except the last
    const plan = (n) => (n === 3 || n === runLength ? 'wrong' : 'right');
    const { xp, bonus } = await playTopic(user, t, plan);
    const right = runLength - 2;
    const pct = Math.round((right / runLength) * 100);
    expect(screen.getByRole('heading', { level: 2, name: `${t.title}: ${right} / ${runLength}` })).toBeInTheDocument();
    // streaks: 2, then runLength - 4 in a row (bonus on every third)
    const longest = runLength - 4;
    const earned = right * xp + Math.floor(longest / 3) * bonus;
    expect(screen.getByText(new RegExp(`You earned ${earned} XP\\.`))).toBeInTheDocument();
    expect(stats().accuracy).toBe(`${pct}%`);
    expect(stats().bestStreak).toBe(Math.max(2, longest));
    await user.click(screen.getByRole('button', { name: 'All topics' }));
    expect(topicButton(t)).toHaveTextContent(`best ${pct}%`);
  });

  it('a weak run points to the study guide; playing again keeps the better best %', async () => {
    const { user } = setup();
    const t = topics[3];
    const { runLength } = await playTopic(user, t, () => 'right');
    await user.click(screen.getByRole('button', { name: 'Play this topic again' }));
    expect(progressLine()).toBe(`${t.title} · 1 / ${runLength} · streak 0`);
    for (let n = 1; n <= runLength; n++) { await answer(user, 'wrong'); await next(user); }
    expect(screen.getByRole('heading', { level: 2, name: `${t.title}: 0 / ${runLength}` })).toBeInTheDocument();
    expect(screen.getByText(/study guide chapter/)).toBeInTheDocument();
    expect(screen.getByText(/You earned 0 XP\./)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'All topics' }));
    expect(topicButton(t)).toHaveTextContent('best 100%');
    expect(stats().accuracy).toBe('50%');
  });
});

describe('QuizGame: saved progress', () => {
  it('saves after every answer and restores stats and best scores on the next visit', async () => {
    const { user, unmount } = setup();
    const t = topics[4];
    await user.click(topicButton(t));
    await answer(user, 'right');
    expect(saved()).toMatchObject({ answered: 1, correct: 1, bestStreak: 1 });
    expect(saved().xp).toBeGreaterThan(0);
    await user.click(screen.getByRole('button', { name: 'Quit' }));
    unmount();

    setup();
    const s = stats();
    expect(s.accuracy).toBe('100%');
    expect(s.bestStreak).toBe(1);
    expect(s.xpInLevel).toBe(saved().xp % s.xpPerLevel);
  });

  it('restores best % per topic from saved data', () => {
    const t = topics[5];
    localStorage.setItem('dev-track-quiz', JSON.stringify({ xp: 250, bestStreak: 7, answered: 20, correct: 15, best: { [t.id]: 90 } }));
    setup();
    expect(topicButton(t)).toHaveTextContent('best 90%');
    expect(stats()).toMatchObject({ level: 3, accuracy: '75%', bestStreak: 7, xpInLevel: 50 });
  });

  it('starts fresh when the saved progress is corrupt', () => {
    localStorage.setItem('dev-track-quiz', '{"xp": oops');
    setup();
    expect(stats()).toMatchObject({ level: 1, accuracy: '0%', bestStreak: 0, xpInLevel: 0 });
    for (const t of topics) expect(topicButton(t)).toHaveTextContent('best –');
  });

  it('starts fresh for fields whose saved value has the wrong shape', () => {
    localStorage.setItem('dev-track-quiz', JSON.stringify({ xp: 'lots', bestStreak: 4, answered: [], correct: null, best: null }));
    setup();
    expect(stats()).toMatchObject({ level: 1, accuracy: '0%', bestStreak: 4, xpInLevel: 0 });
    for (const t of topics) expect(topicButton(t)).toHaveTextContent('best –');
  });
});
