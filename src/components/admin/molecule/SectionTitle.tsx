import type { ReactNode } from "react";
import Tip from "../atom/Tip";

type Props = {
  children: ReactNode;
  tip?: string;
};

/** Sub-section heading with an optional "?" explanation. */
function SectionTitle({ children, tip }: Props) {
  return (
    <h4 className="flex items-center gap-1.5 font-semibold">
      {children}
      {tip ? <Tip text={tip} /> : null}
    </h4>
  );
}

export default SectionTitle;
