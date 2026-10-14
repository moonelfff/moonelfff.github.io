"use client";

import { PlusIcon } from "@/assets/icons/admin";
import {
  createLevel,
  suggestAnswerRange,
  type EditableScoring,
  type EditableTest,
} from "@/lib/admin/editable";
import { levelWarnings, toNumber } from "@/lib/admin/scoringRanges";
import AdminButton from "../atom/AdminButton";
import Hint from "../atom/Hint";
import TextInput from "../atom/TextInput";
import Field from "../molecule/Field";
import QuestionPicker from "../molecule/QuestionPicker";
import SectionTitle from "../molecule/SectionTitle";
import LevelRow from "../molecule/LevelRow";

type Props = {
  test: EditableTest;
  editScoring: (recipe: (draft: EditableScoring) => void) => void;
};

const LEVEL_LABELS = ["Низкий уровень", "Средний уровень", "Высокий уровень"];

/** Sum-of-points scoring: which questions count, the point range and the result ranges. */
function ScaleEditor({ test, editScoring }: Props) {
  const { scoring, questions } = test;
  const min = toNumber(scoring.minValue);
  const max = toNumber(scoring.maxValue);
  const count = scoring.scaleQuestionIds.length;
  const rangeFrom = min !== null ? count * min : null;
  const rangeTo = max !== null ? count * max : null;
  const hasRange = rangeFrom !== null && rangeTo !== null && count > 0;
  const warnings = hasRange ? levelWarnings(scoring, rangeFrom, rangeTo) : [];

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
    editScoring((draft) => {
      draft.levels = LEVEL_LABELS.map((label, index) => {
        const level = createLevel();
        level.min = String(rangeFrom + Math.floor((total * index) / 3));
        level.max = String(
          rangeFrom + Math.floor((total * (index + 1)) / 3) - 1,
        );
        level.label = label;
        return level;
      });
    });
  };

  return (
    <>
      <div className="flex flex-col gap-2">
        <SectionTitle tip="Отметьте вопросы, баллы за которые нужно сложить. Вопросы без отметки в итог не входят, например открытые вопросы с текстом.">
          1. Какие вопросы учитывать
        </SectionTitle>
        <Hint>
          Баллы за выбранные вопросы складываются. «Обратный» переворачивает
          шкалу для утверждений противоположного смысла (например, 3 становится
          1).
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
        <SectionTitle tip="Балл за ответ берётся из поля «Значение» у варианта. Здесь нужно указать самое маленькое и самое большое значение, чтобы сайт знал, сколько баллов можно набрать.">
          2. Баллы за ответ
        </SectionTitle>
        <Hint>
          Балл ответа равен его значению. Укажите значения самого низкого и
          самого высокого варианта (для вариантов 1, 2, 3 это 1 и 3).
        </Hint>
        <div className="grid grid-cols-2 items-end gap-3 md:grid-cols-[8rem_8rem_auto]">
          <Field
            label="Минимум"
            tip="Значение самого низкого варианта ответа. Для вариантов 1, 2, 3 это 1."
          >
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
          <Field
            label="Максимум"
            tip="Значение самого высокого варианта ответа. Для вариантов 1, 2, 3 это 3."
          >
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
          <AdminButton
            className="col-span-2 md:col-span-1 md:justify-self-start"
            onClick={detectRange}
          >
            Определить по вариантам
          </AdminButton>
        </div>
        {hasRange ? (
          <p className="text-sm">
            Итоговый балл будет от <b>{rangeFrom}</b> до <b>{rangeTo}</b>.
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <SectionTitle tip="Диапазон — это промежуток баллов, например от 6 до 10. Человек увидит название и пояснение того диапазона, в который попал его итог. Диапазоны не должны пересекаться и должны покрывать все возможные баллы.">
              3. Диапазоны и толкование
            </SectionTitle>
            <Hint>
              Для каждого диапазона баллов напишите название и пояснение
              результата.
            </Hint>
          </div>
          <div className="flex flex-wrap gap-2">
            <AdminButton
              disabled={
                rangeFrom === null || rangeTo === null || rangeTo <= rangeFrom
              }
              onClick={splitIntoThree}
            >
              Разбить на 3 уровня
            </AdminButton>
            <AdminButton
              onClick={() =>
                editScoring((draft) => {
                  draft.levels.push(createLevel());
                })
              }
            >
              <PlusIcon width={18} height={18} />
              Добавить диапазон
            </AdminButton>
          </div>
        </div>

        {scoring.levels.map((level, index) => (
          <LevelRow
            key={level.id}
            scoring={scoring}
            index={index}
            editScoring={editScoring}
          />
        ))}

        {scoring.levels.length === 0 ? (
          <Hint>
            Диапазонов пока нет: человек увидит только набранные баллы.
          </Hint>
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

export default ScaleEditor;
