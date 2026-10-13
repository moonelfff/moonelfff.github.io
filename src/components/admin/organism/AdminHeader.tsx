"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MouseEvent } from "react";
import { ExternalLinkIcon, LogoutIcon } from "@/assets/icons/admin";
import AdminButton from "../atom/AdminButton";

export type AdminTab = "content" | "tests";

const TABS: Array<{ id: AdminTab; href: string; label: string }> = [
  { id: "content", href: "/admin", label: "Контент" },
  { id: "tests", href: "/admin/tests", label: "Тесты" },
];

type Props = {
  activeTab: AdminTab;
  /** Asks the user before leaving; returns false when they decline. */
  confirmLeave: () => boolean;
};

function AdminHeader({ activeTab, confirmLeave }: Props) {
  const router = useRouter();

  const onTabClick = (event: MouseEvent) => {
    if (!confirmLeave()) {
      event.preventDefault();
    }
  };

  const onLogout = async () => {
    if (!confirmLeave()) {
      return;
    }

    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  };

  return (
    <header className="border-alabaster-grey bg-platinum/90 sticky top-0 z-30 border-b backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2 md:px-6">
        <span className="text-dusty-grape text-base font-semibold">
          Админка
        </span>

        <nav
          aria-label="Разделы админки"
          className="bg-soft-linnen order-last flex w-full gap-1 rounded-xl p-1 md:order-none md:w-auto"
        >
          {TABS.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <Link
                key={tab.id}
                href={tab.href}
                onClick={isActive ? undefined : onTabClick}
                aria-current={isActive ? "page" : undefined}
                className={`flex min-h-9 flex-1 items-center justify-center rounded-lg px-4 text-sm font-semibold transition md:flex-none ${
                  isActive
                    ? "bg-dusty-grape text-platinum shadow-sm"
                    : "hover:text-dusty-grape text-black/60"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
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
          <AdminButton icon variant="ghost" label="Выйти" onClick={onLogout}>
            <LogoutIcon />
          </AdminButton>
        </div>
      </div>
    </header>
  );
}

export default AdminHeader;
