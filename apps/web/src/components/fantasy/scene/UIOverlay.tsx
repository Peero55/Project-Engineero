"use client";

import { LAYOUT_CONTRACT } from "@legendary-hunts/types";
import type { LayoutZone } from "@legendary-hunts/types";

export interface UIOverlayProps {
  children?: React.ReactNode;
  zone: LayoutZone;
}

/**
 * UIOverlay — full-viewport HUD layer that mounts sub-component slots
 * at Layout Contract positions for question panel, enemy info bar, and player HUD.
 *
 * The overlay itself is pointer-events: none so clicks pass through to layers below.
 * Individual slot divs re-enable pointer-events so mounted UI components remain interactive.
 *
 * Validates: Requirements 3.5, 15.4
 */
export function UIOverlay({ children, zone }: UIOverlayProps) {
  const questionPanel = LAYOUT_CONTRACT.questionPanel;
  const enemyInfoBar = LAYOUT_CONTRACT.enemyInfoBar;
  const playerHUD = LAYOUT_CONTRACT.playerHUD;

  return (
    <div
      data-testid="layer-ui-overlay"
      style={{
        position: "absolute",
        left: `${zone.x}%`,
        top: `${zone.y}%`,
        width: `${zone.width}%`,
        height: `${zone.height}%`,
        zIndex: 50,
        pointerEvents: "none",
      }}
    >
      {/* Enemy Info Bar — top area */}
      <div
        data-testid="slot-enemy-info-bar"
        style={{
          position: "absolute",
          left: `${enemyInfoBar.x}%`,
          top: `${enemyInfoBar.y}%`,
          width: `${enemyInfoBar.width}%`,
          height: `${enemyInfoBar.height}%`,
          pointerEvents: "auto",
        }}
      />

      {/* Player HUD — bottom-left */}
      <div
        data-testid="slot-player-hud"
        style={{
          position: "absolute",
          left: `${playerHUD.x}%`,
          top: `${playerHUD.y}%`,
          width: `${playerHUD.width}%`,
          height: `${playerHUD.height}%`,
          pointerEvents: "auto",
        }}
      />

      {/* Question Panel — bottom center */}
      <div
        data-testid="slot-question-panel"
        style={{
          position: "absolute",
          left: `${questionPanel.x}%`,
          top: `${questionPanel.y}%`,
          width: `${questionPanel.width}%`,
          height: `${questionPanel.height}%`,
          pointerEvents: "auto",
        }}
      />

      {/* Flexible child composition */}
      {children}
    </div>
  );
}
