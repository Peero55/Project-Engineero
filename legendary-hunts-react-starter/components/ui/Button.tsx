import React from 'react';

export type StoneButtonType = 'light' | 'medium' | 'heavy' | 'ultimate';

const typeClass: Record<StoneButtonType, string> = {
  light: 'btn-stone btn-stone--light',
  medium: 'btn-stone btn-stone--medium',
  heavy: 'btn-stone btn-stone--heavy',
  ultimate: 'btn-stone btn-stone--ultimate',
};

/**
 * COMPONENT 2 — BUTTON (stone + rune glow)
 * light = gold (easy), medium = blue, heavy = orange, ultimate = crimson / high risk
 */
export function StoneButton({
  type,
  children,
  disabled,
  onClick,
  className = '',
}: {
  type: StoneButtonType;
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={`${typeClass[type]} ${disabled ? 'btn-stone--disabled' : ''} ${className}`.trim()}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
