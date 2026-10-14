"use client";

import { useId, useRef, type ReactNode } from "react";
import TelegramIcon from "@/assets/icons/TelegramIcon";
import VKIcon from "@/assets/icons/VKIcon";
import BookingChannelButton from "./BookingChannelButton";
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
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-white/35 bg-[rgb(0_0_0_/_0.55)] p-6 text-platinum shadow-[0_0_2px_1px_rgb(0_0_0_/_0.7)_inset,0_0_6px_2px_rgb(255_255_255_/_0.6)_inset] backdrop-blur-[1.5rem] backdrop:bg-transparent backdrop:backdrop-blur-none"
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
          <BookingChannelButton
            label={telegramLabel}
            href={telegramHref}
            icon={
              <TelegramIcon
                color="var(--color-dusty-grape)"
                width={24}
                height={24}
              />
            }
          />
          <BookingChannelButton
            label={vkLabel}
            href={vkHref}
            icon={
              <VKIcon
                color="var(--color-dusty-grape)"
                width={24}
                height={24}
              />
            }
          />
        </div>
      </dialog>
    </>
  );
}

export default BookingButton;
