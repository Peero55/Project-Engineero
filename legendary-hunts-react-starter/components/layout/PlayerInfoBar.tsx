import React from 'react';

/** Compact header strip: identity + vital stats (carved bar, not floating pills). */
export function PlayerInfoBar({
  name,
  level,
  hp,
  maxHp,
  xpLabel,
}: {
  name: string;
  level: number;
  hp: number;
  maxHp: number;
  xpLabel?: string;
}) {
  const hpPct = Math.min(100, Math.round((hp / maxHp) * 100));
  return (
    <div className="player-info-bar">
      <div className="player-info-bar__identity">
        <span className="player-info-bar__name">{name}</span>
        <span className="player-info-bar__level">Lv.{level}</span>
      </div>
      <div className="player-info-bar__bars">
        <div className="player-info-bar__track player-info-bar__track--hp" title={`HP ${hp}/${maxHp}`}>
          <div className="player-info-bar__fill player-info-bar__fill--hp" style={{ width: `${hpPct}%` }} />
        </div>
        {xpLabel ? <div className="player-info-bar__xp">{xpLabel}</div> : null}
      </div>
    </div>
  );
}
