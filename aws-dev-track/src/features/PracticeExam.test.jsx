import { describe, it, expect, vi } from 'vitest';
import { render, screen, within, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PracticeExam from './PracticeExam.jsx';
import { topics } from '../data/devTrackQuestions.js';

// Questions and their options are shuffled; find the original question by its text.
const byQuestion = new Map(topics.flatMap((t) => t.questions.map((q) => [q.question, { ...q, topicId: t.id, topicTitle: t.title }])));
const rightText = (q) => q.options[q.correctAnswer];
const wrongText = (q) => q.options.find((_, i) => i !== q.correctAnswer);

// ---- Helpers that read the UI ----
const readIntro = () => {
  const text = screen.getByText(/questions drawn from/).textContent;
  return {
    total: Number(text.match(/^(\d+) questions/)[1]),
    minutes: Number(text.match(/(\d+)-minute countdown/)[1]),
    passPct: Number(text.match(/(\d+)% to pass/)[1]),
  };
};
const examSize = () => Number(screen.getByText(/^Question \d+ of \d+$/).textContent.match(/of (\d+)/)[1]);
const currentNumber = () => Number(screen.getByText(/^Question \d+ of \d+$/).textContent.match(/Question (\d+)/)[1]);
const currentQuestion = () => byQuestion.get(screen.getByRole('heading', { level: 3 }).textContent);
const options = () => within(screen.getByRole('radiogroup', { name: 'Answer options' })).getAllByRole('radio');
const optionText = (el) => el.textContent.slice(1).trim(); // drop the A/B/C/D letter
const option = (text) => options().find((el) => optionText(el) === text);
const grid = () => screen.getByRole('navigation', { name: 'Jump to question' });
const gridButton = (n) => within(grid()).getByRole('button', { name: new RegExp(`^Question ${n}(,|$)`) });
const timer = () => screen.getByRole('timer', { name: 'Time left' });
const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const historyKey = () => Object.keys(localStorage).find((k) => /exam-history$/.test(k));
const savedHistory = () => JSON.parse(localStorage.getItem(historyKey()));
const breakdownRows = () => screen.getByRole('heading', { name: 'By topic' }).nextElementSibling.querySelectorAll('li');

const setup = (opts) => {
  const user = userEvent.setup(opts);
  const view = render(<PracticeExam />);
  return { user, ...view };
};
const start = async (user) => {
  const intro = readIntro();
  await user.click(screen.getByRole('button', { name: 'Start exam' }));
  return intro;
};
const goTo = (user, n) => user.click(gridButton(n));
// plan(q, n) -> 'right' | 'wrong' | null (skip). Returns the questions in exam order.
const answerAll = async (user, plan) => {
  const n = examSize();
  const order = [];
  for (let k = 1; k <= n; k++) {
    await goTo(user, k);
    const q = currentQuestion();
    order.push(q);
    const choice = plan(q, k);
    if (choice === 'right') await user.click(option(rightText(q)));
    if (choice === 'wrong') await user.click(option(wrongText(q)));
  }
  return order;
};
const submit = async (user) => {
  await user.click(screen.getByRole('button', { name: 'Submit exam' }));
  await user.click(screen.getByRole('button', { name: 'Yes, submit' }));
};

describe('PracticeExam: intro', () => {
  it('states the exam rules and starts on question 1 with the full time', async () => {
    const { user } = setup();
    expect(screen.getByRole('heading', { level: 2, name: 'Practice exam' })).toBeInTheDocument();
    const { total, minutes, passPct } = await start(user);
    expect(total).toBeGreaterThan(0);
    expect(passPct).toBeGreaterThan(0);
    expect(passPct).toBeLessThanOrEqual(100);
    expect(screen.getByText(`Question 1 of ${total}`)).toBeInTheDocument();
    expect(timer()).toHaveTextContent(`${minutes}:00`);
    expect(screen.getByText('0 answered')).toBeInTheDocument();
    expect(currentQuestion()).toBeDefined();
  });

  it('the intro names the right number of topics', () => {
    setup();
    const words = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
    expect(screen.getByText(/questions drawn from/)).toHaveTextContent(`from all ${words[topics.length]} topics`);
  });

  it('draws distinct questions from every topic in proportion to its weight', async () => {
    const { user } = setup();
    const { total } = await start(user);
    const drawn = [];
    for (let k = 1; k <= total; k++) { await goTo(user, k); drawn.push(currentQuestion()); }
    expect(drawn.every(Boolean)).toBe(true);
    expect(new Set(drawn.map((q) => q.id)).size).toBe(total);
    const weightSum = topics.reduce((a, t) => a + t.weight, 0);
    for (const t of topics) {
      const n = drawn.filter((q) => q.topicId === t.id).length;
      expect(n, t.id).toBeGreaterThanOrEqual(1);
      expect(Math.abs(n - (t.weight / weightSum) * total), t.id).toBeLessThanOrEqual(1);
    }
  });

  it('shows the last three scores, newest first', () => {
    localStorage.setItem('dev-track-exam-history', JSON.stringify({ attempts: [10, 20, 30, 40].map((pct, i) => ({ pct, at: i })) }));
    setup();
    expect(screen.getByText('Recent: 40% · 30% · 20%')).toBeInTheDocument();
  });

  it('shows no recent scores before the first attempt, or when the history is corrupt', () => {
    localStorage.setItem('dev-track-exam-history', 'not json');
    setup();
    expect(screen.queryByText(/Recent:/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start exam' })).toBeInTheDocument();
  });

  // BUG (robustness): store.load only guards against unreadable JSON. Saved history that parses
  // but has the wrong shape (here attempts is not a list) crashes the intro with
  // "slice(...).reverse is not a function" instead of starting fresh.
  it.fails('survives saved history whose attempts is not a list', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {}); // keep React's crash report out of the log
    localStorage.setItem('dev-track-exam-history', JSON.stringify({ attempts: 'oops' }));
    setup();
    expect(screen.getByRole('button', { name: 'Start exam' })).toBeInTheDocument();
  });
});

describe('PracticeExam: answering, grid and flags', () => {
  it('picking an option marks it chosen, counts it and marks the grid; answers can be changed', async () => {
    const { user } = setup();
    await start(user);
    const q = currentQuestion();
    await user.click(option(wrongText(q)));
    expect(option(wrongText(q))).toHaveAttribute('aria-checked', 'true');
    expect(options().filter((o) => o.getAttribute('aria-checked') === 'true')).toHaveLength(1);
    expect(screen.getByText('1 answered')).toBeInTheDocument();
    expect(gridButton(1)).toHaveAccessibleName('Question 1, answered');
    await user.click(option(rightText(q)));
    expect(option(rightText(q))).toHaveAttribute('aria-checked', 'true');
    expect(option(wrongText(q))).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByText('1 answered')).toBeInTheDocument();
    // no feedback during the exam
    expect(screen.queryByText(byQuestion.get(q.question).explanation)).not.toBeInTheDocument();
  });

  it('the grid has a button per question and jumps to it; Previous/Next move and stop at the ends', async () => {
    const { user } = setup();
    const { total } = await start(user);
    expect(within(grid()).getAllByRole('button')).toHaveLength(total);
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(currentNumber()).toBe(2);
    await goTo(user, total);
    expect(currentNumber()).toBe(total);
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Previous' }));
    expect(currentNumber()).toBe(total - 1);
  });

  it('keeps each answer with its question when moving around', async () => {
    const { user } = setup();
    await start(user);
    const q1 = currentQuestion();
    await user.click(option(rightText(q1)));
    await goTo(user, 2);
    options().forEach((o) => expect(o).toHaveAttribute('aria-checked', 'false'));
    await goTo(user, 1);
    expect(option(rightText(q1))).toHaveAttribute('aria-checked', 'true');
  });

  it('flags and unflags a question, shown on the grid', async () => {
    const { user } = setup();
    await start(user);
    await goTo(user, 3);
    await user.click(screen.getByRole('button', { name: 'Flag for review' }));
    expect(screen.getByRole('button', { name: 'Unflag' })).toHaveAttribute('aria-pressed', 'true');
    expect(gridButton(3)).toHaveAccessibleName('Question 3, flagged');
    await goTo(user, 4);
    expect(screen.getByRole('button', { name: 'Flag for review' })).toHaveAttribute('aria-pressed', 'false');
    await goTo(user, 3);
    await user.click(option(rightText(currentQuestion())));
    expect(gridButton(3)).toHaveAccessibleName('Question 3, answered, flagged');
    await user.click(screen.getByRole('button', { name: 'Unflag' }));
    expect(gridButton(3)).toHaveAccessibleName('Question 3, answered');
  });
});

