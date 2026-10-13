import { ArrowDownIcon, ArrowUpIcon, TrashIcon } from "@/assets/icons/admin";
import AdminButton from "../atom/AdminButton";

type RowActionsProps = {
  index: number;
  count: number;
  /** Accusative noun for accessible labels, e.g. "тариф". */
  noun: string;
  onMove: (fromIndex: number, toIndex: number) => void;
  onRemove: () => void;
};

/** Move up / move down / delete controls for an item in an ordered list. */
function RowActions({ index, count, noun, onMove, onRemove }: RowActionsProps) {
  return (
    <>
      <AdminButton
        icon
        variant="ghost"
        label={`Переместить ${noun} выше`}
        disabled={index === 0}
        onClick={() => onMove(index, index - 1)}
      >
        <ArrowUpIcon />
      </AdminButton>
      <AdminButton
        icon
        variant="ghost"
        label={`Переместить ${noun} ниже`}
        disabled={index === count - 1}
        onClick={() => onMove(index, index + 1)}
      >
        <ArrowDownIcon />
      </AdminButton>
      <AdminButton
        icon
        variant="ghost"
        label={`Удалить ${noun}`}
        onClick={onRemove}
      >
        <TrashIcon className="text-red-600" />
      </AdminButton>
    </>
  );
}

export default RowActions;
