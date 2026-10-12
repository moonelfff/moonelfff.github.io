"use client";

import Link from "next/link";
import { useState, type Dispatch, type SetStateAction } from "react";
import { normalizeSlug } from "@/lib/slug";
import { ExternalLinkIcon, PlusIcon, TrashIcon } from "../../_components/icons";
import { MarkdownEditor } from "../../_components/MarkdownEditor";
import {
  Button,
  Collapsible,
  Field,
  TextArea,
  TextInput,
} from "../../_components/ui";
import { updateDraft } from "../../_lib/draft";
import { moveItem } from "../../_lib/moveItem";
import {
  createQuestion,
  QUESTIONS_PER_PAGE,
  type EditableQuestion,
  type EditableTest,
} from "../_lib/editable";
import { QuestionCard } from "./QuestionCard";

type TestCardProps = {
  test: EditableTest;
  index: number;
  defaultOpen: boolean;
  setTests: Dispatch<SetStateAction<EditableTest[]>>;
};

export function TestCard({ test, index, defaultOpen, setTests }: TestCardProps) {
  const [justAddedQuestionId, setJustAddedQuestionId] = useState<string | null>(null);

  const editTest = (recipe: (draft: EditableTest) => void) =>
    updateDraft(setTests, (draft) => recipe(draft[index]));

  const pageCount = Math.max(1, Math.ceil(test.questions.length / QUESTIONS_PER_PAGE));

  const onRemove = () => {
    if (window.confirm(`Удалить тест «${test.title || test.slug}»?`)) {
      setTests((current) => current.filter((_, i) => i !== index));
    }
  };

  const addQuestion = () => {
    const question = createQuestion(test.questions.length);
    setJustAddedQuestionId(question.id);
    editTest((draft) => {
      draft.questions.push(question);
    });
  };

  return (
    <Collapsible
      defaultOpen={defaultOpen}
      className="bg-white shadow-sm"
      summary={
        <>
          <span className="block truncate font-semibold">
            {test.title || "Без названия"}
          </span>
          <span className="block text-xs text-black/55">
            /{test.slug} · вопросов: {test.questions.length}
          </span>
        </>
      }
      actions={
        <Button icon variant="ghost" label="Удалить тест" onClick={onRemove}>
          <TrashIcon className="text-red-600" />
        </Button>
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
        <Field label="Версия">
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

      <Field label="Slug" hint="Адрес теста на сайте. Латиница, цифры и дефис.">
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
          <Button
            onClick={() =>
              editTest((draft) => {
                draft.slug = normalizeSlug(draft.slug || draft.title);
              })
            }
          >
            Исправить
          </Button>
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
              Страниц: {pageCount}. Новая страница создаётся после каждых{" "}
              {QUESTIONS_PER_PAGE} вопросов.
            </p>
          </div>
          <Button onClick={addQuestion}>
            <PlusIcon width={18} height={18} />
            Добавить вопрос
          </Button>
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
                draft.questions.splice(questionIndex, 1);
              })
            }
          />
        ))}
      </div>

      <Collapsible summary={<span className="text-sm font-medium">Настройки схемы SurveyJS (JSON)</span>}>
        <p className="text-xs text-black/55">
          Общие параметры теста, кроме title, description и pages.
        </p>
        <TextArea
          mono
          rows={10}
          aria-label="Настройки схемы теста (JSON)"
          value={test.schemaSettingsText}
          onChange={(event) =>
            editTest((draft) => {
              draft.schemaSettingsText = event.target.value;
            })
          }
        />
      </Collapsible>

      <Collapsible summary={<span className="text-sm font-medium">Подсчёт результатов, scoring (JSON)</span>}>
        <p className="text-xs text-black/55">
          Шкалы, группы вопросов и интерпретация результатов.
        </p>
        <TextArea
          mono
          rows={12}
          aria-label="Подсчёт результатов (JSON)"
          value={test.scoringText}
          onChange={(event) =>
            editTest((draft) => {
              draft.scoringText = event.target.value;
            })
          }
        />
      </Collapsible>
    </Collapsible>
  );
}
