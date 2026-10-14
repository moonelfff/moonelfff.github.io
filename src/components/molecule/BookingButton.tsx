"use client";

import { useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
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
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-white/60 bg-platinum/75 p-6 text-black shadow-[0_0_2px_1px_rgb(0_0_0_/_0.18)_inset,0_1.5rem_3rem_rgb(0_0_0_/_0.2)] backdrop-blur-[1.5rem] backdrop:bg-transparent backdrop:backdrop-blur-none"
      >
        <div className="flex items-center justify-between gap-4">
          <h2 id={headingId} className="text-lg leading-11 font-semibold">
            Выберите способ связи
          </h2>
          <button
            type="button"
            aria-label="Закрыть"
            onClick={() => dialogRef.current?.close()}
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-dusty-grape transition hover:bg-dusty-grape/10 focus-visible:outline-2 focus-visible:outline-dusty-grape"
          >
            <X size={18} strokeWidth={1.75} aria-hidden />
          </button>
        </div>
        <div className="mt-4 flex flex-col gap-3">
          <BookingChannelButton
            label={telegramLabel}
            href={telegramHref}
            icon={
              <TelegramIcon
                color="var(--color-platinum)"
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
                color="var(--color-platinum)"
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
