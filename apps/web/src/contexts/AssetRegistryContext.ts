"use client";

import { createContext, useContext } from "react";
import type { AssetRegistry } from "@/lib/asset-registry";

/**
 * React context providing the AssetRegistry instance to the component tree.
 * The provider (Task 12.1) will load the manifest and supply the registry.
 */
export const AssetRegistryContext = createContext<AssetRegistry | null>(null);

/**
 * Hook to access the AssetRegistry from context.
 * Returns null when no provider is mounted (e.g. during SSR or before init).
 */
export function useAssetRegistry(): AssetRegistry | null {
  return useContext(AssetRegistryContext);
}
