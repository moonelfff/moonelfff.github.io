"use client";

import { useCallback, useEffect, useState } from "react";
import type { PublicTestDefinition } from "@/lib/tests/types";
import { AdminShell } from "../_components/AdminShell";
import { AdminPageSkeleton } from "../_components/AdminPageSkeleton";
import { PlusIcon } from "../_components/icons";
import { useToast } from "../_components/Toast";
import { Button, Card } from "../_components/ui";
import { errorMessage, fetchAdmin, sendJson } from "../_lib/api";
import { useSavedSnapshot } from "../_lib/draft";
import { TestCard } from "./_components/TestCard";
import {
  buildTestsPayload,
  createEmptyTest,
  toEditable,
  type EditableTest,
} from "./_lib/editable";

type TestBundle = { tests: PublicTestDefinition[]; source: "supabase" };

export default function AdminTestsPage() {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [tests, setTests] = useState<EditableTest[]>([]);

  const snapshot = useSavedSnapshot(tests);
  const { markSaved } = snapshot;

  const load = useCallback(async () => {
    try {
      const bundle = await fetchAdmin<TestBundle>(
        "/api/admin/tests",
        "Не удалось загрузить тесты",
      );
      const loaded = bundle.tests.map(toEditable);
      setTests(loaded);
      markSaved(loaded);
    } catch (error) {
      toast.error(errorMessage(error, "Не удалось загрузить тесты"));
      setLoadFailed(true);
    } finally {
      setIsLoading(false);
    }
  }, [markSaved, toast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch on mount
    void load();
  }, [load]);

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
        <div className="flex flex-col items-start gap-3 rounded-2xl border border-red-200 bg-platinum p-4">
          <p className="text-sm">Не удалось загрузить тесты.</p>
          <Button
            onClick={() => {
              setIsLoading(true);
              setLoadFailed(false);
              void load();
            }}
          >Повторить</Button>
        </div>
      ) : null}

      {!isLoading && !loadFailed ? (
        <Card
          title="Тесты"
          description="Создавайте тесты, меняйте вопросы и настраивайте, как считается результат. На сайте изменения появятся после нажатия «Сохранить»."
          actions={
            <Button
              onClick={() =>
                setTests((current) => [...current, createEmptyTest(current.length)])
              }
            >
              <PlusIcon width={18} height={18} />
              Добавить тест
            </Button>
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
        </Card>
      ) : null}
    </AdminShell>
  );
}
