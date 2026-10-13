import type { ReactNode } from "react";

/** Tinted bordered block that groups the controls of one list item. */
function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`border-alabaster-grey bg-soft-linnen/40 flex flex-col gap-3 rounded-xl border p-3 ${className}`}
    >
      {children}
    </div>
  );
}

export default Panel;
