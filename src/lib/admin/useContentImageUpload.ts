"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/admin/providers/ToastProvider";
import { errorMessage, fetchAdmin } from "./api";
import {
  IMAGE_FIELDS,
  IMAGE_UPLOADED_MESSAGES,
  type ContentBundle,
  type ContentDraft,
  type ImageKind,
} from "./content";
import { updateDraft } from "./draft";

type Options = {
  setDraft: Dispatch<SetStateAction<ContentDraft | null>>;
  updateSaved: (recipe: (saved: ContentDraft) => void) => void;
};

/**
 * Uploads an image right away. Only the image URL is applied to the draft and
 * to the saved baseline, so other unsaved edits stay intact.
 */
export function useContentImageUpload({ setDraft, updateSaved }: Options) {
  const router = useRouter();
  const toast = useToast();
  const [uploadingKind, setUploadingKind] = useState<ImageKind | null>(null);

  const upload = async (kind: ImageKind, file: File) => {
    const formData = new FormData();
    formData.set("kind", kind);
    formData.set("file", file);

    setUploadingKind(kind);
    try {
      const bundle = await fetchAdmin<ContentBundle>(
        "/api/admin/image",
        "Не удалось загрузить изображение",
        router.replace,
        { method: "POST", body: formData },
      );
      const field = IMAGE_FIELDS[kind];
      const url = bundle.content[field];

      updateDraft(setDraft, (current) => {
        current.content[field] = url;
      });
      updateSaved((saved) => {
        saved.content[field] = url;
      });
      toast.success(IMAGE_UPLOADED_MESSAGES[kind]);
    } catch (error) {
      toast.error(errorMessage(error, "Не удалось загрузить изображение"));
    } finally {
      setUploadingKind(null);
    }
  };

  return { uploadingKind, upload };
}
