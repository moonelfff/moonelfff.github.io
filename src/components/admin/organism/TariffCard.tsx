"use client";

import type { Dispatch, SetStateAction } from "react";
import { GripIcon, PlusIcon } from "@/assets/icons/admin";
import { updateDraft } from "@/lib/admin/draft";
import { moveItem } from "@/lib/admin/moveItem";
import { createPackage } from "@/lib/admin/tariffs";
import { useDragSort } from "@/lib/admin/useDragSort";
import { normalizeSlug } from "@/lib/slug";
import type { Tariff } from "@/lib/tariffStore";
import AdminButton from "../atom/AdminButton";
import TextInput from "../atom/TextInput";
import Checkbox from "../molecule/Checkbox";
import Collapsible from "../molecule/Collapsible";
import Field from "../molecule/Field";
import MarkdownEditor from "../molecule/MarkdownEditor";
import RowActions from "../molecule/RowActions";
import PackageRow from "./PackageRow";

type Props = {
  tariff: Tariff;
  index: number;
  count: number;
  dragSort: ReturnType<typeof useDragSort>;
  setTariffs: Dispatch<SetStateAction<Tariff[]>>;
};

/** One tariff: its details and the list of its packages. */
function TariffCard({ tariff, index, count, dragSort, setTariffs }: Props) {
  const packageDragSort = useDragSort((from, to) =>
    updateDraft(setTariffs, (draft) => {
      draft[index].packages = moveItem(draft[index].packages, from, to);
    }),
  );

  const editTariff = (recipe: (draft: Tariff) => void) =>
    updateDraft(setTariffs, (draft) => recipe(draft[index]));

  return (
    <div
      {...dragSort.itemProps(index)}
      className={dragSort.isDragging(index) ? "opacity-60" : ""}
    >
      <Collapsible
        isHighlighted={dragSort.isDropTarget(index)}
        summary={
          <span className="flex min-w-0 items-center gap-2">
            <span
              {...dragSort.handleProps(index)}
              className="hidden shrink-0 cursor-grab text-black/40 active:cursor-grabbing md:inline-flex"
              title="Перетащить тариф"
            >
              <GripIcon />
            </span>
            <span className="min-w-0">
              <span className="block truncate font-medium">
                {tariff.title || "Без названия"}
              </span>
              <span className="block text-xs text-black/55">
                Пакетов: {tariff.packages.length}
                {tariff.isActive ? "" : " · скрыт на сайте"}
              </span>
            </span>
          </span>
        }
        actions={
          <RowActions
            noun="тариф"
            index={index}
            count={count}
            onMove={(from, to) =>
              setTariffs((current) => moveItem(current, from, to))
            }
            onRemove={() =>
              setTariffs((current) => current.filter((_, i) => i !== index))
            }
          />
        }
      >
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Название">
            <TextInput
              value={tariff.title}
              onChange={(event) =>
                editTariff((draft) => {
                  draft.title = event.target.value;
                })
              }
            />
          </Field>
          <Field
            label="Адрес тарифа (slug)"
            hint="Только латиница, цифры и дефис, например online-session."
            tip="Последняя часть ссылки на тариф. Если изменить адрес, старая ссылка перестанет работать."
          >
            <TextInput
              value={tariff.slug}
              autoCapitalize="none"
              onChange={(event) =>
                editTariff((draft) => {
                  draft.slug = normalizeSlug(event.target.value);
                })
              }
            />
          </Field>
        </div>

        <Checkbox
          label="Показывать на сайте"
          tip="Если выключить, тариф останется в админке, но посетители сайта его не увидят. Удобно для черновиков."
          checked={tariff.isActive}
          onChange={(event) =>
            editTariff((draft) => {
              draft.isActive = event.target.checked;
            })
          }
        />

        <MarkdownEditor
          label="Описание (Markdown)"
          value={tariff.descriptionMarkdown}
          onChange={(value) =>
            editTariff((draft) => {
              draft.descriptionMarkdown = value;
            })
          }
        />

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold">Пакеты</h3>
            <AdminButton
              onClick={() =>
                editTariff((draft) => {
                  draft.packages.push(createPackage(draft.packages.length));
                })
              }
            >
              <PlusIcon width={18} height={18} />
              Добавить пакет
            </AdminButton>
          </div>

          {tariff.packages.map((pkg, packageIndex) => (
            <PackageRow
              key={pkg.id}
              pkg={pkg}
              index={packageIndex}
              count={tariff.packages.length}
              dragSort={packageDragSort}
              editPackage={(recipe) =>
                editTariff((draft) => recipe(draft.packages[packageIndex]))
              }
              onMove={(from, to) =>
                editTariff((draft) => {
                  draft.packages = moveItem(draft.packages, from, to);
                })
              }
              onRemove={() =>
                editTariff((draft) => {
                  draft.packages.splice(packageIndex, 1);
                })
              }
            />
          ))}
        </div>
      </Collapsible>
    </div>
  );
}

export default TariffCard;
