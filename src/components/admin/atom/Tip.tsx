"use client";

import Tooltip from "@/components/atom/Tooltip";

/**
 * Round "?" button with the shared site tooltip behavior and appearance.
 */
function Tip({ text }: { text: string }) {
  return (
    <Tooltip text={text} className="relative inline-flex align-middle">
      <button
        type="button"
        aria-label="Пояснение"
        className="border-dusty-grape/40 text-dusty-grape hover:bg-dusty-grape/10 focus-visible:ring-dusty-grape/30 inline-flex size-5 cursor-help items-center justify-center rounded-full border text-xs leading-none font-semibold outline-none focus-visible:ring-2"
      >
        ?
      </button>
    </Tooltip>
  );
}

export default Tip;
