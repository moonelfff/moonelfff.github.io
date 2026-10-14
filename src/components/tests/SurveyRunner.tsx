"use client";

import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import NextLink from "next/link";
import { Model, setLicenseKey, surveyLocalization } from "survey-core";
import "survey-core/i18n/russian";
import Typography from "@/components/atom/Typography";
import TestIntroduction from "@/components/tests/organism/TestIntroduction";
import TestQuestionStep from "@/components/tests/organism/TestQuestionStep";
import TestResult from "@/components/tests/organism/TestResult";
import type { TestResultPayload } from "@/lib/tests/types";
import { countQuestions, estimateMinutes } from "@/lib/tests/meta";

type SurveyRunnerProps = {
  slug: string;
  title: string;
  description: string;
  schema: Record<string, unknown>;
  contactHref?: string;
  contactTitle?: string;
};

type Phase = "intro" | "questions" | "submitting" | "result";

const ruStrings = surveyLocalization.locales.ru;
if (ruStrings) {
  ruStrings.requiredError = "Выберите ответ, чтобы продолжить";
  ruStrings.requiredErrorInPanel = "Ответьте хотя бы на один вопрос";
}

function ArrowIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={direction === "left" ? "M19 12H5M11 6l-6 6 6 6" : "M5 12h14M13 6l6 6-6 6"} />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 12l5 5L20 6" />
    </svg>
  );
}

export default function SurveyRunner({
  slug,
  title,
  description,
  schema,
  contactHref,
  contactTitle,
}: SurveyRunnerProps) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<TestResultPayload | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [, rerender] = useReducer((n: number) => n + 1, 0);

  const questionCount = useMemo(() => countQuestions(schema), [schema]);

  const survey = useMemo(() => {
    void attempt;
    const licenseKey = process.env.NEXT_PUBLIC_SURVEYJS_LICENSE_KEY;
    if (licenseKey) {
      setLicenseKey(licenseKey);
    }

    const surveySchema: Record<string, unknown> = { ...schema };
    delete surveySchema.title;
    delete surveySchema.description;

    // Много вопросов на одной странице показываем по одному, если схема не задала иное
    if (!surveySchema.questionsOnPageMode && questionCount > 8) {
      surveySchema.questionsOnPageMode = "questionPerPage";
    }

    const nextSurvey = new Model(surveySchema);
    nextSurvey.locale = "ru";
    nextSurvey.showNavigationButtons = "none";
    nextSurvey.showProgressBar = "off";
    nextSurvey.showTitle = false;
    if (!surveySchema.showQuestionNumbers) {
      nextSurvey.showQuestionNumbers = "on";
    }
    if (nextSurvey.showQuestionNumbers === "on") {
      nextSurvey.questionStartIndex = "Вопрос 1";
    }
    nextSurvey.showCompletedPage = false;
    nextSurvey.focusFirstQuestionAutomatic = false;
    if (surveySchema.questionsOnPageMode === "questionPerPage") {
      nextSurvey.allowCompleteSurveyAutomatic = false;
    }
    return nextSurvey;
  }, [schema, questionCount, attempt]);

  useEffect(() => {
    let autoNextTimer: ReturnType<typeof setTimeout> | undefined;
    const bump = () => {
      rerender();
      setTimeout(rerender, 80);
    };

    const onComplete = async (sender: Model) => {
      setPhase("submitting");
      setSubmitError(null);

      try {
        const response = await fetch(`/api/tests/${slug}/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers: sender.data }),
        });

        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new Error(body?.error ?? "Не удалось обработать результат");
        }

        const body = (await response.json()) as { result: TestResultPayload };
        setResult(body.result);
        setPhase("result");
      } catch (error) {
        setSubmitError(
          error instanceof Error
            ? error.message
            : "Не удалось обработать результат",
        );
        setPhase("questions");
      }
    };

    const onValueChanged = (
      sender: Model,
      options: { question?: { getType: () => string } },
    ) => {
      bump();
      if (
        sender.isSingleVisibleQuestion &&
        options.question?.getType() === "radiogroup" &&
        sender.isLastElement !== true
      ) {
        if (autoNextTimer) clearTimeout(autoNextTimer);
        autoNextTimer = setTimeout(() => {
          sender.performNext();
          rerender();
        }, 450);
      }
    };

    survey.onComplete.add(onComplete);
    survey.onCurrentPageChanged.add(bump);
    survey.onValueChanged.add(onValueChanged);
    survey.onFocusInQuestion.add(bump);
    return () => {
      if (autoNextTimer) clearTimeout(autoNextTimer);
      survey.onComplete.remove(onComplete);
      survey.onCurrentPageChanged.remove(bump);
      survey.onValueChanged.remove(onValueChanged);
      survey.onFocusInQuestion.remove(bump);
    };
  }, [slug, survey]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [phase]);

  const retry = useCallback(() => {
    setResult(null);
    setSubmitError(null);
    setAttempt((value) => value + 1);
    setPhase("intro");
  }, []);

  const isFirst = survey.isFirstElement ?? survey.isFirstPage;
  const isLast = survey.isLastElement ?? survey.isLastPage;

  const answered = Object.keys(survey.data ?? {}).length;
  const progress = questionCount > 0 ? answered / questionCount : 0;

  const goNext = () => {
    if (isLast) {
      survey.tryComplete();
    } else {
      survey.performNext();
    }
    rerender();
  };

  const goPrev = () => {
    survey.performPrevious();
    rerender();
  };

  const minutes = estimateMinutes(questionCount);

  return (
    <main className="bg-platinum font-primary min-h-dvh px-3 py-3 md:px-12 xl:px-24 2xl:px-60">
      <div className="mx-auto w-full max-w-4xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <NextLink
            href="/tests"
            className="text-dusty-grape text-sm font-semibold hover:underline"
          >
            ← Все тесты
          </NextLink>
        </div>

        <Typography component="h1">{title}</Typography>

        {phase === "intro" ? (
          <TestIntroduction
            description={description}
            questionCount={questionCount}
            minutes={minutes}
            startIcon={<ArrowIcon direction="right" />}
            onStart={() => setPhase("questions")}
          />
        ) : null}

        {phase === "questions" || phase === "submitting" ? (
          <TestQuestionStep
            survey={survey}
            progress={progress}
            answered={answered}
            questionCount={questionCount}
            error={submitError}
            isSubmitting={phase === "submitting"}
            isFirst={Boolean(isFirst)}
            isLast={Boolean(isLast)}
            previousIcon={<ArrowIcon direction="left" />}
            nextIcon={
              isLast ? <CheckIcon /> : <ArrowIcon direction="right" />
            }
            onPrevious={goPrev}
            onNext={goNext}
          />
        ) : null}

        {phase === "result" && result ? (
          <TestResult
            result={result}
            contactHref={contactHref}
            contactTitle={contactTitle}
            onRetry={retry}
          />
        ) : null}
      </div>
    </main>
  );
}
