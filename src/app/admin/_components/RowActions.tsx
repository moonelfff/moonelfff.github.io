import { Button } from "./ui";
import { ArrowDownIcon, ArrowUpIcon, TrashIcon } from "./icons";

type RowActionsProps = {
  index: number;
  count: number;
  /** Accusative noun for accessible labels, e.g. "тариф". */
  noun: string;
  onMove: (fromIndex: number, toIndex: number) => void;
  onRemove: () => void;
};

/** Move up / move down / delete controls for an item in an ordered list. */
export function RowActions({ index, count, noun, onMove, onRemove }: RowActionsProps) {
  return (
    <>
      <Button
        icon
        variant="ghost"
        label={`Переместить ${noun} выше`}
        disabled={index === 0}
        onClick={() => onMove(index, index - 1)}
      >
        <ArrowUpIcon />
      </Button>
      <Button
        icon
        variant="ghost"
        label={`Переместить ${noun} ниже`}
        disabled={index === count - 1}
        onClick={() => onMove(index, index + 1)}
      >
        <ArrowDownIcon />
      </Button>
      <Button icon variant="ghost" label={`Удалить ${noun}`} onClick={onRemove}>
        <TrashIcon className="text-red-600" />
      </Button>
    </>
  );
}
