"use client";

import {
  cloneElement,
  isValidElement,
  useId,
  useRef,
  type ReactNode,
} from "react";
import { positionTooltip } from "./positionTooltip";

type Props = {
  text: string;
  children: ReactNode;
  className?: string;
};

function Tooltip({ text, children, className = "inline-flex" }: Props) {
  const id = useId();
  const triggerRef = useRef<HTMLSpanElement>(null);
  const bubbleRef = useRef<HTMLSpanElement>(null);

  const isOpen = () => bubbleRef.current?.matches(":popover-open") ?? false;

  const open = () => {
    const trigger = triggerRef.current;
    const bubble = bubbleRef.current;
    if (!trigger || !bubble || isOpen()) {
      return;
    }
    positionTooltip(bubble, trigger.getBoundingClientRect());
  };

  const close = () => {
    if (isOpen()) {
      bubbleRef.current?.hidePopover();
    }
  };

  const describedChild = isValidElement<{ "aria-describedby"?: string }>(
    children,
  )
    ? cloneElement(children, {
        "aria-describedby": [children.props["aria-describedby"], id]
          .filter(Boolean)
          .join(" "),
      })
    : children;

  return (
    <span
      ref={triggerRef}
      className={className}
      onPointerEnter={(event) => event.pointerType === "mouse" && open()}
      onPointerLeave={(event) => event.pointerType === "mouse" && close()}
      onFocusCapture={open}
      onBlurCapture={(event) => {
        if (
          !(event.relatedTarget instanceof Node) ||
          !event.currentTarget.contains(event.relatedTarget)
        ) {
          close();
        }
      }}
    >
      {describedChild}
      <span
        ref={bubbleRef}
        id={id}
        role="tooltip"
        popover="auto"
        className="tip-bubble text-platinum pointer-events-none fixed m-0 box-border rounded-xl border-0 px-3 py-2 text-xs leading-relaxed font-normal"
      >
        <span className="relative z-[1]">{text}</span>
      </span>
    </span>
  );
}

export default Tooltip;
