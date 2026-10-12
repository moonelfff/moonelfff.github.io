import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { ChevronDownIcon } from "./icons";

// 16px font on mobile prevents iOS from zooming into focused inputs.
const controlClass =
  "w-full min-h-11 rounded-xl border border-black/15 bg-white px-3 py-2 text-base text-black outline-none transition placeholder:text-black/35 focus:border-dusty-grape focus:ring-2 focus:ring-dusty-grape/20 disabled:opacity-60 md:text-sm";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-dusty-grape text-white hover:bg-dusty-grape/90",
  secondary: "border border-black/15 bg-white text-black hover:bg-black/5",
  danger: "border border-red-200 bg-white text-red-700 hover:bg-red-50",
  ghost: "text-black/70 hover:bg-black/5 hover:text-black",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  /** Square button that only shows an icon; `label` is used for accessibility. */
  icon?: boolean;
  label?: string;
};

export function Button({
  variant = "secondary",
  icon = false,
  label,
  className = "",
  type = "button",
  title,
  ...props
}: ButtonProps) {
  const size = icon ? "size-11 md:size-9" : "min-h-11 px-4 md:min-h-10";
  return (
    <button
      type={type}
      aria-label={label}
      title={title ?? label}
      className={`focus-visible:outline-dusty-grape inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-40 ${size} ${BUTTON_VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}

type FieldProps = {
  label: string;
  hint?: string;
  className?: string;
  children: ReactNode;
};

export function Field({ label, hint, className = "", children }: FieldProps) {
  return (
    <label className={`flex min-w-0 flex-col gap-1.5 ${className}`}>
      <span className="text-sm font-medium text-black/80">{label}</span>
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
  return <select className={`${controlClass} ${className}`} {...props} />;
}

export function Checkbox({
  label,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { label: string }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-black/85 select-none">
      <input
        type="checkbox"
        className="accent-dusty-grape size-5 cursor-pointer"
        {...props}
      />
      {label}
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
    <section className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm md:p-5">
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
      className={`group rounded-xl border bg-black/[0.02] transition ${
        isHighlighted ? "border-dusty-grape/60 bg-dusty-grape/5" : "border-black/10"
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
      <div className="flex flex-col gap-4 border-t border-black/10 p-3 md:p-4">
        {children}
      </div>
    </details>
  );
}
