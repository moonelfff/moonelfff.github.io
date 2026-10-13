"use client";

import type { ScoringMode } from "@/lib/admin/editable";

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

type Props = {
  value: ScoringMode;
  onChange: (mode: ScoringMode) => void;
};

/** Cards for choosing how a test result is calculated. */
function ScoringModePicker({ value, onChange }: Props) {
  return (
    <div className="grid gap-2 md:grid-cols-3">
      {MODES.map((item) => {
        const active = value === item.mode;
        return (
          <button
            key={item.mode}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(item.mode)}
            className={`focus-visible:outline-dusty-grape cursor-pointer rounded-xl border p-3 text-left transition focus-visible:outline-2 ${
              active
                ? "border-dusty-grape bg-dusty-grape/10 ring-dusty-grape/20 ring-2"
                : "border-alabaster-grey bg-platinum hover:border-dusty-grape/50"
            }`}
          >
            <span className="block text-sm font-semibold">{item.title}</span>
            <span className="mt-1 block text-xs text-black/60">
              {item.text}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default ScoringModePicker;
