/**
 * Property-based test for manifest generator completeness.
 *
 * **Validates: Requirement 11.6**
 * FOR ALL asset files present in the scanned directories, THE generated manifest
 * SHALL contain exactly one entry per valid asset file (no duplicates, no omissions).
 */
import { describe, it, expect, afterEach } from "vitest";
import * as fc from "fast-check";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { generateManifest } from "../generate-manifest";
import type { AssetCategory } from "@legendary-hunts/types";

// Minimal valid 1x1 PNG buffer
const MINIMAL_PNG = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49,
  0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x02,
  0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xde, 0x00, 0x00, 0x00, 0x0c, 0x49, 0x44,
  0x41, 0x54, 0x08, 0xd7, 0x63, 0xf8, 0xcf, 0xc0, 0x00, 0x00, 0x00, 0x02, 0x00,
  0x01, 0xe2, 0x21, 0xbc, 0x33, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44,
  0xae, 0x42, 0x60, 0x82,
]);

const VALID_CATEGORIES: AssetCategory[] = [
  "enemy",
  "environment",
  "effect",
  "icon",
  "ui_frame",
  "overlay",
];

const RECOGNIZED_VARIANTS = [
  "idle",
  "attack",
  "hurt",
  "defeated",
  "day",
  "night",
  "dramatic",
];

// Track temp dirs for cleanup
const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs) {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  }
  tempDirs.length = 0;
});

/** Arbitrary for generating a valid asset file config */
interface AssetFileConfig {
  category: AssetCategory;
  slug: string;
  variant?: string;
}

/** Generate a valid slug: lowercase letters and underscores, 3-12 chars */
const slugArb = fc
  .stringMatching(/^[a-z][a-z_]{1,10}[a-z]$/)
  .filter((s) => !s.includes("__"));

/** Generate a valid asset file configuration */
const assetFileConfigArb: fc.Arbitrary<AssetFileConfig> = fc.record({
  category: fc.constantFrom(...VALID_CATEGORIES),
  slug: slugArb,
  variant: fc.option(fc.constantFrom(...RECOGNIZED_VARIANTS), {
    nil: undefined,
  }),
});

/**
 * Generate a unique set of asset file configs (no duplicate category+slug+variant combos).
 */
const assetFileSetArb = fc.uniqueArray(assetFileConfigArb, {
  minLength: 1,
  maxLength: 15,
  comparator: (a, b) =>
    `${a.category}:${a.slug}:${a.variant ?? ""}` ===
    `${b.category}:${b.slug}:${b.variant ?? ""}`,
});

function createTempAssetDir(configs: AssetFileConfig[]): {
  assetsDir: string;
  outputPath: string;
  expectedKeys: string[];
} {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "manifest-pbt-"));
  tempDirs.push(tmpDir);

  const assetsDir = path.join(tmpDir, "assets");
  const outputPath = path.join(tmpDir, "manifest.json");
  const expectedKeys: string[] = [];

  for (const config of configs) {
    const slugDir = path.join(assetsDir, config.category, config.slug);
    fs.mkdirSync(slugDir, { recursive: true });

    const filename = config.variant
      ? `${config.slug}_${config.variant}.png`
      : `${config.slug}.png`;

    fs.writeFileSync(path.join(slugDir, filename), MINIMAL_PNG);

    const key = config.variant
      ? `${config.category}:${config.slug}:${config.variant}`
      : `${config.category}:${config.slug}`;
    expectedKeys.push(key);
  }

  return { assetsDir, outputPath, expectedKeys };
}

describe("Manifest Generator Completeness (Property)", () => {
  it("generates exactly one entry per valid asset file — no duplicates, no omissions", async () => {
    await fc.assert(
      fc.asyncProperty(assetFileSetArb, async (configs) => {
        const { assetsDir, outputPath, expectedKeys } =
          createTempAssetDir(configs);

        const result = await generateManifest({
          assetsDir,
          outputPath,
        });

        const manifestKeys = result.manifest.entries.map((e) => e.assetKey);

        // No duplicates
        const uniqueKeys = new Set(manifestKeys);
        expect(uniqueKeys.size).toBe(manifestKeys.length);

        // Exact match: every expected key is present, no extra keys
        expect(manifestKeys.sort()).toEqual(expectedKeys.sort());

        // Entry count matches
        expect(result.manifest.entries.length).toBe(expectedKeys.length);
      }),
      { numRuns: 30 },
    );
  });
});
