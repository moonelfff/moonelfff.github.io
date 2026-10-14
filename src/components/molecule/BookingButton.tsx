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
        className="booking-dialog m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border p-6 text-black"
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
