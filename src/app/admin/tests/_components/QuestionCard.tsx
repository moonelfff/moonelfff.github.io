"use client";

import { moveItem } from "../../_lib/moveItem";
import { PlusIcon } from "../../_components/icons";
import { RowActions } from "../../_components/RowActions";
import {
  Button,
  Checkbox,
  Collapsible,
  Field,
  Select,
  TextArea,
  TextInput,
} from "../../_components/ui";
import {
  createChoice,
  createDefaultChoices,
  isChoiceBasedQuestion,
  QUESTION_TYPE_LABELS,
  QUESTIONS_PER_PAGE,
  toQuestionType,
  type EditableQuestion,
} from "../_lib/editable";

type QuestionCardProps = {
  question: EditableQuestion;
  index: number;
  count: number;
  defaultOpen: boolean;
  editQuestion: (recipe: (draft: EditableQuestion) => void) => void;
  onMove: (from: number, to: number) => void;
  onRemove: () => void;
};

export function QuestionCard({
  question,
  index,
  count,
  defaultOpen,
  editQuestion,
  onMove,
  onRemove,
}: QuestionCardProps) {
  const pageNumber = Math.floor(index / QUESTIONS_PER_PAGE) + 1;

  return (
    <Collapsible
      defaultOpen={defaultOpen}
      className="bg-platinum"
      summary={
        <>
          <span className="block truncate text-sm font-medium">
            {index + 1}. {question.title || "Без текста"}
          </span>
          <span className="block text-xs text-black/55">
            {QUESTION_TYPE_LABELS[question.type]} · страница {pageNumber}
          </span>
        </>
      }
      actions={
        <RowActions
          noun="вопрос"
          index={index}
          count={count}
          onMove={onMove}
          onRemove={onRemove}
        />
      }
    >
      <Field label="Текст вопроса">
        <TextArea
          rows={3}
          value={question.title}
          onChange={(event) =>
            editQuestion((draft) => {
              draft.title = event.target.value;
            })
          }
        />
      </Field>

      <Field label="Тип">
        <Select
          value={question.type}
          onChange={(event) => {
            const nextType = toQuestionType(event.target.value);
            editQuestion((draft) => {
              draft.type = nextType;
              draft.choices = isChoiceBasedQuestion(nextType)
                ? draft.choices.length > 0
                  ? draft.choices
                  : createDefaultChoices()
                : [];
            });
          }}
        >
          {Object.entries(QUESTION_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Пояснение к вопросу">
        <TextArea
          rows={2}
          value={question.description}
          onChange={(event) =>
            editQuestion((draft) => {
              draft.description = event.target.value;
            })
          }
        />
      </Field>

      <Checkbox
        label="Обязательный вопрос"
        checked={question.isRequired}
        onChange={(event) =>
          editQuestion((draft) => {
            draft.isRequired = event.target.checked;
          })
        }
      />

      {question.type === "rating" ? (
        <div className="grid gap-3 md:grid-cols-3">
          <Field label="Число значений" hint="Шкала от 1 до выбранного числа.">
            <Select
              value={question.rateMax}
              onChange={(event) =>
                editQuestion((draft) => {
                  draft.rateMax = Number(event.target.value);
                })
              }
            >
              {[3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                <option key={value} value={value}>
                  1–{value}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Подпись к минимуму">
            <TextInput
              value={question.minRateText}
              placeholder="Совсем не согласен"
              onChange={(event) =>
                editQuestion((draft) => {
                  draft.minRateText = event.target.value;
                })
              }
            />
          </Field>
          <Field label="Подпись к максимуму">
            <TextInput
              value={question.maxRateText}
              placeholder="Полностью согласен"
              onChange={(event) =>
                editQuestion((draft) => {
                  draft.maxRateText = event.target.value;
                })
              }
            />
          </Field>
        </div>
      ) : null}

      {isChoiceBasedQuestion(question.type) ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-semibold">Варианты ответа</h4>
            <Button
              onClick={() =>
                editQuestion((draft) => {
                  draft.choices.push(createChoice(draft.choices.length));
                })
              }
            >
              <PlusIcon width={18} height={18} />
              Добавить вариант
            </Button>
          </div>
          <p className="text-xs text-black/55">
            «Значение» — число, по которому считаются баллы (например, 1, 2, 3). «Текст» —
            то, что видит человек.
          </p>

          {question.choices.map((choice, choiceIndex) => (
            <div
              key={choice.id}
              className="flex flex-col gap-3 rounded-xl border border-alabaster-grey bg-soft-linnen/40 p-3"
            >
              <div className="grid grid-cols-[5rem_minmax(0,1fr)] gap-3">
                <Field label="Значение">
                  <TextInput
                    value={choice.value}
                    onChange={(event) =>
                      editQuestion((draft) => {
                        draft.choices[choiceIndex].value = event.target.value;
                      })
                    }
                  />
                </Field>
                <Field label="Текст">
                  <TextInput
                    value={choice.text}
                    onChange={(event) =>
                      editQuestion((draft) => {
                        draft.choices[choiceIndex].text = event.target.value;
                      })
                    }
                  />
                </Field>
              </div>
              <div className="flex items-center justify-end gap-1">
                <RowActions
                  noun="вариант"
                  index={choiceIndex}
                  count={question.choices.length}
                  onMove={(from, to) =>
                    editQuestion((draft) => {
                      draft.choices = moveItem(draft.choices, from, to);
                    })
                  }
                  onRemove={() =>
                    editQuestion((draft) => {
                      draft.choices.splice(choiceIndex, 1);
                    })
                  }
                />
              </div>
            </div>
          ))}

          <Checkbox
            label="Перемешивать варианты для каждого прохождения"
            checked={question.shuffleChoices}
            onChange={(event) =>
              editQuestion((draft) => {
                draft.shuffleChoices = event.target.checked;
              })
            }
          />
        </div>
      ) : null}

      <Collapsible summary={<span className="text-sm font-medium">Дополнительно</span>}>
        <Field
          label="Имя поля"
          hint="Технический идентификатор ответа. Должен быть уникальным; подсчёт результатов привязан к вопросу автоматически."
        >
          <TextInput
            value={question.name}
            autoCapitalize="none"
            onChange={(event) =>
              editQuestion((draft) => {
                draft.name = event.target.value;
              })
            }
          />
        </Field>
        <Field label="Другие настройки вопроса (JSON)">
          <TextArea
            mono
            rows={6}
            value={question.extraSettingsText}
            onChange={(event) =>
              editQuestion((draft) => {
                draft.extraSettingsText = event.target.value;
              })
            }
          />
        </Field>
      </Collapsible>
    </Collapsible>
  );
}
