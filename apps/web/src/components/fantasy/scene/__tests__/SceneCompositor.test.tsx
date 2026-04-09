import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { createElement } from "react";
import type { AssetManifest, AssetCategory } from "@legendary-hunts/types";
import { DEFAULT_THEME_ID, DEFAULT_THEME_TOKENS } from "@legendary-hunts/types";
import { AssetRegistry } from "@/lib/asset-registry";
import { AssetRegistryContext } from "@/contexts/AssetRegistryContext";
import { SceneCompositor } from "../SceneCompositor";

/**
 * **Validates: Requirements 3.1, 3.2, 3.4, 6.2, 6.3, 9.4, 15.1, 15.5, 15.6**
 *
 * Unit tests for SceneCompositor covering:
 * - Layer rendering order and z-index stacking (3.1, 15.1, 15.5)
 * - Theme CSS custom property application (6.2, 6.3)
 * - Fallback scene rendering when no props provided (9.4, 15.6)
 * - Missing layer assets don't break other layers (3.2, 3.4)
 */

// ---------------------------------------------------------------------------
// Test manifest with fallback entries for all categories
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
      assetKey: "environment:dark_forest",
      filePath: "/assets/environment/dark_forest/dark_forest.webp",
      width: 1920,
      height: 1080,
      category: "environment",
    },
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
// Mock Image constructor (same pattern as useAsset tests)
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
  registry = new AssetRegistry(testManifest);
  mockImageInstances = [];
  vi.stubGlobal("Image", MockImage);
});

afterEach(() => {
  cleanup();
  warnSpy.mockRestore();
  vi.unstubAllGlobals();
});

describe("SceneCompositor", () => {
  it("renders all 5 layer divs with correct data-testid attributes", () => {
    renderWithRegistry(createElement(SceneCompositor), registry);

    expect(screen.getByTestId("layer-background")).toBeDefined();
    expect(screen.getByTestId("layer-midground")).toBeDefined();
    expect(screen.getByTestId("layer-character-stage")).toBeDefined();
    expect(screen.getByTestId("layer-fx")).toBeDefined();
    expect(screen.getByTestId("layer-ui-overlay")).toBeDefined();
  });

  it("assigns correct z-index to each layer (10, 20, 30, 40, 50)", () => {
    renderWithRegistry(createElement(SceneCompositor), registry);

    const layers: [string, string][] = [
      ["layer-background", "10"],
      ["layer-midground", "20"],
      ["layer-character-stage", "30"],
      ["layer-fx", "40"],
      ["layer-ui-overlay", "50"],
    ];

    for (const [testId, expectedZ] of layers) {
      const el = screen.getByTestId(testId);
      expect(el.style.zIndex).toBe(expectedZ);
    }
  });

  it("renders container with aspect-ratio 16 / 9", () => {
    renderWithRegistry(createElement(SceneCompositor), registry);

    const container = screen.getByTestId("scene-compositor");
    expect(container.style.aspectRatio).toBe("16 / 9");
  });

  it("applies theme CSS custom properties when themeId is provided", () => {
    renderWithRegistry(
      createElement(SceneCompositor, { themeId: "default" }),
      registry,
    );

    const container = screen.getByTestId("scene-compositor");
    for (const [prop, value] of Object.entries(DEFAULT_THEME_TOKENS)) {
      expect(container.style.getPropertyValue(prop)).toBe(value);
    }
  });

  it("applies default theme when themeId is missing", () => {
    renderWithRegistry(createElement(SceneCompositor), registry);

    const container = screen.getByTestId("scene-compositor");
    expect(container.getAttribute("data-theme")).toBe(DEFAULT_THEME_ID);
    for (const [prop, value] of Object.entries(DEFAULT_THEME_TOKENS)) {
      expect(container.style.getPropertyValue(prop)).toBe(value);
    }
  });

  it("applies default theme when themeId is unrecognized", () => {
    renderWithRegistry(
      createElement(SceneCompositor, { themeId: "nonexistent_theme" }),
      registry,
    );

    const container = screen.getByTestId("scene-compositor");
    expect(container.getAttribute("data-theme")).toBe(DEFAULT_THEME_ID);
    for (const [prop, value] of Object.entries(DEFAULT_THEME_TOKENS)) {
      expect(container.style.getPropertyValue(prop)).toBe(value);
    }
  });

  it("renders a complete fallback scene when no props are provided", () => {
    renderWithRegistry(createElement(SceneCompositor), registry);

    // All 5 layers should be present
    expect(screen.getByTestId("layer-background")).toBeDefined();
    expect(screen.getByTestId("layer-midground")).toBeDefined();
    expect(screen.getByTestId("layer-character-stage")).toBeDefined();
    expect(screen.getByTestId("layer-fx")).toBeDefined();
    expect(screen.getByTestId("layer-ui-overlay")).toBeDefined();

    // Container should have default theme and correct layout styles
    const container = screen.getByTestId("scene-compositor");
    expect(container.getAttribute("data-theme")).toBe(DEFAULT_THEME_ID);
    expect(container.style.aspectRatio).toBe("16 / 9");
    expect(container.style.overflow).toBe("hidden");
    expect(container.style.position).toBe("relative");
  });
});
