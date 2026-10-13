import type { ReactNode } from "react";
import { ChevronDownIcon } from "@/assets/icons/admin";

type Props = {
  summary: ReactNode;
  /** Controls rendered next to the summary (reorder, delete, ...). */
  actions?: ReactNode;
  defaultOpen?: boolean;
  isHighlighted?: boolean;
  children: ReactNode;
  className?: string;
};

/** Collapsible nested block built on native <details> for free a11y. */
function Collapsible({
  summary,
  actions,
  defaultOpen = false,
  isHighlighted = false,
  children,
  className = "",
}: Props) {
  const border = isHighlighted
    ? "border-dusty-grape/60 bg-dusty-grape/5"
    : "border-alabaster-grey";

  return (
    <details
      open={defaultOpen}
      className={`group bg-soft-linnen/40 rounded-xl border transition ${border} ${className}`}
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
      <div className="border-alabaster-grey flex flex-col gap-4 border-t p-3 md:p-4">
        {children}
      </div>
    </details>
  );
}

export default Collapsible;
