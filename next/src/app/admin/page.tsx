"use client";

import type { SiteContent } from "@/lib/contentStore";
import type { Tariff, TariffPackage } from "@/lib/tariffStore";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useState,
  type DragEvent,
  type ReactNode,
} from "react";
import { parseMarkdown } from "@/utils/markdownParser";

type AdminBundle = {
  content: SiteContent;
  markdown: Record<string, string>;
  source: "local" | "supabase";
};

type TariffBundle = {
  tariffs: Tariff[];
  source: "local" | "supabase";
};

type SectionKey = "tariffs" | "main" | "links" | "markdown";

const MARKDOWN_LABELS: Record<string, string> = {
  "profile.md": "Профиль: основной текст",
  "blog.md": "Блог: вводный текст",
};

const SECTION_TITLES: Record<SectionKey, string> = {
  tariffs: "Тарифы",
  main: "Основные данные сайта",
  links: "Ссылки и подписи",
  markdown: "Тексты",
};

const INITIAL_COLLAPSED_SECTIONS: Record<SectionKey, boolean> = {
  tariffs: false,
  main: false,
  links: false,
  markdown: false,
};

type AdminSectionProps = {
  title: string;
  collapsed: boolean;
  compactMode: boolean;
  onToggle: () => void;
  actions?: ReactNode;
  children: ReactNode;
};

