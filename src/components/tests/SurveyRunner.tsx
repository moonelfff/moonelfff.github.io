"use client";

import { lazy, Suspense, useState } from "react";
import NextLink from "next/link";
import { ArrowRight, LoaderCircle } from "lucide-react";
import Typography from "@/components/atom/Typography";
import TestIntroduction from "./organism/TestIntroduction";
import { countQuestions, estimateMinutes } from "@/lib/tests/meta";

const TestSession = lazy(() => import("./organism/TestSession"));

type Props = {
  slug: string;
  title: string;
  description: string;
  schema: Record<string, unknown>;
  contactHref?: string;
  contactTitle?: string;
};

export default function SurveyRunner(props: Props) {
  const [started, setStarted] = useState(false);
  const questionCount = countQuestions(props.schema);

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
        <Typography component="h1">{props.title}</Typography>
        {started ? (
          <Suspense
            fallback={
              <div role="status" className="flex items-center gap-2 py-6 text-dusty-grape">
                <LoaderCircle className="size-5 animate-spin motion-reduce:animate-none" aria-hidden />
                <Typography component="span">Загружаем вопросы…</Typography>
              </div>
            }
          >
            <TestSession
              {...props}
              onRetry={() => {
                setStarted(false);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          </Suspense>
        ) : (
          <TestIntroduction
            description={props.description}
            questionCount={questionCount}
            minutes={estimateMinutes(questionCount)}
            startIcon={<ArrowRight size={20} strokeWidth={2.5} aria-hidden />}
            onStart={() => setStarted(true)}
          />
        )}
      </div>
    </main>
  );
}
