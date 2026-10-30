// Multiple-choice check: instant feedback with an explanation per question.
import React, { useState } from 'react';
import Markdown from '../Markdown';

const Quiz = ({ questions, onFinish, best }) => {
  const [answers, setAnswers] = useState({});
  const [round, setRound] = useState(0);
  const answered = Object.keys(answers).length;
  const score = questions.filter((q, i) => answers[i] === q.answer).length;

  const choose = (qi, oi) => {
    if (answers[qi] !== undefined) return;
    const next = { ...answers, [qi]: oi };
    setAnswers(next);
    if (Object.keys(next).length === questions.length) {
      onFinish(questions.filter((q, i) => next[i] === q.answer).length, questions.length);
    }
  };

  return (
    <div className="quiz" key={round}>
      {questions.map((q, qi) => {
        const picked = answers[qi];
        return (
          <fieldset key={qi} className="quiz-q">
            <legend><span className="quiz-num">{qi + 1}</span><Markdown text={q.q} className="inline" /></legend>
            <div className="quiz-options">
              {q.options.map((opt, oi) => {
                const state = picked === undefined ? '' : oi === q.answer ? 'right' : oi === picked ? 'wrong' : 'dim';
                return (
                  <button type="button" key={oi} className={`quiz-option ${state}`} onClick={() => choose(qi, oi)} disabled={picked !== undefined} aria-pressed={picked === oi}>
                    <Markdown text={opt} className="inline" />
                  </button>
                );
              })}
            </div>
            {picked !== undefined && (
              <div className={`quiz-explain ${picked === q.answer ? 'right' : 'wrong'}`}>
                <strong>{picked === q.answer ? 'Correct.' : 'Not quite.'}</strong> <Markdown text={q.explain} className="inline" />
              </div>
            )}
          </fieldset>
        );
      })}
      {answered === questions.length && (
        <div className="quiz-score">
          <span>You got <strong>{score} of {questions.length}</strong>{best && best.score > score ? ` (your best: ${best.score})` : ''}.</span>
          <button type="button" className="btn ghost" onClick={() => { setAnswers({}); setRound(round + 1); }}>Try again</button>
        </div>
      )}
    </div>
  );
};

export default Quiz;
