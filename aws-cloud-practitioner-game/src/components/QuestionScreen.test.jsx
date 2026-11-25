import React, { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QuestionScreen from './QuestionScreen';
import { domains } from '../data';
import { answerField } from '../test/examConfig';

// Each app stores the right answer under its own field name; use whichever this app's data uses.
const FIELD = answerField(domains[0].questions[0]);

const source = { title: 'Amazon S3 storage classes', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/storage-class-intro.html', checked: '2026-11-25' };
const questions = [
  { id: 'q1', question: 'Which service stores objects?', options: ['Amazon EC2', 'Amazon S3', 'AWS Lambda', 'Amazon VPC'], [FIELD]: 1, explanation: 'S3 is object storage.', sources: [source] },
  { id: 'q2', question: 'Which service runs code without servers?', options: ['AWS Lambda', 'Amazon RDS', 'Amazon S3', 'AWS IAM'], [FIELD]: 0, explanation: 'Lambda is serverless compute.', sources: [source] },
];
const domain = { id: 'fake-domain', name: 'Fake Domain', icon: '🧪' };

const baseProps = {
  domain,
  questions,
  currentIndex: 0,
  selectedAnswer: null,
  showExplanation: false,
  sessionStats: { correct: 0, total: 0, streak: 0 },
  showParticles: false,
  onAnswer: () => {},
  onNext: () => {},
  onQuit: () => {},
};

// The answer buttons are the ones labelled A–D followed by the option text.
const answerButton = (text) => screen.getByRole('button', { name: new RegExp(`^[A-D]\\s*${text}$`) });
const answerButtons = () => questions[0].options.map((o) => answerButton(o));

// Mirrors how App.jsx drives the screen: the first answer locks the question and opens the explanation.
function Harness({ onAnswer, onNext, index = 0 }) {
  const [selected, setSelected] = useState(null);
  return (
    <QuestionScreen
      {...baseProps}
      currentIndex={index}
      selectedAnswer={selected}
      showExplanation={selected !== null}
      onAnswer={(i) => { onAnswer(i); if (selected === null) setSelected(i); }}
      onNext={onNext}
    />
  );
}

describe('QuestionScreen', () => {
  it('shows the question, its options, the domain and the progress', () => {
    render(<QuestionScreen {...baseProps} />);
    expect(screen.getByRole('heading', { name: questions[0].question })).toBeInTheDocument();
    answerButtons().forEach((b) => expect(b).toBeEnabled());
    expect(screen.getByText(domain.name)).toBeInTheDocument();
    expect(screen.getByText(`1 / ${questions.length}`)).toBeInTheDocument();
    // Nothing is revealed before the learner answers
    expect(screen.queryByText(questions[0].explanation)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Next Question|See Results/ })).not.toBeInTheDocument();
  });

  it('calls onAnswer with the index of the option picked', async () => {
    const onAnswer = vi.fn();
    render(<QuestionScreen {...baseProps} onAnswer={onAnswer} />);
    await userEvent.click(answerButton(questions[0].options[2]));
    expect(onAnswer).toHaveBeenCalledWith(2);
  });

  it('locks every option after an answer so it cannot be changed', async () => {
    const onAnswer = vi.fn();
    render(<Harness onAnswer={onAnswer} onNext={() => {}} />);
    await userEvent.click(answerButton(questions[0].options[0]));
    answerButtons().forEach((b) => expect(b).toBeDisabled());
    await userEvent.click(answerButton(questions[0].options[1]));
    expect(onAnswer).toHaveBeenCalledTimes(1);
    expect(onAnswer).toHaveBeenCalledWith(0);
  });

  it('marks a wrong pick as incorrect and still shows the right answer', async () => {
    render(<Harness onAnswer={() => {}} onNext={() => {}} />);
    await userEvent.click(answerButton(questions[0].options[0]));
    // The CSS classes are the only right/wrong marker the screen has
    expect(answerButton(questions[0].options[0])).toHaveClass('incorrect');
    expect(answerButton(questions[0].options[1])).toHaveClass('correct');
    expect(answerButton(questions[0].options[2])).not.toHaveClass('correct');
    expect(answerButton(questions[0].options[2])).not.toHaveClass('incorrect');
  });

  it('marks a right pick as correct with no option marked incorrect', async () => {
    render(<Harness onAnswer={() => {}} onNext={() => {}} />);
    await userEvent.click(answerButton(questions[0].options[1]));
    expect(answerButton(questions[0].options[1])).toHaveClass('correct');
    answerButtons().forEach((b) => expect(b).not.toHaveClass('incorrect'));
  });

  it('shows the explanation with its AWS source links after answering', async () => {
    render(<Harness onAnswer={() => {}} onNext={() => {}} />);
    await userEvent.click(answerButton(questions[0].options[1]));
    expect(screen.getByText(questions[0].explanation)).toBeInTheDocument();
    const link = screen.getByRole('link', { name: new RegExp(source.title) });
    expect(link).toHaveAttribute('href', source.url);
  });

  it('offers "Next Question" on any question but the last, and calls onNext', async () => {
    const onNext = vi.fn();
    render(<Harness onAnswer={() => {}} onNext={onNext} index={0} />);
    await userEvent.click(answerButton(questions[0].options[1]));
    await userEvent.click(screen.getByRole('button', { name: /Next Question/ }));
    expect(onNext).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: /See Results/ })).not.toBeInTheDocument();
  });

  it('offers "See Results" on the last question', () => {
    const onNext = vi.fn();
    render(<QuestionScreen {...baseProps} currentIndex={questions.length - 1} selectedAnswer={0} showExplanation onNext={onNext} />);
    expect(screen.getByText(`${questions.length} / ${questions.length}`)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /See Results/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Next Question/ })).not.toBeInTheDocument();
  });

  it('shows the session streak and accuracy from sessionStats', () => {
    render(<QuestionScreen {...baseProps} sessionStats={{ correct: 2, total: 3, streak: 2 }} />);
    const header = screen.getByRole('button', { name: /Quit/ }).parentElement;
    expect(within(header).getByText('67%')).toBeInTheDocument();
    expect(within(header).getByText('2')).toBeInTheDocument();
  });

  it('calls onQuit from the Quit button', async () => {
    const onQuit = vi.fn();
    render(<QuestionScreen {...baseProps} onQuit={onQuit} />);
    await userEvent.click(screen.getByRole('button', { name: /Quit/ }));
    expect(onQuit).toHaveBeenCalledTimes(1);
  });

  it('works with a real question from this app (its answer field is the one marked correct)', async () => {
    const real = domains[0].questions[0];
    const right = real[answerField(real)];
    render(<QuestionScreen {...baseProps} questions={[real]} selectedAnswer={right} showExplanation />);
    const buttons = screen.getAllByRole('button', { name: /^[A-Z]\s*/ }).filter((b) => b.classList.contains('answer-btn'));
    expect(buttons[right]).toHaveClass('correct');
  });
});