describe('PracticeExam: submit', () => {
  it('asks to confirm, warning how many are unanswered; Keep going returns to the exam', async () => {
    const { user } = setup();
    const { total } = await start(user);
    await user.click(option(rightText(currentQuestion())));
    await user.click(screen.getByRole('button', { name: 'Submit exam' }));
    const dialog = screen.getByRole('alertdialog', { name: 'Submit the exam?' });
    expect(dialog).toHaveTextContent(`${total - 1} questions are unanswered and will count as wrong.`);
    await user.click(within(dialog).getByRole('button', { name: 'Keep going' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(screen.getByText(`Question 1 of ${total}`)).toBeInTheDocument();
  });

  it('says "1 question is" when one is left, and "All questions answered" when none are', async () => {
    const { user } = setup();
    await start(user);
    await answerAll(user, (_, k) => (k === 1 ? null : 'wrong'));
    await user.click(screen.getByRole('button', { name: 'Submit exam' }));
    expect(screen.getByRole('alertdialog')).toHaveTextContent('1 question is unanswered and will count as wrong.');
    await user.click(screen.getByRole('button', { name: 'Keep going' }));
    await goTo(user, 1);
    await user.click(option(wrongText(currentQuestion())));
    await user.click(screen.getByRole('button', { name: 'Submit exam' }));
    expect(screen.getByRole('alertdialog')).toHaveTextContent('All questions answered. Submit now?');
  });

  it('scores a pass with the per-topic breakdown, the weakest topic and saved history', async () => {
    const { user } = setup();
    const { total, passPct } = await start(user);
    const weakTopic = topics[3];
    // everything right except the weak topic, which is all wrong
    const order = await answerAll(user, (q) => (q.topicId === weakTopic.id ? 'wrong' : 'right'));
    await submit(user);

    const weakCount = order.filter((q) => q.topicId === weakTopic.id).length;
    const correct = total - weakCount;
    const pct = Math.round((correct / total) * 100);
    expect(pct).toBeGreaterThanOrEqual(passPct); // the fixture plan must give a pass
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(`Pass: ${pct}% (${correct} / ${total})`);
    expect(screen.getByText(new RegExp(`Pass line ${passPct}%`))).toHaveTextContent(`weakest topic: ${weakTopic.title}`);

    const rows = [...breakdownRows()];
    expect(rows).toHaveLength(topics.length);
    for (const t of topics) {
      const row = rows.find((r) => r.firstChild.textContent === t.title);
      const n = order.filter((q) => q.topicId === t.id).length;
      const right = t.id === weakTopic.id ? 0 : n;
      expect(row, t.id).toBeDefined();
      expect(row).toHaveTextContent(`${right}/${n}`);
      expect(within(row).getByRole('img')).toHaveAccessibleName(`${Math.round((right / n) * 100)} percent`);
    }

    expect(savedHistory().attempts).toHaveLength(1);
    expect(savedHistory().attempts[0].pct).toBe(pct);
  });

  it('scores a fail, counting unanswered questions as wrong', async () => {
    const { user } = setup();
    const { total, passPct } = await start(user);
    // answer only the first few right, skip the rest
    const answerCount = Math.floor((total * passPct) / 100) - 1;
    await answerAll(user, (_, k) => (k <= answerCount ? 'right' : null));
    await submit(user);
    const pct = Math.round((answerCount / total) * 100);
    expect(pct).toBeLessThan(passPct);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(`Not yet: ${pct}% (${answerCount} / ${total})`);
  });

  it('review lists every question with your answer, the right one when wrong, and the explanation', async () => {
    const { user } = setup();
    await start(user);
    const order = await answerAll(user, (_, k) => (k === 1 ? 'right' : k === 2 ? 'wrong' : null));
    await submit(user);
    await user.click(screen.getByRole('button', { name: 'Review answers' }));
    const items = within(screen.getAllByRole('list').find((l) => l.tagName === 'OL')).getAllByRole('listitem');
    expect(items).toHaveLength(order.length);
    items.forEach((li, k) => {
      const q = order[k];
      expect(li).toHaveTextContent(q.question);
      expect(li).toHaveTextContent(q.explanation);
    });
    expect(items[0]).toHaveTextContent(`Your answer: ${rightText(order[0])} (correct)`);
    expect(items[0]).not.toHaveTextContent('Correct:');
    expect(items[1]).toHaveTextContent(`Your answer: ${wrongText(order[1])}`);
    expect(items[1]).toHaveTextContent(`Correct: ${rightText(order[1])}`);
    expect(items[2]).toHaveTextContent('Your answer: none');
    expect(items[2]).toHaveTextContent(`Correct: ${rightText(order[2])}`);
    await user.click(screen.getByRole('button', { name: 'Hide answers' }));
    expect(screen.queryByText(order[0].explanation)).not.toBeInTheDocument();
  });

  it('Retake starts a fresh exam; Back shows the intro with the new score', async () => {
    const { user } = setup();
    const { total } = await start(user);
    await user.click(option(rightText(currentQuestion())));
    await submit(user);
    const pct = Math.round((1 / total) * 100);
    await user.click(screen.getByRole('button', { name: 'Retake exam' }));
    expect(screen.getByText(`Question 1 of ${total}`)).toBeInTheDocument();
    expect(screen.getByText('0 answered')).toBeInTheDocument();
    await submit(user);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(`Not yet: 0% (0 / ${total})`);
    await user.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByText(`Recent: 0% · ${pct}%`)).toBeInTheDocument();
    expect(savedHistory().attempts.map((a) => a.pct)).toEqual([pct, 0]);
  });

  it('keeps only the last 20 attempts', async () => {
    localStorage.setItem('dev-track-exam-history', JSON.stringify({ attempts: Array.from({ length: 20 }, (_, i) => ({ pct: i, at: i })) }));
    const { user } = setup();
    await start(user);
    await submit(user);
    const attempts = savedHistory().attempts;
    expect(attempts).toHaveLength(20);
    expect(attempts[0].pct).toBe(1);
    expect(attempts[19].pct).toBe(0);
  });
});

describe('PracticeExam: timer', () => {
  // The countdown is a chain of 1-second setTimeouts, so fake only those. userEvent and RTL's async
  // helpers wait on setTimeout too, so these tests click with fireEvent (synchronous) instead.
  const timedStart = () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    render(<PracticeExam />);
    const intro = readIntro();
    fireEvent.click(screen.getByRole('button', { name: 'Start exam' }));
    return intro;
  };
  // Each second schedules the next timeout after React renders, so step one second at a time.
  const tick = (seconds) => { for (let s = 0; s < seconds; s++) act(() => { vi.advanceTimersByTime(1000); }); };
  const clickSubmit = () => {
    fireEvent.click(screen.getByRole('button', { name: 'Submit exam' }));
    fireEvent.click(screen.getByRole('button', { name: 'Yes, submit' }));
  };

  it('counts down once a second and shows the time used on the result', () => {
    const { minutes } = timedStart();
    expect(timer()).toHaveTextContent(fmt(minutes * 60));
    tick(1);
    expect(timer()).toHaveTextContent(fmt(minutes * 60 - 1));
    tick(64);
    expect(timer()).toHaveTextContent(fmt(minutes * 60 - 65));
    clickSubmit();
    expect(screen.getByText(/time used/)).toHaveTextContent(`time used ${fmt(65)}`);
  });

  it('marks the last five minutes as low time', () => {
    const { minutes } = timedStart();
    expect(timer()).not.toHaveClass('low');
    tick(minutes * 60 - 300);
    expect(timer()).toHaveTextContent('5:00');
    expect(timer()).not.toHaveClass('low');
    tick(1);
    expect(timer()).toHaveTextContent('4:59');
    expect(timer()).toHaveClass('low');
  });

  it('submits automatically at zero, scoring what was answered', () => {
    const { minutes, total } = timedStart();
    fireEvent.click(option(rightText(currentQuestion())));
    tick(minutes * 60);
    const pct = Math.round((1 / total) * 100);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(`Not yet: ${pct}% (1 / ${total})`);
    expect(screen.getByText(/time used/)).toHaveTextContent(`time used ${fmt(minutes * 60)}`);
    expect(savedHistory().attempts).toHaveLength(1);
  });

  it('stops counting after submit: no second auto-submit when the time would have run out', () => {
    const { minutes } = timedStart();
    tick(3);
    clickSubmit();
    tick(minutes * 60);
    expect(screen.getByText(/time used/)).toHaveTextContent(`time used ${fmt(3)}`);
    expect(savedHistory().attempts).toHaveLength(1);
  });
});
