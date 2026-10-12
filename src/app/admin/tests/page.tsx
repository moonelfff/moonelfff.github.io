"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type {
  PublicTestDefinition,
  TestScoringConfig,
} from "@/lib/tests/types";
import { parseMarkdown } from "@/utils/markdownParser";

type TestBundle = {
  tests: PublicTestDefinition[];
  source: "supabase";
};

type ChoiceValue = string | number;

type EditableChoice = {
  id: string;
  value: string;
  text: string;
};

type QuestionType = "radiogroup" | "checkbox" | "dropdown" | "text" | "comment";

type EditableQuestion = {
  id: string;
  type: QuestionType;
  name: string;
  title: string;
  description: string;
  isRequired: boolean;
  choices: EditableChoice[];
  extraSettingsText: string;
};

type EditableTest = Omit<PublicTestDefinition, "schema" | "scoring"> & {
  questions: EditableQuestion[];
  schemaSettingsText: string;
  scoringText: string;
};

const PAGE_SIZE = 20;

const DEFAULT_CHOICES: Array<{ value: string; text: string }> = [
  { value: "1", text: "Полностью согласен" },
  { value: "2", text: "Скорее согласен, чем не согласен" },
  { value: "3", text: "Не согласен" },
];

const DEFAULT_SCHEMA_SETTINGS = {
  showProgressBar: "top",
  progressBarType: "questions",
  completeText: "Показать результат",
};

const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "e",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "h",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "sch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
};

function transliterate(value: string): string {
  return value
    .toLowerCase()
    .split("")
    .map((char) => CYRILLIC_TO_LATIN[char] ?? char)
    .join("");
}

function normalizeSlug(value: string): string {
  return transliterate(value)
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function moveItem<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= items.length ||
    toIndex >= items.length
  ) {
    return items;
  }

  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && !Array.isArray(value) && typeof value === "object";
}

function parseJsonObject(
  value: string,
  fieldName: string,
): Record<string, unknown> {
  let parsed: unknown;

  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error(`${fieldName}: некорректный JSON`);
  }

  if (!isPlainObject(parsed)) {
    throw new Error(`${fieldName}: ожидается JSON-объект`);
  }

  return parsed;
}

function normalizeChoiceValue(value: ChoiceValue): ChoiceValue {
  const trimmed = String(value).trim();
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return Number(trimmed);
  }
  return trimmed;
}

function createChoice(index: number): EditableChoice {
  const template = DEFAULT_CHOICES[index] ?? {
    value: String(index + 1),
    text: `Вариант ${index + 1}`,
  };

  return {
    id: `choice-${crypto.randomUUID()}`,
    value: template.value,
    text: template.text,
  };
}

function createQuestion(index: number): EditableQuestion {
  return {
    id: `question-${crypto.randomUUID()}`,
    type: "radiogroup",
    name: `q${index + 1}`,
    title: `Вопрос ${index + 1}`,
    description: "",
    isRequired: true,
    choices: DEFAULT_CHOICES.map((choice) => ({
      id: `choice-${crypto.randomUUID()}`,
      value: choice.value,
      text: choice.text,
    })),
    extraSettingsText: "{}",
  };
}

function isChoiceBasedQuestion(type: QuestionType): boolean {
  return type === "radiogroup" || type === "checkbox" || type === "dropdown";
}

function toQuestionType(value: unknown): QuestionType {
  if (
    value === "radiogroup" ||
    value === "checkbox" ||
    value === "dropdown" ||
    value === "text" ||
    value === "comment"
  ) {
    return value;
  }

  return "radiogroup";
}

function extractChoiceList(rawChoices: unknown): EditableChoice[] {
  if (!Array.isArray(rawChoices)) {
    return DEFAULT_CHOICES.map((choice) => ({
      id: `choice-${crypto.randomUUID()}`,
      value: choice.value,
      text: choice.text,
    }));
  }

  return rawChoices.map((choice, index) => {
    if (isPlainObject(choice)) {
      return {
        id: `choice-${crypto.randomUUID()}`,
        value: String(choice.value ?? index + 1),
        text: String(choice.text ?? choice.value ?? `Вариант ${index + 1}`),
      };
    }

    return {
      id: `choice-${crypto.randomUUID()}`,
      value: String(choice),
      text: String(choice),
    };
  });
}

