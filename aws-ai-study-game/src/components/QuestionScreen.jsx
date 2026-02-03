import React from 'react';
import { ArrowLeftIcon, ArrowRightIcon, FlameIcon, TargetIcon } from './Icons';

const QuestionScreen = ({
  domain,
  questions,
  currentIndex,
  selectedAnswer,
  showExplanation,
  sessionStats,
  showParticles,
  onAnswer,
  onNext,
  onQuit
}) => {
  const question = questions[currentIndex];
  const { streak = 0, correct = 0, answered = 0 } = sessionStats || {};
  const progress = ((currentIndex + 1) / questions.length) * 100;

  if (!question) {
    return (
      <div className="question-screen">
        <p>Loading question...</p>
      </div>
    );
  }

  return (
    <div className="question-screen">
      {/* Particle effect on correct answer */}
      {showParticles && <div className="particles-container" />}

      {/* Header */}
      <div className="question-header">
        <button className="quit-btn" onClick={onQuit}>
          <ArrowLeftIcon size={18} />
          <span>Quit</span>
        </button>
        
        <div className="session-stats">
          <div className="stat-badge">
            <FlameIcon size={16} />
            <span>{streak}</span>
          </div>
          <div className="stat-badge">
            <TargetIcon size={16} />
            <span>{answered > 0 ? Math.round((correct / answered) * 100) : 0}%</span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="progress-container">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <span className="progress-text">
          {currentIndex + 1} / {questions.length}
        </span>
      </div>

      {/* Domain label */}
      <div className="domain-label">
        <span className="domain-icon">{domain?.icon || '📚'}</span>
        <span>{domain?.name || 'Quiz'}</span>
      </div>

      {/* Question */}
      <div className="question-container">
        <h2 className="question-text">{question.question}</h2>

        <div className="answers-grid">
          {question.options.map((option, index) => {
            let answerClass = 'answer-btn';
            
            if (selectedAnswer !== null) {
              if (index === question.correct) {
                answerClass += ' correct';
              } else if (index === selectedAnswer && index !== question.correct) {
                answerClass += ' incorrect';
              } else {
                answerClass += ' disabled';
              }
            }

            return (
              <button
                key={index}
                className={answerClass}
                onClick={() => onAnswer(index)}
                disabled={selectedAnswer !== null}
              >
                <span className="answer-letter">
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="answer-text">{option}</span>
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {showExplanation && question.explanation && (
          <div className="explanation-box">
            <h4>Explanation</h4>
            <p>{question.explanation}</p>
          </div>
        )}

        {/* Next button */}
        {selectedAnswer !== null && (
          <button className="next-btn" onClick={onNext}>
            {currentIndex < questions.length - 1 ? (
              <>
                <span>Next Question</span>
                <ArrowRightIcon size={18} />
              </>
            ) : (
              <>
                <span>See Results</span>
                <ArrowRightIcon size={18} />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default QuestionScreen;
