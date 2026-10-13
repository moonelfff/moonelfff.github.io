"use client";

import { GripIcon } from "@/assets/icons/admin";
import type { useDragSort } from "@/lib/admin/useDragSort";
import type { TariffPackage } from "@/lib/tariffStore";
import TextInput from "../atom/TextInput";
import Field from "../molecule/Field";
import RowActions from "../molecule/RowActions";

type Props = {
  pkg: TariffPackage;
  index: number;
  count: number;
  dragSort: ReturnType<typeof useDragSort>;
  editPackage: (recipe: (draft: TariffPackage) => void) => void;
  onMove: (from: number, to: number) => void;
  onRemove: () => void;
};

/** One price package of a tariff: name, price, discounted price and currency. */
function PackageRow({
  pkg,
  index,
  count,
  dragSort,
  editPackage,
  onMove,
  onRemove,
}: Props) {
  const border = dragSort.isDropTarget(index)
    ? "border-dusty-grape/60"
    : "border-alabaster-grey";
  const dragging = dragSort.isDragging(index) ? "opacity-60" : "";

  return (
    <div
      {...dragSort.itemProps(index)}
      className={`bg-platinum rounded-xl border p-3 transition ${border} ${dragging}`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-medium text-black/70">
          <span
            {...dragSort.handleProps(index)}
            className="hidden cursor-grab text-black/40 active:cursor-grabbing md:inline-flex"
            title="Перетащить пакет"
          >
            <GripIcon />
          </span>
          Пакет {index + 1}
        </span>
        <div className="flex items-center gap-1">
          <RowActions
            noun="пакет"
            index={index}
            count={count}
            onMove={onMove}
            onRemove={onRemove}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Field label="Название" className="col-span-2 md:col-span-1">
          <TextInput
            value={pkg.title}
            onChange={(event) =>
              editPackage((draft) => {
                draft.title = event.target.value;
              })
            }
          />
        </Field>
        <Field
          label="Цена"
          tip="Обычная цена пакета в выбранной валюте, целым числом."
        >
          <TextInput
            type="number"
            inputMode="numeric"
            min={0}
            value={pkg.regularAmount}
            onChange={(event) =>
              editPackage((draft) => {
                draft.regularAmount = Number(event.target.value);
              })
            }
          />
        </Field>
        <Field
          label="Цена со скидкой"
          tip="Если заполнить, на сайте обычная цена будет зачёркнута, а эта показана как актуальная. Оставьте пустым, если скидки нет."
        >
          <TextInput
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="Нет"
            value={pkg.discountedAmount ?? ""}
            onChange={(event) =>
              editPackage((draft) => {
                draft.discountedAmount =
                  event.target.value === "" ? null : Number(event.target.value);
              })
            }
          />
        </Field>
        <Field label="Валюта" tip="Код или знак валюты, например RUB или ₽.">
          <TextInput
            value={pkg.currency}
            onChange={(event) =>
              editPackage((draft) => {
                draft.currency = event.target.value;
              })
            }
          />
        </Field>
      </div>
    </div>
  );
}

export default PackageRow;
