export type QuestionType = "multiple_choice" | "multi_select" | "scenario" | "guided_lab";

export type DifficultyTier = 1 | 2 | 3 | 4 | 5;

export interface AnswerOption {
  id: string;
  label: string;
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  certificationId: string;
  domainId: string;
  topicId: string;
  prompt: string;
  questionType: QuestionType;
  difficultyTier: DifficultyTier;
  shortExplanation: string;
  longExplanation: string;
  referenceLink?: string;
  options: AnswerOption[];
}