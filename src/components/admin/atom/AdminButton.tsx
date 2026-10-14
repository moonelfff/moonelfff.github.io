import type { ButtonHTMLAttributes } from "react";
import Spinner from "@/components/atom/Spinner";
import Tooltip from "@/components/atom/Tooltip";

type Variant = "primary" | "secondary" | "danger" | "ghost";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-dusty-grape text-platinum hover:bg-dusty-grape/90",
  secondary:
    "border border-dusty-grape/40 bg-platinum text-dusty-grape hover:bg-dusty-grape/10",
  danger:
    "border border-danger/30 bg-platinum text-danger hover:bg-danger/10",
  ghost: "text-black/70 hover:bg-dusty-grape/10 hover:text-dusty-grape",
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  /** Square button that only shows an icon; `label` is used for accessibility. */
  icon?: boolean;
  label?: string;
  /** Shows a spinner instead of the leading icon and blocks clicks. */
  isLoading?: boolean;
};

function AdminButton({
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
}: Props) {
  const size = icon ? "size-11 md:size-9" : "min-h-11 px-4 md:min-h-10";
  const loading = isLoading
    ? "disabled:cursor-progress disabled:opacity-80"
    : "";

  const button = (
    <button
      type={type}
      aria-label={label}
      aria-busy={isLoading || undefined}
      disabled={disabled || isLoading}
      className={`focus-visible:outline-dusty-grape inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-40 ${loading} ${size} ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {isLoading ? <Spinner className="size-[18px]" /> : null}
      {children}
    </button>
  );

  const tooltipText = title ?? (icon ? label : undefined);
  return tooltipText ? (
    <Tooltip text={tooltipText} className="inline-flex shrink-0">
      {button}
    </Tooltip>
  ) : (
    button
  );
}

export default AdminButton;
