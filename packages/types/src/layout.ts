/** Percentage-based rectangle within the 16:9 viewport */
export interface LayoutZone {
  x: number; // left edge as % of viewport width
  y: number; // top edge as % of viewport height
  width: number; // zone width as % of viewport width
  height: number; // zone height as % of viewport height
}

/** Complete layout contract for the battle viewport */
export interface LayoutContractType {
  background: LayoutZone;
  midground: LayoutZone;
  characterStage: LayoutZone;
  fxOverlay: LayoutZone;
  uiOverlay: LayoutZone;
  enemyDisplay: LayoutZone;
  questionPanel: LayoutZone;
  enemyInfoBar: LayoutZone;
  playerHUD: LayoutZone;
}

export const LAYOUT_CONTRACT: LayoutContractType = {
  background: { x: 0, y: 0, width: 100, height: 100 },
  midground: { x: 0, y: 40, width: 100, height: 60 },
  characterStage: { x: 25, y: 30, width: 50, height: 70 },
  fxOverlay: { x: 0, y: 0, width: 100, height: 100 },
  uiOverlay: { x: 0, y: 0, width: 100, height: 100 },
  enemyDisplay: { x: 30, y: 20, width: 40, height: 60 },
  questionPanel: { x: 5, y: 70, width: 90, height: 30 },
  enemyInfoBar: { x: 20, y: 0, width: 60, height: 10 },
  playerHUD: { x: 0, y: 85, width: 20, height: 15 },
};

/** Named FX anchor points */
export type FXAnchorName =
  | "enemy_center"
  | "enemy_top"
  | "player_side"
  | "screen_center"
  | "screen_full";

export interface FXAnchorPosition {
  x: number;
  y: number;
  fillViewport?: boolean;
}

export const FX_ANCHORS: Record<FXAnchorName, FXAnchorPosition> = {
  enemy_center: { x: 50, y: 50 },
  enemy_top: { x: 50, y: 20 },
  player_side: { x: 12, y: 85 },
  screen_center: { x: 50, y: 50 },
  screen_full: { x: 50, y: 50, fillViewport: true },
};

export const DEFAULT_FX_ANCHOR: FXAnchorName = "screen_center";
