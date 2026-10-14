"use client";

import { moveItem } from "@/lib/admin/moveItem";
import type { EditableScoring } from "@/lib/admin/editable";
import TextArea from "../atom/TextArea";
import TextInput from "../atom/TextInput";
import Panel from "../atom/Panel";
import Field from "./Field";
import RowActions from "./RowActions";

type Props = {
  scoring: EditableScoring;
  index: number;
  editScoring: (recipe: (draft: EditableScoring) => void) => void;
};

/** One score range with its title and interpretation. */
function LevelRow({ scoring, index, editScoring }: Props) {
  const level = scoring.levels[index];

  return (
    <Panel>
      <div className="grid grid-cols-[5rem_5rem_minmax(0,1fr)] gap-3">
        <Field
          label="От"
          tip="Наименьший итоговый балл, при котором показывается этот результат."
        >
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
        <Field
          label="До"
          tip="Наибольший итоговый балл, при котором показывается этот результат."
        >
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
        <Field
          label="Название результата"
          tip="Короткий заголовок результата, который увидит человек, например «Средний уровень»."
        >
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
      <Field
        label="Пояснение"
        tip="Текст под заголовком: что означает такой результат и что делать дальше."
      >
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
    </Panel>
  );
}

export default LevelRow;
