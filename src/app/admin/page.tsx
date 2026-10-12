"use client";

import type { SiteContent } from "@/lib/contentStore";
import type { Tariff, TariffPackage } from "@/lib/tariffStore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
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

type UploadKind = "profile" | "og";

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

const buttonBaseClass =
  "cursor-pointer rounded-xl border px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";
const secondaryButtonClass = `${buttonBaseClass} border-platinum/35 bg-black/20 text-platinum hover:bg-black/30`;
const primaryButtonClass = `${buttonBaseClass} border-gold/45 bg-dusty-grape text-platinum hover:bg-dusty-grape/90`;
const dangerButtonClass = `${buttonBaseClass} border-red-300/55 bg-red-900/35 text-red-100 hover:bg-red-900/50`;
const headerButtonBaseClass =
  "cursor-pointer shrink-0 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";
const headerSecondaryButtonClass = `${headerButtonBaseClass} border-platinum/35 bg-black/20 text-platinum hover:bg-black/30`;
const headerPrimaryButtonClass = `${headerButtonBaseClass} border-gold/45 bg-dusty-grape text-platinum hover:bg-dusty-grape/90`;
const subtleButtonClass =
  "cursor-pointer rounded-lg border border-platinum/25 bg-black/15 px-3 py-1.5 text-xs font-medium text-platinum/90 transition hover:bg-black/25 disabled:cursor-not-allowed disabled:opacity-45";
const subtleDangerButtonClass =
  "cursor-pointer rounded-lg border border-red-300/45 bg-red-900/25 px-3 py-1.5 text-xs font-medium text-red-100 transition hover:bg-red-900/40 disabled:cursor-not-allowed disabled:opacity-45";
const inputClass =
  "rounded-lg border border-platinum/35 bg-soft-linnen/95 px-3 py-2 text-black outline-none transition focus:border-gold";
const textareaClass =
  "w-full rounded-lg border border-platinum/35 bg-soft-linnen/95 p-3 font-mono text-sm text-black outline-none transition focus:border-gold";
const STATUS_MESSAGE_TIMEOUT_MS = 4000;

type AdminSectionProps = {
  title: string;
  collapsed: boolean;
  onToggle: () => void;
  actions?: ReactNode;
  children: ReactNode;
};

