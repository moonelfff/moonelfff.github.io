import type { TextareaHTMLAttributes } from "react";
import controlClass from "./controlClass";

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & { mono?: boolean };

function TextArea({ className = "", mono = false, ...props }: Props) {
  return (
    <textarea
      className={`${controlClass} resize-y ${mono ? "font-mono" : ""} ${className}`}
      spellCheck={mono ? false : undefined}
      {...props}
    />
  );
}

export default TextArea;
