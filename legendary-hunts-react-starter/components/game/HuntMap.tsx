import React from 'react';
import { Panel } from '@/components/ui/Panel';

export type MapNodeType = 'start' | 'encounter' | 'trial' | 'boss' | 'locked';

export function MapNode({
  type,
  label,
  done,
  current,
}: {
  type: MapNodeType;
  label: string;
  done?: boolean;
  current?: boolean;
}) {
  const cls = ['map-node', `map-node--${type}`, done ? 'map-node--done' : '', current ? 'map-node--current' : '']
    .filter(Boolean)
    .join(' ');
  return (
    <button type="button" className={cls} disabled={type === 'locked'}>
      <span className="map-node__glyph" />
      <span className="map-node__label">{label}</span>
    </button>
  );
}

/**
 * COMPONENT 9 — MAP
 * Zone nodes — paths — boss; locked dim, completed glow.
 */
export function HuntMap({ children }: { children: React.ReactNode }) {
  return (
    <Panel variant="battle" title="Hunt map" subtitle="World path (preview)" glow>
      <div className="hunt-map" role="list">
        {children}
      </div>
    </Panel>
  );
}
