export type EncounterType = "question" | "puzzle_step";

export type EncounterRowStatus = "pending" | "active" | "completed" | "failed";

export interface BattleEncounterPublic {
  id: string;
  sequenceIndex: number;
  encounterType: EncounterType;
  questionId: string | null;
  puzzleId: string | null;
  status: EncounterRowStatus;
  chainId: string | null;
  chainPosition: number | null;
  chainLength: number | null;
}