function AdminSection({
  title,
  collapsed,
  onToggle,
  actions,
  children,
}: AdminSectionProps) {
  return (
    <section className="shadow-effect shadow-effect-offset mt-2">
      <div className="backdrop-glass backdrop-glass-offset text-platinum rounded-2xl p-5 md:rounded-3xl md:p-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={onToggle}
            className="inline-flex cursor-pointer items-center gap-2 text-left"
            aria-expanded={!collapsed}
          >
            <span className="text-lg font-medium">{title}</span>
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className={`text-platinum/75 transition-transform duration-500 ease-in-out ${
                collapsed ? "rotate-0" : "rotate-180"
              }`}
              aria-hidden="true"
            >
              <path
                d="M5 7.5L10 12.5L15 7.5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <div className="flex items-center gap-2">{actions}</div>
        </div>

        <div
          className={`grid transition-all duration-500 ease-in-out ${
            collapsed
              ? "grid-rows-[0fr] opacity-0"
              : "grid-rows-[1fr] opacity-100"
          }`}
        >
          <div className="overflow-hidden">
            <div className="space-y-2 pt-0.5 md:space-y-4 md:pt-1">
              {children}
            </div>
          </div>
        </div>
      </div>
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

function movePackage(
  items: TariffPackage[],
  fromIndex: number,
  toIndex: number,
): TariffPackage[] {
  if (toIndex < 0 || toIndex >= items.length || fromIndex === toIndex) {
    return items;
  }

  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "e",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "h",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "sch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
};

function normalizeSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function transliterate(value: string): string {
  return value
    .toLowerCase()
    .split("")
    .map((char) => CYRILLIC_TO_LATIN[char] ?? char)
    .join("");
}

function makeSlugFromTitle(title: string): string {
  return normalizeSlug(transliterate(title));
}

function makeUniqueSlug(base: string, used: Set<string>): string {
  const fallback = base || "tariff";
  let candidate = fallback;
  let suffix = 2;

  while (used.has(candidate)) {
    candidate = `${fallback}-${suffix}`;
    suffix += 1;
  }

  used.add(candidate);
  return candidate;
}

function validateTariffSlugs(items: Tariff[]): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();

  for (const [index, tariff] of items.entries()) {
    const slug = normalizeSlug(tariff.slug ?? "");
    const row = index + 1;

    if (!slug) {
      errors.push(`Тариф #${row}: slug не должен быть пустым`);
      continue;
    }

    if (!/^[a-z0-9-]+$/.test(slug)) {
      errors.push(
        `Тариф #${row}: slug может содержать только a-z, 0-9 и дефис`,
      );
      continue;
    }

    if (seen.has(slug)) {
      errors.push(`Тариф #${row}: slug \"${slug}\" уже используется`);
      continue;
    }

    seen.add(slug);
  }

  return errors;
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
  const [draggingPackage, setDraggingPackage] = useState<{
    tariffIndex: number;
    packageIndex: number;
  } | null>(null);
  const [dropTargetPackage, setDropTargetPackage] = useState<{
    tariffIndex: number;
    packageIndex: number;
  } | null>(null);
  const [uploadingImageKind, setUploadingImageKind] =
    useState<UploadKind | null>(null);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [ogImageFile, setOgImageFile] = useState<File | null>(null);
  const [profilePreviewUrl, setProfilePreviewUrl] = useState<string | null>(
    null,
  );
  const [ogPreviewUrl, setOgPreviewUrl] = useState<string | null>(null);
  const [mobileActionsOpen, setMobileActionsOpen] = useState(false);
  const mobileActionsRef = useRef<HTMLDivElement | null>(null);
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
    if (!messageContent) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setMessageContent(null);
    }, STATUS_MESSAGE_TIMEOUT_MS);

    return () => window.clearTimeout(timeoutId);
  }, [messageContent]);

  useEffect(() => {
    if (!messageTariffs) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setMessageTariffs(null);
    }, STATUS_MESSAGE_TIMEOUT_MS);

    return () => window.clearTimeout(timeoutId);
  }, [messageTariffs]);

  useEffect(() => {
    if (!errorContent) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setErrorContent(null);
    }, STATUS_MESSAGE_TIMEOUT_MS);

    return () => window.clearTimeout(timeoutId);
  }, [errorContent]);

  useEffect(() => {
    if (!errorTariffs) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setErrorTariffs(null);
    }, STATUS_MESSAGE_TIMEOUT_MS);

    return () => window.clearTimeout(timeoutId);
  }, [errorTariffs]);

  useEffect(() => {
    if (!profileImageFile) {
      setProfilePreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(profileImageFile);
    setProfilePreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [profileImageFile]);

  useEffect(() => {
    if (!ogImageFile) {
      setOgPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(ogImageFile);
    setOgPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [ogImageFile]);

  useEffect(() => {
    if (!mobileActionsOpen) {
      return;
    }

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target || mobileActionsRef.current?.contains(target)) {
        return;
      }

      setMobileActionsOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileActionsOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileActionsOpen]);

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

    const usedSlugs = new Set<string>();
    const normalizedTariffs: Tariff[] = tariffs.map((tariff) => {
      const normalizedInputSlug = normalizeSlug(
        transliterate(tariff.slug ?? ""),
      );
      const generatedBaseSlug = makeSlugFromTitle(tariff.title || "");
      const slug = makeUniqueSlug(
        normalizedInputSlug || generatedBaseSlug,
        usedSlugs,
      );
      return { ...tariff, slug };
    });

    const slugErrors = validateTariffSlugs(normalizedTariffs);
    if (slugErrors.length > 0) {
      setErrorTariffs(slugErrors.join(" | "));
      setSavingTariffs(false);
      return;
    }

    setTariffs(normalizedTariffs);

    const payload: Tariff[] = normalizedTariffs.map((tariff, tariffIndex) => ({
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

  const onUploadImage = async (kind: UploadKind) => {
    const file = kind === "profile" ? profileImageFile : ogImageFile;

    if (!file) {
      setErrorContent("Сначала выберите изображение для загрузки");
      return;
    }

    setUploadingImageKind(kind);
    setErrorContent(null);
    setMessageContent(null);

    const formData = new FormData();
    formData.set("kind", kind);
    formData.set("file", file);

    const response = await fetch("/api/admin/image", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      setErrorContent(body?.error ?? "Ошибка загрузки изображения");
      setUploadingImageKind(null);
      return;
    }

    const body = (await response.json()) as AdminBundle;
    const nextContent = cloneContent(body.content);
    const nextMarkdown = cloneMarkdown(body.markdown);

    setSource(body.source);
    setContentData(nextContent);
    setMarkdown(nextMarkdown);
    setInitialContentData(cloneContent(nextContent));
    setInitialMarkdown(cloneMarkdown(nextMarkdown));
    setMessageContent(
      kind === "profile"
        ? "Фото профиля успешно загружено"
        : "OG-изображение успешно загружено",
    );

    if (kind === "profile") {
      setProfileImageFile(null);
    } else {
      setOgImageFile(null);
    }

    setUploadingImageKind(null);
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

  const onPackageDragStart = (
    event: DragEvent<HTMLElement>,
    tariffIndex: number,
    packageIndex: number,
  ) => {
    event.dataTransfer.setData(
      "text/plain",
      JSON.stringify({ tariffIndex, packageIndex }),
    );
    event.dataTransfer.effectAllowed = "move";
    const state = { tariffIndex, packageIndex };
    setDraggingPackage(state);
    setDropTargetPackage(state);
  };

  const onPackageDragOver = (
    event: DragEvent<HTMLElement>,
    tariffIndex: number,
    packageIndex: number,
  ) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";

    if (draggingPackage && draggingPackage.tariffIndex !== tariffIndex) {
      return;
    }

    setDropTargetPackage({ tariffIndex, packageIndex });
  };

  const onPackageDrop = (
    event: DragEvent<HTMLElement>,
    tariffIndex: number,
    targetPackageIndex: number,
  ) => {
    event.preventDefault();

    const data = event.dataTransfer.getData("text/plain");
    let parsed: { tariffIndex: number; packageIndex: number } | null = null;

    try {
      parsed = JSON.parse(data) as {
        tariffIndex: number;
        packageIndex: number;
      };
    } catch {
      parsed = null;
    }

    if (
      !parsed ||
      !Number.isInteger(parsed.tariffIndex) ||
      !Number.isInteger(parsed.packageIndex) ||
      parsed.tariffIndex !== tariffIndex
    ) {
      setDraggingPackage(null);
      setDropTargetPackage(null);
      return;
    }

    setTariffs((current) =>
      current.map((item, index) =>
        index === tariffIndex
          ? {
              ...item,
              packages: movePackage(
                item.packages,
                parsed.packageIndex,
                targetPackageIndex,
              ),
            }
          : item,
      ),
    );

    setDraggingPackage(null);
    setDropTargetPackage(null);
  };

  const onPackageDragEnd = () => {
    setDraggingPackage(null);
    setDropTargetPackage(null);
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
    return (
      <main className="bg-platinum font-primary min-h-dvh p-6 text-black">
        Загрузка админки...
      </main>
    );
  }

  if (!contentData) {
    return (
      <main className="bg-platinum font-primary min-h-dvh p-6 text-black">
        Не удалось инициализировать данные контента.
      </main>
    );
  }

  return (
    <main className="bg-platinum font-primary mx-auto flex min-h-dvh w-full max-w-6xl flex-col gap-2 px-2 py-3 md:gap-4 md:px-4 md:py-6">
      <header className="bg-soft-linnen/90 relative z-40 rounded-2xl border border-black/10 p-2 backdrop-blur-md md:p-3">
        <div className="flex flex-col gap-2">
          <div>
            <h1 className="text-lg leading-tight font-semibold text-black md:text-2xl">
              Админка
            </h1>
            <p className="hidden text-sm text-black/80 md:block">
              Источник общего контента:{" "}
              <span className="font-medium">{source}</span>
            </p>
            <p className="hidden text-sm text-black/80 md:block">
              Источник тарифов:{" "}
              <span className="font-medium">{tariffSource}</span>
            </p>
            <Link
              href="/admin/tests"
              className="mt-2 inline-flex rounded-lg border border-black/15 px-3 py-2 text-sm font-medium text-black hover:bg-black/5"
            >
              Открыть раздел тестов
            </Link>

            <details className="mt-1 md:hidden">
              <summary className="cursor-pointer text-xs text-black/70">
                Показать источники данных
              </summary>
              <div className="mt-1 space-y-0.5 text-xs text-black/70">
                <p>
                  Источник общего контента:{" "}
                  <span className="font-medium">{source}</span>
                </p>
                <p>
                  Источник тарифов:{" "}
                  <span className="font-medium">{tariffSource}</span>
                </p>
              </div>
            </details>
          </div>

          <div className="relative z-50 flex items-center gap-1.5 md:hidden">
            <button
              type="button"
              onClick={onSaveContent}
              disabled={savingContent}
              className={`${headerPrimaryButtonClass} inline-flex flex-1 items-center justify-center`}
            >
              <span className="mr-1.5 text-xs">✓</span>
              {savingContent ? "Сохраняем..." : "Сохранить"}
            </button>

            <div ref={mobileActionsRef} className="relative">
              <button
                type="button"
                onClick={() => setMobileActionsOpen((current) => !current)}
                className={`${headerSecondaryButtonClass} inline-flex items-center`}
                aria-expanded={mobileActionsOpen}
                aria-haspopup="menu"
              >
                <span className="mr-1.5 text-xs">⋯</span>
                Действия
              </button>
              {mobileActionsOpen ? (
                <div className="bg-soft-linnen absolute top-full right-0 z-[70] mt-1 w-56 rounded-xl border border-black/10 p-1.5 shadow-lg">
                  <button
                    type="button"
                    onClick={() => {
                      setAllSectionsCollapsed(!allSectionsCollapsed);
                      setMobileActionsOpen(false);
                    }}
                    className="flex w-full cursor-pointer items-center rounded-lg px-2 py-1.5 text-left text-xs text-black transition hover:bg-black/10"
                  >
                    <span className="mr-1.5 text-xs">▾</span>
                    {allSectionsCollapsed ? "Развернуть все" : "Свернуть все"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onResetContent();
                      setMobileActionsOpen(false);
                    }}
                    disabled={!isContentDirty || savingContent}
                    className="flex w-full cursor-pointer items-center rounded-lg px-2 py-1.5 text-left text-xs text-black transition hover:bg-black/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="mr-1.5 text-xs">↺</span>
                    Сбросить изменения
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileActionsOpen(false);
                      onLogout();
                    }}
                    className="flex w-full cursor-pointer items-center rounded-lg px-2 py-1.5 text-left text-xs text-black transition hover:bg-black/10"
                  >
                    <span className="mr-1.5 text-xs">⎋</span>
                    Выйти
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          <div className="bg-soft-linnen/95 hidden rounded-xl border border-black/10 px-1.5 py-1.5 md:sticky md:top-2 md:z-40 md:flex md:flex-wrap md:gap-2">
            <button
              type="button"
              onClick={() => setAllSectionsCollapsed(!allSectionsCollapsed)}
              className={headerSecondaryButtonClass}
            >
              <span className="mr-1.5 text-xs">▾</span>
              {allSectionsCollapsed ? "Развернуть все" : "Свернуть все"}
            </button>
            <button
              type="button"
              onClick={onLogout}
              className={headerSecondaryButtonClass}
            >
              <span className="mr-1.5 text-xs">⎋</span>
              Выйти
            </button>
            <button
              type="button"
              onClick={onResetContent}
              disabled={!isContentDirty || savingContent}
              className={headerSecondaryButtonClass}
            >
              <span className="mr-1.5 text-xs">↺</span>
              Сбросить изменения
            </button>
            <button
              type="button"
              onClick={onSaveContent}
              disabled={savingContent}
              className={headerPrimaryButtonClass}
            >
              <span className="mr-1.5 text-xs">✓</span>
              {savingContent ? "Сохраняем контент..." : "Сохранить контент"}
            </button>
          </div>
        </div>
      </header>

      <div className="pointer-events-none fixed inset-x-0 top-3 z-50 flex justify-center px-2 md:top-4">
        <div className="flex w-full max-w-xl flex-col gap-2">
          {errorContent ? (
            <p className="pointer-events-auto rounded-xl border border-red-300/50 bg-red-900/85 px-3 py-2 text-sm text-red-100 shadow-lg">
              {errorContent}
            </p>
          ) : null}
          {messageContent ? (
            <p className="border-gold/60 bg-gold/90 pointer-events-auto rounded-xl border px-3 py-2 text-sm text-black shadow-lg">
              {messageContent}
            </p>
          ) : null}
          {errorTariffs ? (
            <p className="pointer-events-auto rounded-xl border border-red-300/50 bg-red-900/85 px-3 py-2 text-sm text-red-100 shadow-lg">
              {errorTariffs}
            </p>
          ) : null}
          {messageTariffs ? (
            <p className="border-gold/60 bg-gold/90 pointer-events-auto rounded-xl border px-3 py-2 text-sm text-black shadow-lg">
              {messageTariffs}
            </p>
          ) : null}
        </div>
      </div>

      <AdminSection
        title={SECTION_TITLES.tariffs}
        collapsed={collapsedSections.tariffs}
        onToggle={() => toggleSection("tariffs")}
        actions={
          collapsedSections.tariffs ? null : (
            <>
              <button
                type="button"
                onClick={() =>
                  setTariffs((current) => [
                    ...current,
                    createTariff(current.length),
                  ])
                }
                className={secondaryButtonClass}
              >
                Добавить тариф
              </button>
              <button
                type="button"
                onClick={onSaveTariffs}
                disabled={savingTariffs}
                className={primaryButtonClass}
              >
                {savingTariffs ? "Сохраняем тарифы..." : "Сохранить тарифы"}
              </button>
            </>
          )
        }
      >
        <div className="flex flex-col gap-3 md:gap-4">
          {tariffs.map((tariff, tariffIndex) => (
            <article
              key={tariff.id}
              onDragOver={(event) => onTariffDragOver(event, tariffIndex)}
              onDrop={(event) => onTariffDrop(event, tariffIndex)}
              onDragEnd={onTariffDragEnd}
              className={`border-platinum/25 rounded-xl border bg-black/15 p-2 transition md:p-4 ${
                dropTargetTariffIndex === tariffIndex
                  ? "border-gold/60 bg-black/30"
                  : ""
              } ${draggingTariffIndex === tariffIndex ? "opacity-70" : ""}`}
            >
              <div className="mb-2 flex flex-wrap items-center justify-between gap-1.5 md:mb-3 md:gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    draggable
                    onDragStart={(event) =>
                      onTariffDragStart(event, tariffIndex)
                    }
                    onDragEnd={onTariffDragEnd}
                    className="border-platinum/30 text-platinum/80 cursor-grab rounded-md border bg-black/30 p-2 text-xs transition hover:bg-black/45 active:cursor-grabbing"
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
                    className={subtleButtonClass}
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
                    className={subtleButtonClass}
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
                    className={subtleDangerButtonClass}
                  >
                    Удалить тариф
                  </button>
                </div>
              </div>

              <div className="grid gap-2 md:grid-cols-2 md:gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-platinum/80 text-sm">
                    Название тарифа
                  </span>
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
                    className={inputClass}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-platinum/80 text-sm">Slug тарифа</span>
                  <input
                    value={tariff.slug}
                    onChange={(event) =>
                      setTariffs((current) =>
                        current.map((item, index) =>
                          index === tariffIndex
                            ? {
                                ...item,
                                slug: normalizeSlug(
                                  transliterate(event.target.value),
                                ),
                              }
                            : item,
                        ),
                      )
                    }
                    placeholder="slug"
                    className={inputClass}
                  />
                </label>
              </div>

              <label className="text-platinum/90 mt-2 flex items-center gap-2 text-sm md:mt-3">
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

              <label className="mt-2 flex flex-col gap-1 md:mt-3">
                <span className="text-platinum/80 text-sm">
                  Описание тарифа (Markdown)
                </span>
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
                  className={`${textareaClass} h-28 md:h-40`}
                />
              </label>

              <div className="mt-3 md:mt-4">
                <div className="mb-1.5 flex items-center justify-between md:mb-2">
                  <h4 className="text-platinum font-medium">Пакеты</h4>
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
                    className={subtleButtonClass}
                  >
                    Добавить пакет
                  </button>
                </div>

                <div className="flex flex-col gap-2 md:gap-3">
                  {tariff.packages.map((pkg, pkgIndex) => (
                    <div
                      key={pkg.id}
                      onDragOver={(event) =>
                        onPackageDragOver(event, tariffIndex, pkgIndex)
                      }
                      onDrop={(event) =>
                        onPackageDrop(event, tariffIndex, pkgIndex)
                      }
                      onDragEnd={onPackageDragEnd}
                      className={`border-platinum/20 rounded-lg border bg-black/20 p-2 transition md:p-3 ${
                        dropTargetPackage?.tariffIndex === tariffIndex &&
                        dropTargetPackage.packageIndex === pkgIndex
                          ? "border-gold/60 bg-black/35"
                          : ""
                      } ${
                        draggingPackage?.tariffIndex === tariffIndex &&
                        draggingPackage.packageIndex === pkgIndex
                          ? "opacity-70"
                          : ""
                      }`}
                    >
                      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-1.5 md:mb-2 md:gap-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            draggable
                            onDragStart={(event) =>
                              onPackageDragStart(event, tariffIndex, pkgIndex)
                            }
                            onDragEnd={onPackageDragEnd}
                            className="border-platinum/30 text-platinum/80 cursor-grab rounded-md border bg-black/30 p-1.5 text-xs transition hover:bg-black/45 active:cursor-grabbing"
                            title="Перетащить пакет"
                            aria-label="Перетащить пакет"
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
                              <circle
                                cx="10"
                                cy="3"
                                r="1"
                                fill="currentColor"
                              />
                              <circle cx="4" cy="7" r="1" fill="currentColor" />
                              <circle
                                cx="10"
                                cy="7"
                                r="1"
                                fill="currentColor"
                              />
                              <circle
                                cx="4"
                                cy="11"
                                r="1"
                                fill="currentColor"
                              />
                              <circle
                                cx="10"
                                cy="11"
                                r="1"
                                fill="currentColor"
                              />
                            </svg>
                          </button>
                          <span className="text-platinum/80 text-xs">
                            Пакет #{pkgIndex + 1}
                          </span>
                        </div>

                        <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
                          <button
                            type="button"
                            disabled={pkgIndex === 0}
                            onClick={() =>
                              setTariffs((current) =>
                                current.map((item, index) =>
                                  index === tariffIndex
                                    ? {
                                        ...item,
                                        packages: movePackage(
                                          item.packages,
                                          pkgIndex,
                                          pkgIndex - 1,
                                        ),
                                      }
                                    : item,
                                ),
                              )
                            }
                            className={subtleButtonClass}
                          >
                            Выше
                          </button>
                          <button
                            type="button"
                            disabled={pkgIndex === tariff.packages.length - 1}
                            onClick={() =>
                              setTariffs((current) =>
                                current.map((item, index) =>
                                  index === tariffIndex
                                    ? {
                                        ...item,
                                        packages: movePackage(
                                          item.packages,
                                          pkgIndex,
                                          pkgIndex + 1,
                                        ),
                                      }
                                    : item,
                                ),
                              )
                            }
                            className={subtleButtonClass}
                          >
                            Ниже
                          </button>
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
                            className={subtleDangerButtonClass}
                          >
                            Удалить пакет
                          </button>
                        </div>
                      </div>

                      <div className="grid gap-1.5 md:grid-cols-4 md:gap-2">
                        <label className="flex flex-col gap-1">
                          <span className="text-platinum/80 text-xs">
                            Название пакета
                          </span>
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
                            className={inputClass}
                          />
                        </label>
                        <label className="flex flex-col gap-1">
                          <span className="text-platinum/80 text-xs">
                            Обычная цена
                          </span>
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
                            className={inputClass}
                          />
                        </label>
                        <label className="flex flex-col gap-1">
                          <span className="text-platinum/80 text-xs">
                            Цена со скидкой
                          </span>
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
                            className={inputClass}
                          />
                        </label>
                        <label className="flex flex-col gap-1">
                          <span className="text-platinum/80 text-xs">
                            Валюта
                          </span>
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
                            className={inputClass}
                          />
                        </label>
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
        onToggle={() => toggleSection("main")}
      >
        <div className="grid gap-3 md:grid-cols-2 md:gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-platinum/80 text-sm">Имя</span>
            <input
              value={contentData.fullName}
              onChange={(event) =>
                updateContentField("fullName", event.target.value)
              }
              className={inputClass}
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-platinum/80 text-sm">
              Подзаголовок профиля
            </span>
            <input
              value={contentData.info.title}
              onChange={(event) => updateInfoField("title", event.target.value)}
              className={inputClass}
            />
          </label>

          <label className="flex flex-col gap-1 md:col-span-2">
            <span className="text-platinum/80 text-sm">
              Короткое описание профессии
            </span>
            <input
              value={contentData.professionDescription}
              onChange={(event) =>
                updateContentField("professionDescription", event.target.value)
              }
              className={inputClass}
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-platinum/80 text-sm">
              Заголовок блока тарифов
            </span>
            <input
              value={contentData.priceHeader}
              onChange={(event) =>
                updateContentField("priceHeader", event.target.value)
              }
              className={inputClass}
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-platinum/80 text-sm">Текст загрузки</span>
            <input
              value={contentData.loading}
              onChange={(event) =>
                updateContentField("loading", event.target.value)
              }
              className={inputClass}
            />
          </label>
        </div>
      </AdminSection>

      <AdminSection
        title={SECTION_TITLES.links}
        collapsed={collapsedSections.links}
        onToggle={() => toggleSection("links")}
      >
        <div className="grid gap-3 md:grid-cols-2 md:gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-platinum/80 text-sm">Ссылка Telegram</span>
            <input
              value={contentData.telegramLink}
              onChange={(event) =>
                updateContentField("telegramLink", event.target.value)
              }
              className={inputClass}
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-platinum/80 text-sm">
              Ссылка VK мессенджер
            </span>
            <input
              value={contentData.vkMessengerLink}
              onChange={(event) =>
                updateContentField("vkMessengerLink", event.target.value)
              }
              className={inputClass}
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-platinum/80 text-sm">Ссылка B17</span>
            <input
              value={contentData.b17Link}
              onChange={(event) =>
                updateContentField("b17Link", event.target.value)
              }
              className={inputClass}
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-platinum/80 text-sm">Ссылка блога</span>
            <input
              value={contentData.blogLink}
              onChange={(event) =>
                updateContentField("blogLink", event.target.value)
              }
              className={inputClass}
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-platinum/80 text-sm">Кнопка записи</span>
            <input
              value={contentData.bookConsultation}
              onChange={(event) =>
                updateContentField("bookConsultation", event.target.value)
              }
              className={inputClass}
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-platinum/80 text-sm">
              Текст ссылки на блог
            </span>
            <input
              value={contentData.blog}
              onChange={(event) =>
                updateContentField("blog", event.target.value)
              }
              className={inputClass}
            />
          </label>
        </div>

        <div className="grid gap-3 md:grid-cols-2 md:gap-4">
          <div className="border-platinum/25 rounded-xl border bg-black/15 p-3">
            <p className="text-platinum/90 text-sm font-medium">Фото профиля</p>
            <p className="text-platinum/70 mt-1 text-xs">
              Рекомендуется вертикальное фото, минимум 1200px по длинной
              стороне.
            </p>

            {profilePreviewUrl || contentData.profileImageUrl ? (
              <img
                src={profilePreviewUrl ?? contentData.profileImageUrl}
                alt={
                  profilePreviewUrl
                    ? "Предпросмотр фото профиля"
                    : "Текущее фото профиля"
                }
                className="border-platinum/30 mt-2 max-h-44 rounded-lg border object-cover"
              />
            ) : null}

            <label className="border-platinum/25 mt-3 flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg border bg-black/10 px-3 py-2">
              <span className="border-platinum/35 text-platinum rounded-lg border bg-black/20 px-3 py-1.5 text-sm font-medium">
                Выбрать фото профиля
              </span>
              <span className="text-platinum/70 max-w-[65%] truncate text-right text-sm">
                {profileImageFile?.name ?? "Файл не выбран"}
              </span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(event) =>
                  setProfileImageFile(event.target.files?.[0] ?? null)
                }
                className="hidden"
              />
            </label>

            <button
              type="button"
              onClick={() => onUploadImage("profile")}
              disabled={!profileImageFile || uploadingImageKind !== null}
              className={`${secondaryButtonClass} mt-3`}
            >
              {uploadingImageKind === "profile"
                ? "Загружаем..."
                : "Загрузить фото профиля"}
            </button>
          </div>

          <div className="border-platinum/25 rounded-xl border bg-black/15 p-3">
            <p className="text-platinum/90 text-sm font-medium">
              Превью для Google и соцсетей (OG)
            </p>
            <p className="text-platinum/70 mt-1 text-xs">
              Лучше использовать изображение 1200x630 для корректных превью.
            </p>

            {ogPreviewUrl || contentData.ogImageUrl ? (
              <img
                src={ogPreviewUrl ?? contentData.ogImageUrl}
                alt={
                  ogPreviewUrl
                    ? "Предпросмотр OG изображения"
                    : "Текущее OG изображение"
                }
                className="border-platinum/30 mt-2 max-h-44 w-full rounded-lg border object-cover"
              />
            ) : null}

            <label className="border-platinum/25 mt-3 flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg border bg-black/10 px-3 py-2">
              <span className="border-platinum/35 text-platinum rounded-lg border bg-black/20 px-3 py-1.5 text-sm font-medium">
                Выбрать OG-изображение
              </span>
              <span className="text-platinum/70 max-w-[65%] truncate text-right text-sm">
                {ogImageFile?.name ?? "Файл не выбран"}
              </span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(event) =>
                  setOgImageFile(event.target.files?.[0] ?? null)
                }
                className="hidden"
              />
            </label>

            <button
              type="button"
              onClick={() => onUploadImage("og")}
              disabled={!ogImageFile || uploadingImageKind !== null}
              className={`${secondaryButtonClass} mt-3`}
            >
              {uploadingImageKind === "og"
                ? "Загружаем..."
                : "Загрузить OG изображение"}
            </button>
          </div>
        </div>
      </AdminSection>

      <AdminSection
        title={SECTION_TITLES.markdown}
        collapsed={collapsedSections.markdown}
        onToggle={() => toggleSection("markdown")}
      >
        <div className="flex flex-col gap-3 md:gap-4">
          {markdownKeys.map((key) => (
            <div
              key={key}
              className="border-platinum/25 rounded-xl border bg-black/15 p-2 md:p-3"
            >
              <label className="text-platinum/90 mb-2 block text-sm font-medium">
                {MARKDOWN_LABELS[key] ?? `/${key}`}
              </label>
              <div className="grid gap-2 lg:grid-cols-2 lg:gap-3">
                <textarea
                  value={markdown[key]}
                  onChange={(event) =>
                    setMarkdown((current) => ({
                      ...current,
                      [key]: event.target.value,
                    }))
                  }
                  className={`${textareaClass} h-36 md:h-60`}
                  spellCheck={false}
                />
                <div className="markdown content-markdown border-platinum/25 text-platinum h-36 overflow-auto rounded-lg border bg-black/25 p-3 md:h-60">
                  {markdown[key]?.trim() ? (
                    parseMarkdown(markdown[key])
                  ) : (
                    <p className="text-platinum/70 text-sm">
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
