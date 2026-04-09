import { describe, it, expect } from "vitest";
import { DEFAULT_THEME_TOKENS } from "@legendary-hunts/types";

/**
 * Parse a color string (hex or rgba) into [R, G, B] in 0–255 range.
 */
function parseColor(color: string): [number, number, number] {
  // Hex: #rrggbb
  const hexMatch = color.match(/^#([0-9a-f]{6})$/i);
  if (hexMatch) {
    const hex = hexMatch[1];
    return [
      parseInt(hex.slice(0, 2), 16),
      parseInt(hex.slice(2, 4), 16),
      parseInt(hex.slice(4, 6), 16),
    ];
  }

  // rgba(r, g, b, a) or rgb(r, g, b)
  const rgbaMatch = color.match(
    /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*[\d.]+\s*)?\)$/,
  );
  if (rgbaMatch) {
    return [
      parseInt(rgbaMatch[1], 10),
      parseInt(rgbaMatch[2], 10),
      parseInt(rgbaMatch[3], 10),
    ];
  }

  throw new Error(`Cannot parse color: ${color}`);
}

/**
 * Linearize an sRGB channel value (0–255) to linear light.
 */
function linearize(channel: number): number {
  const s = channel / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

/**
 * Calculate relative luminance per WCAG 2.x definition.
 * L = 0.2126 * R + 0.7152 * G + 0.0722 * B
 */
function relativeLuminance(r: number, g: number, b: number): number {
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

/**
 * Calculate WCAG contrast ratio between two colors.
 * Ratio = (L1 + 0.05) / (L2 + 0.05) where L1 >= L2.
 */
function contrastRatio(
  color1: [number, number, number],
  color2: [number, number, number],
): number {
  const l1 = relativeLuminance(...color1);
  const l2 = relativeLuminance(...color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe("Theme CSS token contrast — WCAG AA", () => {
  /**
   * Validates: Requirement 17.5
   * --lh-text-primary against --lh-panel-bg must meet WCAG AA (4.5:1).
   */
  it("--lh-text-primary vs --lh-panel-bg meets WCAG AA minimum contrast ratio (4.5:1)", () => {
    const textPrimary = parseColor(DEFAULT_THEME_TOKENS["--lh-text-primary"]);
    const panelBg = parseColor(DEFAULT_THEME_TOKENS["--lh-panel-bg"]);

    const ratio = contrastRatio(textPrimary, panelBg);

    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });
});
