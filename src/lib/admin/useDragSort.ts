import { useState, type DragEvent } from "react";

/** Mouse drag-and-drop reordering for one list (touch users use arrow buttons). */
export function useDragSort(
  onMove: (fromIndex: number, toIndex: number) => void,
) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const reset = () => {
    setDragIndex(null);
    setOverIndex(null);
  };

  return {
    isDragging: (index: number) => dragIndex === index,
    isDropTarget: (index: number) =>
      dragIndex !== null && overIndex === index && dragIndex !== index,

    /** Spread on the element the user grabs. */
    handleProps: (index: number) => ({
      draggable: true,
      onDragStart: (event: DragEvent<HTMLElement>) => {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", String(index));
        setDragIndex(index);
      },
      onDragEnd: reset,
    }),

    /** Spread on the element that accepts drops. */
    itemProps: (index: number) => ({
      onDragOver: (event: DragEvent<HTMLElement>) => {
        if (dragIndex === null) {
          return;
        }
        event.preventDefault();
        setOverIndex(index);
      },
      onDrop: (event: DragEvent<HTMLElement>) => {
        if (dragIndex === null) {
          return;
        }
        event.preventDefault();
        onMove(dragIndex, index);
        reset();
      },
    }),
  };
}
