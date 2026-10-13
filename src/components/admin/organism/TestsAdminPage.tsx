"use client";

import { useCallback, useState } from "react";
import { PlusIcon } from "@/assets/icons/admin";
import { errorMessage, fetchAdmin, sendJson } from "@/lib/admin/api";
import { useSavedSnapshot } from "@/lib/admin/draft";
import {
  buildTestsPayload,
  createEmptyTest,
  toEditable,
  type EditableTest,
} from "@/lib/admin/editable";
import { useAdminLoader } from "@/lib/admin/useAdminLoader";
import type { PublicTestDefinition } from "@/lib/tests/types";
import AdminButton from "../atom/AdminButton";
import AdminCard from "../molecule/AdminCard";
import AdminLoadError from "../molecule/AdminLoadError";
import AdminPageSkeleton from "../molecule/AdminPageSkeleton";
import { useToast } from "../providers/ToastProvider";
import AdminShell from "./AdminShell";
import TestCard from "./TestCard";

type TestBundle = { tests: PublicTestDefinition[]; source: "supabase" };

/** The "Tests" admin page: the list of editable tests. */
function TestsAdminPage() {
  const toast = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [tests, setTests] = useState<EditableTest[]>([]);

  const snapshot = useSavedSnapshot(tests);
  const { markSaved } = snapshot;

  const load = useCallback(async () => {
    const bundle = await fetchAdmin<TestBundle>(
      "/api/admin/tests",
      "Не удалось загрузить тесты",
    );
    const loaded = bundle.tests.map(toEditable);
    setTests(loaded);
    markSaved(loaded);
  }, [markSaved]);

  const { isLoading, loadFailed, retry } = useAdminLoader(
    load,
    "Не удалось загрузить тесты",
  );

  const onSave = async () => {
    setIsSaving(true);
    try {
      const bundle = await sendJson<TestBundle>(
        "/api/admin/tests",
        "PUT",
        { tests: buildTestsPayload(tests) },
        "Не удалось сохранить тесты",
      );
      const saved = bundle.tests.map(toEditable);
      setTests(saved);
      markSaved(saved);
      toast.success("Тесты сохранены");
    } catch (error) {
      toast.error(errorMessage(error, "Не удалось сохранить тесты"));
    } finally {
      setIsSaving(false);
    }
  };

  const onReset = () => {
    const saved = snapshot.readSaved<EditableTest[]>();
    if (saved) {
      setTests(saved);
      toast.info("Изменения отменены");
    }
  };

  return (
    <AdminShell
      activeTab="tests"
      isDirty={snapshot.isDirty}
      isSaving={isSaving}
      onSave={onSave}
      onReset={onReset}
    >
      {isLoading ? <AdminPageSkeleton /> : null}

      {loadFailed ? (
        <AdminLoadError message="Не удалось загрузить тесты." onRetry={retry} />
      ) : null}

      {!isLoading && !loadFailed ? (
        <AdminCard
          title="Тесты"
          description="Создавайте тесты, меняйте вопросы и настраивайте, как считается результат. На сайте изменения появятся после нажатия «Сохранить»."
          actions={
            <AdminButton
              onClick={() =>
                setTests((current) => [
                  ...current,
                  createEmptyTest(current.length),
                ])
              }
            >
              <PlusIcon width={18} height={18} />
              Добавить тест
            </AdminButton>
          }
        >
          {tests.length === 0 ? (
            <p className="text-sm text-black/55">Список тестов пуст.</p>
          ) : null}

          {tests.map((test, index) => (
            <TestCard
              key={test.id}
              test={test}
              index={index}
              defaultOpen={tests.length === 1}
              setTests={setTests}
            />
          ))}
        </AdminCard>
      ) : null}
    </AdminShell>
  );
}

export default TestsAdminPage;
