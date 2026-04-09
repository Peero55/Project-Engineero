"use client";

import { useState, useEffect } from "react";
import { useAssetRegistry } from "@/contexts/AssetRegistryContext";
import { ASSET_KEY_PATTERN } from "@legendary-hunts/types";
import type { AssetCategory } from "@legendary-hunts/types";

export type AssetStatus = "loading" | "loaded" | "error";

export interface UseAssetResult {
  src: string | null;
  status: AssetStatus;
  width: number;
  height: number;
  error: string | null;
}

export interface UseAssetOptions {
  variant?: string;
}

/**
 * React hook that resolves an asset key to a loaded image.
 * Integrates with AssetRegistry preload cache for synchronous loaded state.
 * On error, automatically resolves the category-appropriate fallback.
 * On variant miss, falls back to default variant per Requirement 12 rules.
 *
 * Validates: Requirements 18.1, 18.2, 18.3, 18.4, 18.5, 18.6
 */
export function useAsset(
  assetKey: string,
  options?: UseAssetOptions,
): UseAssetResult {
  const registry = useAssetRegistry();
  const variant = options?.variant;

  // Compute cache key for synchronous check
  const cacheKey = variant ? `${assetKey}:${variant}` : assetKey;

  // Check if the asset is already preloaded/cached — return synchronously (Req 18.4)
  const initialState = (): UseAssetResult => {
    if (!registry) {
      return { src: null, status: "loading", width: 0, height: 0, error: null };
    }

    if (registry.isCached(cacheKey) || registry.isCached(assetKey)) {
      const resolved = registry.resolveWithFallback(assetKey, variant);
      return {
        src: resolved.src,
        status: "loaded",
        width: resolved.width,
        height: resolved.height,
        error: null,
      };
    }

    return { src: null, status: "loading", width: 0, height: 0, error: null };
  };

  const [result, setResult] = useState<UseAssetResult>(initialState);

  useEffect(() => {
    // No registry available — stay in loading state
    if (!registry) {
      setResult({
        src: null,
        status: "loading",
        width: 0,
        height: 0,
        error: null,
      });
      return;
    }

    // If already cached, resolve synchronously (Req 18.4)
    if (registry.isCached(cacheKey) || registry.isCached(assetKey)) {
      const resolved = registry.resolveWithFallback(assetKey, variant);
      setResult({
        src: resolved.src,
        status: "loaded",
        width: resolved.width,
        height: resolved.height,
        error: null,
      });
      return;
    }

    let cancelled = false;

    // Resolve the asset (handles variant fallback via resolveWithFallback — Req 18.5)
    const resolved = registry.resolveWithFallback(assetKey, variant);

    // Attempt to load the image
    const img = new Image();

    img.onload = () => {
      if (cancelled) return;
      setResult({
        src: resolved.src,
        status: "loaded",
        width: resolved.width,
        height: resolved.height,
        error: null,
      });
    };

    img.onerror = () => {
      if (cancelled) return;

      // On error, resolve category-appropriate fallback (Req 18.3)
      const catMatch = ASSET_KEY_PATTERN.exec(assetKey);
      const category = catMatch
        ? (catMatch[1] as AssetCategory)
        : ("enemy" as AssetCategory);
      const fallback = registry.getFallback(category);

      setResult({
        src: fallback.src,
        status: "error",
        width: fallback.width,
        height: fallback.height,
        error: `Failed to load asset: ${assetKey}`,
      });
    };

    img.src = resolved.src;

    return () => {
      cancelled = true;
    };
  }, [registry, assetKey, variant, cacheKey]);

  return result;
}
