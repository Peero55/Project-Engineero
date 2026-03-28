/**
 * UI-facing state shapes (screens + encounter flow).
 * Server persistence lives in later phases; these types document intent.
 */

export type AttackTier = 'light' | 'medium' | 'heavy' | 'ultimate';

export interface PlayerUIState {
  level: number;
  xp: number;
  xpToNextLevel?: number;
  health: number;
  maxHealth: number;
  unlocked_attacks: AttackTier[];
}

export interface BattleUIState {
  enemy_hp: number;
  enemy_max_hp: number;
  question_index: number;
  question_total: number;
  last_damage?: number;
  result?: 'pending' | 'correct' | 'incorrect' | 'timeout' | null;
}
