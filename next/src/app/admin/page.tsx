"use client";

import type { SiteContent } from "@/lib/contentStore";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type AdminBundle = {
  content: SiteContent;
  markdown: Record<string, string>;
  source: "local" | "supabase";
};

function prettyJson(value: SiteContent): string {
  return JSON.stringify(value, null, 2);
}

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [source, setSource] = useState<"local" | "supabase">("local");

  const [contentJson, setContentJson] = useState("");
  const [markdown, setMarkdown] = useState<Record<string, string>>({});

  const markdownKeys = useMemo(() => Object.keys(markdown).sort(), [markdown]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/admin/content", { cache: "no-store" });
      if (!response.ok) {
        if (response.status === 401) {
          router.replace("/admin/login");
          return;
        }
        setError("Не удалось загрузить контент");
        setLoading(false);
        return;
      }

      const body = (await response.json()) as AdminBundle;
      setSource(body.source);
      setContentJson(prettyJson(body.content));
      setMarkdown(body.markdown);
      setLoading(false);
    };

    load();
  }, [router]);

  const onSave = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);

    let parsedContent: SiteContent;
    try {
      parsedContent = JSON.parse(contentJson) as SiteContent;
    } catch {
      setError("content.json: невалидный JSON");
      setSaving(false);
      return;
    }

    const response = await fetch("/api/admin/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: parsedContent,
        markdown,
      }),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error ?? "Ошибка сохранения");
      setSaving(false);
      return;
    }

    const body = (await response.json()) as AdminBundle;
    setSource(body.source);
    setContentJson(prettyJson(body.content));
    setMarkdown(body.markdown);
    setMessage("Сохранено");
    setSaving(false);
  };

  const onLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  };

  if (loading) {
    return <main className="p-6">Загрузка админки...</main>;
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Админка контента</h1>
          <p className="text-sm text-black/70">
            Источник данных: <span className="font-medium">{source}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onLogout}
            className="rounded-lg border border-black/20 px-4 py-2"
          >
            Выйти
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
          >
            {saving ? "Сохраняем..." : "Сохранить"}
          </button>
        </div>
      </header>

      {error ? <p className="rounded-lg bg-red-100 px-4 py-2 text-red-800">{error}</p> : null}
      {message ? <p className="rounded-lg bg-emerald-100 px-4 py-2 text-emerald-800">{message}</p> : null}

      <section className="rounded-2xl border border-black/15 bg-white p-4">
        <h2 className="mb-2 text-lg font-medium">content.json</h2>
        <textarea
          value={contentJson}
          onChange={(event) => setContentJson(event.target.value)}
          className="h-96 w-full rounded-xl border border-black/20 p-3 font-mono text-sm outline-none focus:border-black"
          spellCheck={false}
        />
      </section>

      <section className="rounded-2xl border border-black/15 bg-white p-4">
        <h2 className="mb-3 text-lg font-medium">Markdown файлы</h2>
        <div className="flex flex-col gap-4">
          {markdownKeys.map((key) => (
            <div key={key} className="rounded-xl border border-black/15 p-3">
              <label className="mb-2 block text-sm font-medium">/{key}</label>
              <textarea
                value={markdown[key]}
                onChange={(event) =>
                  setMarkdown((current) => ({
                    ...current,
                    [key]: event.target.value,
                  }))
                }
                className="h-60 w-full rounded-lg border border-black/20 p-3 font-mono text-sm outline-none focus:border-black"
                spellCheck={false}
              />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
