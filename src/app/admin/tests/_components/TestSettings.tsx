"use client";

import { Checkbox, Field, Select } from "../../_components/ui";
import {
  PAGING_HINTS,
  PAGING_LABELS,
  type EditableSettings,
  type PagingMode,
} from "../_lib/editable";

type TestSettingsProps = {
  settings: EditableSettings;
  onChange: (recipe: (draft: EditableSettings) => void) => void;
};

export function TestSettings({ settings, onChange }: TestSettingsProps) {
  return (
    <div className="flex flex-col gap-2">
      <Field label="Как показывать вопросы" hint={PAGING_HINTS[settings.paging]}>
        <Select
          value={settings.paging}
          onChange={(event) =>
            onChange((draft) => {
              draft.paging = event.target.value as PagingMode;
            })
          }
        >
          {Object.entries(PAGING_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </Field>

      <Checkbox
        label="Показывать номера вопросов («Вопрос 1», «Вопрос 2»…)"
        checked={settings.numbering}
        onChange={(event) =>
          onChange((draft) => {
            draft.numbering = event.target.checked;
          })
        }
      />

      <Checkbox
        label="Перемешивать порядок вопросов для каждого прохождения"
        checked={settings.shuffleQuestions}
        onChange={(event) =>
          onChange((draft) => {
            draft.shuffleQuestions = event.target.checked;
          })
        }
      />
    </div>
  );
}
