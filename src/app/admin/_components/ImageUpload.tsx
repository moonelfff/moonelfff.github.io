"use client";

import { useRef } from "react";
import { Button } from "./ui";
import { PlusIcon } from "./icons";

type ImageUploadProps = {
  title: string;
  hint: string;
  imageUrl: string;
  isUploading: boolean;
  onSelect: (file: File) => void;
};

/** Shows the current image and uploads a newly chosen file immediately. */
export function ImageUpload({
  title,
  hint,
  imageUrl,
  isUploading,
  onSelect,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-alabaster-grey bg-soft-linnen/40 p-3">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-0.5 text-xs text-black/55">{hint}</p>
      </div>

      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={title}
          className="max-h-52 w-full rounded-lg border border-alabaster-grey object-cover"
        />
      ) : (
        <p className="rounded-lg border border-dashed border-black/20 p-6 text-center text-sm text-black/50">
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
      <Button isLoading={isUploading} onClick={() => inputRef.current?.click()}>
        {isUploading ? null : <PlusIcon width={18} height={18} />}
        {imageUrl ? "Заменить изображение" : "Выбрать изображение"}
      </Button>
    </div>
  );
}
