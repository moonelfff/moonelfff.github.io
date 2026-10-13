"use client";

import { useId, useRef } from "react";

const VIEWPORT_GAP = 12;
const BUBBLE_OFFSET = 8;

/**
 * Round "?" button with a native Popover API bubble. The bubble lives in the
 * top layer, so it never affects page width and closes on Escape or outside tap.
 * Mouse: hover. Touch and keyboard: tap / Enter.
 */
function Tip({ text }: { text: string }) {
  const id = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const bubbleRef = useRef<HTMLSpanElement>(null);
  const pointerType = useRef("");
  const wasOpen = useRef(false);

  const isOpen = () => bubbleRef.current?.matches(":popover-open") ?? false;

  const open = () => {
    const button = buttonRef.current;
    const bubble = bubbleRef.current;
    if (!button || !bubble || isOpen()) {
      return;
    }

    bubble.showPopover();
    const anchor = button.getBoundingClientRect();
    const { width, height } = bubble.getBoundingClientRect();
    const maxLeft = window.innerWidth - width - VIEWPORT_GAP;
    const fitsBelow =
      anchor.bottom + BUBBLE_OFFSET + height <=
      window.innerHeight - VIEWPORT_GAP;

    bubble.style.left = `${Math.max(VIEWPORT_GAP, Math.min(anchor.left, maxLeft))}px`;
    bubble.style.top = `${fitsBelow ? anchor.bottom + BUBBLE_OFFSET : Math.max(VIEWPORT_GAP, anchor.top - BUBBLE_OFFSET - height)}px`;
  };

  const close = () => {
    if (isOpen()) {
      bubbleRef.current?.hidePopover();
    }
  };

  return (
    <span className="relative inline-flex align-middle">
      <button
        ref={buttonRef}
        type="button"
        aria-label="Пояснение"
        aria-describedby={id}
        onPointerDown={(event) => {
          pointerType.current = event.pointerType;
          wasOpen.current = isOpen();
        }}
        onPointerEnter={(event) => event.pointerType === "mouse" && open()}
        onPointerLeave={(event) => event.pointerType === "mouse" && close()}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          if (pointerType.current === "mouse") {
            open();
          } else if (isOpen()) {
            close();
          } else {
            open();
          }
          pointerType.current = "";
        }}
        className="border-dusty-grape/40 text-dusty-grape hover:bg-dusty-grape/10 focus-visible:ring-dusty-grape/30 inline-flex size-5 cursor-help items-center justify-center rounded-full border text-xs leading-none font-semibold outline-none focus-visible:ring-2"
      >
        ?
      </button>
      <span
        ref={bubbleRef}
        id={id}
        role="tooltip"
        popover="auto"
        className="tip-bubble text-platinum fixed m-0 w-64 max-w-[calc(100vw-1.5rem)] rounded-xl border-0 px-3 py-2 text-xs leading-relaxed font-normal"
      >
        {text}
      </span>
    </span>
  );
}

export default Tip;
