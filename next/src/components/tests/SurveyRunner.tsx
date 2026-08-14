"use client";

import { useEffect, useMemo, useState } from "react";
import { Model, setLicenseKey } from "survey-core";
import { Survey } from "survey-react-ui";
import type { TestResultPayload } from "@/lib/tests/types";

type SurveyRunnerProps = {
  slug: string;
  title: string;
  description: string;
  schema: Record<string, unknown>;
};

type SubmitResponse = {
  resultId: string;
  result: TestResultPayload;
  note?: string;
};

export default function SurveyRunner({
  slug,
  title,
  description,
  schema,
}: SurveyRunnerProps) {
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<SubmitResponse | null>(null);

  const survey = useMemo(() => {
    const licenseKey = process.env.NEXT_PUBLIC_SURVEYJS_LICENSE_KEY;
    if (licenseKey) {
      setLicenseKey(licenseKey);
    }

    const nextSurvey = new Model(schema);
    nextSurvey.focusFirstQuestionAutomatic = true;
    return nextSurvey;
  }, [schema]);

  useEffect(() => {
    const onComplete = async (sender: Model) => {
      setSubmitting(true);
      setSubmitError(null);

      const response = await fetch(`/api/tests/${slug}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: sender.data }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        setSubmitError(body?.error ?? "Не удалось обработать результат");
        setSubmitting(false);
        return;
      }

      const body = (await response.json()) as SubmitResponse;
      setResult(body);
      setSubmitting(false);
    };

    survey.onComplete.add(onComplete);
    return () => {
      survey.onComplete.remove(onComplete);
    };
  }, [slug, survey]);

  return (
    <main className="bg-platinum font-primary min-h-dvh px-3 py-4 text-black md:px-6 md:py-8">
      <div className="mx-auto w-full max-w-4xl">
        <h1 className="text-2xl font-semibold md:text-3xl">{title}</h1>
        <p className="mt-2 text-sm text-black/75 md:text-base">{description}</p>

        {submitError ? (
          <p className="mt-3 rounded-lg border border-red-300/60 bg-red-100 px-3 py-2 text-sm text-red-900">
            {submitError}
          </p>
        ) : null}

        <div className="mt-4 rounded-2xl border border-black/10 bg-white p-3 md:p-5">
          <Survey model={survey} />
        </div>

        {submitting ? (
          <p className="mt-3 text-sm text-black/70">Считаем результат...</p>
        ) : null}

        {result ? (
          <section className="border-gold/50 bg-gold/20 mt-4 rounded-2xl border p-4">
            <h2 className="text-lg font-semibold">Ваш результат</h2>
            <p className="mt-1 text-sm">
              Балл: {result.result.score} из {result.result.maxScore}
            </p>
            <p className="mt-1 font-medium">{result.result.level}</p>
            <p className="mt-2 text-sm text-black/80">
              {result.result.summary}
            </p>

            {result.result.topGroups && result.result.topGroups.length > 0 ? (
              <div className="mt-3 rounded-xl border border-black/10 bg-white/60 p-3">
                <p className="text-sm font-medium">
                  Наиболее выраженные группы:
                </p>
                <ul className="mt-2 space-y-3 text-sm text-black/80">
                  {result.result.topGroups.map((group, index) => (
                    <li
                      key={group.id}
                      className="rounded-lg border border-black/10 bg-white/60 p-2"
                    >
                      <div className="font-medium text-black">
                        {index + 1}. {group.title || group.name} — {group.score}{" "}
                        балл
                        {group.score === 1 ? "" : "а"}
                      </div>
                      {group.interpretation ? (
                        <p className="mt-1 text-black/75">
                          {group.interpretation}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <p className="mt-2 text-xs text-black/60">
              ID результата: {result.resultId}
            </p>
            {result.note ? (
              <p className="mt-2 text-xs text-black/60">{result.note}</p>
            ) : null}
          </section>
        ) : null}
      </div>
    </main>
  );
}
