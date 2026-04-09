import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import type {
  AssetManifest,
  AssetEntry,
  AssetCategory,
  VariantTag,
  VariantCategory,
  AnimationMeta,
} from "../asset";

/**
 * Validates: Requirements 2.3
 * FOR ALL valid AssetManifest objects, serializing to JSON then parsing back
 * SHALL produce an equivalent object (round-trip property).
 */

const ASSET_CATEGORIES: AssetCategory[] = [
  "enemy",
  "environment",
  "effect",
  "icon",
  "ui_frame",
  "overlay",
];

const VARIANT_CATEGORIES: VariantCategory[] = ["pose", "lighting", "palette"];

const arbVariantTag: fc.Arbitrary<VariantTag> = fc.record({
  category: fc.constantFrom(...VARIANT_CATEGORIES),
  value: fc.stringMatching(/^[a-z0-9_]{1,20}$/),
});

const arbAnimationMeta: fc.Arbitrary<AnimationMeta> = fc.record({
  frameCount: fc.integer({ min: 1, max: 128 }),
  frameDuration: fc.integer({ min: 1, max: 5000 }),
  loop: fc.boolean(),
});

const arbAssetEntry: fc.Arbitrary<AssetEntry> = fc.record({
  assetKey: fc
    .tuple(
      fc.constantFrom(...ASSET_CATEGORIES),
      fc.stringMatching(/^[a-z0-9_]{1,30}$/),
    )
    .map(([cat, slug]) => `${cat}:${slug}`),
  filePath: fc
    .tuple(
      fc.constantFrom(...ASSET_CATEGORIES),
      fc.stringMatching(/^[a-z0-9_]{1,30}$/),
      fc.constantFrom("png", "webp"),
    )
    .map(([cat, slug, ext]) => `assets/${cat}/${slug}/${slug}.${ext}`),
  width: fc.integer({ min: 1, max: 8192 }),
  height: fc.integer({ min: 1, max: 8192 }),
  category: fc.constantFrom(...ASSET_CATEGORIES),
  variants: fc.option(fc.array(arbVariantTag, { minLength: 0, maxLength: 4 }), {
    nil: undefined,
  }),
  animation: fc.option(arbAnimationMeta, { nil: undefined }),
});

const arbAssetManifest: fc.Arbitrary<AssetManifest> = fc.record({
  schemaVersion: fc.integer({ min: 1, max: 100 }),
  generatedAt: fc
    .integer({
      min: new Date("2020-01-01T00:00:00.000Z").getTime(),
      max: new Date("2030-12-31T23:59:59.999Z").getTime(),
    })
    .map((ts) => new Date(ts).toISOString()),
  entries: fc.array(arbAssetEntry, { minLength: 0, maxLength: 10 }),
});

describe("AssetManifest round-trip serialization", () => {
  it("should survive JSON.stringify → JSON.parse without data loss", () => {
    fc.assert(
      fc.property(arbAssetManifest, (manifest) => {
        const json = JSON.stringify(manifest);
        const parsed: AssetManifest = JSON.parse(json);
        expect(parsed).toEqual(manifest);
      }),
    );
  });
});
