"use client";

import Link from "next/link";
import { useState, type Dispatch, type SetStateAction } from "react";
import { ExternalLinkIcon, GripIcon, PlusIcon } from "@/assets/icons/admin";
import Tooltip from "@/components/atom/Tooltip";
import { updateDraft } from "@/lib/admin/draft";
import {
  createQuestion,
  pruneScoring,
  QUESTIONS_PER_PAGE,
  type EditableQuestion,
  type EditableTest,
  type ScoringMode,
} from "@/lib/admin/editable";
import { moveItem } from "@/lib/admin/moveItem";
import type { useDragSort } from "@/lib/admin/useDragSort";
import { normalizeSlug } from "@/lib/slug";
import AdminButton from "../atom/AdminButton";
import TextArea from "../atom/TextArea";
import TextInput from "../atom/TextInput";
import Collapsible from "../molecule/Collapsible";
import Field from "../molecule/Field";
import MarkdownEditor from "../molecule/MarkdownEditor";
import RowActions from "../molecule/RowActions";
import QuestionCard from "./QuestionCard";
import ScoringEditor from "./ScoringEditor";
import TestSettings from "./TestSettings";

const SCORING_SUMMARY: Record<ScoringMode, string> = {
  none: "не настроено",
  scale: "сумма баллов по диапазонам",
  groups: "типы (группы)",
};

type Props = {
  test: EditableTest;
  index: number;
  count: number;
  dragSort: ReturnType<typeof useDragSort>;
  defaultOpen: boolean;
  setTests: Dispatch<SetStateAction<EditableTest[]>>;
};

