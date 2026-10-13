import type { ReactNode } from "react";
import Tip from "../atom/Tip";

type Props = {
  label: string;
  hint?: string;
  /** Plain-language explanation shown in a tooltip next to the label. */
  tip?: string;
  className?: string;
  children: ReactNode;
};

function Field({ label, hint, tip, className = "", children }: Props) {
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

export default Field;
