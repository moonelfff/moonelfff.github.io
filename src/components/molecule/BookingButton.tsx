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
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-alabaster-grey bg-platinum p-6 text-black shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-sm"
      >
        <div className="flex items-center justify-between gap-4">
          <h2 id={headingId} className="text-lg leading-11 font-semibold">
            Выберите способ связи
          </h2>
          <button
            type="button"
            aria-label="Закрыть"
            onClick={() => dialogRef.current?.close()}
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-black/60 transition hover:bg-black/5 hover:text-black focus-visible:outline-2 focus-visible:outline-dusty-grape"
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
            className="flex min-h-12 items-center justify-center gap-3 rounded-xl bg-dusty-grape px-4 py-3 font-semibold text-platinum transition hover:bg-dusty-grape/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dusty-grape"
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
            className="flex min-h-12 items-center justify-center gap-3 rounded-xl bg-dusty-grape px-4 py-3 font-semibold text-platinum transition hover:bg-dusty-grape/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dusty-grape"
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
