import type { ReactNode } from "react";

/** Small muted helper text. */
function Hint({ children }: { children: ReactNode }) {
  return <p className="text-xs text-black/55">{children}</p>;
}

export default Hint;
