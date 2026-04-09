import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { createElement } from "react";
import type { AssetManifest, AssetCategory } from "@legendary-hunts/types";
import { AssetRegistry } from "@/lib/asset-registry";
import { AssetRegistryContext } from "@/contexts/AssetRegistryContext";
import { useAsset } from "../useAsset";

/**
 * **Validates: Requirements 18.1, 18.2, 18.3, 18.4, 18.5**
 *
 * Unit tests for useAsset hook covering:
 * - loading → loaded transition (18.1, 18.2)
 * - error → fallback resolution (18.3)
 * - variant fallback when requested variant is missing (18.5)
 * - cached asset synchronous return (18.4)
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

const testManifest: AssetManifest = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  entries: [
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
    {
      assetKey: "environment:dark_forest",
      filePath: "/assets/environment/dark_forest/dark_forest.webp",
      width: 1920,
      height: 1080,
      category: "environment",
    },
    // Fallback entries per category
    ...ALL_CATEGORIES.map((category) => ({
      assetKey: `${category}:fallback`,
      filePath: `/assets/fallback/${category}_fallback.png`,
      width: 128,
      height: 128,
      category,
    })),
  ],
};

// ---------------------------------------------------------------------------
// Mock Image constructor
// ---------------------------------------------------------------------------

type MockImageInstance = {
  onload: (() => void) | null;
  onerror: (() => void) | null;
  _src: string;
  src: string;
};

let mockImageInstances: MockImageInstance[] = [];
let imageLoadBehavior: "success" | "error" = "success";

class MockImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  _src = "";

  get src() {
    return this._src;
  }

  set src(value: string) {
    this._src = value;
    const instance = this as unknown as MockImageInstance;
    // Trigger load/error asynchronously to simulate real Image behavior
    setTimeout(() => {
      if (imageLoadBehavior === "error") {
        instance.onerror?.();
      } else {
        instance.onload?.();
      }
    }, 0);
  }

  constructor() {
    mockImageInstances.push(this as unknown as MockImageInstance);
  }
}

// ---------------------------------------------------------------------------
// Wrapper providing AssetRegistryContext
// ---------------------------------------------------------------------------

function createWrapper(registry: AssetRegistry) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(
      AssetRegistryContext.Provider,
      { value: registry },
      children,
    );
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

let registry: AssetRegistry;
let warnSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  registry = new AssetRegistry(testManifest);
  mockImageInstances = [];
  imageLoadBehavior = "success";
  vi.stubGlobal("Image", MockImage);
});

afterEach(() => {
  warnSpy.mockRestore();
  vi.unstubAllGlobals();
});

describe("useAsset hook", () => {
  it("returns loading state initially when asset is not cached", () => {
    const { result } = renderHook(() => useAsset("enemy:fire_golem"), {
      wrapper: createWrapper(registry),
    });

    // Initial render should be loading since the image hasn't loaded yet
    expect(result.current.status).toBe("loading");
    expect(result.current.src).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("transitions to loaded state after image loads successfully", async () => {
    const { result } = renderHook(() => useAsset("enemy:fire_golem"), {
      wrapper: createWrapper(registry),
    });

    expect(result.current.status).toBe("loading");

    await waitFor(() => {
      expect(result.current.status).toBe("loaded");
    });

    expect(result.current.src).toBe("/assets/enemy/fire_golem/fire_golem.png");
    expect(result.current.width).toBe(256);
    expect(result.current.height).toBe(512);
    expect(result.current.error).toBeNull();
  });

  it("returns error state with fallback src when image fails to load", async () => {
    imageLoadBehavior = "error";

    const { result } = renderHook(() => useAsset("enemy:fire_golem"), {
      wrapper: createWrapper(registry),
    });

    await waitFor(() => {
      expect(result.current.status).toBe("error");
    });

    // Should resolve to the enemy category fallback
    expect(result.current.src).toBe("/assets/fallback/enemy_fallback.png");
    expect(result.current.width).toBe(128);
    expect(result.current.height).toBe(128);
    expect(result.current.error).toBe("Failed to load asset: enemy:fire_golem");
  });

  it("returns loaded state synchronously when asset is already cached", () => {
    // Pre-populate the registry cache by resolving the asset first
    registry.resolve("enemy:fire_golem");

    const { result } = renderHook(() => useAsset("enemy:fire_golem"), {
      wrapper: createWrapper(registry),
    });

    // Should be loaded immediately — no loading flash
    expect(result.current.status).toBe("loaded");
    expect(result.current.src).toBe("/assets/enemy/fire_golem/fire_golem.png");
    expect(result.current.width).toBe(256);
    expect(result.current.height).toBe(512);
    expect(result.current.error).toBeNull();
  });

  it("falls back to default variant when requested variant is missing", async () => {
    // Request "attack" variant which doesn't exist — should fall back to "idle"
    const { result } = renderHook(
      () => useAsset("enemy:fire_golem", { variant: "attack" }),
      { wrapper: createWrapper(registry) },
    );

    await waitFor(() => {
      expect(result.current.status).toBe("loaded");
    });

    // Should have resolved to the idle variant via fallback chain
    expect(result.current.src).toBe(
      "/assets/enemy/fire_golem/fire_golem_idle.png",
    );
    expect(result.current.width).toBe(256);
    expect(result.current.height).toBe(512);
    expect(result.current.error).toBeNull();
  });
});
