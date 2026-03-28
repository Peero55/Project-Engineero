export interface UserProfile {
  id: string;
  slackId: string | null;
  level: number;
  xp: number;
  currentHp: number;
  maxHp: number;
}

export interface UserStats {
  topicId: string;
  correctCount: number;
  incorrectCount: number;
  avgTimeMs: number;
}
