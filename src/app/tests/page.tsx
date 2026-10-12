import Link from "next/link";
import { getPublicTestBundle } from "@/lib/tests/testStore";
import { markdownToHtml } from "@/utils/markdownToHtml";

export const dynamic = "force-dynamic";

export default async function TestsPage() {
  const { tests } = await getPublicTestBundle();

  return (
    <main className="bg-platinum font-primary min-h-dvh px-3 py-4 text-black md:px-6 md:py-8">
      <div className="mx-auto w-full max-w-4xl">
        <h1 className="text-2xl font-semibold md:text-3xl">
          Психологические тесты
        </h1>
        <p className="mt-2 text-sm text-black/75 md:text-base">
          Выберите тест и пройдите его онлайн.
        </p>

        <div className="mt-4 grid gap-3">
          {tests.map((test) => (
            <article
              key={test.id}
              className="rounded-xl border border-black/10 bg-white p-4 shadow-sm"
            >
              <h2 className="text-lg font-semibold">{test.title}</h2>
              <div
                className="markdown content-markdown mt-2 text-sm text-black/75"
                dangerouslySetInnerHTML={{
                  __html: markdownToHtml(test.description),
                }}
              />
              <Link
                href={`/tests/${test.slug}`}
                className="mt-3 inline-flex rounded-lg border border-black/20 px-3 py-2 text-sm font-medium hover:bg-black/5"
              >
                Пройти тест
              </Link>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
