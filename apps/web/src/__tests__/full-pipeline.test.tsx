import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, act } from "@testing-library/react";
import { createElement } from "react";
import type { AssetManifest, AssetCategory } from "@legendary-hunts/types";
import { DEFAULT_THEME_ID, DEFAULT_THEME_TOKENS } from "@legendary-hunts/types";
import { AssetRegistry } from "@/lib/asset-registry";
import { AssetRegistryContext } from "@/contexts/AssetRegistryContext";
import { SceneCompositor } from "@/components/fantasy/scene/SceneCompositor";
import manifest from "@/data/asset-manifest.json";

/**
 * **Validates: Requirements 1.1, 3.2, 6.2, 9.1, 9.4, 16.4**
 *
 * Full-pipeline integration tests exercising:
 * 1. asset-manifest.json → AssetRegistry → useAsset → SceneCompositor renders all layers
 * 2. Missing/non-existent enemy slug degrades gracefully with fallback assets
 * 3. Theme CSS custom properties are applied on the scene-compositor container
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
// Setup / Teardown
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

// ---------------------------------------------------------------------------
// 1. Full pipeline: manifest → registry → SceneCompositor renders all layers
// ---------------------------------------------------------------------------

describe("Full pipeline: manifest → registry → SceneCompositor", () => {
  it("loads the real asset-manifest.json into AssetRegistry and resolves starter keys", () => {
    expect(manifest.schemaVersion).toBe(1);
    expect(manifest.entries.length).toBeGreaterThan(0);

    const enemy = registry.resolve("enemy:placeholder_enemy", "idle");
    expect(enemy).not.toBeNull();
    expect(enemy!.src).toContain("placeholder_enemy");

    const env = registry.resolve("environment:default_env", "day");
    expect(env).not.toBeNull();
    expect(env!.src).toContain("default_env");
  });

  it("renders all 5 layers with starter asset keys via useAsset", async () => {
    await act(async () => {
      renderWithRegistry(
        createElement(SceneCompositor, {
          environmentKey: "environment:default_env:day",
          enemyKey: "enemy:placeholder_enemy",
        }),
        registry,
      );
    });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    expect(screen.getByTestId("layer-background")).toBeDefined();
    expect(screen.getByTestId("layer-midground")).toBeDefined();
    expect(screen.getByTestId("layer-character-stage")).toBeDefined();
    expect(screen.getByTestId("layer-fx")).toBeDefined();
    expect(screen.getByTestId("layer-ui-overlay")).toBeDefined();
  });

  it("renders starter assets (not fallbacks) for enemy and environment", async () => {
    await act(async () => {
      renderWithRegistry(
        createElement(SceneCompositor, {
          environmentKey: "environment:default_env:day",
          enemyKey: "enemy:placeholder_enemy",
        }),
        registry,
      );
    });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    const bgImg = screen.getByTestId("layer-background").querySelector("img");
    expect(bgImg).not.toBeNull();
    expect(bgImg!.getAttribute("src")).toContain("default_env");
    expect(bgImg!.getAttribute("src")).not.toContain("fallback");

    const enemyImg = screen.getByTestId("enemy-display").querySelector("img");
    expect(enemyImg).not.toBeNull();
    expect(enemyImg!.getAttribute("src")).toContain("placeholder_enemy");
    expect(enemyImg!.getAttribute("src")).not.toContain("fallback");
  });
});

// ---------------------------------------------------------------------------
// 2. Graceful degradation: non-existent enemy slug uses fallback
// ---------------------------------------------------------------------------

describe("Graceful degradation with missing assets", () => {
  it("renders all layers when enemy slug does not exist in manifest", async () => {
    await act(async () => {
      renderWithRegistry(
        createElement(SceneCompositor, {
          environmentKey: "environment:default_env:day",
          enemyKey: "enemy:nonexistent_dragon",
        }),
        registry,
      );
    });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    expect(screen.getByTestId("layer-background")).toBeDefined();
    expect(screen.getByTestId("layer-midground")).toBeDefined();
    expect(screen.getByTestId("layer-character-stage")).toBeDefined();
    expect(screen.getByTestId("layer-fx")).toBeDefined();
    expect(screen.getByTestId("layer-ui-overlay")).toBeDefined();
  });

  it("uses fallback asset for the missing enemy", async () => {
    await act(async () => {
      renderWithRegistry(
        createElement(SceneCompositor, {
          environmentKey: "environment:default_env:day",
          enemyKey: "enemy:nonexistent_dragon",
        }),
        registry,
      );
    });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    const enemyImg = screen.getByTestId("enemy-display").querySelector("img");
    expect(enemyImg).not.toBeNull();
    expect(enemyImg!.getAttribute("src")).toContain("fallback");
  });

  it("resolveWithFallback never returns null for any category", () => {
    const categories: AssetCategory[] = [
      "enemy",
      "environment",
      "effect",
      "icon",
      "ui_frame",
      "overlay",
    ];

    for (const cat of categories) {
      const result = registry.resolveWithFallback(`${cat}:totally_missing`);
      expect(result).not.toBeNull();
      expect(result.src).toBeTruthy();
    }
  });
});

// ---------------------------------------------------------------------------
// 3. Theme tokens apply correctly on the scene-compositor container
// ---------------------------------------------------------------------------

describe("Theme token application on SceneCompositor", () => {
  it("applies default theme CSS custom properties on the container", () => {
    renderWithRegistry(createElement(SceneCompositor), registry);

    const container = screen.getByTestId("scene-compositor");
    for (const [prop, value] of Object.entries(DEFAULT_THEME_TOKENS)) {
      expect(container.style.getPropertyValue(prop)).toBe(value);
    }
  });

  it("sets data-theme attribute to the resolved theme id", () => {
    renderWithRegistry(
      createElement(SceneCompositor, { themeId: "default" }),
      registry,
    );

    const container = screen.getByTestId("scene-compositor");
    expect(container.getAttribute("data-theme")).toBe(DEFAULT_THEME_ID);
  });

  it("falls back to default theme for unrecognized themeId", () => {
    renderWithRegistry(
      createElement(SceneCompositor, { themeId: "unknown_theme_xyz" }),
      registry,
    );

    const container = screen.getByTestId("scene-compositor");
    expect(container.getAttribute("data-theme")).toBe(DEFAULT_THEME_ID);

    for (const [prop, value] of Object.entries(DEFAULT_THEME_TOKENS)) {
      expect(container.style.getPropertyValue(prop)).toBe(value);
    }
  });

  it("theme tokens are inherited by UI overlay descendants", async () => {
    await act(async () => {
      renderWithRegistry(
        createElement(
          SceneCompositor,
          { themeId: "default" },
          createElement("span", { "data-testid": "ui-child" }, "Hello"),
        ),
        registry,
      );
    });

    const child = screen.getByTestId("ui-child");
    expect(child).toBeDefined();

    const container = screen.getByTestId("scene-compositor");
    expect(container.style.getPropertyValue("--lh-accent-primary")).toBe(
      DEFAULT_THEME_TOKENS["--lh-accent-primary"],
    );

    // The child is a descendant of the themed container
    expect(container.contains(child)).toBe(true);
  });
});
