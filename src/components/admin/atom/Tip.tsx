"use client";

import { useState } from "react";

/** Round "?" button: the explanation shows on hover, focus or tap. */
function Tip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);

  return (
    <span className="group/tip relative inline-flex align-middle">
      <button
        type="button"
        aria-label="Пояснение"
        aria-expanded={open}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen((value) => !value);
        }}
        onBlur={() => setOpen(false)}
        onKeyDown={(event) => event.key === "Escape" && setOpen(false)}
        className="border-dusty-grape/40 text-dusty-grape hover:bg-dusty-grape/10 focus-visible:ring-dusty-grape/30 inline-flex size-5 cursor-help items-center justify-center rounded-full border text-xs leading-none font-semibold outline-none focus-visible:ring-2"
      >
        ?
      </button>
      <span
        role="tooltip"
        className={`tip-bubble text-platinum pointer-events-none absolute top-full left-0 z-40 mt-2 w-64 max-w-[calc(100vw-3rem)] rounded-xl px-3 py-2 text-xs leading-relaxed font-normal group-hover/tip:block ${open ? "block" : "hidden"}`}
      >
        {text}
      </span>
    </span>
  );
}

export default Tip;
