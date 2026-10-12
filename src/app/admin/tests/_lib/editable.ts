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
  | "rating"
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
  shuffleChoices: boolean;
  rateMax: number;
  minRateText: string;
  maxRateText: string;
  extraSettingsText: string;
};

export type PagingMode = "auto" | "one" | "list";

export type EditableSettings = {
  paging: PagingMode;
  numbering: boolean;
  shuffleQuestions: boolean;
};

export type ScoringMode = "none" | "scale" | "groups";

export type EditableLevel = {
  id: string;
  min: string;
  max: string;
  label: string;
  summary: string;
};

export type EditableGroup = {
  id: string;
  key: string;
  name: string;
  title: string;
  interpretation: string;
  questionIds: string[];
};

/** Scoring references questions by their internal id, so renaming a question is safe. */
export type EditableScoring = {
  mode: ScoringMode;
  scaleQuestionIds: string[];
  reverseQuestionIds: string[];
  minValue: string;
  maxValue: string;
  levels: EditableLevel[];
  groups: EditableGroup[];
  positiveValues: string[];
  topCount: number;
  /** Unknown scoring keys are kept as is. */
  extra: Record<string, unknown>;
};

export type EditableTest = Omit<PublicTestDefinition, "schema" | "scoring"> & {
  questions: EditableQuestion[];
  settings: EditableSettings;
  schemaSettingsText: string;
  scoring: EditableScoring;
};

export const QUESTIONS_PER_PAGE = 20;

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  radiogroup: "Один вариант",
  checkbox: "Несколько вариантов",
  dropdown: "Выпадающий список",
  rating: "Оценка по шкале",
  text: "Короткий текст",
  comment: "Большой текст",
};

export const PAGING_LABELS: Record<PagingMode, string> = {
  auto: "Автоматически",
  one: "По одному вопросу",
  list: `Списком (по ${QUESTIONS_PER_PAGE} на странице)`,
};

export const PAGING_HINTS: Record<PagingMode, string> = {
  auto: "Если вопросов больше 8, показываем по одному, иначе списком.",
  one: "Один вопрос на экране, с кнопками «Назад» и «Далее».",
  list: "Вопросы идут подряд, их можно пролистывать.",
};

const DEFAULT_CHOICES: Array<{ value: string; text: string }> = [
  { value: "1", text: "Полностью согласен" },
  { value: "2", text: "Скорее согласен, чем не согласен" },
  { value: "3", text: "Не согласен" },
];

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

function toNumber(value: string): number | null {
  const trimmed = value.trim().replace(",", ".");
  if (trimmed === "") {
    return null;
  }
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
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

/** First `qN` name that is not used yet. */
function nextQuestionName(questions: EditableQuestion[]): string {
  const used = new Set(questions.map((question) => question.name.trim()));
  let number = questions.length + 1;
  while (used.has(`q${number}`)) {
    number += 1;
  }
  return `q${number}`;
}

export function createQuestion(existing: EditableQuestion[]): EditableQuestion {
  return {
    id: newId("question"),
    type: "radiogroup",
    name: nextQuestionName(existing),
    title: `Вопрос ${existing.length + 1}`,
    description: "",
    isRequired: true,
    choices: createDefaultChoices(),
    shuffleChoices: false,
    rateMax: 5,
    minRateText: "",
    maxRateText: "",
    extraSettingsText: "{}",
  };
}

export function createLevel(): EditableLevel {
  return { id: newId("level"), min: "", max: "", label: "", summary: "" };
}

export function createGroup(index: number): EditableGroup {
  return {
    id: newId("group"),
    key: `g${index + 1}`,
    name: "",
    title: "",
    interpretation: "",
    questionIds: [],
  };
}

function createEmptyScoring(): EditableScoring {
  return {
    mode: "none",
    scaleQuestionIds: [],
    reverseQuestionIds: [],
    minValue: "1",
    maxValue: "3",
    levels: [],
    groups: [],
    positiveValues: ["1", "2"],
    topCount: 2,
    extra: {},
  };
}

export function createEmptyTest(index: number): EditableTest {
  return {
    id: `tmp-test-${crypto.randomUUID()}`,
    slug: `test-${index + 1}`,
    title: `Новый тест ${index + 1}`,
    description: "",
    version: 1,
    questions: [createQuestion([])],
    settings: { paging: "auto", numbering: true, shuffleQuestions: false },
    schemaSettingsText: "{}",
    scoring: createEmptyScoring(),
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

      const {
        type,
        name,
        title,
        description,
        isRequired,
        choices,
        choicesOrder,
        rateMin: _rateMin,
        rateMax,
        minRateDescription,
        maxRateDescription,
        ...extra
      } = element;
      void _rateMin;
      const questionType = toQuestionType(type);
      const isRating = questionType === "rating";

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
        shuffleChoices: choicesOrder === "random",
        rateMax: isRating && typeof rateMax === "number" ? rateMax : 5,
        minRateText:
          typeof minRateDescription === "string" ? minRateDescription : "",
        maxRateText:
          typeof maxRateDescription === "string" ? maxRateDescription : "",
        extraSettingsText: JSON.stringify(extra, null, 2),
      });
    }
  }

  return questions;
}