/** One test: its details, questions, settings and scoring. */
function TestCard({ test, index, count, dragSort, defaultOpen, setTests }: Props) {
  const [justAddedQuestionId, setJustAddedQuestionId] = useState<string | null>(
    null,
  );

  const editTest = (recipe: (draft: EditableTest) => void) =>
    updateDraft(setTests, (draft) => recipe(draft[index]));

  const pageCount = Math.max(
    1,
    Math.ceil(test.questions.length / QUESTIONS_PER_PAGE),
  );

  const onRemove = () => {
    if (window.confirm(`Удалить тест «${test.title || test.slug}»?`)) {
      setTests((current) => current.filter((_, i) => i !== index));
    }
  };

  const addQuestion = () => {
    const question = createQuestion(test.questions);
    setJustAddedQuestionId(question.id);
    editTest((draft) => {
      draft.questions.push(question);
    });
  };

  return (
    <Collapsible
      defaultOpen={defaultOpen}
      isHighlighted={dragSort.isDropTarget(index)}
      className="bg-platinum shadow-sm"
      summary={
        <span className="flex min-w-0 items-center gap-2">
          <Tooltip
            text="Перетащить тест"
            className="hidden shrink-0 md:inline-flex"
          >
            <span
              {...dragSort.handleProps(index)}
              aria-label="Перетащить тест"
              className="cursor-grab text-dusty-grape/70 active:cursor-grabbing"
            >
              <GripIcon />
            </span>
          </Tooltip>
          <span className="min-w-0">
            <span className="block truncate font-semibold">
              {test.title || "Без названия"}
            </span>
            <span className="block text-xs text-black/55">
              /{test.slug} · вопросов: {test.questions.length}
            </span>
          </span>
        </span>
      }
      actions={
        <RowActions
          noun="тест"
          index={index}
          count={count}
          onMove={(from, to) =>
            setTests((current) => moveItem(current, from, to))
          }
          onRemove={onRemove}
        />
      }
    >
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_8rem]">
        <Field label="Название">
          <TextInput
            value={test.title}
            onChange={(event) =>
              editTest((draft) => {
                draft.title = event.target.value;
              })
            }
          />
        </Field>
        <Field
          label="Версия"
          tip="Номер версии теста. Увеличивайте его, когда меняете вопросы или подсчёт: так проще понять, по какой версии человек проходил тест."
        >
          <TextInput
            type="number"
            inputMode="numeric"
            min={1}
            value={test.version}
            onChange={(event) =>
              editTest((draft) => {
                draft.version = Math.max(1, Number(event.target.value) || 1);
              })
            }
          />
        </Field>
      </div>

      <Field
        label="Адрес теста (slug)"
        hint="Только латиница, цифры и дефис, например stress-level."
        tip="Последняя часть ссылки на тест. Если изменить адрес, старая ссылка перестанет работать. Кнопка «Исправить» заменит лишние символы."
      >
        <div className="flex gap-2">
          <TextInput
            value={test.slug}
            autoCapitalize="none"
            onChange={(event) =>
              editTest((draft) => {
                draft.slug = event.target.value;
              })
            }
          />
          <AdminButton
            onClick={() =>
              editTest((draft) => {
                draft.slug = normalizeSlug(draft.slug || draft.title);
              })
            }
          >
            Исправить
          </AdminButton>
        </div>
      </Field>

      <div>
        <Link
          href={`/tests/${normalizeSlug(test.slug) || test.slug}`}
          target="_blank"
          className="text-dusty-grape inline-flex min-h-11 items-center gap-2 text-sm font-semibold hover:underline"
        >
          <ExternalLinkIcon width={16} height={16} />
          Открыть тест на сайте
        </Link>
      </div>

      <MarkdownEditor
        label="Описание теста (Markdown)"
        value={test.description}
        onChange={(value) =>
          editTest((draft) => {
            draft.description = value;
          })
        }
      />

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-semibold">Вопросы</h3>
            <p className="text-xs text-black/55">
              Если вопросы показываются списком, они делятся на страницы по{" "}
              {QUESTIONS_PER_PAGE}. Сейчас страниц: {pageCount}.
            </p>
          </div>
          <AdminButton onClick={addQuestion}>
            <PlusIcon width={18} height={18} />
            Добавить вопрос
          </AdminButton>
        </div>

        {test.questions.map((question, questionIndex) => (
          <QuestionCard
            key={question.id}
            question={question}
            index={questionIndex}
            count={test.questions.length}
            defaultOpen={question.id === justAddedQuestionId}
            editQuestion={(recipe: (draft: EditableQuestion) => void) =>
              editTest((draft) => recipe(draft.questions[questionIndex]))
            }
            onMove={(from, to) =>
              editTest((draft) => {
                draft.questions = moveItem(draft.questions, from, to);
              })
            }
            onRemove={() =>
              editTest((draft) => {
                const [removed] = draft.questions.splice(questionIndex, 1);
                pruneScoring(draft.scoring, removed.id);
              })
            }
          />
        ))}
      </div>

      <Collapsible
        summary={
          <span className="text-sm font-semibold">Как проходить тест</span>
        }
      >
        <TestSettings
          settings={test.settings}
          onChange={(recipe) => editTest((draft) => recipe(draft.settings))}
        />
      </Collapsible>

      <Collapsible
        summary={
          <>
            <span className="block text-sm font-semibold">
              Подсчёт и толкование результатов
            </span>
            <span className="block text-xs text-black/55">
              {SCORING_SUMMARY[test.scoring.mode]}
            </span>
          </>
        }
      >
        <ScoringEditor
          test={test}
          editScoring={(recipe) => editTest((draft) => recipe(draft.scoring))}
        />
      </Collapsible>

      <Collapsible
        summary={
          <span className="text-sm font-medium">
            Дополнительно (для опытных)
          </span>
        }
      >
        <p className="text-xs text-black/55">
          Служебные параметры теста в формате JSON. Обычно здесь ничего менять
          не нужно: ошибка в записи может сломать тест.
        </p>
        <TextArea
          mono
          rows={8}
          aria-label="Служебные параметры теста (JSON)"
          value={test.schemaSettingsText}
          onChange={(event) =>
            editTest((draft) => {
              draft.schemaSettingsText = event.target.value;
            })
          }
        />
      </Collapsible>
    </Collapsible>
  );
}

export default TestCard;
