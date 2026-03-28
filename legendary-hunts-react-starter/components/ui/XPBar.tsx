import React from 'react';

/** COMPONENT 4 — XP: gold / arcane glow */
export function XPBar({
  label = 'Experience',
  value,
  max,
}: {
  label?: string;
  value: number;
  max: number;
}) {
  const pct = max <= 0 ? 0 : Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="bar-frame bar-frame--xp">
      <div className="bar-frame__label">{label}</div>
      <div className="progress-track progress-track--xp">
        <div className="progress-fill progress-fill--xp" style={{ width: `${pct}%` }} />
      </div>
      <div className="bar-frame__values">
        {value} / {max}
      </div>
    </div>
  );
}
