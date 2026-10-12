"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, type MouseEvent, type ReactNode } from "react";
import { Button } from "./ui";
import { CheckIcon, ExternalLinkIcon, LogoutIcon, UndoIcon } from "./icons";

type AdminTab = "content" | "tests";

const TABS: Array<{ id: AdminTab; href: string; label: string }> = [
  { id: "content", href: "/admin", label: "Контент" },
  { id: "tests", href: "/admin/tests", label: "Тесты" },
];

const UNSAVED_CONFIRM_TEXT =
  "Есть несохранённые изменения. Уйти без сохранения?";

type AdminShellProps = {
  activeTab: AdminTab;
  isDirty: boolean;
  isSaving: boolean;
  onSave: () => void;
  onReset: () => void;
  children: ReactNode;
};

export function AdminShell({
  activeTab,
  isDirty,
  isSaving,
  onSave,
  onReset,
  children,
}: AdminShellProps) {
  const router = useRouter();
  const canSave = isDirty && !isSaving;

  useEffect(() => {
    if (!isDirty) {
      return;
    }

    const warnBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    const saveOnShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        if (canSave) {
          onSave();
        }
      }
    };

    window.addEventListener("keydown", saveOnShortcut);
    return () => window.removeEventListener("keydown", saveOnShortcut);
  }, [canSave, onSave]);

  const confirmLeave = (event: MouseEvent) => {
    if (isDirty && !window.confirm(UNSAVED_CONFIRM_TEXT)) {
      event.preventDefault();
    }
  };

  const onLogout = async () => {
    if (isDirty && !window.confirm(UNSAVED_CONFIRM_TEXT)) {
      return;
    }

    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  };

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-alabaster-grey bg-platinum/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2 md:px-6">
          <span className="text-dusty-grape text-base font-semibold">Админка</span>

          <nav
            aria-label="Разделы админки"
            className="order-last flex w-full gap-1 rounded-xl bg-soft-linnen p-1 md:order-none md:w-auto"
          >
            {TABS.map((tab) => (
              <Link
                key={tab.id}
                href={tab.href}
                onClick={tab.id === activeTab ? undefined : confirmLeave}
                aria-current={tab.id === activeTab ? "page" : undefined}
                className={`flex min-h-9 flex-1 items-center justify-center rounded-lg px-4 text-sm font-semibold transition md:flex-none ${
                  tab.id === activeTab
                    ? "bg-dusty-grape text-platinum shadow-sm"
                    : "text-black/60 hover:text-dusty-grape"
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1">
            <Link
              href="/"
              target="_blank"
              aria-label="Открыть сайт в новой вкладке"
              title="Открыть сайт"
              className="inline-flex size-11 items-center justify-center rounded-xl text-black/70 transition hover:bg-black/5 hover:text-black md:size-9"
            >
              <ExternalLinkIcon />
            </Link>
            <Button icon variant="ghost" label="Выйти" onClick={onLogout}>
              <LogoutIcon />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-3 pt-4 pb-32 md:px-6 md:pt-6">
        {children}
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-alabaster-grey bg-platinum/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center gap-2 px-3 py-2.5 md:px-6">
          <p
            className="hidden min-w-0 flex-1 items-center gap-2 text-sm text-black/70 md:flex"
            aria-live="polite"
          >
            <span
              className={`size-2 shrink-0 rounded-full ${
                isDirty ? "bg-amber-500" : "bg-emerald-500"
              }`}
            />
            {isDirty ? "Есть несохранённые изменения" : "Все изменения сохранены"}
          </p>
          {isDirty ? (
            <span
              className="size-2.5 shrink-0 rounded-full bg-amber-500 md:hidden"
              role="img"
              aria-label="Есть несохранённые изменения"
            />
          ) : null}

          <Button
            disabled={!isDirty || isSaving}
            onClick={onReset}
          >
            <UndoIcon width={18} height={18} />
            <span className="max-md:sr-only">Отменить</span>
          </Button>
          <Button
            variant="primary"
            className="max-md:flex-1"
            disabled={!canSave}
            isLoading={isSaving}
            onClick={onSave}
          >
            {isSaving ? null : <CheckIcon width={18} height={18} />}
            Сохранить
          </Button>
        </div>
      </div>
    </>
  );
}
