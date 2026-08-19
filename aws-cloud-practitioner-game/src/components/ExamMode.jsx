import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { domains } from '../data';
import {
  ArrowLeftIcon,
  ClockIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FlagIcon
} from './Icons';
import './ExamMode.css';

// ---- Per-app configuration ----
const EXAM_CONFIG = {
  certName: 'AWS Certified Cloud Practitioner (CLF-C02)',
  totalQuestions: 65,
  timeLimitMinutes: 90,
  passingScaled: 700,
  answerField: 'correctAnswer',
  historyKey: 'aws-ccp-exam-history'
};

const getCorrect = (q) => q[EXAM_CONFIG.answerField];

const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Sample questions from every domain proportionally to its official exam weight,
// capped by pool size, topping up from domains with spare questions.
const buildExam = () => {
  const total = Math.min(
    EXAM_CONFIG.totalQuestions,
    domains.reduce((n, d) => n + d.questions.length, 0)
  );
  const weights = domains.map((d) => parseInt(d.weight, 10) || 0);
  const weightSum = weights.reduce((a, b) => a + b, 0) || 1;

  const targets = domains.map((d, i) =>
    Math.min(Math.round((weights[i] / weightSum) * total), d.questions.length)
  );
  // Top up (or trim) so targets sum to the exam size
  let diff = total - targets.reduce((a, b) => a + b, 0);
  while (diff !== 0) {
    let moved = false;
    for (let i = 0; i < targets.length && diff !== 0; i++) {
      if (diff > 0 && targets[i] < domains[i].questions.length) {
        targets[i] += 1;
        diff -= 1;
        moved = true;
      } else if (diff < 0 && targets[i] > 0) {
        targets[i] -= 1;
        diff += 1;
        moved = true;
      }
    }
    if (!moved) break;
  }

  const picked = domains.flatMap((d, i) =>
    shuffleArray(d.questions)
      .slice(0, targets[i])
      .map((q) => ({ ...q, domainId: d.id, domainName: d.name }))
  );

  // Shuffle question order, then shuffle each question's options
  return shuffleArray(picked).map((q) => {
    const order = shuffleArray(q.options.map((_, idx) => idx));
    return {
      ...q,
      options: order.map((idx) => q.options[idx]),
      [EXAM_CONFIG.answerField]: order.indexOf(getCorrect(q))
    };
  });
};

const loadHistory = () => {
  try {
    return JSON.parse(localStorage.getItem(EXAM_CONFIG.historyKey)) || [];
  } catch {
    return [];
  }
};

const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
};

