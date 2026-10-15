"use client";

import { useEffect, useMemo, useReducer, useState } from "react";
import { Model, setLicenseKey, surveyLocalization } from "survey-core";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import "survey-core/i18n/russian";
import TestQuestionStep from "@/components/tests/organism/TestQuestionStep";
import TestResult from "@/components/tests/organism/TestResult";
import type { TestResultPayload } from "@/lib/tests/types";
import { countQuestions } from "@/lib/tests/meta";

type Props = {
  slug: string;
  schema: Record<string, unknown>;
  contactHref?: string;
  contactTitle?: string;
  onRetry: () => void;
};

type Phase = "questions" | "submitting" | "result";

const ruStrings = surveyLocalization.locales.ru;
if (ruStrings) {
  ruStrings.requiredError = "Выберите ответ, чтобы продолжить";
  ruStrings.requiredErrorInPanel = "Ответьте хотя бы на один вопрос";
}

export default function TestSession({
  slug,
  schema,
  contactHref,
  contactTitle,
  onRetry,
}: Props) {
  const [phase, setPhase] = useState<Phase>("questions");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<TestResultPayload | null>(null);
  const [, rerender] = useReducer((n: number) => n + 1, 0);

  const questionCount = useMemo(() => countQuestions(schema), [schema]);

  const survey = useMemo(() => {
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
  }, [schema, questionCount]);

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

  return (
    <>
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
          previousIcon={<ArrowLeft size={20} strokeWidth={2.5} aria-hidden />}
          nextIcon={
            isLast ? (
              <Check size={20} strokeWidth={3} aria-hidden />
            ) : (
              <ArrowRight size={20} strokeWidth={2.5} aria-hidden />
            )
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
          onRetry={onRetry}
        />
      ) : null}
    </>
  );
}
