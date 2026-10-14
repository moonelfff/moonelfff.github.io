import type { InputHTMLAttributes } from "react";
import Typography from "@/components/atom/Typography";
import Tip from "../atom/Tip";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
  tip?: string;
};

function Checkbox({ label, tip, ...props }: Props) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-black/85 select-none">
      <input
        type="checkbox"
        className="accent-dusty-grape size-5 shrink-0 cursor-pointer"
        {...props}
      />
      <Typography component="span">{label}</Typography>
      {tip ? <Tip text={tip} /> : null}
    </label>
  );
}

export default Checkbox;
