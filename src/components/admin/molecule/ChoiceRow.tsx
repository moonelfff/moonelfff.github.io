"use client";

import { moveItem } from "@/lib/admin/moveItem";
import type { EditableQuestion } from "@/lib/admin/editable";
import TextInput from "../atom/TextInput";
import Panel from "../atom/Panel";
import Field from "./Field";
import RowActions from "./RowActions";

type Props = {
  question: EditableQuestion;
  index: number;
  editQuestion: (recipe: (draft: EditableQuestion) => void) => void;
};

/** One answer option: the value used for scoring and the text shown to a person. */
function ChoiceRow({ question, index, editQuestion }: Props) {
  const choice = question.choices[index];

  return (
    <Panel>
      <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-3">
        <Field
          label="Значение"
          tip="Число, которое идёт в подсчёт баллов, когда человек выбирает этот вариант. Человек его не видит. Если подсчёт не нужен, оставьте как есть."
        >
          <TextInput
            value={choice.value}
            onChange={(event) =>
              editQuestion((draft) => {
                draft.choices[index].value = event.target.value;
              })
            }
          />
        </Field>
        <Field label="Текст" tip="Так вариант выглядит для человека.">
          <TextInput
            value={choice.text}
            onChange={(event) =>
              editQuestion((draft) => {
                draft.choices[index].text = event.target.value;
              })
            }
          />
        </Field>
      </div>
      <div className="flex items-center justify-end gap-1">
        <RowActions
          noun="вариант"
          index={index}
          count={question.choices.length}
          onMove={(from, to) =>
            editQuestion((draft) => {
              draft.choices = moveItem(draft.choices, from, to);
            })
          }
          onRemove={() =>
            editQuestion((draft) => {
              draft.choices.splice(index, 1);
            })
          }
        />
      </div>
    </Panel>
  );
}

export default ChoiceRow;
