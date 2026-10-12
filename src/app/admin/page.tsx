"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { SiteContent } from "@/lib/contentTypes";
import type { Tariff } from "@/lib/tariffStore";
import { AdminShell } from "./_components/AdminShell";
import { AdminPageSkeleton } from "./_components/AdminPageSkeleton";
import { ImageUpload } from "./_components/ImageUpload";
import { MarkdownEditor } from "./_components/MarkdownEditor";
import { TariffsEditor } from "./_components/TariffsEditor";
import { useToast } from "./_components/Toast";
import { Button, Card, Field, TextInput } from "./_components/ui";
import { errorMessage, fetchAdmin, sendJson } from "./_lib/api";
import { updateDraft, useSavedSnapshot } from "./_lib/draft";
import { prepareTariffsForSave } from "./_lib/tariffs";
import { validateContentUrls } from "./_lib/validation";

type ContentDraft = {
  content: SiteContent;
  markdown: Record<string, string>;
};

type ContentBundle = ContentDraft & { source: "supabase" };
type TariffBundle = { tariffs: Tariff[]; source: "supabase" };
type ImageKind = "profile" | "og";

const MARKDOWN_LABELS: Record<string, string> = {
  "profile.md": "Профиль: основной текст",
  "blog.md": "Блог: вводный текст",
};

const IMAGE_FIELDS = {
  profile: "profileImageUrl",
  og: "ogImageUrl",
} as const satisfies Record<ImageKind, keyof SiteContent>;

const IMAGE_UPLOADED_MESSAGES: Record<ImageKind, string> = {
  profile: "Фото профиля загружено",
  og: "OG-изображение загружено",
};

type TextFieldKey = {
  [K in keyof SiteContent]: SiteContent[K] extends string ? K : never;
}[keyof SiteContent];

type TextFieldConfig = { key: TextFieldKey; label: string; wide?: boolean };

const MAIN_FIELDS: TextFieldConfig[] = [
  { key: "fullName", label: "Имя" },
  { key: "priceHeader", label: "Заголовок блока тарифов" },
  { key: "professionDescription", label: "Короткое описание профессии", wide: true },
];

const LINK_FIELDS: TextFieldConfig[] = [
  { key: "telegramLink", label: "Ссылка Telegram" },
  { key: "vkMessengerLink", label: "Ссылка VK мессенджер" },
  { key: "b17Link", label: "Ссылка B17" },
  { key: "instagramLink", label: "Ссылка Instagram" },
  { key: "blogLink", label: "Ссылка блога" },
  { key: "blog", label: "Текст ссылки на блог" },
  { key: "bookConsultation", label: "Кнопка записи" },
];

