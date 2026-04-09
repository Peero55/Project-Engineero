/** The six supported asset categories */
export type AssetCategory =
  | "enemy"
  | "environment"
  | "effect"
  | "icon"
  | "ui_frame"
  | "overlay";

/** Variant category types */
export type PoseVariant = "idle" | "attack" | "hurt" | "defeated";
export type LightingVariant = "day" | "night" | "dramatic";
export type PaletteVariant = string; // open-ended recolor names
export type VariantCategory = "pose" | "lighting" | "palette";

export interface VariantTag {
  category: VariantCategory;
  value: string;
}

/** Optional animation metadata for sprite sheets / future animation support */
export interface AnimationMeta {
  frameCount: number;
  frameDuration: number; // ms per frame
  loop: boolean;
}

/**
 * A single entry in the asset manifest.
 * AssetKey format: `{category}:{slug}` or `{category}:{slug}:{variant}`
 */
export interface AssetEntry {
  assetKey: string;
  filePath: string;
  width: number;
  height: number;
  category: AssetCategory;
  variants?: VariantTag[];
  animation?: AnimationMeta;
}

/** Top-level asset manifest structure */
export interface AssetManifest {
  schemaVersion: number;
  generatedAt: string; // ISO 8601
  entries: AssetEntry[];
}

/** Asset key regex pattern: {category}:{slug} or {category}:{slug}:{variant} */
export const ASSET_KEY_PATTERN =
  /^(enemy|environment|effect|icon|ui_frame|overlay):([a-z0-9_]+)(?::([a-z0-9_]+))?$/;

/** Valid image extensions per category */
export const CATEGORY_FORMATS: Record<AssetCategory, string[]> = {
  enemy: ["png"],
  environment: ["webp"],
  effect: ["png", "webp"],
  icon: ["png"],
  ui_frame: ["png"],
  overlay: ["png", "webp"],
};

/** Recognized variant values per variant category */
export const RECOGNIZED_VARIANTS: Record<VariantCategory, string[]> = {
  pose: ["idle", "attack", "hurt", "defeated"],
  lighting: ["day", "night", "dramatic"],
  palette: [], // open-ended, no validation
};

/** Default variant per variant category (used for fallback) */
export const DEFAULT_VARIANTS: Record<VariantCategory, string> = {
  pose: "idle",
  lighting: "day",
  palette: "default",
};
