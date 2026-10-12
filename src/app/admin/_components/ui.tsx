"use client";

import { useState } from "react";
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import Spinner from "@/components/atom/Spinner";
import { ChevronDownIcon } from "./icons";

// 16px font on mobile prevents iOS from zooming into focused inputs.
const controlClass =
  "w-full min-h-11 rounded-xl border border-alabaster-grey bg-platinum px-3 py-2 text-base text-black outline-none transition placeholder:text-black/35 focus:border-dusty-grape focus:ring-2 focus:ring-dusty-grape/20 disabled:opacity-60 md:text-sm";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-dusty-grape text-platinum hover:bg-dusty-grape/90",
  secondary:
    "border border-dusty-grape/40 bg-platinum text-dusty-grape hover:bg-dusty-grape/10",
  danger: "border border-red-200 bg-platinum text-red-700 hover:bg-red-50",
  ghost: "text-black/70 hover:bg-dusty-grape/10 hover:text-dusty-grape",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  /** Square button that only shows an icon; `label` is used for accessibility. */
  icon?: boolean;
  label?: string;
  /** Shows a spinner instead of the leading icon and blocks clicks. */
  isLoading?: boolean;
};

export function Button({
  variant = "secondary",
  icon = false,
  label,
  isLoading = false,
  className = "",
  type = "button",
  title,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const size = icon ? "size-11 md:size-9" : "min-h-11 px-4 md:min-h-10";
  return (
    <button
      type={type}
      aria-label={label}
      aria-busy={isLoading || undefined}
      title={title ?? label}
      disabled={disabled || isLoading}
      className={`focus-visible:outline-dusty-grape inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-40 ${isLoading ? "disabled:cursor-progress disabled:opacity-80" : ""} ${size} ${BUTTON_VARIANTS[variant]} ${className}`}
      {...props}
    >
      {isLoading ? <Spinner className="size-[18px]" /> : null}
      {children}
    </button>
  );
}

/** Round "?" button: the explanation shows on hover, focus or tap. */
export function Tip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="group relative inline-flex align-middle">
      <button
        type="button"
        aria-label="Пояснение"
        aria-expanded={open}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        className="border-dusty-grape/40 text-dusty-grape hover:bg-dusty-grape/10 focus-visible:ring-dusty-grape/30 inline-flex size-5 cursor-help items-center justify-center rounded-full border text-xs leading-none font-semibold outline-none focus-visible:ring-2"
      >
        ?
      </button>
      <span
        role="tooltip"
        className={`pointer-events-none absolute top-full left-0 z-40 mt-2 w-64 max-w-[calc(100vw-3rem)] rounded-xl bg-black px-3 py-2 text-xs leading-relaxed font-normal text-white shadow-lg group-hover:block ${open ? "block" : "hidden"}`}
      >
        {text}
      </span>
    </span>
  );
}

type FieldProps = {
  label: string;
  hint?: string;
  /** Plain-language explanation shown in a tooltip next to the label. */
  tip?: string;
  className?: string;
  children: ReactNode;
};

export function Field({
  label,
  hint,
  tip,
  className = "",
  children,
}: FieldProps) {
  return (
    <label className={`flex min-w-0 flex-col gap-1.5 ${className}`}>
      <span className="flex items-center gap-1.5 text-sm font-medium text-black/80">
        {label}
        {tip ? <Tip text={tip} /> : null}
      </span>
      {children}
      {hint ? <span className="text-xs text-black/55">{hint}</span> : null}
    </label>
  );
}

export function TextInput({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${controlClass} ${className}`} {...props} />;
}

export function TextArea({
  className = "",
  mono = false,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { mono?: boolean }) {
  return (
    <textarea
      className={`${controlClass} resize-y ${mono ? "font-mono" : ""} ${className}`}
      spellCheck={mono ? false : undefined}
      {...props}
    />
  );
}

export function Select({
  className = "",
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`admin-select ${controlClass} ${className}`}
      {...props}
    />
  );
}

export function Checkbox({
  label,
  tip,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
  tip?: string;
}) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-black/85 select-none">
      <input
        type="checkbox"
        className="accent-dusty-grape size-5 shrink-0 cursor-pointer"
        {...props}
      />
      <span>{label}</span>
      {tip ? <Tip text={tip} /> : null}
    </label>
  );
}

type CardProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
};

/** Top-level page block with a heading and optional action buttons. */
export function Card({ title, description, actions, children }: CardProps) {
  return (
    <section className="rounded-2xl border border-alabaster-grey bg-platinum p-4 shadow-sm md:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold">{title}</h2>
          {description ? (
            <p className="mt-0.5 text-sm text-black/60">{description}</p>
          ) : null}
        </div>
        {actions}
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

type CollapsibleProps = {
  summary: ReactNode;
  /** Controls rendered next to the summary (reorder, delete, ...). */
  actions?: ReactNode;
  defaultOpen?: boolean;
  isHighlighted?: boolean;
  children: ReactNode;
  className?: string;
};

/** Collapsible nested block built on native <details> for free a11y. */
export function Collapsible({
  summary,
  actions,
  defaultOpen = false,
  isHighlighted = false,
  children,
  className = "",
}: CollapsibleProps) {
  return (
    <details
      open={defaultOpen}
      className={`group rounded-xl       border bg-soft-linnen/40 transition ${
              isHighlighted ? "border-dusty-grape/60 bg-dusty-grape/5" : "border-alabaster-grey"
      } ${className}`}
    >
      <summary className="flex cursor-pointer list-none items-center gap-2 p-2 pl-3 marker:hidden [&::-webkit-details-marker]:hidden">
        <span className="min-w-0 flex-1">{summary}</span>
        <span
          className="flex items-center gap-1"
          onClick={(event) => event.preventDefault()}
        >
          {actions}
        </span>
        <ChevronDownIcon className="shrink-0 text-black/50 transition-transform group-open:rotate-180" />
      </summary>
      <div className="flex flex-col gap-4 border-t border-alabaster-grey p-3 md:p-4">
        {children}
      </div>
    </details>
  );
}
