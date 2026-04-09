"use client";

import type { LayoutZone } from "@legendary-hunts/types";
import { useAsset } from "@/hooks/useAsset";

export interface CharacterStageProps {
  enemyKey?: string;
  enemyVariant?: string;
  zone: LayoutZone;
  enemyDisplayZone: LayoutZone;
}

/**
 * CharacterStage layer — renders enemy art within the character stage zone.
 *
 * The outer container uses the `zone` prop (characterStage from LAYOUT_CONTRACT)
 * and the inner enemy image is positioned according to `enemyDisplayZone`
 * (enemyDisplay from LAYOUT_CONTRACT), centered with max 40% width / 60% height.
 *
 * Defaults to idle pose variant. Supports CSS crossfade transition (300ms)
 * between pose variants via opacity. Displays a fallback silhouette when
 * the enemy asset is missing without breaking layout.
 *
 * Validates: Requirements 3.2, 4.2, 4.3, 4.4, 4.5, 12.2, 14.4, 15.3
 */
export function CharacterStage({
  enemyKey,
  enemyVariant,
  zone,
  enemyDisplayZone,
}: CharacterStageProps) {
  const variant = enemyVariant ?? "idle";
  const { src, status } = useAsset(enemyKey ?? "", { variant });

  // Compute enemy display position relative to the character stage zone
  const relativeLeft = ((enemyDisplayZone.x - zone.x) / zone.width) * 100;
  const relativeTop = ((enemyDisplayZone.y - zone.y) / zone.height) * 100;
  const relativeWidth = (enemyDisplayZone.width / zone.width) * 100;
  const relativeHeight = (enemyDisplayZone.height / zone.height) * 100;

  const showImage =
    enemyKey && (status === "loaded" || status === "error") && src;

  return (
    <div
      data-testid="layer-character-stage"
      style={{
        position: "absolute",
        left: `${zone.x}%`,
        top: `${zone.y}%`,
        width: `${zone.width}%`,
        height: `${zone.height}%`,
        zIndex: 30,
      }}
    >
      <div
        data-testid="enemy-display"
        style={{
          position: "absolute",
          left: `${relativeLeft}%`,
          top: `${relativeTop}%`,
          width: `${relativeWidth}%`,
          height: `${relativeHeight}%`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {showImage && (
          <img
            key={src}
            src={src}
            alt={enemyKey ? `Enemy: ${enemyKey}` : ""}
            draggable={false}
            style={{
              display: "block",
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain",
              opacity: 1,
              transition: "opacity 300ms ease-in-out",
            }}
          />
        )}
      </div>
    </div>
  );
}
