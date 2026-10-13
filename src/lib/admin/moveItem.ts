/** Returns a copy of `items` with the element moved; out-of-range moves are ignored. */
export function moveItem<T>(
  items: T[],
  fromIndex: number,
  toIndex: number,
): T[] {
  const inRange = (index: number) => index >= 0 && index < items.length;
  if (fromIndex === toIndex || !inRange(fromIndex) || !inRange(toIndex)) {
    return items;
  }

  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}
