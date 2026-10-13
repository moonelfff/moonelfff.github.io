"use client";

import { useEffect, type ReactNode } from "react";
import AdminHeader, { type AdminTab } from "./AdminHeader";
import AdminSaveBar from "./AdminSaveBar";

const UNSAVED_CONFIRM_TEXT =
  "Есть несохранённые изменения. Уйти без сохранения?";

type Props = {
  activeTab: AdminTab;
  isDirty: boolean;
  isSaving: boolean;
  onSave: () => void;
  onReset: () => void;
  children: ReactNode;
};

/** Page frame: header with tabs, content area, sticky save bar, Ctrl+S and the unsaved-changes guard. */
function AdminShell({
  activeTab,
  isDirty,
  isSaving,
  onSave,
  onReset,
  children,
}: Props) {
  const canSave = isDirty && !isSaving;

  useEffect(() => {
    if (!isDirty) {
      return;
    }

    const warnBeforeUnload = (event: BeforeUnloadEvent) =>
      event.preventDefault();
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

  const confirmLeave = () => !isDirty || window.confirm(UNSAVED_CONFIRM_TEXT);

  return (
    <>
      <AdminHeader activeTab={activeTab} confirmLeave={confirmLeave} />

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-3 pt-4 pb-32 md:px-6 md:pt-6">
        {children}
      </main>

      <AdminSaveBar
        isDirty={isDirty}
        isSaving={isSaving}
        onSave={onSave}
        onReset={onReset}
      />
    </>
  );
}

export default AdminShell;
