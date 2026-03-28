import React from 'react';
import { Panel } from '@/components/ui/Panel';

export type NpcDialogueProps = {
  npc: string;
  title?: string;
  text: React.ReactNode;
  portrait?: React.ReactNode;
  explainAction?: React.ReactNode;
};

/**
 * COMPONENT 7 — NPC DIALOG
 * [ Portrait ] [ Dialogue ]; optional explain control for mentor flows.
 */
export function NpcDialogue({ npc, title, text, portrait, explainAction }: NpcDialogueProps) {
  const heading = title ?? npc;
  return (
    <Panel variant="dashboard" glow>
      <div className="npc-dialogue">
        <div className="npc-dialogue__portrait" aria-hidden={!portrait}>
          {portrait ?? <div className="npc-dialogue__placeholder">{npc.slice(0, 1)}</div>}
        </div>
        <div className="npc-dialogue__body">
          <div className="npc-dialogue__name">{heading}</div>
          <div className="npc-dialogue__text">{text}</div>
          {explainAction ? <div className="npc-dialogue__action">{explainAction}</div> : null}
        </div>
      </div>
    </Panel>
  );
}
