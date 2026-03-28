import React from 'react';
import { Panel } from '@/components/ui/Panel';
import { ProgressBar } from '@/components/ui/ProgressBar';

export function SkillBar({ topic, value }: { topic: string; value: number }) {
  const v = Math.min(100, Math.max(0, value));
  return (
    <div className="skill-bar">
      <div className="skill-bar__head">
        <span>{topic}</span>
        <span className="skill-bar__pct">{v}%</span>
      </div>
      <ProgressBar value={v} />
    </div>
  );
}

/**
 * COMPONENT 8 — MASTERY DASHBOARD
 * Player info + skill bars + weak areas + rewards placeholder
 */
export function MasteryDashboard({
  playerSlot,
  skills,
  weakAreas,
  rewards,
}: {
  playerSlot: React.ReactNode;
  skills: { topic: string; value: number }[];
  weakAreas: React.ReactNode;
  rewards?: React.ReactNode;
}) {
  return (
    <div className="mastery-dashboard grid grid-2">
      <Panel variant="dashboard" title="Path mastery" subtitle="Topic strength (preview)">
        {playerSlot}
        <div className="skill-bar-list">
          {skills.map((s) => (
            <SkillBar key={s.topic} topic={s.topic} value={s.value} />
          ))}
        </div>
      </Panel>
      <div className="grid" style={{ gap: 18 }}>
        <Panel variant="dashboard" title="Weak areas">
          {weakAreas}
        </Panel>
        {rewards ? <Panel variant="dashboard" title="Rewards">{rewards}</Panel> : null}
      </div>
    </div>
  );
}
