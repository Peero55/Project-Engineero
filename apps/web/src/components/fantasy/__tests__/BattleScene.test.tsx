import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import { createElement } from "react";
import type { AssetManifest, AssetCategory } from "@legendary-hunts/types";
import { AssetRegistry } from "@/lib/asset-registry";
import { AssetRegistryContext } from "@/contexts/AssetRegistryContext";
import {
  BattleScene,
  toEnemyKey,
  toEnvironmentKey,
  toEffectDescriptors,
} from "../BattleScene";

/**
 * **Validates: Requirements 4.1, 5.1, 6.2, 7.2, 7.3, 9.2, 9.3**
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
      assetKey: "environment:dark_forest",
      filePath: "/assets/environment/dark_forest/dark_forest.webp",
      width: 1920,
      height: 1080,
      category: "environment",
    },
    {
      assetKey: "effect:attack_slash",
      filePath: "/assets/effect/attack_slash/attack_slash.png",
      width: 128,
      height: 128,
      category: "effect",
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
// Mock Image constructor — triggers onload asynchronously
// ---------------------------------------------------------------------------

class MockImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  _src = "";

  get src() {
    return this._src;
  }

  set src(value: string) {
    this._src = value;
    setTimeout(() => this.onload?.(), 0);
  }
}

// Mock AssetRegistryProvider to pass children through (we inject context manually)
vi.mock("@/contexts/AssetRegistryProvider", () => ({
  AssetRegistryProvider: ({ children }: { children: React.ReactNode }) =>
    children,
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderWithRegistry(ui: React.ReactElement, registry: AssetRegistry) {
  return render(
    createElement(AssetRegistryContext.Provider, { value: registry }, ui),
  );
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

let registry: AssetRegistry;
let warnSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  registry = new AssetRegistry(testManifest);
  vi.stubGlobal("Image", MockImage);
});

afterEach(() => {
  cleanup();
  warnSpy.mockRestore();
  vi.unstubAllGlobals();
});

// ---------------------------------------------------------------------------
// 1. Pure helper wiring tests (synchronous, no DOM)
// ---------------------------------------------------------------------------

describe("BattleScene wiring helpers", () => {
  describe("toEnemyKey (Req 4.1)", () => {
    it("maps slug to enemy:{slug} pattern", () => {
      expect(toEnemyKey("fire_golem")).toBe("enemy:fire_golem");
    });

    it("returns undefined when slug is undefined", () => {
      expect(toEnemyKey(undefined)).toBeUndefined();
    });

    it("returns undefined when slug is empty string", () => {
      expect(toEnemyKey("")).toBeUndefined();
    });
  });

  describe("toEnvironmentKey (Req 5.1)", () => {
    it("maps env id to environment:{id} pattern", () => {
      expect(toEnvironmentKey("dark_forest")).toBe("environment:dark_forest");
    });

    it("returns undefined when env id is undefined", () => {
      expect(toEnvironmentKey(undefined)).toBeUndefined();
    });
  });

  describe("toEffectDescriptors (Req 7.2, 7.3)", () => {
    it("maps triggers to EffectDescriptors with effect:{slug} keys", () => {
      const result = toEffectDescriptors([
        { effectSlug: "attack_slash", anchor: "enemy_center", id: "fx-1" },
        {
          effectSlug: "magic_spark",
          anchor: "screen_full",
          duration: 1200,
          id: "fx-2",
        },
      ]);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        assetKey: "effect:attack_slash",
        anchor: "enemy_center",
        duration: undefined,
        id: "fx-1",
      });
      expect(result[1]).toEqual({
        assetKey: "effect:magic_spark",
        anchor: "screen_full",
        duration: 1200,
        id: "fx-2",
      });
    });

    it("defaults anchor to enemy_center when not specified", () => {
      const result = toEffectDescriptors([
        { effectSlug: "attack_slash", id: "fx-1" },
      ]);
      expect(result[0]!.anchor).toBe("enemy_center");
    });

    it("returns empty array for undefined input", () => {
      expect(toEffectDescriptors(undefined)).toEqual([]);
    });

    it("returns empty array for empty input", () => {
      expect(toEffectDescriptors([])).toEqual([]);
    });
  });
});

// ---------------------------------------------------------------------------
// 2. Component integration tests
// ---------------------------------------------------------------------------

describe("BattleScene component", () => {
  describe("scene rendering with registry", () => {
    it("renders SceneCompositor when registry is available and assets preloaded", async () => {
      renderWithRegistry(
        createElement(BattleScene, { enemySlug: "fire_golem" }),
        registry,
      );

      await waitFor(() => {
        expect(screen.queryByTestId("battle-scene-loading")).toBeNull();
        expect(screen.getByTestId("scene-compositor")).toBeDefined();
      });
    });

    it("renders all 5 layers", () => {
      renderWithRegistry(createElement(BattleScene, {}), registry);

      expect(screen.getByTestId("layer-background")).toBeDefined();
      expect(screen.getByTestId("layer-midground")).toBeDefined();
      expect(screen.getByTestId("layer-character-stage")).toBeDefined();
      expect(screen.getByTestId("layer-fx")).toBeDefined();
      expect(screen.getByTestId("layer-ui-overlay")).toBeDefined();
    });
  });

  describe("enemy wiring renders correct asset (Req 4.1)", () => {
    it("renders enemy image after async load", async () => {
      renderWithRegistry(
        createElement(BattleScene, { enemySlug: "fire_golem" }),
        registry,
      );

      await waitFor(() => {
        const stage = screen.getByTestId("layer-character-stage");
        const img = stage.querySelector("img");
        expect(img).not.toBeNull();
        expect(img?.getAttribute("src")).toBe(
          "/assets/enemy/fire_golem/fire_golem.png",
        );
      });
    });
  });

  describe("environment wiring renders correct asset (Req 5.1)", () => {
    it("renders background image after async load", async () => {
      renderWithRegistry(
        createElement(BattleScene, { environmentId: "dark_forest" }),
        registry,
      );

      await waitFor(() => {
        const bg = screen.getByTestId("layer-background");
        const img = bg.querySelector("img");
        expect(img).not.toBeNull();
        expect(img?.getAttribute("src")).toBe(
          "/assets/environment/dark_forest/dark_forest.webp",
        );
      });
    });
  });

  describe("themeId pass-through (Req 6.2)", () => {
    it("passes themeId to SceneCompositor", () => {
      renderWithRegistry(
        createElement(BattleScene, { themeId: "default" }),
        registry,
      );

      const container = screen.getByTestId("scene-compositor");
      expect(container.getAttribute("data-theme")).toBe("default");
    });

    it("falls back to default theme when themeId is omitted", () => {
      renderWithRegistry(createElement(BattleScene, {}), registry);

      const container = screen.getByTestId("scene-compositor");
      expect(container.getAttribute("data-theme")).toBe("default");
    });
  });

  describe("effect triggers (Req 7.2, 7.3)", () => {
    it("renders effect elements in FX layer", async () => {
      renderWithRegistry(
        createElement(BattleScene, {
          effects: [
            {
              effectSlug: "attack_slash",
              anchor: "enemy_center" as const,
              id: "fx-1",
            },
          ],
        }),
        registry,
      );

      await waitFor(() => {
        expect(screen.getByTestId("fx-effect-fx-1")).toBeDefined();
      });
    });

    it("renders no effects when effects prop is empty", () => {
      renderWithRegistry(createElement(BattleScene, { effects: [] }), registry);

      const fxLayer = screen.getByTestId("layer-fx");
      const effectEls = fxLayer.querySelectorAll("img");
      expect(effectEls.length).toBe(0);
    });
  });

  describe("loading placeholder (Req 9.2, 9.3)", () => {
    it("shows loading placeholder when registry is null", () => {
      render(
        createElement(
          AssetRegistryContext.Provider,
          { value: null },
          createElement(BattleScene, { enemySlug: "fire_golem" }),
        ),
      );

      expect(screen.getByTestId("battle-scene-loading")).toBeDefined();
      expect(screen.getByText("Preparing the battlefield…")).toBeDefined();
    });

    it("loading placeholder maintains 16:9 aspect ratio", () => {
      render(
        createElement(
          AssetRegistryContext.Provider,
          { value: null },
          createElement(BattleScene, {}),
        ),
      );

      const placeholder = screen.getByTestId("battle-scene-loading");
      expect(placeholder.style.aspectRatio).toBe("16 / 9");
    });
  });
});
