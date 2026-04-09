/**
 * Unit tests for manifest generator.
 *
 * **Validates: Requirements 11.1, 11.2, 11.4, 11.7, 12.6**
 */
import { describe, it, expect, afterEach } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { generateManifest } from "../generate-manifest";

// Minimal valid 1x1 PNG buffer
const MINIMAL_PNG = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49,
  0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x02,
  0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xde, 0x00, 0x00, 0x00, 0x0c, 0x49, 0x44,
  0x41, 0x54, 0x08, 0xd7, 0x63, 0xf8, 0xcf, 0xc0, 0x00, 0x00, 0x00, 0x02, 0x00,
  0x01, 0xe2, 0x21, 0xbc, 0x33, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44,
  0xae, 0x42, 0x60, 0x82,
]);

// Track temp dirs for cleanup
const tempDirs: string[] = [];

function makeTmpDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "manifest-unit-"));
  tempDirs.push(dir);
  return dir;
}

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

/** Helper: create a file inside the temp assets dir */
function createAssetFile(
  assetsDir: string,
  relativePath: string,
  content: Buffer = MINIMAL_PNG,
): void {
  const fullPath = path.join(assetsDir, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content);
}

describe("Manifest Generator — Key Inference (Req 11.1, 11.2)", () => {
  it("infers key from folder path: enemy/fire_golem/fire_golem.png → enemy:fire_golem", async () => {
    const tmpDir = makeTmpDir();
    const assetsDir = path.join(tmpDir, "assets");
    const outputPath = path.join(tmpDir, "manifest.json");

    createAssetFile(assetsDir, "enemy/fire_golem/fire_golem.png");

    const result = await generateManifest({ assetsDir, outputPath });

    expect(result.manifest.entries).toHaveLength(1);
    expect(result.manifest.entries[0].assetKey).toBe("enemy:fire_golem");
    expect(result.manifest.entries[0].category).toBe("enemy");
    expect(result.manifest.entries[0].width).toBe(1);
    expect(result.manifest.entries[0].height).toBe(1);
  });
});

describe("Manifest Generator — Variant Detection and Tagging (Req 11.2, 12.6)", () => {
  it("detects pose variant: enemy/fire_golem/fire_golem_idle.png → enemy:fire_golem:idle with pose tag", async () => {
    const tmpDir = makeTmpDir();
    const assetsDir = path.join(tmpDir, "assets");
    const outputPath = path.join(tmpDir, "manifest.json");

    createAssetFile(assetsDir, "enemy/fire_golem/fire_golem_idle.png");

    const result = await generateManifest({ assetsDir, outputPath });

    expect(result.manifest.entries).toHaveLength(1);
    const entry = result.manifest.entries[0];
    expect(entry.assetKey).toBe("enemy:fire_golem:idle");
    expect(entry.variants).toEqual([{ category: "pose", value: "idle" }]);
  });

  it("detects lighting variant: environment/dark_forest/dark_forest_night.png → environment:dark_forest:night with lighting tag", async () => {
    const tmpDir = makeTmpDir();
    const assetsDir = path.join(tmpDir, "assets");
    const outputPath = path.join(tmpDir, "manifest.json");

    createAssetFile(assetsDir, "environment/dark_forest/dark_forest_night.png");

    const result = await generateManifest({ assetsDir, outputPath });

    expect(result.manifest.entries).toHaveLength(1);
    const entry = result.manifest.entries[0];
    expect(entry.assetKey).toBe("environment:dark_forest:night");
    expect(entry.variants).toEqual([{ category: "lighting", value: "night" }]);
  });

  it("warns on unrecognized variant suffix", async () => {
    const tmpDir = makeTmpDir();
    const assetsDir = path.join(tmpDir, "assets");
    const outputPath = path.join(tmpDir, "manifest.json");

    createAssetFile(assetsDir, "enemy/fire_golem/fire_golem_custom.png");

    const result = await generateManifest({ assetsDir, outputPath });

    // Entry should still be created (with the unrecognized variant as key suffix)
    expect(result.manifest.entries).toHaveLength(1);
    expect(result.manifest.entries[0].assetKey).toBe("enemy:fire_golem:custom");
    // But no variant tags since it's unrecognized
    expect(result.manifest.entries[0].variants).toBeUndefined();
    // And a warning should be emitted
    expect(
      result.warnings.some((w) => w.includes("Unrecognized variant suffix")),
    ).toBe(true);
    expect(result.warnings.some((w) => w.includes("custom"))).toBe(true);
  });
});

describe("Manifest Generator — Orphaned Entry Detection (Req 11.7)", () => {
  it("detects orphaned keys from existing manifest", async () => {
    const tmpDir = makeTmpDir();
    const assetsDir = path.join(tmpDir, "assets");
    const outputPath = path.join(tmpDir, "manifest.json");
    const existingManifestPath = path.join(tmpDir, "existing-manifest.json");

    // Create only one asset on disk
    createAssetFile(assetsDir, "enemy/fire_golem/fire_golem.png");

    // Write an existing manifest with an extra key that no longer exists on disk
    const existingManifest = {
      schemaVersion: 1,
      generatedAt: new Date().toISOString(),
      entries: [
        {
          assetKey: "enemy:fire_golem",
          filePath: "assets/enemy/fire_golem/fire_golem.png",
          width: 1,
          height: 1,
          category: "enemy",
        },
        {
          assetKey: "enemy:ice_dragon",
          filePath: "assets/enemy/ice_dragon/ice_dragon.png",
          width: 1,
          height: 1,
          category: "enemy",
        },
      ],
    };
    fs.writeFileSync(existingManifestPath, JSON.stringify(existingManifest));

    const result = await generateManifest({
      assetsDir,
      outputPath,
      existingManifestPath,
    });

    expect(result.orphanedKeys).toContain("enemy:ice_dragon");
    expect(result.orphanedKeys).not.toContain("enemy:fire_golem");
  });
});

describe("Manifest Generator — Skip Non-Conforming Files (Req 11.4)", () => {
  it("skips files that don't match {slug}.{ext} or {slug}_{variant}.{ext} pattern", async () => {
    const tmpDir = makeTmpDir();
    const assetsDir = path.join(tmpDir, "assets");
    const outputPath = path.join(tmpDir, "manifest.json");

    // Create a conforming file and a non-conforming file
    createAssetFile(assetsDir, "enemy/fire_golem/fire_golem.png");
    createAssetFile(assetsDir, "enemy/fire_golem/random_name.png");

    const result = await generateManifest({ assetsDir, outputPath });

    // Only the conforming file should produce an entry
    expect(result.manifest.entries).toHaveLength(1);
    expect(result.manifest.entries[0].assetKey).toBe("enemy:fire_golem");

    // A warning should be emitted for the non-conforming file
    expect(result.warnings.some((w) => w.includes("non-conforming"))).toBe(
      true,
    );
    expect(result.warnings.some((w) => w.includes("random_name.png"))).toBe(
      true,
    );
  });

  it("does not fail the entire scan when non-conforming files are present", async () => {
    const tmpDir = makeTmpDir();
    const assetsDir = path.join(tmpDir, "assets");
    const outputPath = path.join(tmpDir, "manifest.json");

    // Only non-conforming files
    createAssetFile(assetsDir, "enemy/fire_golem/totally_wrong.png");
    createAssetFile(assetsDir, "effect/spark/misnamed.png");

    const result = await generateManifest({ assetsDir, outputPath });

    // No entries, but no crash
    expect(result.manifest.entries).toHaveLength(0);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.manifest.schemaVersion).toBe(1);
  });
});
