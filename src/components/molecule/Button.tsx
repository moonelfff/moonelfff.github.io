import NextLink from "next/link";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  href?: string;
  external?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "glass" | "outline" | "soft" | "success";
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  className?: string;
};

function Button({
  children,
  href,
  external,
  onClick,
  disabled,
  variant = "glass",
  icon,
  iconPosition = "right",
  className = "",
}: Props) {
  const label = (
    <span className="flex items-center justify-center gap-2 px-4 py-3 text-center text-sm font-semibold uppercase lg:px-6 lg:text-base">
      {icon && iconPosition === "left" ? icon : null}
      <span>{children}</span>
      {icon && iconPosition === "right" ? icon : null}
    </span>
  );

  const base = `block w-full lg:w-auto lg:min-w-48 ${
    disabled ? "pointer-events-none opacity-50" : ""
  } ${className}`;

  const inner =
    variant !== "outline" ? (
      <span
        className={`shadow-effect button-shadow text-platinum mt-2 block ${
          variant === "soft"
            ? "button-soft"
            : variant === "success"
              ? "button-success"
              : ""
        }`}
      >
        <span className="backdrop-glass button-glass block">{label}</span>
      </span>
    ) : (
      <span className="text-dusty-grape border-dusty-grape hover:bg-dusty-grape/10 mt-2 block rounded-xl border-2 transition-colors">
        {label}
      </span>
    );

  if (href) {
    return external ? (
      <a href={href} target="_blank" rel="noopener noreferrer" className={base}>
        {inner}
      </a>
    ) : (
      <NextLink href={href} className={base}>
        {inner}
      </NextLink>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${base} cursor-pointer`}
    >
      {inner}
    </button>
  );
}

export default Button;
