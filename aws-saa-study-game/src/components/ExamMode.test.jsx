import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExamMode from './ExamMode';
import { correctIndex, answerField } from '../test/examConfig';

// ExamMode builds its exam from `domains` in '../data'. Swap that array's contents per
// test: small fixtures for exact scoring, the app's real domains for the weighting check.
const data = vi.hoisted(() => ({ domains: [], real: [] }));
vi.mock('../data', async (importOriginal) => {
  const actual = await importOriginal();
  data.real = actual.domains;
  return { ...actual, domains: data.domains };
});
const useDomains = (list) => data.domains.splice(0, data.domains.length, ...list);

// ---- Fixtures (use the app's own answer field: correctAnswer or correct) ----
const byQuestion = new Map();
const makeDomain = (id, name, weight, count) => {
  const field = answerField(data.real[0].questions[0]);
  const questions = Array.from({ length: count }, (_, k) => {
    const n = k + 1;
    const tag = `[${id}-${n}]`;
    const right = n % 4;
    const q = {
      id: `${id}-${n}`,
      question: `Fixture question ${tag}?`,
      options: [0, 1, 2, 3].map((o) => (o === right ? `Right answer ${tag}` : `Wrong answer ${o} ${tag}`)),
      [field]: right,
      explanation: `Explanation for ${tag}.`,
      sources: [{ title: `Doc ${tag}`, url: `https://docs.aws.amazon.com/fixture/${id}-${n}.html`, checked: '2026-11-01' }],
    };
    byQuestion.set(q.question, { ...q, domainId: id, domainName: name });
    return q;
  });
  return { id, name, weight, questions };
};
// 20 questions whose pools match their weights, so every fixture question is in the exam.
const fixtureDomains = () => [
  makeDomain('d1', 'Fixture Domain One', '50%', 10),
  makeDomain('d2', 'Fixture Domain Two', '30%', 6),
  makeDomain('d3', 'Fixture Domain Three', '20%', 4),
];
const FIXTURE_TOTAL = 20;

// ---- Helpers that read the UI ----
const factValue = (caption) => screen.getByText(caption).previousElementSibling.textContent;
const readIntro = () => ({
  size: parseInt(factValue(/questions, weighted by exam domain/), 10),
  minutes: parseInt(factValue(/countdown, auto-submits at zero/), 10),
  passing: parseInt(factValue(/scaled score needed to pass/), 10),
});
const examSize = () => Number(screen.getByText(/^\d+\/\d+ answered$/).textContent.match(/\/(\d+)/)[1]);
const currentQuestion = () => byQuestion.get(screen.getByRole('heading', { level: 3 }).textContent);
const optionButton = (text) => screen.getByRole('button', { name: (n) => n.endsWith(text) });
const rightText = (q) => q.options[correctIndex(q)];
const wrongText = (q) => q.options.find((_, i) => i !== correctIndex(q));
const goTo = (user, n) => user.click(screen.getByRole('button', { name: String(n) }));

const setup = () => {
  const onExit = vi.fn();
  const user = userEvent.setup();
  const { unmount } = render(<ExamMode onExit={onExit} />);
  return { user, onExit, unmount };
};

const start = async (user) => {
  const intro = readIntro();
  await user.click(screen.getByRole('button', { name: 'Start Exam' }));
  return intro;
};

// plan(q, index) returns 'right' | 'wrong' | null (skip) for each question in exam order.
const answerAll = async (user, plan) => {
  const n = examSize();
  for (let i = 1; i <= n; i++) {
    await goTo(user, i);
    const q = currentQuestion();
    const choice = plan(q, i);
    if (choice === 'right') await user.click(optionButton(rightText(q)));
    if (choice === 'wrong') await user.click(optionButton(wrongText(q)));
  }
};

const submit = async (user) => {
  await user.click(screen.getByRole('button', { name: 'Submit Exam' }));
  await user.click(screen.getByRole('button', { name: 'Yes, submit' }));
};

const historyKey = () => Object.keys(localStorage).find((k) => /exam-history$/.test(k));
const savedHistory = () => JSON.parse(localStorage.getItem(historyKey()));
const shownScore = () => Number(screen.getByText('/1000').parentElement.textContent.replace('/1000', ''));
const scaledFor = (correct, total) => Math.round(100 + (correct / total) * 900);
const domainRow = (name) => screen.getByText(name).parentElement;
const readPassingFromResults = () => Number(screen.getByText(/passing score \d+/).textContent.match(/passing score (\d+)/)[1]);

