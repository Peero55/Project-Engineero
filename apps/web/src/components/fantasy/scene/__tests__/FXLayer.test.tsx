import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, act } from "@testing-library/react";
import { createElement } from "react";
import type { AssetManifest, AssetCategory } from "@legendary-hunts/types";
import { LAYOUT_CONTRACT, FX_ANCHORS } from "@legendary-hunts/types";
import { AssetRegistry } from "@/lib/asset-registry";
import { AssetRegistryContext } from "@/contexts/AssetRegistryContext";
import { FXLayer } from "../FXLayer";
import type { EffectDescriptor } from "../SceneCompositor";

/**
 * **Validates: Requirements 19.3, 19.4, 19.5, 7.4, 14.5**
 *
 * Unit tests for FXLayer covering:
 * - Named anchor positions effect correctly (19.3)
 * - screen_full fills viewport (19.4)
 * - Unrecognized anchor defaults to screen_center (19.5)
 * - Effect auto-removal after duration (14.5)
 * - Multiple simultaneous effects render without issues (7.4)
 */

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
      assetKey: "effect:attack_slash",
      filePath: "/assets/effect/attack_slash/attack_slash.png",
      width: 256,
      height: 256,
      category: "effect",
    },
    {
      assetKey: "effect:magic_spark",
      filePath: "/assets/effect/magic_spark/magic_spark.png",
      width: 128,
      height: 128,
      category: "effect",
    },
    {
      assetKey: "effect:env_fog",
      filePath: "/assets/effect/env_fog/env_fog.png",
      width: 1920,
      height: 1080,
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
    Promise.resolve().then(() => instance.onload?.());
  }
  constructor() {
    mockImageInstances.push(this as unknown as MockImageInstance);
  }
}

function renderFXLayer(effects: EffectDescriptor[], registry: AssetRegistry) {
  return render(
    createElement(
      AssetRegistryContext.Provider,
      { value: registry },
      createElement(FXLayer, { effects, zone: LAYOUT_CONTRACT.fxOverlay }),
    ),
  );
}

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

describe("FXLayer", () => {
  it("renders effect at enemy_center anchor with translate(-50%, -50%)", async () => {
    const effects: EffectDescriptor[] = [
      { id: "fx-1", assetKey: "effect:attack_slash", anchor: "enemy_center" },
    ];
    renderFXLayer(effects, registry);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });
    const el = screen.getByTestId("fx-effect-fx-1");
    expect(el.style.left).toBe(`${FX_ANCHORS.enemy_center.x}%`);
    expect(el.style.top).toBe(`${FX_ANCHORS.enemy_center.y}%`);
    expect(el.style.transform).toBe("translate(-50%, -50%)");
  });

  it("renders screen_full anchor with width/height 100%", async () => {
    const effects: EffectDescriptor[] = [
      { id: "fx-full", assetKey: "effect:env_fog", anchor: "screen_full" },
    ];
    renderFXLayer(effects, registry);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });
    const el = screen.getByTestId("fx-effect-fx-full");
    expect(el.style.width).toBe("100%");
    expect(el.style.height).toBe("100%");
  });

  it("defaults unrecognized anchor to screen_center and logs warning", async () => {
    const effects: EffectDescriptor[] = [
      {
        id: "fx-unk",
        assetKey: "effect:attack_slash",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        anchor: "bad_anchor" as any,
      },
    ];
    renderFXLayer(effects, registry);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });
    const el = screen.getByTestId("fx-effect-fx-unk");
    expect(el.style.left).toBe(`${FX_ANCHORS.screen_center.x}%`);
    expect(el.style.top).toBe(`${FX_ANCHORS.screen_center.y}%`);
    expect(el.style.transform).toBe("translate(-50%, -50%)");
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Unrecognized anchor"),
    );
  });

  it("auto-removes effect after its duration", async () => {
    vi.useFakeTimers();
    const effects: EffectDescriptor[] = [
      {
        id: "fx-timed",
        assetKey: "effect:attack_slash",
        anchor: "enemy_center",
        duration: 500,
      },
    ];
    renderFXLayer(effects, registry);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(screen.getByTestId("fx-effect-fx-timed")).toBeDefined();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    expect(screen.queryByTestId("fx-effect-fx-timed")).toBeNull();
    vi.useRealTimers();
  });

  it("renders multiple simultaneous effects without issues", async () => {
    const effects: EffectDescriptor[] = [
      { id: "fx-a", assetKey: "effect:attack_slash", anchor: "enemy_center" },
      { id: "fx-b", assetKey: "effect:magic_spark", anchor: "enemy_top" },
      { id: "fx-c", assetKey: "effect:env_fog", anchor: "screen_full" },
    ];
    renderFXLayer(effects, registry);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });
    expect(screen.getByTestId("fx-effect-fx-a")).toBeDefined();
    expect(screen.getByTestId("fx-effect-fx-b")).toBeDefined();
    expect(screen.getByTestId("fx-effect-fx-c")).toBeDefined();
  });
});
