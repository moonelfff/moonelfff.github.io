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
      onClick={open}
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
        className="tip-bubble pointer-events-none fixed m-0 box-border w-max max-w-80 max-h-[calc(100dvh-1.5rem)] overflow-x-hidden overflow-y-auto [overflow-wrap:anywhere] rounded-xl border-0 bg-[rgb(110_68_194_/_0.85)] px-3 py-2 text-xs leading-relaxed font-normal text-platinum opacity-0 isolate backdrop-blur-[1.5rem] shadow-[0_0_2px_1px_rgb(0_0_0_/_0.5)_inset,0_0_6px_2px_rgb(255_255_255_/_0.5)_inset,0_0.5rem_1.5rem_rgb(40_20_90_/_0.25)] transition-[opacity,transform,display,overlay] transition-discrete duration-150 ease-out motion-reduce:transition-none"
      >
        <span className="relative z-[1]">{text}</span>
      </span>
    </span>
  );
}

export default Tooltip;
