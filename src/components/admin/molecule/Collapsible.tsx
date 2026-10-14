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

/** Shared accessible accordion surface for admin sections and editable rows. */
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
      className={`admin-accordion overflow-hidden rounded-xl border bg-soft-linnen/40 transition-colors duration-200 ${border} ${className}`}
    >
      <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 rounded-xl px-3 py-2 transition-colors hover:bg-dusty-grape/5 focus-visible:outline-dusty-grape focus-visible:outline-2 focus-visible:outline-offset-[-2px] marker:hidden [&::-webkit-details-marker]:hidden">
        <span className="min-w-0 flex-1">{summary}</span>
        <span
          className="flex items-center gap-1"
          onClick={(event) => event.preventDefault()}
        >
          {actions}
        </span>
        <ChevronDownIcon className="admin-accordion-chevron size-5 shrink-0 text-dusty-grape" />
      </summary>
      <div className="border-alabaster-grey flex flex-col gap-4 border-t p-3 md:p-4">
        {children}
      </div>
    </details>
  );
}

export default Collapsible;
