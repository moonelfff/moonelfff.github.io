import NextLink from "next/link";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  href?: string;
  external?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "glass" | "outline";
  className?: string;
};

function Button({
  children,
  href,
  external,
  onClick,
  disabled,
  variant = "glass",
  className = "",
}: Props) {
  const label = (
    <span className="block px-6 py-3 text-center text-sm font-semibold uppercase lg:text-base">
      {children}
    </span>
  );

  const base = `block w-full lg:w-auto lg:min-w-48 ${
    disabled ? "pointer-events-none opacity-50" : ""
  } ${className}`;

  const inner =
    variant === "glass" ? (
      <span className="shadow-effect button-shadow text-platinum mt-2 block">
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
