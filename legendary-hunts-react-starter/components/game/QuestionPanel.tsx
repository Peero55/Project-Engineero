'use client';

import React, { useState } from 'react';

export type AnswerResult = 'idle' | 'correct' | 'incorrect';

export type QuestionPanelProps = {
  question: string;
  answers: string[];
  correctIndex?: number;
  onAnswer?: (index: number, correct: boolean) => void;
};

/**
 * COMPONENT 5 — QUESTION PANEL
 * Click → feedback; correct → gold emphasis; incorrect → red flash (MVP local state).
 */
export function QuestionPanel({ question, answers, correctIndex = 1, onAnswer }: QuestionPanelProps) {
  const [result, setResult] = useState<AnswerResult>('idle');
  const [picked, setPicked] = useState<number | null>(null);

  function pick(index: number) {
    if (result !== 'idle') return;
    const correct = index === correctIndex;
    setPicked(index);
    setResult(correct ? 'correct' : 'incorrect');
    onAnswer?.(index, correct);
  }

  const cardClass =
    result === 'correct'
      ? 'question-card question-card--correct'
      : result === 'incorrect'
        ? 'question-card question-card--incorrect'
        : 'question-card';

  return (
    <div className={cardClass}>
      <div className="muted">Encounter</div>
      <h3 className="question-card__prompt">{question}</h3>
      <div className="answer-list" role="list">
        {answers.map((answer, index) => {
          const letter = String.fromCharCode(65 + index);
          let choiceClass = 'answer-choice';
          if (picked === index) {
            choiceClass += index === correctIndex ? ' answer-choice--right' : ' answer-choice--wrong';
          }
          return (
            <button
              key={answer}
              type="button"
              className={choiceClass}
              onClick={() => pick(index)}
              disabled={result !== 'idle'}
            >
              <span className="answer-choice__letter">{letter}</span>
              <span>{answer}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
