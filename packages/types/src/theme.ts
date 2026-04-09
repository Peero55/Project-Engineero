/** Required CSS custom property keys for a theme token set */
export interface ThemeTokenSet {
  "--lh-accent-primary": string;
  "--lh-accent-secondary": string;
  "--lh-panel-bg": string;
  "--lh-panel-border": string;
  "--lh-border-glow": string;
  "--lh-text-primary": string;
  "--lh-text-secondary": string;
  "--lh-text-accent": string;
}

/** Theme identifier type */
export type ThemeId = string;

/** Theme map: theme identifier → token set */
export type ThemeMap = Record<ThemeId, ThemeTokenSet>;

/** The default theme ID applied when no theme is specified or the specified theme is missing */
export const DEFAULT_THEME_ID: ThemeId = "default";

/** Default theme token set — dark fantasy baseline matching existing fantasy-ui.css */
export const DEFAULT_THEME_TOKENS: ThemeTokenSet = {
  "--lh-accent-primary": "#f2c94c",
  "--lh-accent-secondary": "#ff7a18",
  "--lh-panel-bg": "rgba(13, 24, 38, 0.96)",
  "--lh-panel-border": "rgba(255, 255, 255, 0.08)",
  "--lh-border-glow": "rgba(242, 201, 76, 0.25)",
  "--lh-text-primary": "#f3f6ff",
  "--lh-text-secondary": "#9db2d1",
  "--lh-text-accent": "#f2c94c",
};

/** Built-in theme map with at least the default theme */
export const THEME_MAP: ThemeMap = {
  [DEFAULT_THEME_ID]: DEFAULT_THEME_TOKENS,
};
