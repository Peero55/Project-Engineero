export type BattleState = "active" | "won" | "lost";

export type BattleResult = "ongoing" | "win" | "loss";

export interface BattleStateSnapshot {
  battleId: string;
  battleState: BattleState;
  playerHP: number;
  enemyHP: number;
  result: BattleResult;
  questionsAnswered: number;
  maxQuestions: number;
}

export interface AnswerResult {
  correct: boolean;
  damageDealt: number;
  damageTaken: number;
  responseMs: number;
}
