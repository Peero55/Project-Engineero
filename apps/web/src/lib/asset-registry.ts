import type {
  AssetManifest,
  AssetEntry,
  AssetCategory,
  VariantCategory,
} from "@legendary-hunts/types";
import {
  ASSET_KEY_PATTERN,
  DEFAULT_VARIANTS,
  RECOGNIZED_VARIANTS,
} from "@legendary-hunts/types";

export interface ResolvedAsset {
  src: string;
  width: number;
  height: number;
  entry: AssetEntry;
}

export interface PreloadProgress {
  total: number;
  loaded: number;
  fraction: number;
}

/** All valid asset categories for type-safe iteration */
const ALL_CATEGORIES: AssetCategory[] = [
  "enemy",
  "environment",
  "effect",
  "icon",
  "ui_frame",
  "overlay",
];

/**
 * Determine which variant category a variant value belongs to.
 * Returns the first matching category, or null if unrecognized.
 */
function getVariantCategory(variant: string): VariantCategory | null {
  for (const [category, values] of Object.entries(RECOGNIZED_VARIANTS)) {
    if (values.includes(variant)) {
      return category as VariantCategory;
    }
  }
  return null;
}

export class AssetRegistry {
  private manifest: AssetManifest;
  private lookup: Map<string, AssetEntry>;
  private cache: Map<string, ResolvedAsset>;
  private imageCache: Map<string, HTMLImageElement>;
  private fallbacks: Map<AssetCategory, AssetEntry>;

  constructor(manifest: AssetManifest) {
    this.manifest = manifest;
    this.lookup = new Map();
    this.cache = new Map();
    this.imageCache = new Map();
    this.fallbacks = new Map();

    // Build lookup map from manifest entries
    for (const entry of manifest.entries) {
      this.lookup.set(entry.assetKey, entry);
    }

    // Build fallback map: entries keyed as "{category}:fallback"
    // or whose filePath contains "fallback/{category}"
    for (const category of ALL_CATEGORIES) {
      const fallbackKey = `${category}:fallback`;
      const byKey = this.lookup.get(fallbackKey);
      if (byKey) {
        this.fallbacks.set(category, byKey);
        continue;
      }
      // Search by path convention fallback/{category}
      const byPath = manifest.entries.find(
        (e) =>
          e.category === category &&
          e.filePath.includes(`fallback/${category}`),
      );
      if (byPath) {
        this.fallbacks.set(category, byPath);
      }
    }
  }

  /**
   * Resolve an asset key to a ResolvedAsset.
   * If a variant is provided, appends it to the key for lookup.
   * Returns null if the key is invalid or no entry is found.
   */
  resolve(assetKey: string, variant?: string): ResolvedAsset | null {
    const fullKey = variant ? `${assetKey}:${variant}` : assetKey;
    // Check resolution cache first
    if (this.cache.has(fullKey)) {
      return this.cache.get(fullKey)!;
    }

    // Validate key format
    const match = ASSET_KEY_PATTERN.exec(fullKey);
    if (!match) {
      console.warn(
        `[AssetRegistry] Invalid asset key format: "${fullKey}". Expected {category}:{slug} or {category}:{slug}:{variant}.`,
      );
      return null;
    }

    const entry = this.lookup.get(fullKey);
    if (!entry) {
      console.warn(`[AssetRegistry] Asset not found for key: "${fullKey}".`);
      return null;
    }

    const resolved: ResolvedAsset = {
      src: entry.filePath,
      width: entry.width,
      height: entry.height,
      entry,
    };
    this.cache.set(fullKey, resolved);
    return resolved;
  }

  /**
   * Get the fallback asset for a given category.
   * Returns a generic placeholder ResolvedAsset if no fallback entry exists.
   */
  getFallback(category: AssetCategory): ResolvedAsset {
    const entry = this.fallbacks.get(category);
    if (entry) {
      return {
        src: entry.filePath,
        width: entry.width,
        height: entry.height,
        entry,
      };
    }
    // Generic last-resort fallback when no fallback entry is registered
    const placeholder: AssetEntry = {
      assetKey: `${category}:fallback`,
      filePath: `/assets/fallback/${category}_fallback.png`,
      width: 128,
      height: 128,
      category,
    };
    return {
      src: placeholder.filePath,
      width: placeholder.width,
      height: placeholder.height,
      entry: placeholder,
    };
  }

