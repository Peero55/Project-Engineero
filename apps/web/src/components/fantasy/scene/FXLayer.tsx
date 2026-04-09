"use client";

import { useState, useEffect } from "react";
import { FX_ANCHORS, DEFAULT_FX_ANCHOR } from "@legendary-hunts/types";
import type { FXAnchorName, LayoutZone } from "@legendary-hunts/types";
import { useAsset } from "@/hooks/useAsset";
import type { EffectDescriptor } from "./SceneCompositor";

const DEFAULT_DURATION = 800;

export interface FXLayerProps {
  effects: EffectDescriptor[];
  zone: LayoutZone;
}

/**
 * Resolves an anchor name to its position from FX_ANCHORS.
 * Unrecognized anchors default to screen_center with a console warning.
 */
function resolveAnchor(anchor: string) {
  if (anchor in FX_ANCHORS) {
    return FX_ANCHORS[anchor as FXAnchorName];
  }
  console.warn(
    `[FXLayer] Unrecognized anchor "${anchor}", defaulting to "${DEFAULT_FX_ANCHOR}"`,
  );
  return FX_ANCHORS[DEFAULT_FX_ANCHOR];
}

/** Individual effect renderer */
function EffectItem({ effect }: { effect: EffectDescriptor }) {
  const { src, status } = useAsset(effect.assetKey);
  const anchorPos = resolveAnchor(effect.anchor);
  const isFull = anchorPos.fillViewport === true;

  // Skip rendering and warn if asset failed to load (Req 7.5)
  if (status === "error") {
    console.warn(
      `[FXLayer] Effect asset failed to load: "${effect.assetKey}", skipping render`,
    );
    return null;
  }

  // Don't render while still loading
  if (status === "loading" || !src) {
    return null;
  }

  const style: React.CSSProperties = isFull
    ? {
        position: "absolute",
        left: 0,
        top: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }
    : {
        position: "absolute",
        left: `${anchorPos.x}%`,
        top: `${anchorPos.y}%`,
        transform: "translate(-50%, -50%)",
        pointerEvents: "none",
      };

  return (
    <img
      data-testid={`fx-effect-${effect.id}`}
      src={src}
      alt=""
      role="presentation"
      style={style}
    />
  );
}

/**
 * FXLayer — renders active effects at their anchor positions within the FX overlay zone.
 *
 * Internally tracks which effects are visible and auto-removes them after their
 * specified duration (default 800ms). Multiple simultaneous effects render without
 * z-order conflicts via natural DOM order within the layer.
 *
 * Validates: Requirements 7.1, 7.2, 7.4, 7.5, 14.5, 19.3, 19.4, 19.5
 */
export function FXLayer({ effects, zone }: FXLayerProps) {
  // Track which effect IDs are still visible (auto-removal after duration)
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set());

  // When new effects arrive, add them to visible set and schedule removal
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    for (const effect of effects) {
      // Add to visible set if not already present
      setVisibleIds((prev) => {
        if (prev.has(effect.id)) return prev;
        const next = new Set(prev);
        next.add(effect.id);
        return next;
      });

      // Schedule auto-removal after duration
      const duration = effect.duration ?? DEFAULT_DURATION;
      const timer = setTimeout(() => {
        setVisibleIds((prev) => {
          const next = new Set(prev);
          next.delete(effect.id);
          return next;
        });
      }, duration);
      timers.push(timer);
    }

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [effects]);

  // Clean up stale visible IDs that are no longer in the effects array
  useEffect(() => {
    const currentIds = new Set(effects.map((e) => e.id));
    setVisibleIds((prev) => {
      const next = new Set<string>();
      for (const id of prev) {
        if (currentIds.has(id)) next.add(id);
      }
      return next.size !== prev.size ? next : prev;
    });
  }, [effects]);

  // Only render effects that are both in the props array and still visible
  const activeEffects = effects.filter((e) => visibleIds.has(e.id));

  return (
    <div
      data-testid="layer-fx"
      style={{
        position: "absolute",
        left: `${zone.x}%`,
        top: `${zone.y}%`,
        width: `${zone.width}%`,
        height: `${zone.height}%`,
        zIndex: 40,
        pointerEvents: "none",
      }}
    >
      {activeEffects.map((effect) => (
        <EffectItem key={effect.id} effect={effect} />
      ))}
    </div>
  );
}
