"use client";

import type { ReactNode } from "react";

export type FeedbackType = "correct" | "damage" | "xp" | "failure";

export function Feedback({
  type,
  value,
  children,
}: {
  type: FeedbackType;
  value?: string;
  children?: ReactNode;
}) {
  return (
    <div className={`feedback-chip feedback-chip--${type}`} role="status">
      {value ? <span>{value}</span> : null}
      {children}
    </div>
  );
}

export function FeedbackLayer({ children }: { children: ReactNode }) {
  return (
    <div className="feedback-layer" aria-live="polite">
      {children}
    </div>
  );
}
