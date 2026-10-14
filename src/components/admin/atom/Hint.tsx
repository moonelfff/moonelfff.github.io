import type { ReactNode } from "react";
import Typography from "@/components/atom/Typography";

/** Small muted helper text. */
function Hint({ children }: { children: ReactNode }) {
  return (
    <Typography component="p" className="text-left text-xs text-black/55">
      {children}
    </Typography>
  );
}

export default Hint;
