"use client";

import { PlusIcon } from "../../_components/icons";
import { RowActions } from "../../_components/RowActions";
import { Button, Collapsible, Field, Select, TextArea, TextInput } from "../../_components/ui";
import { moveItem } from "../../_lib/moveItem";
import {
  collectAnswerValues,
  createGroup,
  createLevel,
  suggestAnswerRange,
  type EditableScoring,
  type EditableTest,
  type ScoringMode,
} from "../_lib/editable";
import { QuestionPicker } from "./QuestionPicker";

type ScoringEditorProps = {
  test: EditableTest;
  editScoring: (recipe: (draft: EditableScoring) => void) => void;
};

const MODES: Array<{ mode: ScoringMode; title: string; text: string }> = [
  {
    mode: "scale",
    title: "Сумма баллов",
    text: "Баллы за ответы складываются, итог попадает в диапазон: например, уровень стресса.",
  },
  {
    mode: "groups",
    title: "Типы (группы)",
    text: "Вопросы делятся на группы, побеждают группы с наибольшим числом подходящих ответов: например, тип личности.",
  },
  {
    mode: "none",
    title: "Без подсчёта",
    text: "Ответы сохраняются, человек видит общий текст результата.",
  },
];

function toNumber(value: string): number | null {
  const parsed = Number(value.trim().replace(",", "."));
  return value.trim() !== "" && Number.isFinite(parsed) ? parsed : null;
}

function levelWarnings(scoring: EditableScoring, from: number, to: number): string[] {
  const parsed = scoring.levels
    .map((level) => ({ min: toNumber(level.min), max: toNumber(level.max) }))
    .filter((level): level is { min: number; max: number } => level.min !== null && level.max !== null)
    .sort((a, b) => a.min - b.min);

  if (parsed.length === 0) {
    return [];
  }

  const warnings: string[] = [];
  if (parsed[0].min > from) {
    warnings.push(`Баллы от ${from} до ${parsed[0].min - 1} не попадают ни в один диапазон.`);
  }
  for (let i = 1; i < parsed.length; i += 1) {
    const prev = parsed[i - 1];
    const next = parsed[i];
    if (next.min <= prev.max) {
      warnings.push(`Диапазоны ${prev.min}–${prev.max} и ${next.min}–${next.max} пересекаются.`);
    } else if (next.min > prev.max + 1) {
      warnings.push(`Баллы от ${prev.max + 1} до ${next.min - 1} не попадают ни в один диапазон.`);
    }
  }
  const last = parsed[parsed.length - 1];
  if (last.max < to) {
    warnings.push(`Баллы от ${last.max + 1} до ${to} не попадают ни в один диапазон.`);
  }
  return warnings;
}

function Hint({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-black/55">{children}</p>;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h4 className="font-semibold">{children}</h4>;
}

export function ScoringEditor({ test, editScoring }: ScoringEditorProps) {
  const { scoring, questions } = test;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-2 md:grid-cols-3">
        {MODES.map((item) => {
          const active = scoring.mode === item.mode;
          return (
            <button
              key={item.mode}
              type="button"
              aria-pressed={active}
              onClick={() =>
                editScoring((draft) => {
                  draft.mode = item.mode;
                })
              }
              className={`focus-visible:outline-dusty-grape cursor-pointer rounded-xl border p-3 text-left transition focus-visible:outline-2 ${
                active
                  ? "border-dusty-grape bg-dusty-grape/10 ring-2 ring-dusty-grape/20"
                  : "border-alabaster-grey bg-platinum hover:border-dusty-grape/50"
              }`}
            >
              <span className="block text-sm font-semibold">{item.title}</span>
              <span className="mt-1 block text-xs text-black/60">{item.text}</span>
            </button>
          );
        })}
      </div>

      {scoring.mode === "scale" ? (
        <ScaleEditor test={test} editScoring={editScoring} />
      ) : null}
      {scoring.mode === "groups" ? (
        <GroupsEditor test={test} editScoring={editScoring} />
      ) : null}
      {scoring.mode === "none" ? (
        <Hint>
          После теста человек увидит нейтральный результат. Выберите способ подсчёта выше,
          чтобы показывать интерпретацию.
        </Hint>
      ) : null}
      {questions.length === 0 ? <Hint>Сначала добавьте вопросы.</Hint> : null}
    </div>
  );
}

