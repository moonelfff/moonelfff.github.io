"use client";

import type { ContentDraft, ImageKind } from "@/lib/admin/content";
import AdminCard from "../molecule/AdminCard";
import ImageUpload from "../molecule/ImageUpload";

type Props = {
  draft: ContentDraft;
  uploadingKind: ImageKind | null;
  onUpload: (kind: ImageKind, file: File) => void;
};

function SiteImagesCard({ draft, uploadingKind, onUpload }: Props) {
  return (
    <AdminCard
      title="Изображения"
      description="Картинка загружается и сохраняется сразу после выбора файла, кнопка «Сохранить» не нужна."
    >
      <div className="grid gap-3 md:grid-cols-2">
        <ImageUpload
          title="Фото профиля"
          hint="Вертикальное фото, минимум 1200 px по длинной стороне."
          aspectClass="aspect-4/5 max-w-xs mx-auto"
          imageUrl={draft.content.profileImageUrl}
          isUploading={uploadingKind === "profile"}
          onSelect={(file) => onUpload("profile", file)}
        />
        <ImageUpload
          title="Картинка для ссылок (Google, соцсети)"
          hint="Показывается, когда ссылкой на сайт делятся в соцсетях и мессенджерах. Лучше всего 1200×630 px."
          aspectClass="aspect-[1200/630]"
          imageUrl={draft.content.ogImageUrl}
          isUploading={uploadingKind === "og"}
          onSelect={(file) => onUpload("og", file)}
        />
      </div>
    </AdminCard>
  );
}

export default SiteImagesCard;