beforeEach(() => {
  byQuestion.clear();
  useDomains(fixtureDomains());
});

describe('ExamMode: intro', () => {
  it('shows the exam facts and starts on the first question', async () => {
    const { user } = setup();
    expect(screen.getByRole('heading', { name: 'Exam Simulator' })).toBeInTheDocument();
    const intro = readIntro();
    expect(intro.size).toBeGreaterThan(0);
    expect(intro.minutes).toBeGreaterThan(0);
    expect(intro.passing).toBeGreaterThan(100);
    expect(intro.passing).toBeLessThanOrEqual(1000);
    await start(user);
    expect(screen.getByText(`Question 1 of ${FIXTURE_TOTAL}`)).toBeInTheDocument();
    expect(currentQuestion()).toBeDefined();
  });

  it('Menu calls onExit', async () => {
    const { user, onExit } = setup();
    await user.click(screen.getByRole('button', { name: /Menu/ }));
    expect(onExit).toHaveBeenCalledTimes(1);
  });
});

describe('ExamMode: building the exam', () => {
  it("draws from every app domain in proportion to its weight, capped at the exam size", async () => {
    useDomains(data.real);
    const { user } = setup();
    const { size } = await start(user);
    const pool = data.real.reduce((n, d) => n + d.questions.length, 0);
    const n = examSize();
    expect(n).toBe(Math.min(size, pool));

    await submit(user);
    const weights = data.real.map((d) => parseInt(d.weight, 10));
    const weightSum = weights.reduce((a, b) => a + b, 0);
    let sum = 0;
    data.real.forEach((d, i) => {
      const [, got] = within(domainRow(d.name)).getByText(/^0\/\d+ \(0%\)$/).textContent.match(/\/(\d+)/);
      const count = Number(got);
      sum += count;
      expect(count).toBeLessThanOrEqual(d.questions.length);
      // Rounding plus top-up can move a domain by one question, never more.
      expect(Math.abs(count - (weights[i] / weightSum) * n)).toBeLessThanOrEqual(1);
    });
    expect(sum).toBe(n);
  });

  it('takes all of a small domain and tops up from the others to fill the exam', async () => {
    // Read the configured exam size, then use a pool bigger than it where one heavy domain is tiny.
    const probe = setup();
    const { size } = readIntro();
    probe.unmount();
    byQuestion.clear();
    useDomains([
      makeDomain('small', 'Tiny Heavy Domain', '60%', 2),
      makeDomain('big1', 'Big Domain A', '20%', size),
      makeDomain('big2', 'Big Domain B', '20%', size),
    ]);
    const { user } = setup();
    await start(user);
    expect(examSize()).toBe(size);
    await submit(user);
    expect(within(domainRow('Tiny Heavy Domain')).getByText('0/2 (0%)')).toBeInTheDocument();
    const count = (name) => Number(within(domainRow(name)).getByText(/^0\/\d+/).textContent.match(/\/(\d+)/)[1]);
    expect(count('Big Domain A') + count('Big Domain B')).toBe(size - 2);
    expect(Math.abs(count('Big Domain A') - count('Big Domain B'))).toBeLessThanOrEqual(1);
  });

  it('uses the whole pool when it is smaller than the exam size, each question once', async () => {
    const { user } = setup();
    await start(user);
    expect(examSize()).toBe(FIXTURE_TOTAL);
    const seen = new Set();
    for (let i = 1; i <= FIXTURE_TOTAL; i++) {
      await goTo(user, i);
      seen.add(currentQuestion().id);
    }
    expect(seen.size).toBe(FIXTURE_TOTAL);
  });
});

