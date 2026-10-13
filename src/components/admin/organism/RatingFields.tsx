"use client";

import type { EditableQuestion } from "@/lib/admin/editable";
import Select from "../atom/Select";
import TextInput from "../atom/TextInput";
import Field from "../molecule/Field";

type Props = {
  question: EditableQuestion;
  editQuestion: (recipe: (draft: EditableQuestion) => void) => void;
};

const RATE_MAX_OPTIONS = [3, 4, 5, 6, 7, 8, 9, 10];

/** Settings of a rating question: number of values and the end labels. */
function RatingFields({ question, editQuestion }: Props) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <Field
        label="Число значений"
        tip="Сколько вариантов оценки увидит человек. Например, 1–5: от «совсем не согласен» до «полностью согласен». Баллы в подсчёте равны выбранному числу."
      >
        <Select
          value={question.rateMax}
          onChange={(event) =>
            editQuestion((draft) => {
              draft.rateMax = Number(event.target.value);
            })
          }
        >
          {RATE_MAX_OPTIONS.map((value) => (
            <option key={value} value={value}>
              1–{value}
            </option>
          ))}
        </Select>
      </Field>
      <Field
        label="Подпись к минимуму"
        tip="Короткий текст рядом с самой низкой оценкой, например «Совсем не согласен». Можно оставить пустым."
      >
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
      <Field
        label="Подпись к максимуму"
        tip="Короткий текст рядом с самой высокой оценкой, например «Полностью согласен». Можно оставить пустым."
      >
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
  );
}

export default RatingFields;
