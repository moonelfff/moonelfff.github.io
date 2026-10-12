"use client";

import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import NextLink from "next/link";
import { Model, setLicenseKey } from "survey-core";
import { Survey } from "survey-react-ui";
import "survey-core/survey-core.min.css";
import Glass from "@/components/atom/Glass";
import Typography from "@/components/atom/Typography";
import Button from "@/components/molecule/Button";
import type { TestResultPayload } from "@/lib/tests/types";
import {
  countQuestions,
  estimateMinutes,
  pluralize,
} from "@/lib/tests/meta";
import { parseMarkdown } from "@/utils/markdownParser";

type SurveyRunnerProps = {
  slug: string;
  title: string;
  description: string;
  schema: Record<string, unknown>;
  contactHref?: string;
  contactTitle?: string;
};

type Phase = "intro" | "questions" | "submitting" | "result";

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

function ProgressBar({
  value,
  label,
  onGlass,
}: {
  value: number;
  label?: string;
  onGlass?: boolean;
}) {
  const percent = Math.max(0, Math.min(100, Math.round(value * 100)));
  return (
    <div
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={`h-3 w-full overflow-hidden rounded-full ${
        onGlass ? "bg-black/30" : "bg-dusty-grape/15"
      }`}
    >
      <div
        className="bg-success h-full rounded-full transition-all duration-300"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

function ResultView({
  result,
  contactHref,
  contactTitle,
  onRetry,
}: {
  result: TestResultPayload;
  contactHref?: string;
  contactTitle?: string;
  onRetry: () => void;
}) {
  const groups = result.groupScores ?? [];
  const maxGroup = Math.max(1, ...groups.map((group) => group.score));
  const top = result.topGroups ?? [];

  return (
    <div className="flex flex-col gap-6">
      <Glass>
        <div className="text-platinum flex flex-col gap-4 p-6 lg:p-8">
          <p className="text-sm tracking-wide uppercase opacity-80">
            Ваш результат
          </p>
          <h2 className="text-2xl font-semibold lg:text-4xl">
            {result.level}
          </h2>
          {result.maxScore > 0 && groups.length === 0 ? (
            <div className="flex flex-col gap-2">
              <ProgressBar
                onGlass
                value={result.score / result.maxScore}
                label="Балл"
              />
              <p className="font-numerical text-sm">
                {result.score} / {result.maxScore}
              </p>
            </div>
          ) : null}
          {result.summary ? (
            <p className="text-base lg:text-lg">{result.summary}</p>
          ) : null}
        </div>
      </Glass>

      {top.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          {top.map((group, index) => (
            <div key={group.id} className="pb-2">
              <Glass>
                <div className="text-platinum flex h-full flex-col gap-2 p-6">
                  <span className="bg-gold w-fit rounded-full px-3 py-1 text-sm font-semibold text-black">
                    {index === 0 ? "Главное" : `№${index + 1}`}
                  </span>
                  <h3 className="text-xl font-semibold lg:text-2xl">
                    {group.title || group.name}
                  </h3>
                  {group.interpretation ? (
                    <p className="text-base">{group.interpretation}</p>
                  ) : null}
                </div>
              </Glass>
            </div>
          ))}
        </div>
      ) : null}

      {groups.length > 1 ? (
        <div className="pb-2">
          <Glass>
            <div className="text-platinum flex flex-col gap-3 p-6">
              <h3 className="text-xl font-semibold">Все результаты</h3>
              {groups.map((group) => (
                <div key={group.id} className="flex flex-col gap-1">
                  <div className="flex justify-between gap-3 text-sm">
                    <span>{group.name || group.title}</span>
                    <span className="font-numerical">{group.score}</span>
                  </div>
                  <ProgressBar onGlass value={group.score / maxGroup} />
                </div>
              ))}
            </div>
          </Glass>
        </div>
      ) : null}

      <Typography component="p" className="text-sm opacity-70">
        Тест не является диагностикой и не заменяет консультацию психолога.
      </Typography>

      <div className="flex flex-col gap-4 lg:flex-row">
        {contactHref ? (
          <Button href={contactHref} external>
            {contactTitle || "Записаться на консультацию"}
          </Button>
        ) : null}
        <Button variant="outline" onClick={onRetry}>
          Пройти заново
        </Button>
        <Button variant="outline" href="/tests">
          Все тесты
        </Button>
      </div>
    </div>
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
    nextSurvey.showNavigationButtons = "none";
    nextSurvey.showProgressBar = "off";
    nextSurvey.showTitle = false;
    if (!surveySchema.showQuestionNumbers) {
      nextSurvey.showQuestionNumbers = "on";
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
          <div className="flex flex-col gap-6 pb-6">
            <div className="pb-2">
              <Glass>
                <div className="text-platinum flex flex-col gap-4 p-6 lg:p-8">
                  <div className="markdown content-markdown">
                    {description.trim() ? (
                      parseMarkdown(description)
                    ) : (
                      <p>Описание теста пока не заполнено.</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 text-sm">
                    <span className="rounded-full bg-white/20 px-3 py-1">
                      {questionCount}{" "}
                      {pluralize(questionCount, [
                        "вопрос",
                        "вопроса",
                        "вопросов",
                      ])}
                    </span>
                    <span className="rounded-full bg-white/20 px-3 py-1">
                      ~{minutes}{" "}
                      {pluralize(minutes, ["минута", "минуты", "минут"])}
                    </span>
                  </div>
                </div>
              </Glass>
            </div>
            <Button onClick={() => setPhase("questions")}>Начать</Button>
          </div>
        ) : null}

        {phase === "questions" || phase === "submitting" ? (
          <div className="flex flex-col gap-6 pb-6">
            <div className="flex flex-col gap-2">
              <ProgressBar value={progress} label="Прогресс" />
              <p className="font-numerical text-dusty-grape text-sm">
                Отвечено {answered} из {questionCount}
              </p>
            </div>

            {submitError ? (
              <p className="border-danger/40 bg-danger/10 text-danger rounded-xl border px-4 py-3 text-sm">
                {submitError}
              </p>
            ) : null}

            <div className="pb-2">
              <Glass>
                <div className="test-survey text-platinum p-6 lg:p-8">
                  <Survey model={survey} />
                </div>
              </Glass>
            </div>

            <div className="flex gap-3 lg:justify-between">
              <Button
                variant="soft"
                className="flex-1 lg:flex-none"
                icon={<ArrowIcon direction="left" />}
                iconPosition="left"
                onClick={goPrev}
                disabled={phase === "submitting" || Boolean(isFirst)}
              >
                Назад
              </Button>
              <Button
                variant={isLast ? "success" : "glass"}
                className="flex-1 lg:flex-none"
                icon={isLast ? <CheckIcon /> : <ArrowIcon direction="right" />}
                onClick={goNext}
                disabled={phase === "submitting"}
              >
                {phase === "submitting"
                  ? "Считаем..."
                  : isLast
                    ? "Результат"
                    : "Далее"}
              </Button>
            </div>
          </div>
        ) : null}

        {phase === "result" && result ? (
          <ResultView
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