describe('ExamMode: taking the exam', () => {
  it('counts answers, lets the learner change one, and scores the final choice', async () => {
    const { user } = setup();
    await start(user);
    const q = currentQuestion();
    await user.click(optionButton(wrongText(q)));
    expect(screen.getByText(`1/${FIXTURE_TOTAL} answered`)).toBeInTheDocument();
    await user.click(optionButton(rightText(q)));
    expect(screen.getByText(`1/${FIXTURE_TOTAL} answered`)).toBeInTheDocument();

    await submit(user);
    expect(screen.getByText(new RegExp(`^1/${FIXTURE_TOTAL} correct`))).toBeInTheDocument();
  });

  it('navigates with the question grid and Previous/Next, keeping answers', async () => {
    const { user } = setup();
    await start(user);
    expect(screen.getByRole('button', { name: /Previous/ })).toBeDisabled();
    const first = currentQuestion();
    await user.click(optionButton(rightText(first)));

    await user.click(screen.getByRole('button', { name: /Next/ }));
    expect(screen.getByText(`Question 2 of ${FIXTURE_TOTAL}`)).toBeInTheDocument();
    expect(currentQuestion().id).not.toBe(first.id);

    await goTo(user, FIXTURE_TOTAL);
    expect(screen.getByText(`Question ${FIXTURE_TOTAL} of ${FIXTURE_TOTAL}`)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Next/ })).toBeDisabled();

    await goTo(user, 1);
    expect(currentQuestion().id).toBe(first.id);
    // The grid marks answered questions (no accessible alternative, so the class is the behavior).
    expect(screen.getByRole('button', { name: '1' })).toHaveClass('answered');
    expect(screen.getByRole('button', { name: '2' })).not.toHaveClass('answered');
  });

  it('flags a question for review and keeps the flag when coming back', async () => {
    const { user } = setup();
    await start(user);
    await user.click(screen.getByRole('button', { name: /Flag for review/ }));
    expect(screen.getByRole('button', { name: /Flagged/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '1' })).toHaveClass('flagged');

    await goTo(user, 2);
    expect(screen.getByRole('button', { name: /Flag for review/ })).toBeInTheDocument();
    await goTo(user, 1);
    expect(screen.getByRole('button', { name: /Flagged/ })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Flagged/ }));
    expect(screen.getByRole('button', { name: '1' })).not.toHaveClass('flagged');
  });
});

describe('ExamMode: submitting', () => {
  it('asks before submitting, warns about unanswered questions, and can be cancelled', async () => {
    const { user } = setup();
    await start(user);
    await user.click(optionButton(rightText(currentQuestion())));
    await user.click(screen.getByRole('button', { name: 'Submit Exam' }));
    expect(screen.getByText(new RegExp(`${FIXTURE_TOTAL - 1} unanswered — submit anyway\\?`))).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Keep going' }));
    expect(screen.getByRole('button', { name: 'Submit Exam' })).toBeInTheDocument();
    expect(screen.getByText(`Question 1 of ${FIXTURE_TOTAL}`)).toBeInTheDocument();

    await answerAll(user, () => 'right');
    await user.click(screen.getByRole('button', { name: 'Submit Exam' }));
    expect(screen.getByText(/Submit final answers\?/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Yes, submit' }));
    expect(screen.getByText(/\bPASS\b/)).toBeInTheDocument();
  });
});

describe('ExamMode: timer', () => {
  const timedSetup = () => {
    // Fake only the exam clock (setInterval); userEvent keeps real setTimeout.
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    return setup();
  };
  const tick = (seconds) => act(() => { vi.advanceTimersByTime(seconds * 1000); });

  it('counts down from the exam time limit', async () => {
    const { user } = timedSetup();
    const { minutes } = await start(user);
    expect(screen.getByText(`${minutes}:00`)).toBeInTheDocument();
    tick(1);
    expect(screen.getByText(`${minutes - 1}:59`)).toBeInTheDocument();
  });

  it('auto-submits at zero with the answers given so far', async () => {
    const { user } = timedSetup();
    const { minutes } = await start(user);
    await user.click(optionButton(rightText(currentQuestion())));

    tick(minutes * 60 - 1);
    expect(screen.getByText('0:01')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit Exam' })).toBeInTheDocument();

    tick(1);
    expect(screen.getByText(/NOT YET/)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`^1/${FIXTURE_TOTAL} correct`))).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`time used ${minutes}:00`))).toBeInTheDocument();
    expect(savedHistory()).toHaveLength(1);
  });
});

