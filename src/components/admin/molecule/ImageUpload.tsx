"use client";

import { useRef } from "react";
import { PlusIcon } from "@/assets/icons/admin";
import AdminButton from "../atom/AdminButton";
import Panel from "../atom/Panel";

type ImageUploadProps = {
  title: string;
  hint: string;
  imageUrl: string;
  isUploading: boolean;
  /** Tailwind aspect class matching how the image is shown on the site. */
  aspectClass: string;
  onSelect: (file: File) => void;
};

/** Shows the current image and uploads a newly chosen file immediately. */
function ImageUpload({
  title,
  hint,
  imageUrl,
  isUploading,
  aspectClass,
  onSelect,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <Panel>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-0.5 text-xs text-black/55">{hint}</p>
      </div>

      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={title}
          className={`${aspectClass} border-alabaster-grey w-full rounded-2xl border object-cover`}
        />
      ) : (
        <p
          className={`${aspectClass} flex w-full items-center justify-center rounded-2xl border border-dashed border-black/20 p-6 text-center text-sm text-black/50`}
        >
          Изображение не загружено
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) {
            onSelect(file);
          }
        }}
      />
      <AdminButton
        isLoading={isUploading}
        onClick={() => inputRef.current?.click()}
      >
        {isUploading ? null : <PlusIcon width={18} height={18} />}
        {imageUrl ? "Заменить изображение" : "Выбрать изображение"}
      </AdminButton>
    </Panel>
  );
}

export default ImageUpload;