function ScaleEditor({ test, editScoring }: ScoringEditorProps) {
  const { scoring, questions } = test;
  const min = toNumber(scoring.minValue);
  const max = toNumber(scoring.maxValue);
  const count = scoring.scaleQuestionIds.length;
  const rangeFrom = min !== null ? count * min : null;
  const rangeTo = max !== null ? count * max : null;
  const warnings =
    rangeFrom !== null && rangeTo !== null && count > 0
      ? levelWarnings(scoring, rangeFrom, rangeTo)
      : [];

  const detectRange = () => {
    const range = suggestAnswerRange(questions, scoring.scaleQuestionIds);
    if (range) {
      editScoring((draft) => {
        draft.minValue = String(range.min);
        draft.maxValue = String(range.max);
      });
    }
  };

  const splitIntoThree = () => {
    if (rangeFrom === null || rangeTo === null || rangeTo <= rangeFrom) {
      return;
    }
    const total = rangeTo - rangeFrom + 1;
    const labels = ["Низкий уровень", "Средний уровень", "Высокий уровень"];
    editScoring((draft) => {
      draft.levels = labels.map((label, index) => {
        const level = createLevel();
        level.min = String(rangeFrom + Math.floor((total * index) / 3));
        level.max = String(rangeFrom + Math.floor((total * (index + 1)) / 3) - 1);
        level.label = label;
        return level;
      });
    });
  };

  return (
    <>
      <div className="flex flex-col gap-2">
        <SectionTitle>1. Какие вопросы учитывать</SectionTitle>
        <Hint>
          Баллы за выбранные вопросы складываются. «Обратный» переворачивает шкалу для
          утверждений противоположного смысла (например, 3 становится 1).
        </Hint>
        <QuestionPicker
          questions={questions}
          selected={scoring.scaleQuestionIds}
          onChange={(ids) =>
            editScoring((draft) => {
              draft.scaleQuestionIds = ids;
            })
          }
          secondary={{
            label: "обратный",
            selected: scoring.reverseQuestionIds,
            onChange: (ids) =>
              editScoring((draft) => {
                draft.reverseQuestionIds = ids;
              }),
          }}
        />
      </div>

      <div className="flex flex-col gap-2">
        <SectionTitle>2. Баллы за ответ</SectionTitle>
        <Hint>
          Балл ответа равен его значению. Укажите значения самого низкого и самого высокого
          варианта (для вариантов 1, 2, 3 это 1 и 3).
        </Hint>
        <div className="grid grid-cols-2 items-end gap-3 md:grid-cols-[8rem_8rem_auto]">
          <Field label="Минимум">
            <TextInput
              inputMode="decimal"
              value={scoring.minValue}
              onChange={(event) =>
                editScoring((draft) => {
                  draft.minValue = event.target.value;
                })
              }
            />
          </Field>
          <Field label="Максимум">
            <TextInput
              inputMode="decimal"
              value={scoring.maxValue}
              onChange={(event) =>
                editScoring((draft) => {
                  draft.maxValue = event.target.value;
                })
              }
            />
          </Field>
          <Button className="col-span-2 md:col-span-1 md:justify-self-start" onClick={detectRange}>
            Определить по вариантам
          </Button>
        </div>
        {rangeFrom !== null && rangeTo !== null && count > 0 ? (
          <p className="text-sm">
            Итоговый балл будет от <b>{rangeFrom}</b> до <b>{rangeTo}</b>.
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <SectionTitle>3. Диапазоны и толкование</SectionTitle>
            <Hint>Для каждого диапазона баллов напишите название и пояснение результата.</Hint>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={rangeFrom === null || rangeTo === null || rangeTo <= rangeFrom}
              onClick={splitIntoThree}
            >
              Разбить на 3 уровня
            </Button>
            <Button
              onClick={() =>
                editScoring((draft) => {
                  draft.levels.push(createLevel());
                })
              }
            >
              <PlusIcon width={18} height={18} />
              Добавить диапазон
            </Button>
          </div>
        </div>

        {scoring.levels.map((level, index) => (
          <div
            key={level.id}
            className="border-alabaster-grey bg-soft-linnen/40 flex flex-col gap-3 rounded-xl border p-3"
          >
            <div className="grid grid-cols-[5rem_5rem_minmax(0,1fr)] gap-3">
              <Field label="От">
                <TextInput
                  inputMode="decimal"
                  value={level.min}
                  onChange={(event) =>
                    editScoring((draft) => {
                      draft.levels[index].min = event.target.value;
                    })
                  }
                />
              </Field>
              <Field label="До">
                <TextInput
                  inputMode="decimal"
                  value={level.max}
                  onChange={(event) =>
                    editScoring((draft) => {
                      draft.levels[index].max = event.target.value;
                    })
                  }
                />
              </Field>
              <Field label="Название результата">
                <TextInput
                  value={level.label}
                  placeholder="Например: Высокий уровень"
                  onChange={(event) =>
                    editScoring((draft) => {
                      draft.levels[index].label = event.target.value;
                    })
                  }
                />
              </Field>
            </div>
            <Field label="Пояснение">
              <TextArea
                rows={3}
                value={level.summary}
                onChange={(event) =>
                  editScoring((draft) => {
                    draft.levels[index].summary = event.target.value;
                  })
                }
              />
            </Field>
            <div className="flex items-center justify-end gap-1">
              <RowActions
                noun="диапазон"
                index={index}
                count={scoring.levels.length}
                onMove={(from, to) =>
                  editScoring((draft) => {
                    draft.levels = moveItem(draft.levels, from, to);
                  })
                }
                onRemove={() =>
                  editScoring((draft) => {
                    draft.levels.splice(index, 1);
                  })
                }
              />
            </div>
          </div>
        ))}

        {scoring.levels.length === 0 ? (
          <Hint>Диапазонов пока нет: человек увидит только набранные баллы.</Hint>
        ) : null}

        {warnings.length > 0 ? (
          <ul className="flex flex-col gap-1 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            {warnings.map((warning) => (
              <li key={warning}>⚠ {warning}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </>
  );
}

function GroupsEditor({ test, editScoring }: ScoringEditorProps) {
  const { scoring, questions } = test;
  const answerValues = collectAnswerValues(questions);

  return (
    <>
      <div className="flex flex-col gap-2">
        <SectionTitle>1. Какие ответы засчитываются</SectionTitle>
        <Hint>
          Каждый такой ответ добавляет группе одно очко. Остальные ответы очков не дают.
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
                      : draft.positiveValues.filter((value) => value !== answer.value);
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
            <Hint>Нет числовых вариантов ответа: задайте значения 1, 2, 3… в вопросах.</Hint>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-[14rem_1fr] md:items-end">
        <Field label="Сколько групп выделять в результате">
          <Select
            value={scoring.topCount}
            onChange={(event) =>
              editScoring((draft) => {
                draft.topCount = Number(event.target.value);
              })
            }
          >
            {[1, 2, 3, 4].map((value) => (
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
            <SectionTitle>2. Группы</SectionTitle>
            <Hint>Для каждой группы выберите вопросы и напишите толкование.</Hint>
          </div>
          <Button
            onClick={() =>
              editScoring((draft) => {
                draft.groups.push(createGroup(draft.groups.length));
              })
            }
          >
            <PlusIcon width={18} height={18} />
            Добавить группу
          </Button>
        </div>

        {scoring.groups.map((group, index) => (
          <Collapsible
            key={group.id}
            defaultOpen={!group.name && !group.title}
            className="bg-platinum"
            summary={
              <>
                <span className="block truncate text-sm font-medium">
                  {group.name || group.title || "Новая группа"}
                </span>
                <span className="block text-xs text-black/55">
                  вопросов: {group.questionIds.length}
                </span>
              </>
            }
            actions={
              <RowActions
                noun="группу"
                index={index}
                count={scoring.groups.length}
                onMove={(from, to) =>
                  editScoring((draft) => {
                    draft.groups = moveItem(draft.groups, from, to);
                  })
                }
                onRemove={() =>
                  editScoring((draft) => {
                    draft.groups.splice(index, 1);
                  })
                }
              />
            }
          >
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Название группы" hint="Показывается в списке «Все результаты».">
                <TextInput
                  value={group.name}
                  onChange={(event) =>
                    editScoring((draft) => {
                      draft.groups[index].name = event.target.value;
                    })
                  }
                />
              </Field>
              <Field
                label="Заголовок результата"
                hint="Крупно, если группа среди лидирующих. Можно оставить пустым."
              >
                <TextInput
                  value={group.title}
                  onChange={(event) =>
                    editScoring((draft) => {
                      draft.groups[index].title = event.target.value;
                    })
                  }
                />
              </Field>
            </div>
            <Field label="Толкование" hint="Текст, который увидит человек, если группа лидирует.">
              <TextArea
                rows={4}
                value={group.interpretation}
                onChange={(event) =>
                  editScoring((draft) => {
                    draft.groups[index].interpretation = event.target.value;
                  })
                }
              />
            </Field>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-black/80">Вопросы группы</span>
              <QuestionPicker
                questions={questions}
                selected={group.questionIds}
                onChange={(ids) =>
                  editScoring((draft) => {
                    draft.groups[index].questionIds = ids;
                  })
                }
              />
            </div>
          </Collapsible>
        ))}

        {scoring.groups.length === 0 ? <Hint>Групп пока нет.</Hint> : null}
      </div>
    </>
  );
}