describe('ExamMode: scoring', () => {
  // Smallest number of correct answers that reaches the passing line shown on the intro.
  const passLine = (passing) => {
    let k = 0;
    while (scaledFor(k, FIXTURE_TOTAL) < passing) k += 1;
    return k;
  };

  it('scores 1000 and passes when every answer is right', async () => {
    const { user } = setup();
    await start(user);
    await answerAll(user, () => 'right');
    await submit(user);
    expect(shownScore()).toBe(1000);
    expect(screen.getByText(/\bPASS\b/)).toBeInTheDocument();
    expect(screen.getByText(`${FIXTURE_TOTAL}/${FIXTURE_TOTAL} correct (100%)`, { exact: false })).toBeInTheDocument();
    expect(screen.getByText(/Readiness: Ready/)).toBeInTheDocument();
  });

  it('scores 100 and fails when nothing is answered', async () => {
    const { user } = setup();
    await start(user);
    await submit(user);
    expect(shownScore()).toBe(100);
    expect(screen.getByText(/NOT YET/)).toBeInTheDocument();
    expect(screen.getByText(/Readiness: Keep practicing/)).toBeInTheDocument();
  });

  it('passes exactly at the passing line and fails one answer below it', async () => {
    const { user } = setup();
    const { passing } = await start(user);
    const k = passLine(passing);
    await answerAll(user, (_, i) => (i <= k ? 'right' : 'wrong'));
    await submit(user);
    expect(shownScore()).toBe(scaledFor(k, FIXTURE_TOTAL));
    expect(shownScore()).toBeGreaterThanOrEqual(passing);
    expect(screen.getByText(new RegExp(`passing score ${passing}`))).toBeInTheDocument();
    expect(screen.getByText(/\bPASS\b/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Retake Exam' }));
    expect(screen.getByText(`0/${FIXTURE_TOTAL} answered`)).toBeInTheDocument();
    await answerAll(user, (_, i) => (i <= k - 1 ? 'right' : 'wrong'));
    await submit(user);
    expect(shownScore()).toBe(scaledFor(k - 1, FIXTURE_TOTAL));
    expect(shownScore()).toBeLessThan(passing);
    expect(screen.getByText(/NOT YET/)).toBeInTheDocument();
  });

  it('breaks the score down by domain', async () => {
    const { user } = setup();
    await start(user);
    await answerAll(user, (q) => (q.domainId === 'd1' ? 'right' : 'wrong'));
    await submit(user);
    expect(within(domainRow('Fixture Domain One')).getByText('10/10 (100%)')).toBeInTheDocument();
    expect(within(domainRow('Fixture Domain Two')).getByText('0/6 (0%)')).toBeInTheDocument();
    expect(within(domainRow('Fixture Domain Three')).getByText('0/4 (0%)')).toBeInTheDocument();
    expect(shownScore()).toBe(scaledFor(10, FIXTURE_TOTAL));
  });

  it('puts the score in the share message and Back to Menu calls onExit', async () => {
    const { user, onExit } = setup();
    await start(user);
    await answerAll(user, () => 'right');
    await submit(user);
    const x = screen.getByRole('link', { name: /^X$/ });
    expect(decodeURIComponent(x.getAttribute('href'))).toContain('I scored 1000/1000 on a full timed practice exam');
    await user.click(screen.getByRole('button', { name: 'Back to Menu' }));
    expect(onExit).toHaveBeenCalledTimes(1);
  });
});

describe('ExamMode: review', () => {
  it('shows incorrect answers by default, marking the right answer and the learner\'s, with explanation and sources', async () => {
    const { user } = setup();
    await start(user);
    // Question 1 wrong, question 2 skipped, the rest right.
    const picked = {};
    await answerAll(user, (q, i) => {
      picked[i] = q;
      if (i === 1) return 'wrong';
      if (i === 2) return null;
      return 'right';
    });
    await submit(user);
    await user.click(screen.getByRole('button', { name: 'Review Answers' }));

    const wrongQ = picked[1];
    const skippedQ = picked[2];
    const card = screen.getByText(wrongQ.question).parentElement;
    expect(within(card).getByText(new RegExp(`^Q1 · ${wrongQ.domainName}$`))).toBeInTheDocument();
    expect(within(card).getByText('Incorrect')).toBeInTheDocument();
    expect(within(card).getByText('✓ correct').parentElement).toHaveTextContent(rightText(wrongQ));
    expect(within(card).getByText('your answer').parentElement).toHaveTextContent(wrongText(wrongQ));
    expect(within(card).getByText(wrongQ.explanation, { exact: false })).toBeInTheDocument();
    expect(within(card).getByRole('link', { name: new RegExp(wrongQ.sources[0].title.replace(/[[\]]/g, '\\$&')) }))
      .toHaveAttribute('href', wrongQ.sources[0].url);

    const skippedCard = screen.getByText(skippedQ.question).parentElement;
    expect(within(skippedCard).getByText('You left this question unanswered.')).toBeInTheDocument();
    expect(within(skippedCard).queryByText('your answer')).not.toBeInTheDocument();

    // Correct answers are hidden until "All questions".
    const rightQ = picked[3];
    expect(screen.queryByText(rightQ.question)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'All questions' }));
    const rightCard = screen.getByText(rightQ.question).parentElement;
    expect(within(rightCard).getByText('Correct')).toBeInTheDocument();
    // Picking the right answer shows both markers on the same option.
    const marked = within(rightCard).getByText('✓ correct').parentElement;
    expect(within(marked).getByText('your answer')).toBeInTheDocument();
    expect(marked).toHaveTextContent(rightText(rightQ));

    await user.click(screen.getByRole('button', { name: /Score report/ }));
    expect(screen.getByRole('button', { name: 'Review Answers' })).toBeInTheDocument();
  });

  it('says there is nothing to review when every answer was right', async () => {
    const { user } = setup();
    await start(user);
    await answerAll(user, () => 'right');
    await submit(user);
    await user.click(screen.getByRole('button', { name: 'Review Answers' }));
    expect(screen.getByText(/Nothing to review/)).toBeInTheDocument();
  });
});

