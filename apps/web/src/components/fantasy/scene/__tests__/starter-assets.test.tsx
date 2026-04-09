import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, act } from "@testing-library/react";
import { createElement } from "react";
import type { AssetManifest } from "@legendary-hunts/types";
import { AssetRegistry } from "@/lib/asset-registry";
import { AssetRegistryContext } from "@/contexts/AssetRegistryContext";
import { SceneCompositor } from "../SceneCompositor";
import manifest from "@/data/asset-manifest.json";

/**
 * **Validates: Requirement 16.4**
 *
 * Integration-style verification that the SceneCompositor renders a complete
 * battle scene using the actual generated starter assets from asset-manifest.json,
 * with no fallback assets visible.
 */

// ---------------------------------------------------------------------------
// Mock Image constructor — auto-fires onload so useAsset resolves to "loaded"
// ---------------------------------------------------------------------------

type MockImageInstance = {
  onload: (() => void) | null;
  onerror: (() => void) | null;
  _src: string;
  src: string;
};

let mockImageInstances: MockImageInstance[] = [];

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
    setTimeout(() => {
      instance.onload?.();
    }, 0);
  }

  constructor() {
    mockImageInstances.push(this as unknown as MockImageInstance);
  }
}

// ---------------------------------------------------------------------------
// Helper: render with AssetRegistryContext provider
// ---------------------------------------------------------------------------

function renderWithRegistry(ui: React.ReactElement, registry: AssetRegistry) {
  return render(
    createElement(AssetRegistryContext.Provider, { value: registry }, ui),
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

let registry: AssetRegistry;
let warnSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  registry = new AssetRegistry(manifest as AssetManifest);
  mockImageInstances = [];
  vi.stubGlobal("Image", MockImage);
});

afterEach(() => {
  cleanup();
  warnSpy.mockRestore();
  vi.unstubAllGlobals();
});

describe("Starter Asset Pack — SceneCompositor integration (Req 16.4)", () => {
  it("loads the actual asset-manifest.json and creates a valid AssetRegistry", () => {
    expect(manifest.schemaVersion).toBe(1);
    expect(manifest.entries.length).toBeGreaterThan(0);

    // Registry should resolve the starter enemy and environment keys
    const enemy = registry.resolve("enemy:placeholder_enemy", "idle");
    expect(enemy).not.toBeNull();
    expect(enemy!.src).toContain("placeholder_enemy");

    const env = registry.resolve("environment:default_env", "day");
    expect(env).not.toBeNull();
    expect(env!.src).toContain("default_env");
  });

  it("renders all 5 layers with starter asset keys", async () => {
    await act(async () => {
      renderWithRegistry(
        createElement(SceneCompositor, {
          environmentKey: "environment:default_env:day",
          enemyKey: "enemy:placeholder_enemy",
        }),
        registry,
      );
    });

    // Flush mock Image onload timers
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    expect(screen.getByTestId("layer-background")).toBeDefined();
    expect(screen.getByTestId("layer-midground")).toBeDefined();
    expect(screen.getByTestId("layer-character-stage")).toBeDefined();
    expect(screen.getByTestId("layer-fx")).toBeDefined();
    expect(screen.getByTestId("layer-ui-overlay")).toBeDefined();
  });

  it("uses starter assets (not fallback assets) for enemy and environment", async () => {
    await act(async () => {
      renderWithRegistry(
        createElement(SceneCompositor, {
          environmentKey: "environment:default_env:day",
          enemyKey: "enemy:placeholder_enemy",
        }),
        registry,
      );
    });

    // Flush mock Image onload timers
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    // The background should use the starter environment, not the fallback
    const bgImg = screen.getByTestId("layer-background").querySelector("img");
    expect(bgImg).not.toBeNull();
    expect(bgImg!.getAttribute("src")).toContain("default_env");
    expect(bgImg!.getAttribute("src")).not.toContain("fallback");

    // The enemy should use the starter placeholder_enemy, not the fallback
    const enemyImg = screen.getByTestId("enemy-display").querySelector("img");
    expect(enemyImg).not.toBeNull();
    expect(enemyImg!.getAttribute("src")).toContain("placeholder_enemy");
    expect(enemyImg!.getAttribute("src")).not.toContain("fallback");

    // No image in the scene should reference a fallback path
    const allImages = screen
      .getByTestId("scene-compositor")
      .querySelectorAll("img");
    for (const img of Array.from(allImages)) {
      expect(img.getAttribute("src")).not.toContain("fallback");
    }
  });

  it("resolves all 5 starter effect assets from the manifest without fallback", () => {
    const effectKeys = [
      "effect:attack_slash",
      "effect:magic_spark",
      "effect:status_shield",
      "effect:env_fog",
      "effect:generic_flash",
    ];

    for (const key of effectKeys) {
      const resolved = registry.resolve(key);
      expect(resolved).not.toBeNull();
      expect(resolved!.src).not.toContain("fallback");
    }
  });
});
