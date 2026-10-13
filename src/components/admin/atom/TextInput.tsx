import type { InputHTMLAttributes } from "react";
import controlClass from "./controlClass";

function TextInput({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${controlClass} ${className}`} {...props} />;
}

export default TextInput;