function AdminSection({
  title,
  collapsed,
  compactMode,
  onToggle,
  actions,
  children,
}: AdminSectionProps) {
  return (
    <section className="rounded-2xl border border-black/15 bg-white p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={onToggle}
          className="inline-flex items-center gap-2 text-left"
          aria-expanded={!collapsed}
        >
          <span className="text-lg font-medium">{title}</span>
          <span className="text-xs text-black/55">{collapsed ? "▸" : "▾"}</span>
        </button>
        <div className="flex items-center gap-2">{actions}</div>
      </div>

      {!collapsed ? (
        <div className={compactMode ? "space-y-3" : "space-y-4"}>
          {children}
        </div>
      ) : null}
    </section>
  );
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

function cloneContent(content: SiteContent): SiteContent {
  return JSON.parse(JSON.stringify(content)) as SiteContent;
}

function cloneMarkdown(
  markdown: Record<string, string>,
): Record<string, string> {
  return { ...markdown };
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function validateContentUrls(content: SiteContent): string[] {
  const candidates = [
    {
      field: "telegramLink",
      value: content.telegramLink,
      label: "Ссылка Telegram",
    },
    {
      field: "vkMessengerLink",
      value: content.vkMessengerLink,
      label: "Ссылка VK мессенджер",
    },
    { field: "b17Link", value: content.b17Link, label: "Ссылка B17" },
    { field: "blogLink", value: content.blogLink, label: "Ссылка блога" },
    {
      field: "instagramLink",
      value: content.instagramLink,
      label: "Ссылка Instagram",
    },
  ];

  const errors: string[] = [];
  for (const candidate of candidates) {
    if (!candidate.value?.trim()) {
      errors.push(`${candidate.label}: поле не должно быть пустым`);
      continue;
    }

    if (!isHttpUrl(candidate.value)) {
      errors.push(
        `${candidate.label}: укажите полный URL, например https://...`,
      );
    }
  }

  return errors;
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

  const [contentData, setContentData] = useState<SiteContent | null>(null);
  const [markdown, setMarkdown] = useState<Record<string, string>>({});
  const [initialContentData, setInitialContentData] =
    useState<SiteContent | null>(null);
  const [initialMarkdown, setInitialMarkdown] = useState<
    Record<string, string>
  >({});
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [draggingTariffIndex, setDraggingTariffIndex] = useState<number | null>(
    null,
  );
  const [dropTargetTariffIndex, setDropTargetTariffIndex] = useState<
    number | null
  >(null);
  const [compactMode, setCompactMode] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<
    Record<SectionKey, boolean>
  >(INITIAL_COLLAPSED_SECTIONS);

  const markdownKeys = useMemo(
    () =>
      Object.keys(markdown)
        .filter((key) => !key.startsWith("pricelist/"))
        .sort(),
    [markdown],
  );

  const isContentDirty = useMemo(() => {
    if (!contentData || !initialContentData) {
      return false;
    }

    return (
      JSON.stringify(contentData) !== JSON.stringify(initialContentData) ||
      JSON.stringify(markdown) !== JSON.stringify(initialMarkdown)
    );
  }, [contentData, initialContentData, markdown, initialMarkdown]);

  const allSectionsCollapsed = useMemo(
    () => Object.values(collapsedSections).every(Boolean),
    [collapsedSections],
  );

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
      const nextContent = cloneContent(contentBody.content);
      const nextMarkdown = cloneMarkdown(contentBody.markdown);
      setContentData(nextContent);
      setMarkdown(nextMarkdown);
      setInitialContentData(cloneContent(nextContent));
      setInitialMarkdown(cloneMarkdown(nextMarkdown));

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

    if (!contentData) {
      setErrorContent("Контент еще не загружен");
      setSavingContent(false);
      return;
    }

    const urlErrors = validateContentUrls(contentData);
    if (urlErrors.length > 0) {
      setErrorContent(urlErrors.join(" | "));
      setSavingContent(false);
      return;
    }

    const response = await fetch("/api/admin/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: contentData,
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
    const nextContent = cloneContent(body.content);
    const nextMarkdown = cloneMarkdown(body.markdown);
    setContentData(nextContent);
    setMarkdown(nextMarkdown);
    setInitialContentData(cloneContent(nextContent));
    setInitialMarkdown(cloneMarkdown(nextMarkdown));
    setMessageContent("Контент сохранен");
    setSavingContent(false);
  };

  const onResetContent = () => {
    if (!initialContentData) {
      return;
    }

    setContentData(cloneContent(initialContentData));
    setMarkdown(cloneMarkdown(initialMarkdown));
    setErrorContent(null);
    setMessageContent("Изменения сброшены к последнему сохранению");
  };

  const updateContentField = <K extends keyof SiteContent>(
    key: K,
    value: SiteContent[K],
  ) => {
    setContentData((current) =>
      current ? { ...current, [key]: value } : current,
    );
  };

  const updateInfoField = (key: keyof SiteContent["info"], value: string) => {
    setContentData((current) =>
      current
        ? {
            ...current,
            info: {
              ...current.info,
              [key]: value,
            },
          }
        : current,
    );
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

  const onToggleCompactMode = () => {
    setCompactMode((current) => {
      if (!current) {
        setCollapsedSections({
          tariffs: false,
          main: true,
          links: true,
          markdown: true,
        });
      } else {
        setCollapsedSections(INITIAL_COLLAPSED_SECTIONS);
      }

      return !current;
    });
  };

  const toggleSection = (section: SectionKey) => {
    setCollapsedSections((current) => ({
      ...current,
      [section]: !current[section],
    }));
  };

  const setAllSectionsCollapsed = (collapsed: boolean) => {
    setCollapsedSections({
      tariffs: collapsed,
      main: collapsed,
      links: collapsed,
      markdown: collapsed,
    });
  };

  if (loading) {
    return <main className="p-6">Загрузка админки...</main>;
  }

  if (!contentData) {
    return (
      <main className="p-6">Не удалось инициализировать данные контента.</main>
    );
  }

  return (
    <main
      className={`mx-auto flex w-full max-w-6xl flex-col px-4 py-6 ${
        compactMode ? "gap-3" : "gap-4"
      }`}
    >
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
            onClick={onToggleCompactMode}
            className="rounded-lg border border-black/20 px-4 py-2"
          >
            {compactMode ? "Обычный режим" : "Компактный режим"}
          </button>
          {compactMode ? (
            <button
              type="button"
              onClick={() => setAllSectionsCollapsed(!allSectionsCollapsed)}
              className="rounded-lg border border-black/20 px-4 py-2"
            >
              {allSectionsCollapsed ? "Развернуть все" : "Свернуть все"}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onLogout}
            className="rounded-lg border border-black/20 px-4 py-2"
          >
            Выйти
          </button>
          <button
            type="button"
            onClick={onResetContent}
            disabled={!isContentDirty || savingContent}
            className="rounded-lg border border-black/20 px-4 py-2 disabled:opacity-50"
          >
            Сбросить изменения
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

      <AdminSection
        title={SECTION_TITLES.tariffs}
        collapsed={collapsedSections.tariffs}
        compactMode={compactMode}
        onToggle={() => toggleSection("tariffs")}
        actions={
          <>
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
          </>
        }
      >
        <p className="mb-3 text-sm text-black/65">
          Перетаскивайте карточки тарифов только за иконку-хваталку в заголовке.
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
              className={`rounded-xl border border-black/15 ${
                compactMode ? "p-3" : "p-4"
              } transition ${
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
                className={`mt-3 w-full rounded-lg border border-black/20 p-3 font-mono text-sm ${
                  compactMode ? "h-32" : "h-40"
                }`}
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
      </AdminSection>

      <AdminSection
        title={SECTION_TITLES.main}
        collapsed={collapsedSections.main}
        compactMode={compactMode}
        onToggle={() => toggleSection("main")}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-sm text-black/70">Имя</span>
            <input
              value={contentData.fullName}
              onChange={(event) =>
                updateContentField("fullName", event.target.value)
              }
              className="rounded-lg border border-black/20 px-3 py-2"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm text-black/70">Подзаголовок профиля</span>
            <input
              value={contentData.info.title}
              onChange={(event) => updateInfoField("title", event.target.value)}
              className="rounded-lg border border-black/20 px-3 py-2"
            />
          </label>

          <label className="flex flex-col gap-1 md:col-span-2">
            <span className="text-sm text-black/70">
              Короткое описание профессии
            </span>
            <input
              value={contentData.professionDescription}
              onChange={(event) =>
                updateContentField("professionDescription", event.target.value)
              }
              className="rounded-lg border border-black/20 px-3 py-2"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm text-black/70">
              Заголовок блока тарифов
            </span>
            <input
              value={contentData.priceHeader}
              onChange={(event) =>
                updateContentField("priceHeader", event.target.value)
              }
              className="rounded-lg border border-black/20 px-3 py-2"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm text-black/70">Текст загрузки</span>
            <input
              value={contentData.loading}
              onChange={(event) =>
                updateContentField("loading", event.target.value)
              }
              className="rounded-lg border border-black/20 px-3 py-2"
            />
          </label>
        </div>
      </AdminSection>

      <AdminSection
        title={SECTION_TITLES.links}
        collapsed={collapsedSections.links}
        compactMode={compactMode}
        onToggle={() => toggleSection("links")}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-sm text-black/70">Ссылка Telegram</span>
            <input
              value={contentData.telegramLink}
              onChange={(event) =>
                updateContentField("telegramLink", event.target.value)
              }
              className="rounded-lg border border-black/20 px-3 py-2"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm text-black/70">Ссылка VK мессенджер</span>
            <input
              value={contentData.vkMessengerLink}
              onChange={(event) =>
                updateContentField("vkMessengerLink", event.target.value)
              }
              className="rounded-lg border border-black/20 px-3 py-2"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm text-black/70">Ссылка B17</span>
            <input
              value={contentData.b17Link}
              onChange={(event) =>
                updateContentField("b17Link", event.target.value)
              }
              className="rounded-lg border border-black/20 px-3 py-2"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm text-black/70">Ссылка блога</span>
            <input
              value={contentData.blogLink}
              onChange={(event) =>
                updateContentField("blogLink", event.target.value)
              }
              className="rounded-lg border border-black/20 px-3 py-2"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm text-black/70">Кнопка записи</span>
            <input
              value={contentData.bookConsultation}
              onChange={(event) =>
                updateContentField("bookConsultation", event.target.value)
              }
              className="rounded-lg border border-black/20 px-3 py-2"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm text-black/70">Текст ссылки на блог</span>
            <input
              value={contentData.blog}
              onChange={(event) =>
                updateContentField("blog", event.target.value)
              }
              className="rounded-lg border border-black/20 px-3 py-2"
            />
          </label>
        </div>
      </AdminSection>

      <AdminSection
        title={SECTION_TITLES.markdown}
        collapsed={collapsedSections.markdown}
        compactMode={compactMode}
        onToggle={() => toggleSection("markdown")}
      >
        <div className="flex flex-col gap-4">
          {markdownKeys.map((key) => (
            <div key={key} className="rounded-xl border border-black/15 p-3">
              <label className="mb-2 block text-sm font-medium">
                {MARKDOWN_LABELS[key] ?? `/${key}`}
              </label>
              <div className="grid gap-3 lg:grid-cols-2">
                <textarea
                  value={markdown[key]}
                  onChange={(event) =>
                    setMarkdown((current) => ({
                      ...current,
                      [key]: event.target.value,
                    }))
                  }
                  className={`w-full rounded-lg border border-black/20 p-3 font-mono text-sm outline-none focus:border-black ${
                    compactMode ? "h-44" : "h-60"
                  }`}
                  spellCheck={false}
                />
                <div
                  className={`markdown content-markdown overflow-auto rounded-lg border border-black/15 bg-black/[0.02] p-3 ${
                    compactMode ? "h-44" : "h-60"
                  }`}
                >
                  {markdown[key]?.trim() ? (
                    parseMarkdown(markdown[key])
                  ) : (
                    <p className="text-sm text-black/55">
                      Предпросмотр появится после ввода текста.
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </AdminSection>
    </main>
  );
}