/** Pulls the settings that have dedicated controls out of the raw schema. */
function extractSettings(schema: Record<string, unknown>) {
  const rest = { ...schema };
  delete rest.title;
  delete rest.description;
  delete rest.pages;

  const settings: EditableSettings = {
    paging: "auto",
    numbering: true,
    shuffleQuestions: false,
  };

  const mode = rest.questionsOnPageMode;
  if (mode === "questionPerPage") {
    settings.paging = "one";
    delete rest.questionsOnPageMode;
  } else if (mode === "standard") {
    settings.paging = "list";
    delete rest.questionsOnPageMode;
  }

  if (rest.showQuestionNumbers === "off") {
    settings.numbering = false;
    delete rest.showQuestionNumbers;
  } else if (rest.showQuestionNumbers === "on") {
    delete rest.showQuestionNumbers;
  }

  if (rest.questionsOrder === "random") {
    settings.shuffleQuestions = true;
    delete rest.questionsOrder;
  }

  return { settings, rest };
}

function extractScoring(
  scoring: TestScoringConfig,
  questions: EditableQuestion[],
): EditableScoring {
  const {
    questionIds,
    reverseQuestionIds,
    minPerQuestion,
    maxPerQuestion,
    levels,
    groups,
    positiveValues,
    topCount,
    ...extra
  } = (scoring ?? {}) as TestScoringConfig;

  const idByName = new Map(questions.map((question) => [question.name, question.id]));
  const toIds = (names: string[] | undefined) =>
    (names ?? []).flatMap((name) => {
      const id = idByName.get(name);
      return id ? [id] : [];
    });

  const hasGroups = Array.isArray(groups) && groups.length > 0;
  const hasScale =
    (Array.isArray(questionIds) && questionIds.length > 0) ||
    (Array.isArray(levels) && levels.length > 0);

  return {
    mode: hasGroups ? "groups" : hasScale ? "scale" : "none",
    scaleQuestionIds: toIds(questionIds),
    reverseQuestionIds: toIds(reverseQuestionIds),
    minValue: String(minPerQuestion ?? 1),
    maxValue: String(maxPerQuestion ?? 3),
    levels: (levels ?? []).map((level) => ({
      id: newId("level"),
      min: String(level.min),
      max: String(level.max),
      label: level.label ?? "",
      summary: level.summary ?? "",
    })),
    groups: (groups ?? []).map((group) => ({
      id: newId("group"),
      key: group.id,
      name: group.name ?? "",
      title: group.title ?? "",
      interpretation: group.interpretation ?? "",
      questionIds: toIds(group.questions),
    })),
    positiveValues: (positiveValues ?? [1, 2]).map(String),
    topCount: topCount ?? 2,
    extra,
  };
}

export function toEditable(test: PublicTestDefinition): EditableTest {
  const questions = extractQuestions(test.schema);
  const { settings, rest } = extractSettings(test.schema);

  return {
    id: test.id,
    slug: test.slug,
    title: test.title,
    description: test.description,
    version: test.version,
    questions,
    settings,
    schemaSettingsText: JSON.stringify(rest, null, 2),
    scoring: extractScoring(test.scoring, questions),
  };
}

function questionName(question: EditableQuestion, index: number): string {
  return question.name.trim() || `q${index + 1}`;
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
    name: questionName(question, index),
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

    if (question.shuffleChoices) {
      schema.choicesOrder = "random";
    }
  }

  if (question.type === "rating") {
    schema.rateMin = 1;
    schema.rateMax = Math.min(10, Math.max(2, Math.round(question.rateMax) || 5));
    if (question.minRateText.trim()) {
      schema.minRateDescription = question.minRateText.trim();
    }
    if (question.maxRateText.trim()) {
      schema.maxRateDescription = question.maxRateText.trim();
    }
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
    `Тест "${test.title || test.slug}", дополнительные настройки`,
  );

  const schema: Record<string, unknown> = {
    ...schemaSettings,
    title: test.title.trim(),
    description: test.description,
    pages: buildPages(test.questions),
  };

  if (test.settings.paging === "one") {
    schema.questionsOnPageMode = "questionPerPage";
  } else if (test.settings.paging === "list") {
    schema.questionsOnPageMode = "standard";
  }
  if (!test.settings.numbering) {
    schema.showQuestionNumbers = "off";
  }
  if (test.settings.shuffleQuestions) {
    schema.questionsOrder = "random";
  }

  return schema;
}

/** Possible answer values for the "which answers count" selector. */
export function collectAnswerValues(
  questions: EditableQuestion[],
): Array<{ value: string; text: string }> {
  const seen = new Map<string, string>();

  for (const question of questions) {
    if (question.type === "rating") {
      for (let value = 1; value <= question.rateMax; value += 1) {
        if (!seen.has(String(value))) {
          seen.set(String(value), `${value}`);
        }
      }
      continue;
    }

    if (!isChoiceBasedQuestion(question.type) || question.type === "checkbox") {
      continue;
    }

    for (const choice of question.choices) {
      const value = String(normalizeChoiceValue(choice.value));
      if (toNumber(value) !== null && !seen.has(value)) {
        seen.set(value, choice.text);
      }
    }
  }

  return [...seen.entries()]
    .map(([value, text]) => ({ value, text }))
    .sort((a, b) => Number(a.value) - Number(b.value));
}