function extractQuestions(schema: Record<string, unknown>): EditableQuestion[] {
  const pages = Array.isArray(schema.pages) ? schema.pages : [];
  const questions: EditableQuestion[] = [];

  pages.forEach((page) => {
    if (!isPlainObject(page)) {
      return;
    }

    const elements = Array.isArray(page.elements) ? page.elements : [];
    elements.forEach((element) => {
      if (!isPlainObject(element)) {
        return;
      }

      const { type, name, title, description, isRequired, choices, ...extra } =
        element;

      const questionType = toQuestionType(type);

      questions.push({
        id: `question-${crypto.randomUUID()}`,
        type: questionType,
        name: typeof name === "string" ? name : `q${questions.length + 1}`,
        title:
          typeof title === "string" ? title : `Вопрос ${questions.length + 1}`,
        description: typeof description === "string" ? description : "",
        isRequired: Boolean(isRequired),
        choices: isChoiceBasedQuestion(questionType)
          ? extractChoiceList(choices)
          : [],
        extraSettingsText: JSON.stringify(extra, null, 2),
      });
    });
  });

  return questions;
}

function extractSchemaSettings(
  schema: Record<string, unknown>,
): Record<string, unknown> {
  const rest = { ...schema };
  delete rest.title;
  delete rest.description;
  delete rest.pages;
  return rest;
}

function toEditable(test: PublicTestDefinition): EditableTest {
  const schemaSettings = extractSchemaSettings(test.schema);

  return {
    id: test.id,
    slug: test.slug,
    title: test.title,
    description: test.description,
    version: test.version,
    questions: extractQuestions(test.schema),
    schemaSettingsText: JSON.stringify(schemaSettings, null, 2),
    scoringText: JSON.stringify(test.scoring, null, 2),
  };
}

function createEmptyTest(index: number): EditableTest {
  const title = `Новый тест ${index + 1}`;

  return {
    id: `tmp-test-${crypto.randomUUID()}`,
    slug: `test-${index + 1}`,
    title,
    description: "",
    version: 1,
    questions: [createQuestion(0)],
    schemaSettingsText: JSON.stringify(DEFAULT_SCHEMA_SETTINGS, null, 2),
    scoringText: JSON.stringify({}, null, 2),
  };
}

function chunkQuestions(
  questions: EditableQuestion[],
): Array<Array<EditableQuestion>> {
  if (questions.length === 0) {
    return [[]];
  }

  const chunks: Array<Array<EditableQuestion>> = [];

  for (let index = 0; index < questions.length; index += PAGE_SIZE) {
    chunks.push(questions.slice(index, index + PAGE_SIZE));
  }

  return chunks;
}

function buildQuestionSchema(
  question: EditableQuestion,
  index: number,
): Record<string, unknown> {
  const extraSettings = parseJsonObject(
    question.extraSettingsText,
    `Вопрос #${index + 1}, доп. настройки`,
  );

  const base: Record<string, unknown> = {
    type: question.type,
    name: question.name.trim() || `q${index + 1}`,
    title: question.title.trim() || `Вопрос ${index + 1}`,
    isRequired: question.isRequired,
    ...extraSettings,
  };

  if (question.description.trim()) {
    base.description = question.description.trim();
  }

  if (isChoiceBasedQuestion(question.type)) {
    base.choices = question.choices.map((choice, choiceIndex) => ({
      value:
        normalizeChoiceValue(choice.value || String(choiceIndex + 1)) ??
        choiceIndex + 1,
      text: choice.text.trim() || `Вариант ${choiceIndex + 1}`,
    }));
  }

  return base;
}

function buildSchema(test: EditableTest): Record<string, unknown> {
  const schemaSettings = parseJsonObject(
    test.schemaSettingsText,
    `Тест \"${test.title || test.slug}\", настройки схемы`,
  );
  const pages = chunkQuestions(test.questions);

  return {
    ...schemaSettings,
    title: test.title.trim(),
    description: test.description,
    pages: pages.map((questions, pageIndex) => {
      const start = pageIndex * PAGE_SIZE + 1;
      const end = pageIndex * PAGE_SIZE + questions.length;
      const totalPages = Math.max(1, pages.length);

      return {
        name: totalPages === 1 ? "main" : `page-${pageIndex + 1}`,
        title: totalPages > 1 ? `Вопросы ${start}-${end}` : undefined,
        elements: questions.map((question, questionIndex) =>
          buildQuestionSchema(question, pageIndex * PAGE_SIZE + questionIndex),
        ),
      };
    }),
  };
}

