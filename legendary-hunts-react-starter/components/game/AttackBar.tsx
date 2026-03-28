'use client';

import React from 'react';
import { StoneButton, type StoneButtonType } from '@/components/ui/Button';

const ORDER: StoneButtonType[] = ['light', 'medium', 'heavy', 'ultimate'];

const LABELS: Record<StoneButtonType, string> = {
  light: 'Light',
  medium: 'Medium',
  heavy: 'Heavy',
  ultimate: 'Ultimate',
};

export type AttackBarProps = {
  /** Attack tiers the player cannot use yet — dimmed stone */
  locked?: StoneButtonType[];
  onSelect?: (tier: StoneButtonType) => void;
};

/**
 * COMPONENT 3 — ATTACK BAR
 * Always visible in battle; locked attacks appear dimmed.
 */
export function AttackBar({ locked = [], onSelect }: AttackBarProps) {
  const lockedSet = new Set(locked);
  return (
    <div className="attack-bar" role="group" aria-label="Attack tiers">
      {ORDER.map((type) => (
        <StoneButton
          key={type}
          type={type}
          disabled={lockedSet.has(type)}
          onClick={() => onSelect?.(type)}
        >
          {LABELS[type]}
        </StoneButton>
      ))}
    </div>
  );
}
