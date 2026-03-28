'use client';

import React from 'react';

export type FeedbackType = 'correct' | 'damage' | 'xp' | 'failure';

/**
 * COMPONENT 6 — FEEDBACK LAYER
 * correct: gold burst, damage: shake, xp: floating text, failure: dim + red
 */
export function Feedback({ type, value, children }: { type: FeedbackType; value?: string; children?: React.ReactNode }) {
  return (
    <div className={`feedback-chip feedback-chip--${type}`} role="status">
      {value ? <span className="feedback-chip__value">{value}</span> : null}
      {children}
    </div>
  );
}

export function FeedbackLayer({ children }: { children: React.ReactNode }) {
  return (
    <div className="feedback-layer" aria-live="polite">
      {children}
    </div>
  );
}
