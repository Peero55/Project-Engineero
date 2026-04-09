"use client";

import { useEffect, useMemo, useState } from "react";
import { AssetRegistryProvider } from "@/contexts/AssetRegistryProvider";
import { useAssetRegistry } from "@/contexts/AssetRegistryContext";
import {
  SceneCompositor,
  type EffectDescriptor,
} from "@/components/fantasy/scene";
import type { FXAnchorName } from "@legendary-hunts/types";

/* ------------------------------------------------------------------ */
/*  Public types                                                       */
/* ------------------------------------------------------------------ */

/** A single effect trigger from battle logic */
export interface BattleEffectTrigger {
  /** Effect slug, e.g. "attack_slash" */
  effectSlug: string;
  /** Named anchor for placement (defaults to "enemy_center") */
  anchor?: FXAnchorName;
  /** Display duration in ms (defaults to 800) */
  duration?: number;
  /** Unique id for this trigger instance */
  id: string;
}

/** Battle metadata used to drive the scene visuals */
export interface BattleSceneData {
  /** Enemy slug from battle data, e.g. "fire_golem" */
  enemySlug?: string;
  /** Environment identifier from battle metadata, e.g. "dark_forest" */
  environmentId?: string;
  /** Theme identifier from battle metadata */
  themeId?: string;
  /** Active effect triggers */
  effects?: BattleEffectTrigger[];
}

export interface BattleSceneProps extends BattleSceneData {
  /** Extra class name on the outer wrapper */
  className?: string;
  /** Children rendered inside the UIOverlay layer */
  children?: React.ReactNode;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Map enemy_slug → enemyKey via `enemy:{enemy_slug}` pattern (Req 4.1) */
export function toEnemyKey(slug?: string): string | undefined {
  return slug ? `enemy:${slug}` : undefined;
}

/** Map environment_id → environmentKey via `environment:{env_id}` pattern (Req 5.1) */
export function toEnvironmentKey(envId?: string): string | undefined {
  return envId ? `environment:${envId}` : undefined;
}

/** Map BattleEffectTrigger[] → EffectDescriptor[] with FXAnchorName values (Req 7.2, 7.3) */
export function toEffectDescriptors(
  triggers?: BattleEffectTrigger[],
): EffectDescriptor[] {
  if (!triggers?.length) return [];
  return triggers.map((t) => ({
    assetKey: `effect:${t.effectSlug}`,
    anchor: t.anchor ?? "enemy_center",
    duration: t.duration,
    id: t.id,
  }));
}

/* ------------------------------------------------------------------ */
/*  Loading placeholder                                                */
/* ------------------------------------------------------------------ */

/**
 * Placeholder shown while the AssetRegistry initialises.
 * Matches the scene visual style: dark 16:9 container with a subtle pulse.
 * Validates: Requirement 9.2
 */
function SceneLoadingPlaceholder() {
  return (
    <div
      data-testid="battle-scene-loading"
      style={{
        position: "relative",
        aspectRatio: "16 / 9",
        width: "100%",
        overflow: "hidden",
        background: "rgba(13, 24, 38, 0.96)",
        borderRadius: 12,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <span
        style={{
          color: "var(--lh-text-secondary, #9db2d1)",
          fontFamily: "var(--font-display), serif",
          fontSize: "1rem",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          animation: "pulse 1.8s ease-in-out infinite",
        }}
      >
        Preparing the battlefield…
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Inner scene (requires registry context)                            */
/* ------------------------------------------------------------------ */

function BattleSceneInner({
  enemySlug,
  environmentId,
  themeId,
  effects,
  className,
  children,
}: BattleSceneProps) {
  const registry = useAssetRegistry();
  const [preloaded, setPreloaded] = useState(false);

  const enemyKey = useMemo(() => toEnemyKey(enemySlug), [enemySlug]);
  const environmentKey = useMemo(
    () => toEnvironmentKey(environmentId),
    [environmentId],
  );
  const effectDescriptors = useMemo(
    () => toEffectDescriptors(effects),
    [effects],
  );

  // Collect all scene asset keys for preloading (Req 10.1)
  const sceneAssetKeys = useMemo(() => {
    const keys: string[] = [];
    if (enemyKey) keys.push(enemyKey);
    if (environmentKey) keys.push(environmentKey);
    for (const ed of effectDescriptors) {
      keys.push(ed.assetKey);
    }
    return keys;
  }, [enemyKey, environmentKey, effectDescriptors]);

  // Preload all scene assets before compositor renders (Req 10.1)
  useEffect(() => {
    if (!registry || sceneAssetKeys.length === 0) {
      setPreloaded(true);
      return;
    }

    let cancelled = false;
    setPreloaded(false);

    registry.preload(sceneAssetKeys).then(() => {
      if (!cancelled) {
        setPreloaded(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [registry, sceneAssetKeys]);

  // Show loading placeholder while registry initialises or assets preload (Req 9.2, 10.1)
  if (!registry || !preloaded) {
    return <SceneLoadingPlaceholder />;
  }

  return (
    <SceneCompositor
      enemyKey={enemyKey}
      environmentKey={environmentKey}
      themeId={themeId}
      effects={effectDescriptors}
      className={className}
    >
      {children}
    </SceneCompositor>
  );
}

/* ------------------------------------------------------------------ */
/*  Public component — wraps with AssetRegistryProvider                 */
/* ------------------------------------------------------------------ */

/**
 * Battle scene wrapper that maps battle data to SceneCompositor props.
 *
 * Wiring patterns:
 * - `enemySlug`      → `enemy:{enemy_slug}`       (Req 4.1)
 * - `environmentId`  → `environment:{env_id}`      (Req 5.1)
 * - `themeId`        → passed through              (Req 6.2)
 * - `effects`        → mapped with FXAnchorName    (Req 7.2, 7.3)
 *
 * Wraps children in AssetRegistryProvider so the scene is self-contained.
 * Shows a loading placeholder while the registry initialises (Req 9.2, 9.3).
 *
 * Validates: Requirements 4.1, 5.1, 6.2, 7.2, 7.3, 9.2, 9.3
 */
export function BattleScene(props: BattleSceneProps) {
  return (
    <AssetRegistryProvider>
      <BattleSceneInner {...props} />
    </AssetRegistryProvider>
  );
}
