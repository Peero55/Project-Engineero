import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type {
  AssetManifest,
  AssetCategory,
  AssetEntry,
} from "@legendary-hunts/types";
import { AssetRegistry } from "../asset-registry";
import type { PreloadProgress } from "../asset-registry";

/**
 * **Validates: Requirements 1.1, 1.2, 1.4, 4.5, 8.5, 10.5**
 *
 * Unit tests for AssetRegistry covering:
 * - resolve() with valid key, missing key, invalid key format
 * - resolveWithFallback() category fallback
 * - Variant fallback logic
 * - getVariants()
 * - isCached()
 * - preload() progress reporting
 */

// ---------------------------------------------------------------------------
// Test manifest
// ---------------------------------------------------------------------------

const ALL_CATEGORIES: AssetCategory[] = [
  "enemy",
  "environment",
  "effect",
  "icon",
  "ui_frame",
  "overlay",
];

const testEntries: AssetEntry[] = [
  // Enemy with base + idle variant only (no attack)
  {
    assetKey: "enemy:fire_golem",
    filePath: "/assets/enemy/fire_golem/fire_golem.png",
    width: 256,
    height: 512,
    category: "enemy",
  },
  {
    assetKey: "enemy:fire_golem:idle",
    filePath: "/assets/enemy/fire_golem/fire_golem_idle.png",
    width: 256,
    height: 512,
    category: "enemy",
    variants: [{ category: "pose", value: "idle" }],
  },
  // Environment with day variant
  {
    assetKey: "environment:dark_forest",
    filePath: "/assets/environment/dark_forest/dark_forest.webp",
    width: 1920,
    height: 1080,
    category: "environment",
  },
  {
    assetKey: "environment:dark_forest:day",
    filePath: "/assets/environment/dark_forest/dark_forest_day.webp",
    width: 1920,
    height: 1080,
    category: "environment",
    variants: [{ category: "lighting", value: "day" }],
  },
  // Effect
  {
    assetKey: "effect:attack_slash",
    filePath: "/assets/effect/attack_slash/attack_slash.png",
    width: 128,
    height: 128,
    category: "effect",
  },
  // Fallback entries per category
  ...ALL_CATEGORIES.map((category) => ({
    assetKey: `${category}:fallback`,
    filePath: `/assets/fallback/${category}_fallback.png`,
    width: 128,
    height: 128,
    category,
  })),
];

const testManifest: AssetManifest = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  entries: testEntries,
};

// ---------------------------------------------------------------------------
// Mock Image for preload tests (Node has no HTMLImageElement)
// ---------------------------------------------------------------------------

class MockImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  private _src = "";
  get src() {
    return this._src;
  }
  set src(value: string) {
    this._src = value;
    setTimeout(() => this.onload?.(), 0);
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

let registry: AssetRegistry;
let warnSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  registry = new AssetRegistry(testManifest);
});

afterEach(() => {
  warnSpy.mockRestore();
});

describe("AssetRegistry resolve()", () => {
  it("resolves a valid key to a ResolvedAsset", () => {
    const result = registry.resolve("enemy:fire_golem");
    expect(result).not.toBeNull();
    expect(result!.src).toBe("/assets/enemy/fire_golem/fire_golem.png");
    expect(result!.width).toBe(256);
    expect(result!.height).toBe(512);
    expect(result!.entry.category).toBe("enemy");
  });

  it("resolves a valid key with variant", () => {
    const result = registry.resolve("enemy:fire_golem", "idle");
    expect(result).not.toBeNull();
    expect(result!.src).toBe("/assets/enemy/fire_golem/fire_golem_idle.png");
  });

  it("returns null for a missing key", () => {
    const result = registry.resolve("enemy:ice_dragon");
    expect(result).toBeNull();
    expect(warnSpy).toHaveBeenCalled();
  });

  it("returns null and logs warning for an invalid key format", () => {
    const result = registry.resolve("INVALID KEY!!!");
    expect(result).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Invalid asset key format"),
    );
  });
});

describe("AssetRegistry resolveWithFallback()", () => {
  it("returns category fallback when key is missing", () => {
    const result = registry.resolveWithFallback("enemy:unknown_beast");
    expect(result).not.toBeNull();
    expect(result.src).toBe("/assets/fallback/enemy_fallback.png");
    expect(result.entry.category).toBe("enemy");
  });
});

describe("AssetRegistry variant fallback", () => {
  it("falls back to idle when requested pose variant does not exist", () => {
    // "attack" variant doesn't exist for fire_golem, should fall back to "idle"
    const result = registry.resolveWithFallback("enemy:fire_golem", "attack");
    expect(result).not.toBeNull();
    expect(result.src).toBe("/assets/enemy/fire_golem/fire_golem_idle.png");
  });
});

describe("AssetRegistry getVariants()", () => {
  it("returns all variant entries for a base key", () => {
    const variants = registry.getVariants("enemy:fire_golem");
    // Should include the base entry + the idle variant
    expect(variants.length).toBeGreaterThanOrEqual(2);
    const keys = variants.map((v) => v.assetKey);
    expect(keys).toContain("enemy:fire_golem");
    expect(keys).toContain("enemy:fire_golem:idle");
  });
});

describe("AssetRegistry isCached()", () => {
  it("returns false before resolve", () => {
    expect(registry.isCached("enemy:fire_golem")).toBe(false);
  });

  it("returns true after resolve populates the cache", () => {
    registry.resolve("enemy:fire_golem");
    expect(registry.isCached("enemy:fire_golem")).toBe(true);
  });
});

describe("AssetRegistry preload()", () => {
  beforeEach(() => {
    vi.stubGlobal("Image", MockImage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reports progress correctly during preload", async () => {
    const progressUpdates: PreloadProgress[] = [];
    const keys = ["enemy:fire_golem", "effect:attack_slash"];

    await registry.preload(keys, (progress) => {
      progressUpdates.push({ ...progress });
    });

    // Should have received progress callbacks
    expect(progressUpdates.length).toBeGreaterThanOrEqual(1);

    // Final progress should show all loaded
    const final = progressUpdates[progressUpdates.length - 1];
    expect(final.total).toBe(2);
    expect(final.loaded).toBe(2);
    expect(final.fraction).toBe(1);
  });

  it("reports fraction 1 for empty key array", async () => {
    const progressUpdates: PreloadProgress[] = [];

    await registry.preload([], (progress) => {
      progressUpdates.push({ ...progress });
    });

    expect(progressUpdates.length).toBe(1);
    expect(progressUpdates[0].fraction).toBe(1);
  });
});
