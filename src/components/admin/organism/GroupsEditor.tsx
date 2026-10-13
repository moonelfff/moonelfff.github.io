"use client";

import { PlusIcon } from "@/assets/icons/admin";
import {
  collectAnswerValues,
  createGroup,
  type EditableScoring,
  type EditableTest,
} from "@/lib/admin/editable";
import AdminButton from "../atom/AdminButton";
import Hint from "../atom/Hint";
import Select from "../atom/Select";
import Field from "../molecule/Field";
import SectionTitle from "../molecule/SectionTitle";
import GroupCard from "./GroupCard";

type Props = {
  test: EditableTest;
  editScoring: (recipe: (draft: EditableScoring) => void) => void;
};

const TOP_COUNT_OPTIONS = [1, 2, 3, 4];

/** Group-based scoring: which answers count, how many leaders to show and the groups. */
function GroupsEditor({ test, editScoring }: Props) {
  const { scoring, questions } = test;
  const answerValues = collectAnswerValues(questions);

  return (
    <>
      <div className="flex flex-col gap-2">
        <SectionTitle tip="Выберите, какие ответы считаются «попаданием». Каждый такой ответ в вопросах группы даёт этой группе одно очко. Побеждают группы с наибольшим числом очков.">
          1. Какие ответы засчитываются
        </SectionTitle>
        <Hint>
          Каждый такой ответ добавляет группе одно очко. Остальные ответы очков
          не дают.
        </Hint>
        <div className="flex flex-wrap gap-x-5">
          {answerValues.map((answer) => (
            <label
              key={answer.value}
              className="flex min-h-11 cursor-pointer items-center gap-2 text-sm"
            >
              <input
                type="checkbox"
                className="accent-dusty-grape size-5 cursor-pointer"
                checked={scoring.positiveValues.includes(answer.value)}
                onChange={(event) =>
                  editScoring((draft) => {
                    draft.positiveValues = event.target.checked
                      ? [...draft.positiveValues, answer.value]
                      : draft.positiveValues.filter(
                          (value) => value !== answer.value,
                        );
                  })
                }
              />
              <span>
                <b>{answer.value}</b>
                {answer.text !== answer.value ? ` — ${answer.text}` : ""}
              </span>
            </label>
          ))}
          {answerValues.length === 0 ? (
            <Hint>
              Нет числовых вариантов ответа: задайте значения 1, 2, 3… в
              вопросах.
            </Hint>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-[14rem_1fr] md:items-end">
        <Field
          label="Сколько групп выделять в результате"
          tip="Сколько групп с наибольшим числом очков показать крупно, с толкованием. Если выбрать 2, человек увидит две самые сильные группы."
        >
          <Select
            value={scoring.topCount}
            onChange={(event) =>
              editScoring((draft) => {
                draft.topCount = Number(event.target.value);
              })
            }
          >
            {TOP_COUNT_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </Select>
        </Field>
        <Hint>Остальные группы показываются в общем списке с баллами.</Hint>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <SectionTitle tip="Группа — это один возможный тип результата. К ней привязываются вопросы, а очки считаются по выбранным выше ответам.">
              2. Группы
            </SectionTitle>
            <Hint>
              Для каждой группы выберите вопросы и напишите толкование.
            </Hint>
          </div>
          <AdminButton
            onClick={() =>
              editScoring((draft) => {
                draft.groups.push(createGroup(draft.groups.length));
              })
            }
          >
            <PlusIcon width={18} height={18} />
            Добавить группу
          </AdminButton>
        </div>

        {scoring.groups.map((group, index) => (
          <GroupCard
            key={group.id}
            test={test}
            index={index}
            editScoring={editScoring}
          />
        ))}

        {scoring.groups.length === 0 ? <Hint>Групп пока нет.</Hint> : null}
      </div>
    </>
  );
}

export default GroupsEditor;