export default function AdminTestsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [source, setSource] = useState<"supabase">("supabase");
  const [tests, setTests] = useState<EditableTest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/admin/tests", { cache: "no-store" });
      if (!response.ok) {
        if (response.status === 401) {
          router.replace("/admin/login");
          return;
        }

        const body = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(body?.error ?? "Не удалось загрузить тесты");
        setLoading(false);
        return;
      }

      const body = (await response.json()) as TestBundle;
      setSource(body.source);
      setTests(body.tests.map(toEditable));
      setLoading(false);
    };

    load();
  }, [router]);

  useEffect(() => {
    if (!message) {
      return;
    }

    const timeoutId = window.setTimeout(() => setMessage(null), 4000);
    return () => window.clearTimeout(timeoutId);
  }, [message]);

  useEffect(() => {
    if (!error) {
      return;
    }

    const timeoutId = window.setTimeout(() => setError(null), 5000);
    return () => window.clearTimeout(timeoutId);
  }, [error]);

  const hasTests = useMemo(() => tests.length > 0, [tests.length]);

  const onSave = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const usedSlugs = new Set<string>();

      const payload: PublicTestDefinition[] = tests.map((test, index) => {
        const slug = normalizeSlug(
          test.slug || test.title || `test-${index + 1}`,
        );
        if (!slug) {
          throw new Error(`Тест #${index + 1}: slug не должен быть пустым`);
        }

        if (usedSlugs.has(slug)) {
          throw new Error(
            `Тест #${index + 1}: slug \"${slug}\" уже используется`,
          );
        }

        if (!test.questions.length) {
          throw new Error(`Тест #${index + 1}: добавьте хотя бы один вопрос`);
        }

        usedSlugs.add(slug);

        return {
          id: test.id,
          slug,
          title: test.title.trim(),
          description: test.description,
          version: Number(test.version) || 1,
          schema: buildSchema(test),
          scoring: parseJsonObject(
            test.scoringText,
            `Тест #${index + 1}, scoring`,
          ) as TestScoringConfig,
        };
      });

      const response = await fetch("/api/admin/tests", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tests: payload }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(body?.error ?? "Не удалось сохранить тесты");
      }

      const body = (await response.json()) as TestBundle;
      setSource(body.source);
      setTests(body.tests.map(toEditable));
      setMessage("Тесты сохранены");
    } catch (nextError) {
      setError(
        nextError instanceof Error ? nextError.message : "Ошибка сохранения",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="bg-platinum font-primary min-h-dvh p-6 text-black">
        Загрузка тестов...
      </main>
    );
  }

  return (
    <main className="bg-platinum font-primary min-h-dvh px-3 py-4 text-black md:px-6 md:py-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
        <header className="flex flex-col gap-3 rounded-3xl border border-black/10 bg-white/90 p-4 shadow-sm md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold md:text-3xl">
              Управление тестами
            </h1>
            <p className="mt-2 text-sm text-black/70">
              Источник данных: <span className="font-medium">{source}</span>
            </p>
            <p className="mt-1 text-sm text-black/70">
              Описание редактируется в Markdown. Вопросы настраиваются
              визуально, а страницы формируются автоматически по 20 вопросов.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin"
              className="rounded-xl border border-black/15 px-4 py-2 text-sm font-medium hover:bg-black/5"
            >
              Назад в админку
            </Link>
            <button
              type="button"
              onClick={() =>
                setTests((current) => [
                  ...current,
                  createEmptyTest(current.length),
                ])
              }
              className="rounded-xl border border-black/15 px-4 py-2 text-sm font-medium hover:bg-black/5"
            >
              Добавить тест
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {saving ? "Сохраняем..." : "Сохранить все"}
            </button>
          </div>
        </header>

        {error ? (
          <p className="rounded-xl border border-red-300/60 bg-red-100 px-4 py-3 text-sm text-red-900">
            {error}
          </p>
        ) : null}

        {message ? (
          <p className="rounded-xl border border-amber-300/60 bg-amber-100 px-4 py-3 text-sm text-black">
            {message}
          </p>
        ) : null}

        {!hasTests ? (
          <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
            <p className="text-sm text-black/70">Список тестов пуст.</p>
          </section>
        ) : null}

        <div className="grid gap-4">
          {tests.map((test, testIndex) => {
            const totalPages = Math.max(
              1,
              Math.ceil(test.questions.length / PAGE_SIZE),
            );

            return (
              <article
                key={test.id}
                className="rounded-3xl border border-black/10 bg-white p-4 shadow-sm md:p-5"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">
                      Тест #{testIndex + 1}
                    </h2>
                    <p className="mt-1 text-xs text-black/60">ID: {test.id}</p>
                    <p className="mt-1 text-xs text-black/60">
                      Вопросов: {test.questions.length} · Страниц: {totalPages}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/tests/${normalizeSlug(test.slug) || test.slug}`}
                      target="_blank"
                      className="rounded-lg border border-black/15 px-3 py-2 text-sm hover:bg-black/5"
                    >
                      Открыть тест
                    </Link>
                    <button
                      type="button"
                      onClick={() =>
                        setTests((current) =>
                          current.filter(
                            (_, currentIndex) => currentIndex !== testIndex,
                          ),
                        )
                      }
                      className="rounded-lg border border-red-300/60 px-3 py-2 text-sm text-red-800 hover:bg-red-50"
                    >
                      Удалить тест
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(12rem,16rem)]">
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="font-medium">Название</span>
                    <input
                      value={test.title}
                      onChange={(event) =>
                        setTests((current) =>
                          current.map((item, currentIndex) =>
                            currentIndex === testIndex
                              ? { ...item, title: event.target.value }
                              : item,
                          ),
                        )
                      }
                      className="rounded-xl border border-black/15 px-3 py-2 outline-none focus:border-black"
                    />
                  </label>

                  <label className="flex flex-col gap-1 text-sm">
                    <span className="font-medium">Версия</span>
                    <input
                      type="number"
                      min={1}
                      value={test.version}
                      onChange={(event) =>
                        setTests((current) =>
                          current.map((item, currentIndex) =>
                            currentIndex === testIndex
                              ? {
                                  ...item,
                                  version: Math.max(
                                    1,
                                    Number(event.target.value) || 1,
                                  ),
                                }
                              : item,
                          ),
                        )
                      }
                      className="rounded-xl border border-black/15 px-3 py-2 outline-none focus:border-black"
                    />
                  </label>

                  <label className="flex flex-col gap-1 text-sm md:col-span-2">
                    <span className="font-medium">Slug</span>
                    <div className="flex flex-col gap-2 md:flex-row">
                      <input
                        value={test.slug}
                        onChange={(event) =>
                          setTests((current) =>
                            current.map((item, currentIndex) =>
                              currentIndex === testIndex
                                ? { ...item, slug: event.target.value }
                                : item,
                            ),
                          )
                        }
                        className="flex-1 rounded-xl border border-black/15 px-3 py-2 outline-none focus:border-black"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setTests((current) =>
                            current.map((item, currentIndex) =>
                              currentIndex === testIndex
                                ? {
                                    ...item,
                                    slug: normalizeSlug(
                                      item.slug || item.title,
                                    ),
                                  }
                                : item,
                            ),
                          )
                        }
                        className="rounded-xl border border-black/15 px-3 py-2 text-sm hover:bg-black/5"
                      >
                        Нормализовать slug
                      </button>
                    </div>
                  </label>
                </div>

                <div className="mt-5 grid gap-3 xl:grid-cols-2">
                  <div className="rounded-2xl border border-black/10 bg-black/[0.03] p-3">
                    <label className="mb-2 block text-sm font-medium">
                      Описание теста (Markdown)
                    </label>
                    <textarea
                      value={test.description}
                      onChange={(event) =>
                        setTests((current) =>
                          current.map((item, currentIndex) =>
                            currentIndex === testIndex
                              ? { ...item, description: event.target.value }
                              : item,
                          ),
                        )
                      }
                      rows={10}
                      spellCheck={false}
                      className="h-64 w-full rounded-xl border border-black/15 px-3 py-2 font-mono text-sm outline-none focus:border-black"
                    />
                  </div>

                  <div className="rounded-2xl border border-black/10 bg-black/[0.03] p-3">
                    <p className="mb-2 text-sm font-medium">Предпросмотр</p>
                    <div className="markdown content-markdown h-64 overflow-auto rounded-xl border border-black/10 bg-white p-4 text-sm">
                      {test.description.trim() ? (
                        parseMarkdown(test.description)
                      ) : (
                        <p className="text-black/60">
                          Предпросмотр появится после ввода текста.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <section className="mt-5 rounded-2xl border border-black/10 bg-black/[0.02] p-3 md:p-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-base font-semibold">Вопросы</h3>
                      <p className="text-sm text-black/60">
                        Порядок вопросов можно менять. После 20-го вопроса
                        автоматически создаётся следующая страница.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setTests((current) =>
                          current.map((item, currentIndex) =>
                            currentIndex === testIndex
                              ? {
                                  ...item,
                                  questions: [
                                    ...item.questions,
                                    createQuestion(item.questions.length),
                                  ],
                                }
                              : item,
                          ),
                        )
                      }
                      className="rounded-xl border border-black/15 px-4 py-2 text-sm font-medium hover:bg-black/5"
                    >
                      Добавить вопрос
                    </button>
                  </div>

                  <div className="mt-4 flex flex-col gap-3">
                    {test.questions.map((question, questionIndex) => {
                      const pageNumber =
                        Math.floor(questionIndex / PAGE_SIZE) + 1;

                      return (
                        <div
                          key={question.id}
                          className="rounded-2xl border border-black/10 bg-white p-3 shadow-sm"
                        >
                          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                            <div>
                              <h4 className="font-medium">
                                Вопрос #{questionIndex + 1}
                              </h4>
                              <p className="text-xs text-black/55">
                                Страница {pageNumber}
                              </p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                disabled={questionIndex === 0}
                                onClick={() =>
                                  setTests((current) =>
                                    current.map((item, currentIndex) =>
                                      currentIndex === testIndex
                                        ? {
                                            ...item,
                                            questions: moveItem(
                                              item.questions,
                                              questionIndex,
                                              questionIndex - 1,
                                            ),
                                          }
                                        : item,
                                    ),
                                  )
                                }
                                className="rounded-lg border border-black/15 px-3 py-1.5 text-sm disabled:opacity-40"
                              >
                                Выше
                              </button>
                              <button
                                type="button"
                                disabled={
                                  questionIndex === test.questions.length - 1
                                }
                                onClick={() =>
                                  setTests((current) =>
                                    current.map((item, currentIndex) =>
                                      currentIndex === testIndex
                                        ? {
                                            ...item,
                                            questions: moveItem(
                                              item.questions,
                                              questionIndex,
                                              questionIndex + 1,
                                            ),
                                          }
                                        : item,
                                    ),
                                  )
                                }
                                className="rounded-lg border border-black/15 px-3 py-1.5 text-sm disabled:opacity-40"
                              >
                                Ниже
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setTests((current) =>
                                    current.map((item, currentIndex) =>
                                      currentIndex === testIndex
                                        ? {
                                            ...item,
                                            questions: item.questions.filter(
                                              (_, index) =>
                                                index !== questionIndex,
                                            ),
                                          }
                                        : item,
                                    ),
                                  )
                                }
                                className="rounded-lg border border-red-300/60 px-3 py-1.5 text-sm text-red-800 hover:bg-red-50"
                              >
                                Удалить
                              </button>
                            </div>
                          </div>

                          <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_12rem_12rem]">
                            <label className="flex flex-col gap-1 text-sm">
                              <span className="font-medium">Текст вопроса</span>
                              <textarea
                                value={question.title}
                                onChange={(event) =>
                                  setTests((current) =>
                                    current.map((item, currentIndex) =>
                                      currentIndex === testIndex
                                        ? {
                                            ...item,
                                            questions: item.questions.map(
                                              (questionItem, itemIndex) =>
                                                itemIndex === questionIndex
                                                  ? {
                                                      ...questionItem,
                                                      title: event.target.value,
                                                    }
                                                  : questionItem,
                                            ),
                                          }
                                        : item,
                                    ),
                                  )
                                }
                                rows={3}
                                className="rounded-xl border border-black/15 px-3 py-2 outline-none focus:border-black"
                              />
                            </label>

                            <label className="flex flex-col gap-1 text-sm">
                              <span className="font-medium">Тип</span>
                              <select
                                value={question.type}
                                onChange={(event) => {
                                  const nextType = toQuestionType(
                                    event.target.value,
                                  );

                                  setTests((current) =>
                                    current.map((item, currentIndex) =>
                                      currentIndex === testIndex
                                        ? {
                                            ...item,
                                            questions: item.questions.map(
                                              (questionItem, itemIndex) =>
                                                itemIndex === questionIndex
                                                  ? {
                                                      ...questionItem,
                                                      type: nextType,
                                                      choices:
                                                        isChoiceBasedQuestion(
                                                          nextType,
                                                        )
                                                          ? questionItem.choices
                                                              .length > 0
                                                            ? questionItem.choices
                                                            : DEFAULT_CHOICES.map(
                                                                (choice) => ({
                                                                  id: `choice-${crypto.randomUUID()}`,
                                                                  value:
                                                                    choice.value,
                                                                  text: choice.text,
                                                                }),
                                                              )
                                                          : [],
                                                    }
                                                  : questionItem,
                                            ),
                                          }
                                        : item,
                                    ),
                                  );
                                }}
                                className="rounded-xl border border-black/15 px-3 py-2 outline-none focus:border-black"
                              >
                                <option value="radiogroup">Один вариант</option>
                                <option value="checkbox">
                                  Несколько вариантов
                                </option>
                                <option value="dropdown">
                                  Выпадающий список
                                </option>
                                <option value="text">Короткий текст</option>
                                <option value="comment">Большой текст</option>
                              </select>
                            </label>

                            <label className="flex flex-col gap-1 text-sm">
                              <span className="font-medium">Имя поля</span>
                              <input
                                value={question.name}
                                onChange={(event) =>
                                  setTests((current) =>
                                    current.map((item, currentIndex) =>
                                      currentIndex === testIndex
                                        ? {
                                            ...item,
                                            questions: item.questions.map(
                                              (questionItem, itemIndex) =>
                                                itemIndex === questionIndex
                                                  ? {
                                                      ...questionItem,
                                                      name: event.target.value,
                                                    }
                                                  : questionItem,
                                            ),
                                          }
                                        : item,
                                    ),
                                  )
                                }
                                className="rounded-xl border border-black/15 px-3 py-2 outline-none focus:border-black"
                              />
                            </label>
                          </div>

                          <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_10rem]">
                            <label className="flex flex-col gap-1 text-sm">
                              <span className="font-medium">
                                Подсказка / описание вопроса
                              </span>
                              <textarea
                                value={question.description}
                                onChange={(event) =>
                                  setTests((current) =>
                                    current.map((item, currentIndex) =>
                                      currentIndex === testIndex
                                        ? {
                                            ...item,
                                            questions: item.questions.map(
                                              (questionItem, itemIndex) =>
                                                itemIndex === questionIndex
                                                  ? {
                                                      ...questionItem,
                                                      description:
                                                        event.target.value,
                                                    }
                                                  : questionItem,
                                            ),
                                          }
                                        : item,
                                    ),
                                  )
                                }
                                rows={2}
                                className="rounded-xl border border-black/15 px-3 py-2 outline-none focus:border-black"
                              />
                            </label>

                            <label className="flex items-center gap-2 rounded-xl border border-black/10 bg-black/[0.03] px-3 py-2 text-sm">
                              <input
                                type="checkbox"
                                checked={question.isRequired}
                                onChange={(event) =>
                                  setTests((current) =>
                                    current.map((item, currentIndex) =>
                                      currentIndex === testIndex
                                        ? {
                                            ...item,
                                            questions: item.questions.map(
                                              (questionItem, itemIndex) =>
                                                itemIndex === questionIndex
                                                  ? {
                                                      ...questionItem,
                                                      isRequired:
                                                        event.target.checked,
                                                    }
                                                  : questionItem,
                                            ),
                                          }
                                        : item,
                                    ),
                                  )
                                }
                              />
                              Обязательный вопрос
                            </label>
                          </div>

                          {isChoiceBasedQuestion(question.type) ? (
                            <div className="mt-4 rounded-2xl border border-black/10 bg-black/[0.02] p-3">
                              <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                <div>
                                  <h5 className="font-medium">
                                    Варианты ответа
                                  </h5>
                                  <p className="text-xs text-black/55">
                                    Можно менять текст, значение и порядок.
                                  </p>
                                </div>

                                <button
                                  type="button"
                                  onClick={() =>
                                    setTests((current) =>
                                      current.map((item, currentIndex) =>
                                        currentIndex === testIndex
                                          ? {
                                              ...item,
                                              questions: item.questions.map(
                                                (questionItem, itemIndex) =>
                                                  itemIndex === questionIndex
                                                    ? {
                                                        ...questionItem,
                                                        choices: [
                                                          ...questionItem.choices,
                                                          createChoice(
                                                            questionItem.choices
                                                              .length,
                                                          ),
                                                        ],
                                                      }
                                                    : questionItem,
                                              ),
                                            }
                                          : item,
                                      ),
                                    )
                                  }
                                  className="rounded-lg border border-black/15 px-3 py-1.5 text-sm hover:bg-black/5"
                                >
                                  Добавить вариант
                                </button>
                              </div>

                              <div className="flex flex-col gap-2">
                                {question.choices.map((choice, choiceIndex) => (
                                  <div
                                    key={choice.id}
                                    className="grid gap-2 rounded-xl border border-black/10 bg-white p-3 lg:grid-cols-[7rem_minmax(0,1fr)_auto]"
                                  >
                                    <label className="flex flex-col gap-1 text-sm">
                                      <span className="font-medium">
                                        Значение
                                      </span>
                                      <input
                                        value={choice.value}
                                        onChange={(event) =>
                                          setTests((current) =>
                                            current.map((item, currentIndex) =>
                                              currentIndex === testIndex
                                                ? {
                                                    ...item,
                                                    questions:
                                                      item.questions.map(
                                                        (
                                                          questionItem,
                                                          itemIndex,
                                                        ) =>
                                                          itemIndex ===
                                                          questionIndex
                                                            ? {
                                                                ...questionItem,
                                                                choices:
                                                                  questionItem.choices.map(
                                                                    (
                                                                      choiceItem,
                                                                      choiceItemIndex,
                                                                    ) =>
                                                                      choiceItemIndex ===
                                                                      choiceIndex
                                                                        ? {
                                                                            ...choiceItem,
                                                                            value:
                                                                              event
                                                                                .target
                                                                                .value,
                                                                          }
                                                                        : choiceItem,
                                                                  ),
                                                              }
                                                            : questionItem,
                                                      ),
                                                  }
                                                : item,
                                            ),
                                          )
                                        }
                                        className="rounded-xl border border-black/15 px-3 py-2 outline-none focus:border-black"
                                      />
                                    </label>

                                    <label className="flex flex-col gap-1 text-sm">
                                      <span className="font-medium">Текст</span>
                                      <input
                                        value={choice.text}
                                        onChange={(event) =>
                                          setTests((current) =>
                                            current.map((item, currentIndex) =>
                                              currentIndex === testIndex
                                                ? {
                                                    ...item,
                                                    questions:
                                                      item.questions.map(
                                                        (
                                                          questionItem,
                                                          itemIndex,
                                                        ) =>
                                                          itemIndex ===
                                                          questionIndex
                                                            ? {
                                                                ...questionItem,
                                                                choices:
                                                                  questionItem.choices.map(
                                                                    (
                                                                      choiceItem,
                                                                      choiceItemIndex,
                                                                    ) =>
                                                                      choiceItemIndex ===
                                                                      choiceIndex
                                                                        ? {
                                                                            ...choiceItem,
                                                                            text: event
                                                                              .target
                                                                              .value,
                                                                          }
                                                                        : choiceItem,
                                                                  ),
                                                              }
                                                            : questionItem,
                                                      ),
                                                  }
                                                : item,
                                            ),
                                          )
                                        }
                                        className="rounded-xl border border-black/15 px-3 py-2 outline-none focus:border-black"
                                      />
                                    </label>

                                    <div className="flex flex-wrap items-end gap-2">
                                      <button
                                        type="button"
                                        disabled={choiceIndex === 0}
                                        onClick={() =>
                                          setTests((current) =>
                                            current.map((item, currentIndex) =>
                                              currentIndex === testIndex
                                                ? {
                                                    ...item,
                                                    questions:
                                                      item.questions.map(
                                                        (
                                                          questionItem,
                                                          itemIndex,
                                                        ) =>
                                                          itemIndex ===
                                                          questionIndex
                                                            ? {
                                                                ...questionItem,
                                                                choices:
                                                                  moveItem(
                                                                    questionItem.choices,
                                                                    choiceIndex,
                                                                    choiceIndex -
                                                                      1,
                                                                  ),
                                                              }
                                                            : questionItem,
                                                      ),
                                                  }
                                                : item,
                                            ),
                                          )
                                        }
                                        className="rounded-lg border border-black/15 px-3 py-2 text-sm disabled:opacity-40"
                                      >
                                        Выше
                                      </button>
                                      <button
                                        type="button"
                                        disabled={
                                          choiceIndex ===
                                          question.choices.length - 1
                                        }
                                        onClick={() =>
                                          setTests((current) =>
                                            current.map((item, currentIndex) =>
                                              currentIndex === testIndex
                                                ? {
                                                    ...item,
                                                    questions:
                                                      item.questions.map(
                                                        (
                                                          questionItem,
                                                          itemIndex,
                                                        ) =>
                                                          itemIndex ===
                                                          questionIndex
                                                            ? {
                                                                ...questionItem,
                                                                choices:
                                                                  moveItem(
                                                                    questionItem.choices,
                                                                    choiceIndex,
                                                                    choiceIndex +
                                                                      1,
                                                                  ),
                                                              }
                                                            : questionItem,
                                                      ),
                                                  }
                                                : item,
                                            ),
                                          )
                                        }
                                        className="rounded-lg border border-black/15 px-3 py-2 text-sm disabled:opacity-40"
                                      >
                                        Ниже
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setTests((current) =>
                                            current.map((item, currentIndex) =>
                                              currentIndex === testIndex
                                                ? {
                                                    ...item,
                                                    questions:
                                                      item.questions.map(
                                                        (
                                                          questionItem,
                                                          itemIndex,
                                                        ) =>
                                                          itemIndex ===
                                                          questionIndex
                                                            ? {
                                                                ...questionItem,
                                                                choices:
                                                                  questionItem.choices.filter(
                                                                    (
                                                                      _,
                                                                      choiceItemIndex,
                                                                    ) =>
                                                                      choiceItemIndex !==
                                                                      choiceIndex,
                                                                  ),
                                                              }
                                                            : questionItem,
                                                      ),
                                                  }
                                                : item,
                                            ),
                                          )
                                        }
                                        className="rounded-lg border border-red-300/60 px-3 py-2 text-sm text-red-800 hover:bg-red-50"
                                      >
                                        Удалить
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : null}

                          <details className="mt-4 rounded-2xl border border-black/10 bg-black/[0.02] p-3">
                            <summary className="cursor-pointer text-sm font-medium">
                              Дополнительные настройки вопроса (JSON)
                            </summary>
                            <textarea
                              value={question.extraSettingsText}
                              onChange={(event) =>
                                setTests((current) =>
                                  current.map((item, currentIndex) =>
                                    currentIndex === testIndex
                                      ? {
                                          ...item,
                                          questions: item.questions.map(
                                            (questionItem, itemIndex) =>
                                              itemIndex === questionIndex
                                                ? {
                                                    ...questionItem,
                                                    extraSettingsText:
                                                      event.target.value,
                                                  }
                                                : questionItem,
                                          ),
                                        }
                                      : item,
                                  ),
                                )
                              }
                              rows={8}
                              spellCheck={false}
                              className="mt-3 w-full rounded-xl border border-black/15 px-3 py-2 font-mono text-xs outline-none focus:border-black"
                            />
                          </details>
                        </div>
                      );
                    })}
                  </div>
                </section>

                <div className="mt-5 grid gap-3 xl:grid-cols-2">
                  <div className="rounded-2xl border border-black/10 bg-black/[0.03] p-3">
                    <label className="mb-2 block text-sm font-medium">
                      Настройки схемы теста (JSON)
                    </label>
                    <p className="mb-2 text-xs text-black/60">
                      Здесь настраиваются общие параметры SurveyJS, кроме title,
                      description и pages.
                    </p>
                    <textarea
                      value={test.schemaSettingsText}
                      onChange={(event) =>
                        setTests((current) =>
                          current.map((item, currentIndex) =>
                            currentIndex === testIndex
                              ? {
                                  ...item,
                                  schemaSettingsText: event.target.value,
                                }
                              : item,
                          ),
                        )
                      }
                      rows={12}
                      spellCheck={false}
                      className="w-full rounded-xl border border-black/15 px-3 py-2 font-mono text-xs outline-none focus:border-black"
                    />
                  </div>

                  <div className="rounded-2xl border border-black/10 bg-black/[0.03] p-3">
                    <label className="mb-2 block text-sm font-medium">
                      Scoring (JSON)
                    </label>
                    <p className="mb-2 text-xs text-black/60">
                      Конфигурация подсчёта результатов остаётся в JSON.
                    </p>
                    <textarea
                      value={test.scoringText}
                      onChange={(event) =>
                        setTests((current) =>
                          current.map((item, currentIndex) =>
                            currentIndex === testIndex
                              ? { ...item, scoringText: event.target.value }
                              : item,
                          ),
                        )
                      }
                      rows={12}
                      spellCheck={false}
                      className="w-full rounded-xl border border-black/15 px-3 py-2 font-mono text-xs outline-none focus:border-black"
                    />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </main>
  );
}
