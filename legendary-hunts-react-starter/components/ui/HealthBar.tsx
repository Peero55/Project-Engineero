import React from 'react';

/** COMPONENT 4 — Health (enemy or player): red / ember glow, stone frame */
export function HealthBar({
  label,
  value,
  max,
}: {
  label: string;
  value: number;
  max: number;
}) {
  const pct = max <= 0 ? 0 : Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="bar-frame bar-frame--hp">
      <div className="bar-frame__label">{label}</div>
      <div className="progress-track progress-track--hp">
        <div className="progress-fill progress-fill--hp" style={{ width: `${pct}%` }} />
      </div>
      <div className="bar-frame__values">
        {value} / {max}
      </div>
    </div>
  );
}
