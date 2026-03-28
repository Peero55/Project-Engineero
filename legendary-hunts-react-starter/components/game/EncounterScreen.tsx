'use client';

import React, { useState } from 'react';
import { ScreenShell } from '@/components/layout/ScreenShell';
import { PlayerInfoBar } from '@/components/layout/PlayerInfoBar';
import { Panel } from '@/components/ui/Panel';
import { HealthBar } from '@/components/ui/HealthBar';
import { XPBar } from '@/components/ui/XPBar';
import { AttackBar } from '@/components/game/AttackBar';
import { QuestionPanel } from '@/components/game/QuestionPanel';
import { FeedbackLayer, Feedback } from '@/components/game/FeedbackLayer';
import type { StoneButtonType } from '@/components/ui/Button';

/** SCREEN 2 — Encounter: enemy + HP, question, attack bar, feedback (global structure). */
export function EncounterScreen({
  playerName,
  playerLevel,
  playerHp,
  playerMaxHp,
  playerXp,
  playerXpMax,
  enemyName,
  enemyHp,
  enemyMaxHp,
  question,
  answers,
  correctIndex,
  lockedAttacks,
  questionLabel,
}: {
  playerName: string;
  playerLevel: number;
  playerHp: number;
  playerMaxHp: number;
  playerXp: number;
  playerXpMax: number;
  enemyName: string;
  enemyHp: number;
  enemyMaxHp: number;
  question: string;
  answers: string[];
  correctIndex: number;
  lockedAttacks?: StoneButtonType[];
  questionLabel?: string;
}) {
  const [lastHit, setLastHit] = useState<string | null>(null);

  return (
    <ScreenShell
      header={
        <PlayerInfoBar
          name={playerName}
          level={playerLevel}
          hp={playerHp}
          maxHp={playerMaxHp}
          xpLabel={`${playerXp} XP`}
        />
      }
      main={
        <Panel variant="battle" title={enemyName} subtitle={questionLabel ?? 'Domain encounter'} glow>
          <div className="encounter-main" style={{ display: 'grid', gap: 20 }}>
            <HealthBar label="Foe essence" value={enemyHp} max={enemyMaxHp} />
            <HealthBar label="Your resilience" value={playerHp} max={playerMaxHp} />
            <XPBar value={playerXp} max={playerXpMax} />
            <QuestionPanel
              question={question}
              answers={answers}
              correctIndex={correctIndex}
              onAnswer={(_, correct) => {
                setLastHit(correct ? 'correct' : 'incorrect');
              }}
            />
          </div>
        </Panel>
      }
      actionBar={
        <div className="action-bar-wrap">
          <p className="action-bar-wrap__label muted">Strike — ties difficulty to your swing</p>
          <AttackBar
            locked={lockedAttacks}
            onSelect={(tier) => setLastHit(`attack:${tier}`)}
          />
        </div>
      }
      feedback={
        <FeedbackLayer>
          {lastHit === 'correct' ? <Feedback type="correct" value="True strike" /> : null}
          {lastHit === 'incorrect' ? <Feedback type="failure" value="Glancing miss — see mentor" /> : null}
          {lastHit?.startsWith('attack:') ? (
            <Feedback type="xp" value={`${lastHit.replace('attack:', '')} swing`} />
          ) : null}
        </FeedbackLayer>
      }
    />
  );
}
