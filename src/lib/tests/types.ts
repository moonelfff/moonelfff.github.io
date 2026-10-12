export type TestScaleLevel = {
  min: number;
  max: number;
  label: string;
  summary: string;
};

export type TestGroupDefinition = {
  id: string;
  name: string;
  title: string;
  interpretation: string;
  questions: string[];
};

export type TestGroupScore = {
  id: string;
  name: string;
  title: string;
  interpretation: string;
  score: number;
};

export type TestScoringConfig = {
  questionIds?: string[];
  reverseQuestionIds?: string[];
  minPerQuestion?: number;
  maxPerQuestion?: number;
  levels?: TestScaleLevel[];
  groups?: TestGroupDefinition[];
  /** Group mode: answer values that count as "yes" (default [1, 2]). */
  positiveValues?: number[];
  /** Group mode: how many leading groups to highlight (default 2). */
  topCount?: number;
};

export type PublicTestDefinition = {
  id: string;
  slug: string;
  title: string;
  description: string;
  version: number;
  schema: Record<string, unknown>;
  scoring: TestScoringConfig;
};

export type TestResultPayload = {
  score: number;
  maxScore: number;
  level: string;
  summary: string;
  groupScores?: TestGroupScore[];
  topGroups?: TestGroupScore[];
};
