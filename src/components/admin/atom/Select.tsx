import type { SelectHTMLAttributes } from "react";
import controlClass from "./controlClass";

function Select({
  className = "",
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`admin-select ${controlClass} ${className}`}
      {...props}
    />
  );
}

export default Select;
