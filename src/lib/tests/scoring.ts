import type { TestResultPayload, TestScoringConfig } from "./types";

function toNumericAnswer(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

export function evaluateTestResult(
  answers: Record<string, unknown>,
  scoring: TestScoringConfig,
): TestResultPayload {
  if (scoring.groups && scoring.groups.length > 0) {
    const groupScores = scoring.groups
      .map((group) => {
        const score = group.questions.reduce((total, questionId) => {
          const raw = toNumericAnswer(answers[questionId]);
          if (raw === 1 || raw === 2) {
            return total + 1;
          }
          return total;
        }, 0);

        return {
          id: group.id,
          name: group.name,
          title: group.title,
          interpretation: group.interpretation,
          score,
        };
      })
      .sort((left, right) => right.score - left.score);

    const totalPositiveScore = groupScores.reduce(
      (sum, group) => sum + group.score,
      0,
    );
    const totalPossibleScore = scoring.groups.reduce(
      (sum, group) => sum + group.questions.length,
      0,
    );

    return {
      score: totalPositiveScore,
      maxScore: totalPossibleScore,
      level: "Лидирующие группы",
      summary: "Наиболее выраженные типы по итогам ответа.",
      groupScores,
      topGroups: groupScores.slice(0, 2),
    };
  }

  const questionIds = scoring.questionIds ?? [];
  const minPerQuestion = scoring.minPerQuestion ?? 1;
  const maxPerQuestion = scoring.maxPerQuestion ?? 1;
  const levels = scoring.levels ?? [];
  const reverseSet = new Set(scoring.reverseQuestionIds ?? []);

  let score = 0;
  for (const questionId of questionIds) {
    const raw = toNumericAnswer(answers[questionId]);
    if (raw === null) {
      continue;
    }

    const normalized = Math.max(minPerQuestion, Math.min(raw, maxPerQuestion));

    if (reverseSet.has(questionId)) {
      score += maxPerQuestion + minPerQuestion - normalized;
    } else {
      score += normalized;
    }
  }

  const maxScore = questionIds.length * maxPerQuestion;
  const level =
    levels.find((item) => score >= item.min && score <= item.max) ??
    levels[levels.length - 1];

  return {
    score,
    maxScore,
    level: level?.label ?? "Результат",
    summary: level?.summary ?? "Интерпретация недоступна.",
    groupScores: [],
    topGroups: [],
  };
}
