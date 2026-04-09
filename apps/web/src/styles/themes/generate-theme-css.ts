import type { ThemeMap, ThemeTokenSet, ThemeId } from "@legendary-hunts/types";
import {
  THEME_MAP,
  DEFAULT_THEME_ID,
  DEFAULT_THEME_TOKENS,
} from "@legendary-hunts/types";

/**
 * Generate scoped CSS from a ThemeMap.
 * Each theme produces a rule block that sets --lh-* custom properties
 * scoped to the given selector (e.g. `[data-theme="default"]`).
 *
 * Validates: Requirements 17.1, 17.3, 17.4
 */
export function generateThemeCSS(themeMap: ThemeMap, selector: string): string {
  const blocks: string[] = [];

  for (const [themeId, tokens] of Object.entries(themeMap)) {
    const scopedSelector = selector.replace("{themeId}", themeId);
    const declarations = Object.entries(tokens)
      .map(([prop, value]) => `  ${prop}: ${value};`)
      .join("\n");
    blocks.push(`${scopedSelector} {\n${declarations}\n}`);
  }

  return blocks.join("\n\n") + "\n";
}

/**
 * Return a ThemeTokenSet as React.CSSProperties for inline style application.
 * Falls back to DEFAULT_THEME_TOKENS when the themeId is missing or unrecognized.
 *
 * This is the mechanism SceneCompositor uses to apply theme tokens on its container.
 */
export function getThemeStyle(themeId?: string): React.CSSProperties {
  const resolved: ThemeId =
    themeId && themeId in THEME_MAP ? themeId : DEFAULT_THEME_ID;
  const tokens: ThemeTokenSet = THEME_MAP[resolved] ?? DEFAULT_THEME_TOKENS;
  return { ...tokens } as unknown as React.CSSProperties;
}
