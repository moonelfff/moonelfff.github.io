const VIEWPORT_GAP = 12;
const BUBBLE_OFFSET = 8;
const MAX_BUBBLE_WIDTH = 256;

export function positionTooltip(bubble: HTMLElement, anchor: DOMRect): void {
  const viewport = window.visualViewport;
  const viewportLeft = viewport?.offsetLeft ?? 0;
  const viewportTop = viewport?.offsetTop ?? 0;
  const viewportWidth = viewport?.width ?? window.innerWidth;
  const viewportHeight = viewport?.height ?? window.innerHeight;

  bubble.style.inset = "auto";
  bubble.style.right = "auto";
  bubble.style.bottom = "auto";
  bubble.style.width = `${Math.max(1, Math.min(MAX_BUBBLE_WIDTH, viewportWidth - VIEWPORT_GAP * 2))}px`;
  bubble.style.maxHeight = `${Math.max(1, viewportHeight - VIEWPORT_GAP * 2)}px`;
  bubble.style.overflowWrap = "anywhere";
  bubble.style.overflowY = "auto";
  bubble.showPopover();

  const { width, height } = bubble.getBoundingClientRect();
  const minLeft = viewportLeft + VIEWPORT_GAP;
  const maxLeft = Math.max(
    minLeft,
    viewportLeft + viewportWidth - width - VIEWPORT_GAP,
  );
  const fitsBelow =
    anchor.bottom + BUBBLE_OFFSET + height <=
    viewportTop + viewportHeight - VIEWPORT_GAP;

  bubble.style.left = `${Math.max(minLeft, Math.min(anchor.left, maxLeft))}px`;
  bubble.style.top = `${fitsBelow ? anchor.bottom + BUBBLE_OFFSET : Math.max(viewportTop + VIEWPORT_GAP, anchor.top - BUBBLE_OFFSET - height)}px`;
}
