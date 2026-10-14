import type { SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import controlClass from "./controlClass";

function Select({
  className = "",
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <span className="relative block">
      <select
        className={`admin-select ${controlClass} ${className}`}
        {...props}
      />
      <ChevronDown
        size={18}
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-dusty-grape"
      />
    </span>
  );
}

export default Select;
