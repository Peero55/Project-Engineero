"use client";

import {
  LAYOUT_CONTRACT,
  THEME_MAP,
  DEFAULT_THEME_ID,
  DEFAULT_THEME_TOKENS,
} from "@legendary-hunts/types";
import type { FXAnchorName, ThemeTokenSet } from "@legendary-hunts/types";

import { Background } from "./Background";
import { Midground } from "./Midground";
import { CharacterStage } from "./CharacterStage";
import { FXLayer } from "./FXLayer";
import { UIOverlay } from "./UIOverlay";

export interface EffectDescriptor {
  assetKey: string;
  anchor: FXAnchorName;
  duration?: number; // ms, defaults to 800
  id: string;
}

export interface SceneCompositorProps {
  environmentKey?: string;
  enemyKey?: string;
  effects?: EffectDescriptor[];
  themeId?: string;
  midgroundKey?: string;
  children?: React.ReactNode;
  className?: string;
}

/**
 * Root 16:9 aspect-ratio container for the battle scene.
 * Stacks five layers via z-index: Background (10), Midground (20),
 * CharacterStage (30), FXLayer (40), UIOverlay (50).
 *
 * Applies theme CSS custom properties on the container element.
 * Falls back to DEFAULT_THEME_ID when themeId is missing or unrecognized.
 * Renders a complete fallback scene when no props are provided.
 *
 * Validates: Requirements 3.1, 3.3, 3.4, 3.5, 6.2, 6.3, 9.3, 9.4,
 *            13.6, 15.1, 15.5, 15.6, 17.3
 */
export function SceneCompositor({
  environmentKey = "environment:fallback",
  enemyKey = "enemy:fallback",
  effects = [],
  themeId,
  midgroundKey,
  children,
  className,
}: SceneCompositorProps) {
  // Resolve theme tokens — fall back to default when missing or unrecognized
  const resolvedThemeId =
    themeId && themeId in THEME_MAP ? themeId : DEFAULT_THEME_ID;
  const tokens: ThemeTokenSet =
    THEME_MAP[resolvedThemeId] ?? DEFAULT_THEME_TOKENS;

  // Apply theme tokens as CSS custom properties via inline style
  const themeStyle: React.CSSProperties = {
    position: "relative",
    aspectRatio: "16 / 9",
    width: "100%",
    overflow: "hidden",
    ...tokens,
  };

  return (
    <div
      data-testid="scene-compositor"
      data-theme={resolvedThemeId}
      className={className}
      style={themeStyle}
    >
      <Background assetKey={environmentKey} zone={LAYOUT_CONTRACT.background} />
      <Midground assetKey={midgroundKey} zone={LAYOUT_CONTRACT.midground} />
      <CharacterStage
        enemyKey={enemyKey}
        zone={LAYOUT_CONTRACT.characterStage}
        enemyDisplayZone={LAYOUT_CONTRACT.enemyDisplay}
      />
      <FXLayer effects={effects} zone={LAYOUT_CONTRACT.fxOverlay} />
      <UIOverlay zone={LAYOUT_CONTRACT.uiOverlay}>{children}</UIOverlay>
    </div>
  );
}
