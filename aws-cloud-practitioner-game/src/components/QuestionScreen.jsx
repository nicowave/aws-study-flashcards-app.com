import React from 'react';
import ParticleExplosion from './ParticleExplosion';
import './QuestionScreen.css';

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
  const currentQuestion = questions[currentIndex];

  return (
    <div className="playing-screen" style={{ '--domain-color': domain.color }}>
      <div className="game-nav">
        <button className="quit-button" onClick={onQuit}>
          ✕ Quit
        </button>
        <div className="streak-display">
          {sessionStats.streak > 0 && <>🔥 {sessionStats.streak}</>}
        </div>
      </div>

      <div className="progress-header">
        <div className="domain-badge" style={{ background: domain.gradient }}>
          {domain.icon} {domain.name}
        </div>
        <div className="question-counter">
          Question {currentIndex + 1} of {questions.length}
        </div>
      </div>

      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{
            width: `${((currentIndex + (selectedAnswer !== null ? 1 : 0)) / questions.length) * 100}%`,
            background: domain.gradient
          }}
        />
      </div>

      <div className="question-card">
        <div className="question-text">{currentQuestion.question}</div>

        <div className="options-grid">
          {currentQuestion.options.map((option, index) => {
            let optionClass = 'option-button';
            if (selectedAnswer !== null) {
              if (index === currentQuestion.correctAnswer) {
                optionClass += ' correct';
              } else if (index === selectedAnswer) {
                optionClass += ' incorrect';
              }
            }

            return (
              <button
                key={index}
                className={optionClass}
                onClick={() => onAnswer(index)}
                disabled={selectedAnswer !== null}
              >
                <span className="option-letter">
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="option-text">{option}</span>
                {selectedAnswer !== null && index === currentQuestion.correctAnswer && (
                  <span className="correct-icon">✓</span>
                )}
                {selectedAnswer === index && index !== currentQuestion.correctAnswer && (
                  <span className="incorrect-icon">✗</span>
                )}
              </button>
            );
          })}
        </div>

        <ParticleExplosion active={showParticles} color={domain.color} />

        {showExplanation && (
          <div className="explanation-box">
            <div className="explanation-header">
              {selectedAnswer === currentQuestion.correctAnswer ? (
                <span className="result-correct">✓ Correct!</span>
              ) : (
                <span className="result-incorrect">✗ Incorrect</span>
              )}
            </div>
            <p className="explanation-text">{currentQuestion.explanation}</p>
            <button
              className="next-button"
              onClick={onNext}
              style={{ background: domain.gradient }}
            >
              {currentIndex < questions.length - 1 ? 'Next Question →' : 'See Results →'}
            </button>
          </div>
        )}
      </div>

      <div className="session-score">
        Score: {sessionStats.correct}/{sessionStats.total}
      </div>
    </div>
  );
};

export default QuestionScreen;
