import type { ReactNode } from "react";

/**
 * Question + choices embedded in combat. Answering is the wind-up; AttackBar strike confirms.
 */
export function QuestionPanel({
  flash,
  prompt,
  options,
  loading,
  pickedOptionId,
  onPickOption,
  footerHint,
}: {
  flash: "correct" | "incorrect" | null;
  prompt: string;
  options: Array<{ id: string; label: string; text: string }>;
  loading: boolean;
  pickedOptionId: string | null;
  onPickOption: (id: string) => void;
  footerHint?: ReactNode;
}) {
  const cardClass =
    flash === "correct"
      ? "question-card question-card--correct"
      : flash === "incorrect"
        ? "question-card question-card--incorrect"
        : "question-card";

  return (
    <div className={cardClass}>
      <div className="muted">Encounter</div>
      <h3 className="question-card__prompt">{prompt}</h3>
      <div className="answer-list" role="list">
        {options.map((o, index) => {
          const letter = String.fromCharCode(65 + index);
          const picked = pickedOptionId === o.id;
          let choiceClass = "answer-choice";
          if (picked) choiceClass += " answer-choice--right";
          return (
            <button
              key={o.id}
              type="button"
              role="listitem"
              className={choiceClass}
              disabled={loading}
              onClick={() => onPickOption(o.id)}
            >
              <span className="answer-choice__letter">{letter}</span>
              <span>
                <span style={{ fontWeight: 700, marginRight: 6 }}>{o.label}.</span>
                {o.text}
              </span>
            </button>
          );
        })}
      </div>
      {footerHint}
    </div>
  );
}
