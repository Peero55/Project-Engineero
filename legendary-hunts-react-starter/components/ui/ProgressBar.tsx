/** Neutral progress (e.g. hunt %). For HP/XP use HealthBar / XPBar */
export function ProgressBar({ value }: { value: number }) {
  const v = Math.min(100, Math.max(0, value));
  return (
    <div className="progress-track progress-track--neutral">
      <div className="progress-fill progress-fill--neutral" style={{ width: `${v}%` }} />
    </div>
  );
}
