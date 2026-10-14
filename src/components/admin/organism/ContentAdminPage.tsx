"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import type { Tariff } from "@/lib/tariffStore";
import { errorMessage, fetchAdmin, sendJson } from "@/lib/admin/api";
import {
  type ContentBundle,
  type ContentDraft,
  type TariffBundle,
} from "@/lib/admin/content";
import { useSavedSnapshot } from "@/lib/admin/draft";
import { prepareTariffsForSave } from "@/lib/admin/tariffs";
import { useAdminLoader } from "@/lib/admin/useAdminLoader";
import { useContentImageUpload } from "@/lib/admin/useContentImageUpload";
import { validateContentUrls } from "@/lib/admin/validation";
import AdminLoadError from "../molecule/AdminLoadError";
import AdminPageSkeleton from "../molecule/AdminPageSkeleton";
import { useToast } from "../providers/ToastProvider";
import AdminShell from "./AdminShell";
import SiteImagesCard from "./SiteImagesCard";
import SiteInfoCard from "./SiteInfoCard";
import SiteLinksCard from "./SiteLinksCard";
import SiteTextsCard from "./SiteTextsCard";
import TariffsEditor from "./TariffsEditor";

/** The "Content" admin page: tariffs, site texts, links and images. */
function ContentAdminPage() {
  const router = useRouter();
  const toast = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [draft, setDraft] = useState<ContentDraft | null>(null);
  const [tariffs, setTariffs] = useState<Tariff[]>([]);

  const draftSnapshot = useSavedSnapshot(draft);
  const tariffsSnapshot = useSavedSnapshot(tariffs);
  const isDirty = draftSnapshot.isDirty || tariffsSnapshot.isDirty;
  const { markSaved: markDraftSaved, updateSaved: updateSavedDraft } =
    draftSnapshot;
  const { markSaved: markTariffsSaved } = tariffsSnapshot;

  const load = useCallback(async () => {
    const [contentBundle, tariffBundle] = await Promise.all([
      fetchAdmin<ContentBundle>(
        "/api/admin/content",
        "Не удалось загрузить контент",
        router.replace,
      ),
      fetchAdmin<TariffBundle>(
        "/api/admin/tariffs",
        "Не удалось загрузить тарифы",
        router.replace,
      ),
    ]);

    const loadedDraft = {
      content: contentBundle.content,
      markdown: contentBundle.markdown,
    };
    setDraft(loadedDraft);
    markDraftSaved(loadedDraft);
    setTariffs(tariffBundle.tariffs);
    markTariffsSaved(tariffBundle.tariffs);
  }, [markDraftSaved, markTariffsSaved, router]);

  const { isLoading, loadFailed, retry } = useAdminLoader(
    load,
    "Не удалось загрузить данные",
  );

  const imageUpload = useContentImageUpload({
    setDraft,
    updateSaved: updateSavedDraft,
  });

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
      router.replace,
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
      router.replace,
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
        <AdminLoadError
          message="Не удалось загрузить данные."
          onRetry={retry}
        />
      ) : null}

      {draft ? (
        <>
          <TariffsEditor tariffs={tariffs} setTariffs={setTariffs} />
          <SiteInfoCard draft={draft} setDraft={setDraft} />
          <SiteLinksCard draft={draft} setDraft={setDraft} />
          <SiteImagesCard
            draft={draft}
            uploadingKind={imageUpload.uploadingKind}
            onUpload={(kind, file) => void imageUpload.upload(kind, file)}
          />
          <SiteTextsCard draft={draft} setDraft={setDraft} />
        </>
      ) : null}
    </AdminShell>
  );
}

export default ContentAdminPage;