const ExamMode = ({ onExit }) => {
  const [view, setView] = useState('intro'); // intro | exam | results | review
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [flagged, setFlagged] = useState(() => new Set());
  const [current, setCurrent] = useState(0);
  const [timeLeft, setTimeLeft] = useState(EXAM_CONFIG.timeLimitMinutes * 60);
  const [result, setResult] = useState(null);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [reviewFilter, setReviewFilter] = useState('incorrect');
  const [history, setHistory] = useState(loadHistory);
  const submittedRef = useRef(false);

  const startExam = useCallback(() => {
    const exam = buildExam();
    setQuestions(exam);
    setAnswers(new Array(exam.length).fill(null));
    setFlagged(new Set());
    setCurrent(0);
    setTimeLeft(EXAM_CONFIG.timeLimitMinutes * 60);
    setResult(null);
    setConfirmSubmit(false);
    submittedRef.current = false;
    setView('exam');
  }, []);

  const submitExam = useCallback((finalAnswers, secondsLeft) => {
    if (submittedRef.current) return;
    submittedRef.current = true;

    let correctCount = 0;
    const domainMap = {};
    questions.forEach((q, i) => {
      const isCorrect = finalAnswers[i] === getCorrect(q);
      if (isCorrect) correctCount += 1;
      if (!domainMap[q.domainId]) {
        domainMap[q.domainId] = { name: q.domainName, correct: 0, total: 0 };
      }
      domainMap[q.domainId].total += 1;
      if (isCorrect) domainMap[q.domainId].correct += 1;
    });

    const pct = questions.length > 0 ? correctCount / questions.length : 0;
    const scaled = Math.round(100 + pct * 900);
    const passed = scaled >= EXAM_CONFIG.passingScaled;
    const summary = {
      date: new Date().toISOString(),
      scaled,
      pct: Math.round(pct * 100),
      passed,
      correct: correctCount,
      total: questions.length,
      durationSec: EXAM_CONFIG.timeLimitMinutes * 60 - secondsLeft,
      domains: Object.values(domainMap)
    };

    setResult(summary);
    setHistory((prev) => {
      const next = [...prev, summary].slice(-20);
      try {
        localStorage.setItem(EXAM_CONFIG.historyKey, JSON.stringify(next));
      } catch (e) {
        console.error('[ExamMode] Failed to save history:', e);
      }
      return next;
    });
    setView('results');
  }, [questions]);

  // Countdown timer
  useEffect(() => {
    if (view !== 'exam') return undefined;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [view]);

  // Auto-submit when time runs out
  useEffect(() => {
    if (view === 'exam' && timeLeft === 0) {
      submitExam(answers, 0);
    }
  }, [view, timeLeft, answers, submitExam]);

  const selectAnswer = useCallback((optionIndex) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[current] = optionIndex;
      return next;
    });
  }, [current]);

  const toggleFlag = useCallback(() => {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(current)) next.delete(current);
      else next.add(current);
      return next;
    });
  }, [current]);

  const answeredCount = useMemo(
    () => answers.filter((a) => a !== null).length,
    [answers]
  );

  const bestScaled = useMemo(
    () => (history.length > 0 ? Math.max(...history.map((h) => h.scaled)) : null),
    [history]
  );

  // ---------- Intro ----------
  if (view === 'intro') {
    return (
      <div className="exam-screen">
        <button className="exam-back-btn" onClick={onExit}>
          <ArrowLeftIcon size={18} />
          <span>Menu</span>
        </button>
        <div className="exam-intro">
          <div className="exam-intro-icon">📝</div>
          <h2>Exam Simulator</h2>
          <p className="exam-intro-cert">{EXAM_CONFIG.certName}</p>
          <div className="exam-intro-facts">
            <div className="exam-fact">
              <strong>{EXAM_CONFIG.totalQuestions}</strong>
              <span>questions, weighted by exam domain</span>
            </div>
            <div className="exam-fact">
              <strong>{EXAM_CONFIG.timeLimitMinutes} min</strong>
              <span>countdown, auto-submits at zero</span>
            </div>
            <div className="exam-fact">
              <strong>{EXAM_CONFIG.passingScaled}/1000</strong>
              <span>scaled score needed to pass</span>
            </div>
          </div>
          <p className="exam-intro-note">
            No hints, no instant feedback — just like the real exam. You can flag
            questions and change answers until you submit.
          </p>
          {history.length > 0 && (
            <p className="exam-intro-history">
              Attempts: {history.length} · Best score: <strong>{bestScaled}</strong>
              {history[history.length - 1] && (
                <> · Last: {history[history.length - 1].scaled} ({history[history.length - 1].passed ? 'pass' : 'fail'})</>
              )}
            </p>
          )}
          <button className="exam-primary-btn" onClick={startExam}>
            Start Exam
          </button>
        </div>
      </div>
    );
  }

  // ---------- Exam ----------
  if (view === 'exam') {
    const q = questions[current];
    const unanswered = questions.length - answeredCount;
    return (
      <div className="exam-screen">
        <div className="exam-topbar">
          <span className={`exam-timer ${timeLeft < 300 ? 'warning' : ''}`}>
            <ClockIcon size={16} /> {formatTime(timeLeft)}
          </span>
          <span className="exam-progress-label">
            {answeredCount}/{questions.length} answered
          </span>
          {confirmSubmit ? (
            <span className="exam-submit-confirm">
              {unanswered > 0 ? `${unanswered} unanswered — submit anyway?` : 'Submit final answers?'}
              <button className="exam-confirm-yes" onClick={() => submitExam(answers, timeLeft)}>Yes, submit</button>
              <button className="exam-confirm-no" onClick={() => setConfirmSubmit(false)}>Keep going</button>
            </span>
          ) : (
            <button className="exam-submit-btn" onClick={() => setConfirmSubmit(true)}>
              Submit Exam
            </button>
          )}
        </div>

        <div className="exam-palette">
          {questions.map((_, i) => (
            <button
              key={i}
              className={[
                'palette-cell',
                i === current ? 'current' : '',
                answers[i] !== null ? 'answered' : '',
                flagged.has(i) ? 'flagged' : ''
              ].join(' ')}
              onClick={() => setCurrent(i)}
            >
              {i + 1}
            </button>
          ))}
        </div>

        <div className="exam-question-card">
          <div className="exam-question-meta">
            <span>Question {current + 1} of {questions.length}</span>
            <button
              className={`exam-flag-btn ${flagged.has(current) ? 'active' : ''}`}
              onClick={toggleFlag}
            >
              <FlagIcon size={14} /> {flagged.has(current) ? 'Flagged' : 'Flag for review'}
            </button>
          </div>
          <h3 className="exam-question-text">{q.question}</h3>
          <div className="exam-options">
            {q.options.map((opt, i) => (
              <button
                key={i}
                className={`exam-option ${answers[current] === i ? 'selected' : ''}`}
                onClick={() => selectAnswer(i)}
              >
                <span className="exam-option-letter">{String.fromCharCode(65 + i)}</span>
                <span>{opt}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="exam-nav-row">
          <button
            className="exam-nav-btn"
            disabled={current === 0}
            onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          >
            <ChevronLeftIcon size={18} /> Previous
          </button>
          <button
            className="exam-nav-btn"
            disabled={current === questions.length - 1}
            onClick={() => setCurrent((c) => Math.min(questions.length - 1, c + 1))}
          >
            Next <ChevronRightIcon size={18} />
          </button>
        </div>
      </div>
    );
  }

  // ---------- Results ----------
  if (view === 'results' && result) {
    return (
      <div className="exam-screen">
        <div className={`exam-result-banner ${result.passed ? 'pass' : 'fail'}`}>
          <div className="exam-result-verdict">{result.passed ? '✅ PASS' : '❌ NOT YET'}</div>
          <div className="exam-result-score">{result.scaled}<span>/1000</span></div>
          <div className="exam-result-sub">
            {result.correct}/{result.total} correct ({result.pct}%) ·
            passing score {EXAM_CONFIG.passingScaled} ·
            time used {formatTime(result.durationSec)}
          </div>
        </div>

        <div className="exam-domain-breakdown">
          <h3>Domain breakdown</h3>
          {result.domains.map((d) => {
            const dpct = d.total > 0 ? Math.round((d.correct / d.total) * 100) : 0;
            return (
              <div key={d.name} className="exam-domain-row">
                <span className="exam-domain-name">{d.name}</span>
                <div className="exam-domain-bar">
                  <div
                    className={`exam-domain-fill ${dpct >= 70 ? 'good' : 'weak'}`}
                    style={{ width: `${dpct}%` }}
                  />
                </div>
                <span className="exam-domain-pct">{d.correct}/{d.total} ({dpct}%)</span>
              </div>
            );
          })}
          <p className="exam-domain-tip">
            Aim for consistent 80%+ across every domain before booking the real exam.
          </p>
        </div>

        <div className="exam-result-actions">
          <button className="exam-primary-btn" onClick={() => setView('review')}>
            Review Answers
          </button>
          <button className="exam-secondary-btn" onClick={startExam}>
            Retake Exam
          </button>
          <button className="exam-secondary-btn" onClick={onExit}>
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  // ---------- Review ----------
  if (view === 'review') {
    const items = questions
      .map((q, i) => ({ q, i, isCorrect: answers[i] === getCorrect(q) }))
      .filter((item) => (reviewFilter === 'incorrect' ? !item.isCorrect : true));
    return (
      <div className="exam-screen">
        <div className="exam-review-header">
          <button className="exam-back-btn" onClick={() => setView('results')}>
            <ArrowLeftIcon size={18} />
            <span>Score report</span>
          </button>
          <div className="exam-review-filter">
            <button
              className={reviewFilter === 'incorrect' ? 'active' : ''}
              onClick={() => setReviewFilter('incorrect')}
            >
              Incorrect only
            </button>
            <button
              className={reviewFilter === 'all' ? 'active' : ''}
              onClick={() => setReviewFilter('all')}
            >
              All questions
            </button>
          </div>
        </div>

        {items.length === 0 && (
          <p className="exam-review-empty">🎉 Nothing to review — every answer was correct!</p>
        )}

        {items.map(({ q, i, isCorrect }) => (
          <div key={i} className={`exam-review-card ${isCorrect ? 'correct' : 'incorrect'}`}>
            <div className="exam-review-meta">
              <span>Q{i + 1} · {q.domainName}</span>
              <span className={isCorrect ? 'review-tag-correct' : 'review-tag-incorrect'}>
                {isCorrect ? <><CheckCircleIcon size={14} /> Correct</> : 'Incorrect'}
              </span>
            </div>
            <div className="exam-review-question">{q.question}</div>
            <div className="exam-review-answers">
              {q.options.map((opt, oi) => (
                <div
                  key={oi}
                  className={[
                    'exam-review-option',
                    oi === getCorrect(q) ? 'right' : '',
                    oi === answers[i] && oi !== getCorrect(q) ? 'wrong' : ''
                  ].join(' ')}
                >
                  <span className="exam-option-letter">{String.fromCharCode(65 + oi)}</span>
                  <span>{opt}</span>
                  {oi === getCorrect(q) && <span className="review-marker">✓ correct</span>}
                  {oi === answers[i] && oi !== getCorrect(q) && <span className="review-marker">your answer</span>}
                  {oi === answers[i] && oi === getCorrect(q) && <span className="review-marker">your answer</span>}
                </div>
              ))}
              {answers[i] === null && <div className="exam-review-skipped">You left this question unanswered.</div>}
            </div>
            {q.explanation && <div className="exam-review-explanation">{q.explanation}</div>}
          </div>
        ))}
      </div>
    );
  }

  return null;
};

export default ExamMode;
