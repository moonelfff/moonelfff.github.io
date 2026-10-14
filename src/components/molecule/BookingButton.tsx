"use client";

import { useId, useRef, type ReactNode } from "react";
import TelegramIcon from "@/assets/icons/TelegramIcon";
import VKIcon from "@/assets/icons/VKIcon";
import Button from "./Button";

type Props = {
  label: string;
  telegramLabel: string;
  telegramHref: string;
  vkLabel: string;
  vkHref: string;
  variant?: "glass" | "solid";
  className?: string;
  icon?: ReactNode;
};

function BookingButton({
  label,
  telegramLabel,
  telegramHref,
  vkLabel,
  vkHref,
  variant = "glass",
  className,
  icon,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const headingId = useId();

  return (
    <>
      <Button
        onClick={() => dialogRef.current?.showModal()}
        variant={variant}
        className={className}
        icon={icon}
      >
        {label}
      </Button>
      <dialog
        ref={dialogRef}
        aria-labelledby={headingId}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            dialogRef.current?.close();
          }
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-white/30 bg-[rgb(110_68_194_/_0.86)] p-6 text-platinum shadow-[0_0_2px_1px_rgb(0_0_0_/_0.5)_inset,0_0_6px_2px_rgb(255_255_255_/_0.35)_inset,0_1.5rem_3rem_rgb(40_20_90_/_0.35)] backdrop-blur-[1.5rem] backdrop:bg-black/35 backdrop:backdrop-blur-sm"
      >
        <div className="flex items-center justify-between gap-4">
          <h2 id={headingId} className="text-lg leading-11 font-semibold">
            Выберите способ связи
          </h2>
          <button
            type="button"
            aria-label="Закрыть"
            onClick={() => dialogRef.current?.close()}
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-platinum/75 transition hover:bg-white/15 hover:text-platinum focus-visible:outline-2 focus-visible:outline-white"
          >
            <svg
              aria-hidden="true"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
            >
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
        <div className="mt-4 flex flex-col gap-3">
          <a
            href={telegramHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-12 items-center justify-center gap-3 rounded-xl border border-white/30 bg-white/10 px-4 py-3 font-semibold text-platinum shadow-[0_0_1px_1px_rgb(0_0_0_/_0.25)_inset,0_0_3px_2px_rgb(255_255_255_/_0.25)_inset] backdrop-blur-xl transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <TelegramIcon
              color="var(--color-platinum)"
              width={24}
              height={24}
            />
            {telegramLabel}
          </a>
          <a
            href={vkHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-12 items-center justify-center gap-3 rounded-xl border border-white/30 bg-white/10 px-4 py-3 font-semibold text-platinum shadow-[0_0_1px_1px_rgb(0_0_0_/_0.25)_inset,0_0_3px_2px_rgb(255_255_255_/_0.25)_inset] backdrop-blur-xl transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <VKIcon color="var(--color-platinum)" width={24} height={24} />
            {vkLabel}
          </a>
        </div>
      </dialog>
    </>
  );
}

export default BookingButton;
