import { describe, it, expect, vi, beforeAll } from "vitest";
import * as fc from "fast-check";
import type { AssetManifest, AssetCategory } from "@legendary-hunts/types";
import { AssetRegistry } from "../asset-registry";

/**
 * **Validates: Requirements 1.2, 9.1, 9.4**
 *
 * Property: For any asset key string and any variant string,
 * `resolveWithFallback` never returns null. The registry always
 * provides a ResolvedAsset — either the matched entry or a
 * category-appropriate fallback.
 */

const ALL_CATEGORIES: AssetCategory[] = [
  "enemy",
  "environment",
  "effect",
  "icon",
  "ui_frame",
  "overlay",
];

const fallbackManifest: AssetManifest = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  entries: ALL_CATEGORIES.map((category) => ({
    assetKey: `${category}:fallback`,
    filePath: `/assets/fallback/${category}_fallback.png`,
    width: 128,
    height: 128,
    category,
  })),
};

let registry: AssetRegistry;

beforeAll(() => {
  // Suppress expected console.warn from missing key lookups
  vi.spyOn(console, "warn").mockImplementation(() => {});
  registry = new AssetRegistry(fallbackManifest);
});

describe("AssetRegistry resolveWithFallback guarantee", () => {
  it("never returns null for random asset key strings", () => {
    fc.assert(
      fc.property(fc.string(), (randomKey) => {
        const result = registry.resolveWithFallback(randomKey);
        expect(result).not.toBeNull();
        expect(result).toHaveProperty("src");
        expect(result).toHaveProperty("width");
        expect(result).toHaveProperty("height");
        expect(result).toHaveProperty("entry");
      }),
    );
  });

  it("never returns null for valid category:slug keys", () => {
    const categoryArb = fc.constantFrom(...ALL_CATEGORIES);
    const slugArb = fc.stringMatching(/^[a-z0-9_]{1,30}$/);

    fc.assert(
      fc.property(categoryArb, slugArb, (category, slug) => {
        const key = `${category}:${slug}`;
        const result = registry.resolveWithFallback(key);
        expect(result).not.toBeNull();
        expect(result).toHaveProperty("src");
        expect(typeof result.src).toBe("string");
      }),
    );
  });

  it("never returns null for valid keys with random variant strings", () => {
    const categoryArb = fc.constantFrom(...ALL_CATEGORIES);
    const slugArb = fc.stringMatching(/^[a-z0-9_]{1,30}$/);
    const variantArb = fc.string({ minLength: 0, maxLength: 30 });

    fc.assert(
      fc.property(
        categoryArb,
        slugArb,
        variantArb,
        (category, slug, variant) => {
          const key = `${category}:${slug}`;
          const result = registry.resolveWithFallback(
            key,
            variant || undefined,
          );
          expect(result).not.toBeNull();
          expect(result).toHaveProperty("src");
          expect(typeof result.src).toBe("string");
        },
      ),
    );
  });
});
