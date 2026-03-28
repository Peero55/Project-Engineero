import React from 'react';

export type PanelVariant = 'default' | 'battle' | 'dashboard';

/**
 * COMPONENT 1 — PANEL (foundation)
 * Material: stone + metal, beveled edges, optional faint rune glow.
 */
export function Panel({
  title,
  subtitle,
  variant = 'default',
  glow = false,
  children,
}: {
  title?: string;
  subtitle?: string;
  variant?: PanelVariant;
  glow?: boolean;
  children: React.ReactNode;
}) {
  const mods = ['panel', `panel--${variant}`, glow ? 'panel--glow' : ''].filter(Boolean).join(' ');
  return (
    <section className={mods}>
      {(title || subtitle) && (
        <header className="panel-header">
          {title && <div className="panel-title">{title}</div>}
          {subtitle && <div className="panel-subtitle">{subtitle}</div>}
        </header>
      )}
      <div className="panel-body">{children}</div>
    </section>
  );
}
