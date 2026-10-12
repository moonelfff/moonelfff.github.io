"use client";

import { useState } from "react";
import { parseMarkdown } from "@/utils/markdownParser";
import { TextArea } from "./ui";

type MarkdownEditorProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
};

/** Markdown textarea with a live preview: tabs on small screens, side by side on large ones. */
export function MarkdownEditor({ label, value, onChange, hint }: MarkdownEditorProps) {
  const [mobileTab, setMobileTab] = useState<"edit" | "preview">("edit");

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-black/80">{label}</span>
        <div
          role="tablist"
          aria-label="Режим просмотра"
          className="flex gap-1 rounded-lg bg-black/5 p-0.5 lg:hidden"
        >
          {(["edit", "preview"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={mobileTab === tab}
              onClick={() => setMobileTab(tab)}
              className={`min-h-9 cursor-pointer rounded-md px-3 text-sm font-medium transition ${
                mobileTab === tab ? "bg-white shadow-sm" : "text-black/60"
              }`}
            >
              {tab === "edit" ? "Текст" : "Предпросмотр"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <TextArea
          mono
          aria-label={label}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`h-64 ${mobileTab === "preview" ? "max-lg:hidden" : ""}`}
        />
        <div
          className={`markdown content-markdown h-64 overflow-auto rounded-xl border border-black/10 bg-black/[0.03] p-3 text-sm ${
            mobileTab === "edit" ? "max-lg:hidden" : ""
          }`}
        >
          {value.trim() ? (
            parseMarkdown(value)
          ) : (
            <p className="text-black/55">Предпросмотр появится после ввода текста.</p>
          )}
        </div>
      </div>
      {hint ? <span className="text-xs text-black/55">{hint}</span> : null}
    </div>
  );
}
