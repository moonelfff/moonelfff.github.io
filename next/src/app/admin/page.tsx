"use client";

import type { SiteContent } from "@/lib/contentStore";
import type { Tariff, TariffPackage } from "@/lib/tariffStore";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type DragEvent } from "react";

type AdminBundle = {
  content: SiteContent;
  markdown: Record<string, string>;
  source: "local" | "supabase";
};

type TariffBundle = {
  tariffs: Tariff[];
  source: "local" | "supabase";
};

function prettyJson(value: SiteContent): string {
  return JSON.stringify(value, null, 2);
}

function createPackage(index: number): TariffPackage {
  return {
    id: `tmp-pkg-${crypto.randomUUID()}`,
    title: `Пакет ${index + 1}`,
    regularAmount: 5000,
    discountedAmount: null,
    currency: "₽",
    sortOrder: index,
  };
}

function createTariff(index: number): Tariff {
  return {
    id: `tmp-tariff-${crypto.randomUUID()}`,
    slug: "",
    title: `Новый тариф ${index + 1}`,
    descriptionMarkdown: "",
    isActive: true,
    sortOrder: index,
    packages: [createPackage(0)],
  };
}

function moveTariff(
  items: Tariff[],
  fromIndex: number,
  toIndex: number,
): Tariff[] {
  if (toIndex < 0 || toIndex >= items.length || fromIndex === toIndex) {
    return items;
  }

  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [savingContent, setSavingContent] = useState(false);
  const [savingTariffs, setSavingTariffs] = useState(false);
  const [errorContent, setErrorContent] = useState<string | null>(null);
  const [errorTariffs, setErrorTariffs] = useState<string | null>(null);
  const [messageContent, setMessageContent] = useState<string | null>(null);
  const [messageTariffs, setMessageTariffs] = useState<string | null>(null);
  const [source, setSource] = useState<"local" | "supabase">("local");
  const [tariffSource, setTariffSource] = useState<"local" | "supabase">(
    "local",
  );

  const [contentJson, setContentJson] = useState("");
  const [markdown, setMarkdown] = useState<Record<string, string>>({});
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [draggingTariffIndex, setDraggingTariffIndex] = useState<number | null>(
    null,
  );
  const [dropTargetTariffIndex, setDropTargetTariffIndex] = useState<
    number | null
  >(null);

  const markdownKeys = useMemo(() => Object.keys(markdown).sort(), [markdown]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setErrorContent(null);
      setErrorTariffs(null);

      const [contentResponse, tariffsResponse] = await Promise.all([
        fetch("/api/admin/content", { cache: "no-store" }),
        fetch("/api/admin/tariffs", { cache: "no-store" }),
      ]);

      if (!contentResponse.ok || !tariffsResponse.ok) {
        if (contentResponse.status === 401 || tariffsResponse.status === 401) {
          router.replace("/admin/login");
          return;
        }

        if (!contentResponse.ok) {
          setErrorContent("Не удалось загрузить общий контент");
        }

        if (!tariffsResponse.ok) {
          setErrorTariffs("Не удалось загрузить тарифы");
        }

        setLoading(false);
        return;
      }

      const contentBody = (await contentResponse.json()) as AdminBundle;
      setSource(contentBody.source);
      setContentJson(prettyJson(contentBody.content));
      setMarkdown(contentBody.markdown);

      const tariffBody = (await tariffsResponse.json()) as TariffBundle;
      setTariffSource(tariffBody.source);
      setTariffs(tariffBody.tariffs);

      setLoading(false);
    };

    load();
  }, [router]);

  const onSaveContent = async () => {
    setSavingContent(true);
    setErrorContent(null);
    setMessageContent(null);

    let parsedContent: SiteContent;
    try {
      parsedContent = JSON.parse(contentJson) as SiteContent;
    } catch {
      setErrorContent("content.json: невалидный JSON");
      setSavingContent(false);
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
      const body = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      setErrorContent(body?.error ?? "Ошибка сохранения");
      setSavingContent(false);
      return;
    }

    const body = (await response.json()) as AdminBundle;
    setSource(body.source);
    setContentJson(prettyJson(body.content));
    setMarkdown(body.markdown);
    setMessageContent("Контент сохранен");
    setSavingContent(false);
  };

  const onSaveTariffs = async () => {
    setSavingTariffs(true);
    setErrorTariffs(null);
    setMessageTariffs(null);

    const payload: Tariff[] = tariffs.map((tariff, tariffIndex) => ({
      ...tariff,
      sortOrder: tariffIndex,
      packages: tariff.packages.map((pkg, pkgIndex) => ({
        ...pkg,
        sortOrder: pkgIndex,
      })),
    }));

    const response = await fetch("/api/admin/tariffs", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tariffs: payload }),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      setErrorTariffs(body?.error ?? "Ошибка сохранения тарифов");
      setSavingTariffs(false);
      return;
    }

    const body = (await response.json()) as TariffBundle;
    setTariffSource(body.source);
    setTariffs(body.tariffs);
    setMessageTariffs("Тарифы сохранены");
    setSavingTariffs(false);
  };

  const onLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  };

  const onTariffDragStart = (
    event: DragEvent<HTMLElement>,
    fromIndex: number,
  ) => {
    event.dataTransfer.setData("text/plain", String(fromIndex));
    event.dataTransfer.effectAllowed = "move";
    setDraggingTariffIndex(fromIndex);
    setDropTargetTariffIndex(fromIndex);
  };

  const onTariffDragOver = (
    event: DragEvent<HTMLElement>,
    targetIndex: number,
  ) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDropTargetTariffIndex(targetIndex);
  };

  const onTariffDrop = (event: DragEvent<HTMLElement>, targetIndex: number) => {
    event.preventDefault();
    const fromRaw = event.dataTransfer.getData("text/plain");
    const fromIndex = Number(fromRaw);

    if (!Number.isInteger(fromIndex)) {
      setDraggingTariffIndex(null);
      setDropTargetTariffIndex(null);
      return;
    }

    setTariffs((current) => moveTariff(current, fromIndex, targetIndex));
    setDraggingTariffIndex(null);
    setDropTargetTariffIndex(null);
  };

  const onTariffDragEnd = () => {
    setDraggingTariffIndex(null);
    setDropTargetTariffIndex(null);
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
            Источник общего контента:{" "}
            <span className="font-medium">{source}</span>
          </p>
          <p className="text-sm text-black/70">
            Источник тарифов:{" "}
            <span className="font-medium">{tariffSource}</span>
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
            onClick={onSaveContent}
            disabled={savingContent}
            className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
          >
            {savingContent ? "Сохраняем контент..." : "Сохранить контент"}
          </button>
        </div>
      </header>

      {errorContent ? (
        <p className="rounded-lg bg-red-100 px-4 py-2 text-red-800">
          {errorContent}
        </p>
      ) : null}
      {messageContent ? (
        <p className="rounded-lg bg-emerald-100 px-4 py-2 text-emerald-800">
          {messageContent}
        </p>
      ) : null}

      <section className="rounded-2xl border border-black/15 bg-white p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-medium">Тарифы</h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() =>
                setTariffs((current) => [
                  ...current,
                  createTariff(current.length),
                ])
              }
              className="rounded-lg border border-black/20 px-4 py-2"
            >
              Добавить тариф
            </button>
            <button
              type="button"
              onClick={onSaveTariffs}
              disabled={savingTariffs}
              className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
            >
              {savingTariffs ? "Сохраняем тарифы..." : "Сохранить тарифы"}
            </button>
          </div>
        </div>

        <p className="mb-3 text-sm text-black/65">
          Перетаскивайте карточки тарифов за любой участок карточки, чтобы
          менять порядок.
        </p>

        {errorTariffs ? (
          <p className="mb-3 rounded-lg bg-red-100 px-4 py-2 text-red-800">
            {errorTariffs}
          </p>
        ) : null}
        {messageTariffs ? (
          <p className="mb-3 rounded-lg bg-emerald-100 px-4 py-2 text-emerald-800">
            {messageTariffs}
          </p>
        ) : null}

        <div className="flex flex-col gap-4">
          {tariffs.map((tariff, tariffIndex) => (
            <article
              key={tariff.id}
              onDragOver={(event) => onTariffDragOver(event, tariffIndex)}
              onDrop={(event) => onTariffDrop(event, tariffIndex)}
              onDragEnd={onTariffDragEnd}
              className={`rounded-xl border border-black/15 p-4 transition ${
                dropTargetTariffIndex === tariffIndex
                  ? "border-black/40 bg-black/[0.03]"
                  : ""
              } ${draggingTariffIndex === tariffIndex ? "opacity-70" : ""}`}
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    draggable
                    onDragStart={(event) =>
                      onTariffDragStart(event, tariffIndex)
                    }
                    onDragEnd={onTariffDragEnd}
                    className="cursor-grab rounded-md border border-black/20 p-2 text-xs text-black/65 transition hover:bg-black/5 active:cursor-grabbing"
                    title="Перетащить тариф"
                    aria-label="Перетащить тариф"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                    >
                      <circle cx="4" cy="3" r="1" fill="currentColor" />
                      <circle cx="10" cy="3" r="1" fill="currentColor" />
                      <circle cx="4" cy="7" r="1" fill="currentColor" />
                      <circle cx="10" cy="7" r="1" fill="currentColor" />
                      <circle cx="4" cy="11" r="1" fill="currentColor" />
                      <circle cx="10" cy="11" r="1" fill="currentColor" />
                    </svg>
                  </button>
                  <h3 className="text-base font-medium">
                    Тариф #{tariffIndex + 1}
                  </h3>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={tariffIndex === 0}
                    onClick={() =>
                      setTariffs((current) =>
                        moveTariff(current, tariffIndex, tariffIndex - 1),
                      )
                    }
                    className="rounded-md border border-black/20 px-3 py-1 text-sm disabled:opacity-40"
                  >
                    Выше
                  </button>
                  <button
                    type="button"
                    disabled={tariffIndex === tariffs.length - 1}
                    onClick={() =>
                      setTariffs((current) =>
                        moveTariff(current, tariffIndex, tariffIndex + 1),
                      )
                    }
                    className="rounded-md border border-black/20 px-3 py-1 text-sm disabled:opacity-40"
                  >
                    Ниже
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setTariffs((current) =>
                        current.filter((_, index) => index !== tariffIndex),
                      )
                    }
                    className="rounded-md border border-red-300 px-3 py-1 text-sm text-red-700"
                  >
                    Удалить тариф
                  </button>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <input
                  value={tariff.title}
                  onChange={(event) =>
                    setTariffs((current) =>
                      current.map((item, index) =>
                        index === tariffIndex
                          ? { ...item, title: event.target.value }
                          : item,
                      ),
                    )
                  }
                  placeholder="Название тарифа"
                  className="rounded-lg border border-black/20 px-3 py-2"
                />
                <input
                  value={tariff.slug}
                  onChange={(event) =>
                    setTariffs((current) =>
                      current.map((item, index) =>
                        index === tariffIndex
                          ? { ...item, slug: event.target.value }
                          : item,
                      ),
                    )
                  }
                  placeholder="slug"
                  className="rounded-lg border border-black/20 px-3 py-2"
                />
              </div>

              <label className="mt-3 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={tariff.isActive}
                  onChange={(event) =>
                    setTariffs((current) =>
                      current.map((item, index) =>
                        index === tariffIndex
                          ? { ...item, isActive: event.target.checked }
                          : item,
                      ),
                    )
                  }
                />
                Показывать на сайте
              </label>

              <textarea
                value={tariff.descriptionMarkdown}
                onChange={(event) =>
                  setTariffs((current) =>
                    current.map((item, index) =>
                      index === tariffIndex
                        ? { ...item, descriptionMarkdown: event.target.value }
                        : item,
                    ),
                  )
                }
                placeholder="Описание тарифа в Markdown"
                className="mt-3 h-40 w-full rounded-lg border border-black/20 p-3 font-mono text-sm"
              />

              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="font-medium">Пакеты</h4>
                  <button
                    type="button"
                    onClick={() =>
                      setTariffs((current) =>
                        current.map((item, index) =>
                          index === tariffIndex
                            ? {
                                ...item,
                                packages: [
                                  ...item.packages,
                                  createPackage(item.packages.length),
                                ],
                              }
                            : item,
                        ),
                      )
                    }
                    className="rounded-md border border-black/20 px-3 py-1 text-sm"
                  >
                    Добавить пакет
                  </button>
                </div>

                <div className="flex flex-col gap-3">
                  {tariff.packages.map((pkg, pkgIndex) => (
                    <div
                      key={pkg.id}
                      className="rounded-lg border border-black/15 p-3"
                    >
                      <div className="mb-2 flex justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            setTariffs((current) =>
                              current.map((item, index) =>
                                index === tariffIndex
                                  ? {
                                      ...item,
                                      packages: item.packages.filter(
                                        (_, packageIndex) =>
                                          packageIndex !== pkgIndex,
                                      ),
                                    }
                                  : item,
                              ),
                            )
                          }
                          className="rounded-md border border-red-300 px-3 py-1 text-sm text-red-700"
                        >
                          Удалить пакет
                        </button>
                      </div>

                      <div className="grid gap-2 md:grid-cols-4">
                        <input
                          value={pkg.title}
                          onChange={(event) =>
                            setTariffs((current) =>
                              current.map((item, index) =>
                                index === tariffIndex
                                  ? {
                                      ...item,
                                      packages: item.packages.map(
                                        (packageItem, packageIndex) =>
                                          packageIndex === pkgIndex
                                            ? {
                                                ...packageItem,
                                                title: event.target.value,
                                              }
                                            : packageItem,
                                      ),
                                    }
                                  : item,
                              ),
                            )
                          }
                          placeholder="Название пакета"
                          className="rounded-md border border-black/20 px-3 py-2"
                        />
                        <input
                          type="number"
                          min={0}
                          value={pkg.regularAmount}
                          onChange={(event) =>
                            setTariffs((current) =>
                              current.map((item, index) =>
                                index === tariffIndex
                                  ? {
                                      ...item,
                                      packages: item.packages.map(
                                        (packageItem, packageIndex) =>
                                          packageIndex === pkgIndex
                                            ? {
                                                ...packageItem,
                                                regularAmount: Number(
                                                  event.target.value,
                                                ),
                                              }
                                            : packageItem,
                                      ),
                                    }
                                  : item,
                              ),
                            )
                          }
                          placeholder="Обычная цена"
                          className="rounded-md border border-black/20 px-3 py-2"
                        />
                        <input
                          type="number"
                          min={0}
                          value={pkg.discountedAmount ?? ""}
                          onChange={(event) =>
                            setTariffs((current) =>
                              current.map((item, index) =>
                                index === tariffIndex
                                  ? {
                                      ...item,
                                      packages: item.packages.map(
                                        (packageItem, packageIndex) =>
                                          packageIndex === pkgIndex
                                            ? {
                                                ...packageItem,
                                                discountedAmount:
                                                  event.target.value === ""
                                                    ? null
                                                    : Number(
                                                        event.target.value,
                                                      ),
                                              }
                                            : packageItem,
                                      ),
                                    }
                                  : item,
                              ),
                            )
                          }
                          placeholder="Цена со скидкой"
                          className="rounded-md border border-black/20 px-3 py-2"
                        />
                        <input
                          value={pkg.currency}
                          onChange={(event) =>
                            setTariffs((current) =>
                              current.map((item, index) =>
                                index === tariffIndex
                                  ? {
                                      ...item,
                                      packages: item.packages.map(
                                        (packageItem, packageIndex) =>
                                          packageIndex === pkgIndex
                                            ? {
                                                ...packageItem,
                                                currency: event.target.value,
                                              }
                                            : packageItem,
                                      ),
                                    }
                                  : item,
                              ),
                            )
                          }
                          placeholder="Валюта"
                          className="rounded-md border border-black/20 px-3 py-2"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-black/15 bg-white p-4">
        <h2 className="mb-2 text-lg font-medium">
          Остальной контент: content.json
        </h2>
        <textarea
          value={contentJson}
          onChange={(event) => setContentJson(event.target.value)}
          className="h-96 w-full rounded-xl border border-black/20 p-3 font-mono text-sm outline-none focus:border-black"
          spellCheck={false}
        />
      </section>

      <section className="rounded-2xl border border-black/15 bg-white p-4">
        <h2 className="mb-3 text-lg font-medium">
          Markdown файлы (кроме тарифов)
        </h2>
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
