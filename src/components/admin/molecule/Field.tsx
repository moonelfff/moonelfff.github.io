import type { ReactNode } from "react";
import Typography from "@/components/atom/Typography";
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
      <Typography
        component="span"
        className="flex items-center gap-1.5 text-sm font-medium text-black/80"
      >
        {label}
        {tip ? <Tip text={tip} /> : null}
      </Typography>
      {children}
      {hint ? (
        <Typography component="span" className="text-xs text-black/55">
          {hint}
        </Typography>
      ) : null}
    </label>
  );
}

export default Field;
