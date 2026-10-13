"use client";

import Select from "../atom/Select";
import Checkbox from "../molecule/Checkbox";
import Field from "../molecule/Field";
import {
  PAGING_HINTS,
  PAGING_LABELS,
  type EditableSettings,
  type PagingMode,
} from "@/lib/admin/editable";

type Props = {
  settings: EditableSettings;
  onChange: (recipe: (draft: EditableSettings) => void) => void;
};

/** How a test is taken: paging, numbering, shuffling. */
function TestSettings({ settings, onChange }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <Field
        label="Как показывать вопросы"
        tip="«По одному вопросу» — на экране один вопрос, удобно на телефоне. «Списком» — вопросы идут подряд на странице. «Автоматически» — сайт сам выберет по числу вопросов."
        hint={PAGING_HINTS[settings.paging]}
      >
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
        label="Показывать номера вопросов"
        tip="Над каждым вопросом появится подпись «Вопрос 1», «Вопрос 2» и так далее, чтобы человек видел, где он в тесте."
        checked={settings.numbering}
        onChange={(event) =>
          onChange((draft) => {
            draft.numbering = event.target.checked;
          })
        }
      />

      <Checkbox
        label="Перемешивать порядок вопросов"
        tip="Вопросы будут идти в случайном порядке при каждом прохождении. Подходит, если порядок не важен; на подсчёт баллов не влияет."
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

export default TestSettings;
