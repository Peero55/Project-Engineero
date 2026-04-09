"use client";

import { useMemo, type ReactNode } from "react";
import { AssetRegistryContext } from "./AssetRegistryContext";
import { AssetRegistry } from "@/lib/asset-registry";
import manifest from "@/data/asset-manifest.json";
import type { AssetManifest } from "@legendary-hunts/types";

/**
 * Provides an AssetRegistry instance to the component tree.
 * Loads asset-manifest.json at module scope and creates the registry once.
 *
 * Validates: Requirements 1.5, 18.6
 */
export function AssetRegistryProvider({ children }: { children: ReactNode }) {
  const registry = useMemo(
    () => new AssetRegistry(manifest as AssetManifest),
    [],
  );

  return (
    <AssetRegistryContext.Provider value={registry}>
      {children}
    </AssetRegistryContext.Provider>
  );
}
