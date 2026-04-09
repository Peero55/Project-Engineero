"use client";

import type { LayoutZone } from "@legendary-hunts/types";
import { useAsset } from "@/hooks/useAsset";

export interface MidgroundProps {
  assetKey?: string;
  zone: LayoutZone;
}

/**
 * Midground/parallax layer component — renders the midground image
 * when an asset key is provided, or an empty placeholder when absent.
 *
 * Positioned absolutely within the midground zone (bottom 60% of viewport).
 * Uses useAsset to resolve the asset key and display the image with cover fit.
 *
 * Validates: Requirements 3.1, 5.5, 15.2
 */
export function Midground({ assetKey, zone }: MidgroundProps) {
  const { src, status } = useAsset(assetKey ?? "");

  return (
    <div
      data-testid="layer-midground"
      style={{
        position: "absolute",
        left: `${zone.x}%`,
        top: `${zone.y}%`,
        width: `${zone.width}%`,
        height: `${zone.height}%`,
        zIndex: 20,
      }}
    >
      {assetKey && status === "loaded" && src && (
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
