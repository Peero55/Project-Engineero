"use client";

import type { LayoutZone } from "@legendary-hunts/types";
import { useAsset } from "@/hooks/useAsset";

export interface BackgroundProps {
  assetKey: string;
  zone: LayoutZone;
}

/**
 * Background layer component — renders the environment background image
 * scaled to fill the 16:9 viewport.
 *
 * Uses useAsset to resolve the asset key (supports lighting variants
 * via asset key variant suffix, e.g. "environment:dark_forest:night").
 *
 * Validates: Requirements 3.1, 5.2, 5.4, 15.2
 */
export function Background({ assetKey, zone }: BackgroundProps) {
  const { src, status } = useAsset(assetKey);

  return (
    <div
      data-testid="layer-background"
      style={{
        position: "absolute",
        left: `${zone.x}%`,
        top: `${zone.y}%`,
        width: `${zone.width}%`,
        height: `${zone.height}%`,
        zIndex: 10,
      }}
    >
      {status === "loaded" && src && (
        <img
          src={src}
          alt=""
          draggable={false}
          style={{
            display: "block",
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      )}
    </div>
  );
}