export default function AdminContentPage() {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingKind, setUploadingKind] = useState<ImageKind | null>(null);
  const [draft, setDraft] = useState<ContentDraft | null>(null);
  const [tariffs, setTariffs] = useState<Tariff[]>([]);

  const draftSnapshot = useSavedSnapshot(draft);
  const tariffsSnapshot = useSavedSnapshot(tariffs);
  const isDirty = draftSnapshot.isDirty || tariffsSnapshot.isDirty;

  const markdownKeys = useMemo(
    () =>
      Object.keys(draft?.markdown ?? {})
        .filter((key) => !key.startsWith("pricelist/"))
        .sort(),
    [draft?.markdown],
  );

  const { markSaved: markDraftSaved } = draftSnapshot;
  const { markSaved: markTariffsSaved } = tariffsSnapshot;

  const load = useCallback(async () => {

    try {
      const [contentBundle, tariffBundle] = await Promise.all([
        fetchAdmin<ContentBundle>("/api/admin/content", "Не удалось загрузить контент"),
        fetchAdmin<TariffBundle>("/api/admin/tariffs", "Не удалось загрузить тарифы"),
      ]);

      const loadedDraft = {
        content: contentBundle.content,
        markdown: contentBundle.markdown,
      };
      setDraft(loadedDraft);
      markDraftSaved(loadedDraft);
      setTariffs(tariffBundle.tariffs);
      markTariffsSaved(tariffBundle.tariffs);
    } catch (error) {
      toast.error(errorMessage(error, "Не удалось загрузить данные"));
      setLoadFailed(true);
    } finally {
      setIsLoading(false);
    }
  }, [markDraftSaved, markTariffsSaved, toast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch on mount
    void load();
  }, [load]);

  const saveContent = async (current: ContentDraft) => {
    const urlErrors = validateContentUrls(current.content);
    if (urlErrors.length > 0) {
      throw new Error(urlErrors.join("\n"));
    }

    const bundle = await sendJson<ContentBundle>(
      "/api/admin/content",
      "PUT",
      current,
      "Не удалось сохранить контент",
    );
    const saved = { content: bundle.content, markdown: bundle.markdown };
    setDraft(saved);
    markDraftSaved(saved);
  };

  const saveTariffs = async (current: Tariff[]) => {
    const bundle = await sendJson<TariffBundle>(
      "/api/admin/tariffs",
      "PUT",
      { tariffs: prepareTariffsForSave(current) },
      "Не удалось сохранить тарифы",
    );
    setTariffs(bundle.tariffs);
    markTariffsSaved(bundle.tariffs);
  };

  const onSave = async () => {
    if (!draft) {
      return;
    }

    setIsSaving(true);
    try {
      if (draftSnapshot.isDirty) {
        await saveContent(draft);
      }
      if (tariffsSnapshot.isDirty) {
        await saveTariffs(tariffs);
      }
      toast.success("Изменения сохранены");
    } catch (error) {
      toast.error(errorMessage(error, "Не удалось сохранить изменения"));
    } finally {
      setIsSaving(false);
    }
  };

  const onReset = () => {
    const savedDraft = draftSnapshot.readSaved<ContentDraft>();
    const savedTariffs = tariffsSnapshot.readSaved<Tariff[]>();
    if (savedDraft) {
      setDraft(savedDraft);
    }
    if (savedTariffs) {
      setTariffs(savedTariffs);
    }
    toast.info("Изменения отменены");
  };

  // The image is stored on the server right away, so only the image URL
  // is applied, leaving other unsaved edits intact.
  const onUploadImage = async (kind: ImageKind, file: File) => {
    const formData = new FormData();
    formData.set("kind", kind);
    formData.set("file", file);

    setUploadingKind(kind);
    try {
      const bundle = await fetchAdmin<ContentBundle>(
        "/api/admin/image",
        "Не удалось загрузить изображение",
        { method: "POST", body: formData },
      );
      const field = IMAGE_FIELDS[kind];
      const url = bundle.content[field];

      updateDraft(setDraft, (current) => {
        current.content[field] = url;
      });
      draftSnapshot.updateSaved<ContentDraft>((saved) => {
        saved.content[field] = url;
      });
      toast.success(IMAGE_UPLOADED_MESSAGES[kind]);
    } catch (error) {
      toast.error(errorMessage(error, "Не удалось загрузить изображение"));
    } finally {
      setUploadingKind(null);
    }
  };

  const renderTextField = ({ key, label, wide }: TextFieldConfig, content: SiteContent) => (
    <Field key={key} label={label} className={wide ? "md:col-span-2" : ""}>
      <TextInput
        value={content[key]}
        onChange={(event) =>
          updateDraft(setDraft, (current) => {
            current.content[key] = event.target.value;
          })
        }
      />
    </Field>
  );

  return (
    <AdminShell
      activeTab="content"
      isDirty={isDirty}
      isSaving={isSaving}
      onSave={onSave}
      onReset={onReset}
    >
      {isLoading ? <AdminPageSkeleton /> : null}

      {loadFailed ? (
        <div className="flex flex-col items-start gap-3 rounded-2xl border border-red-200 bg-platinum p-4">
          <p className="text-sm">Не удалось загрузить данные.</p>
          <Button
            onClick={() => {
              setIsLoading(true);
              setLoadFailed(false);
              void load();
            }}
          >Повторить</Button>
        </div>
      ) : null}

      {draft ? (
        <>
          <TariffsEditor tariffs={tariffs} setTariffs={setTariffs} />

          <Card title="Основные данные сайта">
            <div className="grid gap-3 md:grid-cols-2">
              {MAIN_FIELDS.map((field) => renderTextField(field, draft.content))}
              <Field label="Подзаголовок профиля">
                <TextInput
                  value={draft.content.info.title}
                  onChange={(event) =>
                    updateDraft(setDraft, (current) => {
                      current.content.info.title = event.target.value;
                    })
                  }
                />
              </Field>
            </div>
          </Card>

          <Card title="Ссылки и подписи">
            <div className="grid gap-3 md:grid-cols-2">
              {LINK_FIELDS.map((field) => renderTextField(field, draft.content))}
            </div>
          </Card>

          <Card
            title="Изображения"
            description="Новое изображение сохраняется сразу после выбора файла."
          >
            <div className="grid gap-3 md:grid-cols-2">
              <ImageUpload
                title="Фото профиля"
                hint="Вертикальное фото, минимум 1200px по длинной стороне."
                imageUrl={draft.content.profileImageUrl}
                isUploading={uploadingKind === "profile"}
                onSelect={(file) => void onUploadImage("profile", file)}
              />
              <ImageUpload
                title="Превью для Google и соцсетей (OG)"
                hint="Лучше всего подходит изображение 1200x630."
                imageUrl={draft.content.ogImageUrl}
                isUploading={uploadingKind === "og"}
                onSelect={(file) => void onUploadImage("og", file)}
              />
            </div>
          </Card>

          <Card title="Тексты">
            {markdownKeys.map((key) => (
              <MarkdownEditor
                key={key}
                label={MARKDOWN_LABELS[key] ?? `/${key}`}
                value={draft.markdown[key]}
                onChange={(value) =>
                  updateDraft(setDraft, (current) => {
                    current.markdown[key] = value;
                  })
                }
              />
            ))}
          </Card>
        </>
      ) : null}
    </AdminShell>
  );
}