/** Min/max numeric answer among the given questions, or null if none are numeric. */
export function suggestAnswerRange(
  questions: EditableQuestion[],
  ids: string[],
): { min: number; max: number } | null {
  const values: number[] = [];

  for (const question of questions) {
    if (!ids.includes(question.id)) {
      continue;
    }
    if (question.type === "rating") {
      values.push(1, question.rateMax);
    } else if (question.type === "radiogroup" || question.type === "dropdown") {
      for (const choice of question.choices) {
        const parsed = toNumber(choice.value);
        if (parsed !== null) {
          values.push(parsed);
        }
      }
    }
  }

  return values.length > 0
    ? { min: Math.min(...values), max: Math.max(...values) }
    : null;
}

/** Removes references to a deleted question from the scoring setup. */
export function pruneScoring(scoring: EditableScoring, questionId: string) {
  scoring.scaleQuestionIds = scoring.scaleQuestionIds.filter((id) => id !== questionId);
  scoring.reverseQuestionIds = scoring.reverseQuestionIds.filter((id) => id !== questionId);
  for (const group of scoring.groups) {
    group.questionIds = group.questionIds.filter((id) => id !== questionId);
  }
}

function buildScoring(test: EditableTest, row: number): TestScoringConfig {
  const { scoring, questions } = test;
  const where = `Тест #${row}, подсчёт результатов`;
  const nameById = new Map(
    questions.map((question, index) => [question.id, questionName(question, index)]),
  );
  // Keep questions in the order they have in the test.
  const orderedNames = (ids: string[]) =>
    questions.flatMap((question) =>
      ids.includes(question.id) ? [nameById.get(question.id) as string] : [],
    );

  if (scoring.mode === "none") {
    return { ...scoring.extra };
  }

  if (scoring.mode === "scale") {
    const min = toNumber(scoring.minValue);
    const max = toNumber(scoring.maxValue);

    if (scoring.scaleQuestionIds.length === 0) {
      throw new Error(`${where}: отметьте вопросы, баллы за которые суммируются`);
    }
    if (min === null || max === null || min > max) {
      throw new Error(`${where}: проверьте минимальный и максимальный балл ответа`);
    }

    const levels = scoring.levels.map((level, index) => {
      const from = toNumber(level.min);
      const to = toNumber(level.max);
      if (from === null || to === null || from > to) {
        throw new Error(`${where}: диапазон #${index + 1} заполнен неверно`);
      }
      return {
        min: from,
        max: to,
        label: level.label.trim() || "Результат",
        summary: level.summary.trim(),
      };
    });
    levels.sort((a, b) => a.min - b.min);

    return {
      ...scoring.extra,
      questionIds: orderedNames(scoring.scaleQuestionIds),
      reverseQuestionIds: orderedNames(
        scoring.reverseQuestionIds.filter((id) => scoring.scaleQuestionIds.includes(id)),
      ),
      minPerQuestion: min,
      maxPerQuestion: max,
      levels,
    };
  }

  if (scoring.groups.length === 0) {
    throw new Error(`${where}: добавьте хотя бы одну группу`);
  }

  const positive = scoring.positiveValues
    .map(toNumber)
    .filter((value): value is number => value !== null);
  if (positive.length === 0) {
    throw new Error(`${where}: выберите, какие ответы засчитываются`);
  }

  const usedKeys = new Set<string>();
  const groups = scoring.groups.map((group, index) => {
    const label = group.name.trim() || group.title.trim();
    if (!label) {
      throw new Error(`${where}: у группы #${index + 1} нет названия`);
    }
    if (group.questionIds.length === 0) {
      throw new Error(`${where}: в группе «${label}» нет вопросов`);
    }

    let key = normalizeSlug(group.key) || `g${index + 1}`;
    for (let suffix = 2; usedKeys.has(key); suffix += 1) {
      key = `${normalizeSlug(group.key) || "g"}-${suffix}`;
    }
    usedKeys.add(key);

    return {
      id: key,
      name: group.name.trim(),
      title: group.title.trim(),
      interpretation: group.interpretation.trim(),
      questions: orderedNames(group.questionIds),
    };
  });

  return {
    ...scoring.extra,
    groups,
    positiveValues: positive,
    topCount: Math.max(1, Math.round(scoring.topCount) || 2),
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

    const names = new Set<string>();
    test.questions.forEach((question, questionIndex) => {
      const name = questionName(question, questionIndex);
      if (names.has(name)) {
        throw new Error(
          `Тест #${row}: имя поля «${name}» повторяется (вопрос ${questionIndex + 1}). Измените его в «Дополнительно».`,
        );
      }
      names.add(name);
    });

    return {
      id: test.id,
      slug,
      title: test.title.trim(),
      description: test.description,
      version: Number(test.version) || 1,
      schema: buildSchema(test),
      scoring: buildScoring(test, row),
    };
  });
}
