import { ArrowRight } from "lucide-react";
import Glass from "@/components/atom/Glass";
import Typography from "@/components/atom/Typography";
import Button from "@/components/molecule/Button";
import TestMetadata from "@/components/tests/molecule/TestMetadata";
import { getPublicTestSummaries } from "@/lib/tests/testStore";
import {
  estimateMinutes,
  plainText,
} from "@/lib/tests/meta";

export const dynamic = "force-dynamic";

export default async function TestsPage() {
  const tests = await getPublicTestSummaries();

  return (
    <main className="bg-platinum font-primary min-h-dvh px-3 py-3 md:px-12 xl:px-24 2xl:px-60">
      <header className="mb-6 max-w-3xl pt-2">
        <Typography component="h1">Психологические тесты</Typography>
        <Typography component="p" className="mt-2">
          Короткие тесты помогают лучше понять себя. Они не заменяют
          консультацию, но могут стать первым шагом. Результат показывается
          сразу после прохождения.
        </Typography>
      </header>

      {tests.length === 0 ? (
        <Typography component="p">Тесты скоро появятся.</Typography>
      ) : (
        <div className="grid gap-6 pb-6 md:grid-cols-2 xl:grid-cols-3">
          {tests.map((test) => {
            const questions = test.questionCount;
            const minutes = estimateMinutes(questions);
            const excerpt = plainText(test.description);
            return (
              <article key={test.id} className="pb-2">
                <Glass>
                  <div className="text-platinum flex h-full flex-col gap-4 p-6">
                    <Typography
                      component="h2"
                      className="text-platinum mb-0 text-xl font-semibold lg:text-2xl"
                    >
                      {test.title}
                    </Typography>
                    <div className="flex-1">
                      <Typography
                        component="p"
                        className="line-clamp-5 text-left text-base"
                      >
                        {excerpt}
                      </Typography>
                    </div>
                    <TestMetadata
                      questionCount={questions}
                      minutes={minutes}
                    />
                    <Button
                      href={`/tests/${test.slug}`}
                      variant="solid"
                      icon={<ArrowRight size={20} strokeWidth={2.5} aria-hidden />}
                    >
                      Пройти тест
                    </Button>
                  </div>
                </Glass>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
