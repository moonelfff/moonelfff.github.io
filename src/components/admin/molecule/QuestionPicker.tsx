"use client";

import type { EditableQuestion } from "@/lib/admin/editable";
import AdminButton from "../atom/AdminButton";

type Props = {
  questions: EditableQuestion[];
  selected: string[];
  onChange: (ids: string[]) => void;
  /** Optional second column, e.g. "reverse scoring". */
  secondary?: {
    label: string;
    selected: string[];
    onChange: (ids: string[]) => void;
  };
};

function toggle(list: string[], id: string, on: boolean) {
  const rest = list.filter((item) => item !== id);
  return on ? [...rest, id] : rest;
}

/** Scrollable checklist of questions with "select all / clear" helpers. */
function QuestionPicker({ questions, selected, onChange, secondary }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-black/65">
          Выбрано: <b>{selected.length}</b> из {questions.length}
        </p>
        <div className="flex gap-2">
          <AdminButton
            onClick={() => onChange(questions.map((question) => question.id))}
          >
            Выбрать все
          </AdminButton>
          <AdminButton variant="ghost" onClick={() => onChange([])}>
            Снять все
          </AdminButton>
        </div>
      </div>

      <ul className="border-alabaster-grey bg-platinum max-h-72 divide-y divide-black/5 overflow-y-auto rounded-xl border">
        {questions.map((question, index) => {
          const checked = selected.includes(question.id);

          return (
            <li key={question.id} className="flex items-center gap-3 px-3">
              <label className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  className="accent-dusty-grape size-5 shrink-0 cursor-pointer"
                  checked={checked}
                  onChange={(event) =>
                    onChange(
                      toggle(selected, question.id, event.target.checked),
                    )
                  }
                />
                <span className="min-w-0 truncate">
                  <span className="text-black/45">{index + 1}.</span>{" "}
                  {question.title || "Без текста"}
                </span>
              </label>

              {secondary && checked ? (
                <label className="flex min-h-11 shrink-0 cursor-pointer items-center gap-2 text-xs text-black/70">
                  <input
                    type="checkbox"
                    className="accent-dusty-grape size-4 cursor-pointer"
                    checked={secondary.selected.includes(question.id)}
                    onChange={(event) =>
                      secondary.onChange(
                        toggle(
                          secondary.selected,
                          question.id,
                          event.target.checked,
                        ),
                      )
                    }
                  />
                  {secondary.label}
                </label>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default QuestionPicker;
