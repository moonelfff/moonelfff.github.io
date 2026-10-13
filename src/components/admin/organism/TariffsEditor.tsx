"use client";

import type { Dispatch, SetStateAction } from "react";
import { PlusIcon } from "@/assets/icons/admin";
import { moveItem } from "@/lib/admin/moveItem";
import { createTariff } from "@/lib/admin/tariffs";
import { useDragSort } from "@/lib/admin/useDragSort";
import type { Tariff } from "@/lib/tariffStore";
import AdminButton from "../atom/AdminButton";
import AdminCard from "../molecule/AdminCard";
import TariffCard from "./TariffCard";

type Props = {
  tariffs: Tariff[];
  setTariffs: Dispatch<SetStateAction<Tariff[]>>;
};

/** Ordered list of tariffs with drag-and-drop sorting. */
function TariffsEditor({ tariffs, setTariffs }: Props) {
  const dragSort = useDragSort((from, to) =>
    setTariffs((current) => moveItem(current, from, to)),
  );

  return (
    <AdminCard
      title="Тарифы"
      description="Тарифы идут на сайте в том же порядке, что и здесь. Меняйте порядок стрелками."
      actions={
        <AdminButton
          onClick={() =>
            setTariffs((current) => [...current, createTariff(current.length)])
          }
        >
          <PlusIcon width={18} height={18} />
          Добавить тариф
        </AdminButton>
      }
    >
      {tariffs.length === 0 ? (
        <p className="text-sm text-black/55">Тарифов пока нет.</p>
      ) : null}

      {tariffs.map((tariff, index) => (
        <TariffCard
          key={tariff.id}
          tariff={tariff}
          index={index}
          count={tariffs.length}
          dragSort={dragSort}
          setTariffs={setTariffs}
        />
      ))}
    </AdminCard>
  );
}

export default TariffsEditor;