  /**
   * Resolve with automatic fallback — never returns null.
   *
   * Fallback chain:
   * 1. Try resolve(assetKey, variant)
   * 2. If variant was requested and failed, try the default variant for that
   *    variant's category (e.g. "idle" for pose, "day" for lighting)
   * 3. Try resolve(assetKey) with no variant
   * 4. Return category fallback
   */
  resolveWithFallback(assetKey: string, variant?: string): ResolvedAsset {
    // Step 1: Try exact resolution
    const exact = this.resolve(assetKey, variant);
    if (exact) return exact;

    if (variant) {
      // Step 2: Try default variant for the variant's category
      const variantCat = getVariantCategory(variant);
      if (variantCat) {
        const defaultVariant = DEFAULT_VARIANTS[variantCat];
        if (defaultVariant !== variant) {
          const withDefault = this.resolve(assetKey, defaultVariant);
          if (withDefault) return withDefault;
        }
      }

      // Step 3: Try base key with no variant
      const base = this.resolve(assetKey);
      if (base) return base;
    }

    // Step 4: Extract category from key and return category fallback
    const catMatch = ASSET_KEY_PATTERN.exec(
      variant ? `${assetKey}:${variant}` : assetKey,
    );
    if (catMatch) {
      return this.getFallback(catMatch[1] as AssetCategory);
    }

    // Key didn't even parse — try extracting category from the raw prefix
    const colonIdx = assetKey.indexOf(":");
    if (colonIdx > 0) {
      const maybeCat = assetKey.substring(0, colonIdx);
      if (ALL_CATEGORIES.includes(maybeCat as AssetCategory)) {
        return this.getFallback(maybeCat as AssetCategory);
      }
    }

    // Absolute last resort: return enemy fallback as generic
    return this.getFallback("enemy");
  }

  /**
   * Return all manifest entries sharing the same category:slug prefix.
   * Accepts a base key like "enemy:fire_golem" and returns all variants.
   */
  getVariants(baseKey: string): AssetEntry[] {
    const prefix = baseKey.endsWith(":") ? baseKey : `${baseKey}:`;
    const results: AssetEntry[] = [];

    // Include the exact base key entry if it exists
    const baseEntry = this.lookup.get(baseKey);
    if (baseEntry) {
      results.push(baseEntry);
    }

    // Include all entries whose key starts with the prefix
    for (const [key, entry] of this.lookup) {
      if (key.startsWith(prefix)) {
        results.push(entry);
      }
    }

    return results;
  }

  /**
   * Validate that all manifest file paths are loadable via HEAD requests.
   * Returns { valid, errors } where errors lists unreachable paths.
   */
  async validate(): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    const checks = this.manifest.entries.map(async (entry) => {
      try {
        const response = await fetch(entry.filePath, { method: "HEAD" });
        if (!response.ok) {
          errors.push(
            `Asset "${entry.assetKey}" at "${entry.filePath}" returned HTTP ${response.status}`,
          );
        }
      } catch (err) {
        errors.push(
          `Asset "${entry.assetKey}" at "${entry.filePath}" failed to load: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    });

    await Promise.all(checks);
    return { valid: errors.length === 0, errors };
  }

  /**
   * Preload images for the given asset keys.
   * Resolves each key via the registry, loads the image via HTMLImageElement,
   * and stores it in imageCache. Already-cached images are counted immediately.
   * Reports progress via the optional onProgress callback after each load/fail.
   * Errors are logged but do not reject the returned promise.
   */
  async preload(
    assetKeys: string[],
    onProgress?: (progress: PreloadProgress) => void,
  ): Promise<void> {
    const total = assetKeys.length;
    if (total === 0) {
      onProgress?.({ total: 0, loaded: 0, fraction: 1 });
      return;
    }

    let loaded = 0;

    const report = () => {
      onProgress?.({
        total,
        loaded,
        fraction: total > 0 ? loaded / total : 1,
      });
    };

    const promises = assetKeys.map((key) => {
      return new Promise<void>((resolve) => {
        // Already cached — count immediately
        if (this.imageCache.has(key)) {
          loaded++;
          report();
          resolve();
          return;
        }

        // Resolve the key to get the file path
        const resolved = this.resolveWithFallback(key);
        const img = new Image();

        img.onload = () => {
          this.imageCache.set(key, img);
          loaded++;
          report();
          resolve();
        };

        img.onerror = () => {
          console.warn(
            `[AssetRegistry] Failed to preload image for key: "${key}" at "${resolved.src}".`,
          );
          loaded++;
          report();
          resolve();
        };

        // Setting src triggers the browser fetch (uses browser cache if available)
        img.src = resolved.src;
      });
    });

    await Promise.all(promises);
  }

  /**
   * Check if an asset key has been resolved (resolution cache) or preloaded (image cache).
   */
  isCached(assetKey: string): boolean {
    return this.cache.has(assetKey) || this.imageCache.has(assetKey);
  }
}
