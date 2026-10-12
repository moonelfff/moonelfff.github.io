import type {
  PublicTestDefinition,
  TestScoringConfig,
} from "@/lib/tests/types";
import { normalizeSlug } from "@/lib/slug";

export type ChoiceValue = string | number;

export type EditableChoice = {
  id: string;
  value: string;
  text: string;
};

export type QuestionType =
  | "radiogroup"
  | "checkbox"
  | "dropdown"
  | "text"
  | "comment";

export type EditableQuestion = {
  id: string;
  type: QuestionType;
  name: string;
  title: string;
  description: string;
  isRequired: boolean;
  choices: EditableChoice[];
  extraSettingsText: string;
};

export type EditableTest = Omit<PublicTestDefinition, "schema" | "scoring"> & {
  questions: EditableQuestion[];
  schemaSettingsText: string;
  scoringText: string;
};

export const QUESTIONS_PER_PAGE = 20;

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  radiogroup: "Один вариант",
  checkbox: "Несколько вариантов",
  dropdown: "Выпадающий список",
  text: "Короткий текст",
  comment: "Большой текст",
};

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

const newId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && !Array.isArray(value) && typeof value === "object";
}

function parseJsonObject(value: string, fieldName: string): Record<string, unknown> {
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

/** Numeric-looking choice values are stored as numbers (needed for scoring). */
function normalizeChoiceValue(value: ChoiceValue): ChoiceValue {
  const trimmed = String(value).trim();
  return /^-?\d+(\.\d+)?$/.test(trimmed) ? Number(trimmed) : trimmed;
}

export function isChoiceBasedQuestion(type: QuestionType): boolean {
  return type === "radiogroup" || type === "checkbox" || type === "dropdown";
}

export function toQuestionType(value: unknown): QuestionType {
  return typeof value === "string" && Object.hasOwn(QUESTION_TYPE_LABELS, value)
    ? (value as QuestionType)
    : "radiogroup";
}

export function createDefaultChoices(): EditableChoice[] {
  return DEFAULT_CHOICES.map((choice) => ({ id: newId("choice"), ...choice }));
}

export function createChoice(index: number): EditableChoice {
  const template = DEFAULT_CHOICES[index] ?? {
    value: String(index + 1),
    text: `Вариант ${index + 1}`,
  };

  return { id: newId("choice"), ...template };
}

export function createQuestion(index: number): EditableQuestion {
  return {
    id: newId("question"),
    type: "radiogroup",
    name: `q${index + 1}`,
    title: `Вопрос ${index + 1}`,
    description: "",
    isRequired: true,
    choices: createDefaultChoices(),
    extraSettingsText: "{}",
  };
}

export function createEmptyTest(index: number): EditableTest {
  return {
    id: `tmp-test-${crypto.randomUUID()}`,
    slug: `test-${index + 1}`,
    title: `Новый тест ${index + 1}`,
    description: "",
    version: 1,
    questions: [createQuestion(0)],
    schemaSettingsText: JSON.stringify(DEFAULT_SCHEMA_SETTINGS, null, 2),
    scoringText: JSON.stringify({}, null, 2),
  };
}

function extractChoiceList(rawChoices: unknown): EditableChoice[] {
  if (!Array.isArray(rawChoices)) {
    return createDefaultChoices();
  }

  return rawChoices.map((choice, index) => {
    if (isPlainObject(choice)) {
      return {
        id: newId("choice"),
        value: String(choice.value ?? index + 1),
        text: String(choice.text ?? choice.value ?? `Вариант ${index + 1}`),
      };
    }

    return { id: newId("choice"), value: String(choice), text: String(choice) };
  });
}

function extractQuestions(schema: Record<string, unknown>): EditableQuestion[] {
  const pages = Array.isArray(schema.pages) ? schema.pages : [];
  const questions: EditableQuestion[] = [];

  for (const page of pages) {
    if (!isPlainObject(page) || !Array.isArray(page.elements)) {
      continue;
    }

    for (const element of page.elements) {
      if (!isPlainObject(element)) {
        continue;
      }

      const { type, name, title, description, isRequired, choices, ...extra } =
        element;
      const questionType = toQuestionType(type);

      questions.push({
        id: newId("question"),
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
    }
  }

  return questions;
}

export function toEditable(test: PublicTestDefinition): EditableTest {
  // title, description and pages are edited through dedicated controls.
  const schemaSettings = { ...test.schema };
  delete schemaSettings.title;
  delete schemaSettings.description;
  delete schemaSettings.pages;

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

function buildQuestionSchema(
  question: EditableQuestion,
  index: number,
): Record<string, unknown> {
  const extraSettings = parseJsonObject(
    question.extraSettingsText,
    `Вопрос #${index + 1}, доп. настройки`,
  );

  const schema: Record<string, unknown> = {
    type: question.type,
    name: question.name.trim() || `q${index + 1}`,
    title: question.title.trim() || `Вопрос ${index + 1}`,
    isRequired: question.isRequired,
    ...extraSettings,
  };

  if (question.description.trim()) {
    schema.description = question.description.trim();
  }

  if (isChoiceBasedQuestion(question.type)) {
    schema.choices = question.choices.map((choice, choiceIndex) => ({
      value: normalizeChoiceValue(choice.value || String(choiceIndex + 1)),
      text: choice.text.trim() || `Вариант ${choiceIndex + 1}`,
    }));
  }

  return schema;
}

/** Splits questions into SurveyJS pages of QUESTIONS_PER_PAGE items. */
function buildPages(questions: EditableQuestion[]) {
  const pageCount = Math.max(1, Math.ceil(questions.length / QUESTIONS_PER_PAGE));

  return Array.from({ length: pageCount }, (_, pageIndex) => {
    const start = pageIndex * QUESTIONS_PER_PAGE;
    const end = Math.min(start + QUESTIONS_PER_PAGE, questions.length);

    return {
      name: pageCount === 1 ? "main" : `page-${pageIndex + 1}`,
      title: pageCount > 1 ? `Вопросы ${start + 1}-${end}` : undefined,
      elements: questions
        .slice(start, end)
        .map((question, offset) => buildQuestionSchema(question, start + offset)),
    };
  });
}

function buildSchema(test: EditableTest): Record<string, unknown> {
  const schemaSettings = parseJsonObject(
    test.schemaSettingsText,
    `Тест "${test.title || test.slug}", настройки схемы`,
  );

  return {
    ...schemaSettings,
    title: test.title.trim(),
    description: test.description,
    pages: buildPages(test.questions),
  };
}

/** Validates editable tests and converts them to the API format; throws a readable Error. */
export function buildTestsPayload(tests: EditableTest[]): PublicTestDefinition[] {
  const usedSlugs = new Set<string>();

  return tests.map((test, index) => {
    const row = index + 1;
    const slug = normalizeSlug(test.slug || test.title || `test-${row}`);

    if (!slug) {
      throw new Error(`Тест #${row}: slug не должен быть пустым`);
    }
    if (usedSlugs.has(slug)) {
      throw new Error(`Тест #${row}: slug "${slug}" уже используется`);
    }
    if (test.questions.length === 0) {
      throw new Error(`Тест #${row}: добавьте хотя бы один вопрос`);
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
        `Тест #${row}, scoring`,
      ) as TestScoringConfig,
    };
  });
}
