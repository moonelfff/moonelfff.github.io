import NextLink from "next/link";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  href?: string;
  external?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "glass" | "outline" | "soft" | "success" | "solid" | "tonal";
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  className?: string;
  solidBackground?: "light" | "dusty-grape";
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
  solidBackground = "light",
}: Props) {
  const label = (
    <span className="flex items-center justify-center gap-2 px-4 py-3 text-center text-sm font-semibold uppercase lg:px-6 lg:text-base">
      {icon && iconPosition === "left" ? icon : null}
      <span>{children}</span>
      {icon && iconPosition === "right" ? (
        <span className="transition-transform duration-300 group-hover/btn:translate-x-1">
          {icon}
        </span>
      ) : null}
    </span>
  );

  const base = `block w-full lg:w-auto lg:min-w-48 ${
    disabled ? "pointer-events-none opacity-50" : ""
  } ${className}`;

  const flat = variant === "solid" || variant === "tonal";
  const inner = flat ? (
    <span
      className={`button-grain button-flat group/btn mt-2 block border-2 ${variant === "solid" ? "button-flat--pill rounded-full" : "rounded-xl"} ${
        variant === "solid"
          ? `text-platinum border-white/35 shadow-[inset_0_1px_0_rgb(255_255_255/0.35)] ${
              solidBackground === "dusty-grape"
                ? "[--btn-bg-hover:rgb(110_68_194/0.9)] [--btn-bg:rgb(110_68_194)]"
                : "[--btn-bg-hover:rgb(255_255_255/0.3)] [--btn-bg:rgb(255_255_255/0.16)]"
            }`
          : "text-dusty-grape [--btn-bg-hover:rgb(110_68_194/0.22)] [--btn-bg:rgb(110_68_194/0.1)] border-transparent"
      }`}
    >
      {label}
    </span>
  ) : variant !== "outline" ? (
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
    <span className="button-grain button-grain--subtle button-flat button-flat--outline text-dusty-grape border-dusty-grape mt-2 block rounded-xl border-2 [--btn-bg-hover:rgb(110_68_194/0.18)] [--btn-bg:transparent]">
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