describe('ExamMode: history', () => {
  it('saves each attempt to localStorage', async () => {
    const { user } = setup();
    await start(user);
    await answerAll(user, (q) => (q.domainId === 'd1' ? 'right' : null));
    await submit(user);
    const [attempt] = savedHistory();
    expect(attempt).toMatchObject({
      scaled: scaledFor(10, FIXTURE_TOTAL),
      correct: 10,
      total: FIXTURE_TOTAL,
      pct: 50,
      passed: scaledFor(10, FIXTURE_TOTAL) >= readPassingFromResults(),
    });
    expect(new Date(attempt.date).toString()).not.toBe('Invalid Date');
    expect(attempt.domains).toEqual(expect.arrayContaining([
      { name: 'Fixture Domain One', correct: 10, total: 10 },
      { name: 'Fixture Domain Two', correct: 0, total: 6 },
    ]));
  });

  it('shows past attempts on the intro and keeps only the last 20', async () => {
    // Run one exam to learn this app's history key, then seed 20 older attempts under it.
    const first = setup();
    await start(first.user);
    await submit(first.user);
    const key = historyKey();
    first.unmount();
    const old = Array.from({ length: 20 }, (_, i) => ({
      date: new Date(2026, 0, i + 1).toISOString(), scaled: i === 5 ? 990 : 400, pct: 30,
      passed: i === 5, correct: 6, total: 20, durationSec: 60, domains: [],
    }));
    localStorage.setItem(key, JSON.stringify(old));

    const { user } = setup();
    const intro = screen.getByText(/Attempts:/);
    expect(intro).toHaveTextContent(/Attempts: 20 · Best score: 990 · Last: 400 \(fail\)/);

    await start(user);
    await answerAll(user, () => 'right');
    await submit(user);
    const saved = JSON.parse(localStorage.getItem(key));
    expect(saved).toHaveLength(20);
    expect(saved[0].date).toBe(old[1].date); // oldest dropped
    expect(saved[19]).toMatchObject({ scaled: 1000, passed: true });
  });

  it('starts fine when saved history is corrupt', async () => {
    const first = setup();
    await start(first.user);
    await submit(first.user);
    const key = historyKey();
    first.unmount();
    localStorage.setItem(key, '{not json');

    setup();
    expect(screen.getByRole('button', { name: 'Start Exam' })).toBeInTheDocument();
    expect(screen.queryByText(/Attempts:/)).not.toBeInTheDocument();
  });
});
