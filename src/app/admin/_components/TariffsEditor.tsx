"use client";

import type { Dispatch, SetStateAction } from "react";
import type { Tariff, TariffPackage } from "@/lib/tariffStore";
import { normalizeSlug } from "@/lib/slug";
import { updateDraft } from "../_lib/draft";
import { moveItem } from "../_lib/moveItem";
import { createPackage, createTariff } from "../_lib/tariffs";
import { useDragSort } from "../_lib/useDragSort";
import { GripIcon, PlusIcon } from "./icons";
import { MarkdownEditor } from "./MarkdownEditor";
import { RowActions } from "./RowActions";
import { Button, Card, Checkbox, Collapsible, Field, TextInput } from "./ui";

type TariffsEditorProps = {
  tariffs: Tariff[];
  setTariffs: Dispatch<SetStateAction<Tariff[]>>;
};

export function TariffsEditor({ tariffs, setTariffs }: TariffsEditorProps) {
  const dragSort = useDragSort((from, to) =>
    setTariffs((current) => moveItem(current, from, to)),
  );

  return (
    <Card
      title="Тарифы"
      description="Порядок здесь совпадает с порядком на сайте."
      actions={
        <Button
          onClick={() =>
            setTariffs((current) => [...current, createTariff(current.length)])
          }
        >
          <PlusIcon width={18} height={18} />
          Добавить тариф
        </Button>
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
    </Card>
  );
}

type TariffCardProps = {
  tariff: Tariff;
  index: number;
  count: number;
  dragSort: ReturnType<typeof useDragSort>;
  setTariffs: Dispatch<SetStateAction<Tariff[]>>;
};

function TariffCard({ tariff, index, count, dragSort, setTariffs }: TariffCardProps) {
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
            onMove={(from, to) => setTariffs((current) => moveItem(current, from, to))}
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
          <Field label="Slug" hint="Латиница, цифры и дефис. Используется в адресе.">
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
            <Button
              onClick={() =>
                editTariff((draft) => {
                  draft.packages.push(createPackage(draft.packages.length));
                })
              }
            >
              <PlusIcon width={18} height={18} />
              Добавить пакет
            </Button>
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

type PackageRowProps = {
  pkg: TariffPackage;
  index: number;
  count: number;
  dragSort: ReturnType<typeof useDragSort>;
  editPackage: (recipe: (draft: TariffPackage) => void) => void;
  onMove: (from: number, to: number) => void;
  onRemove: () => void;
};

function PackageRow({
  pkg,
  index,
  count,
  dragSort,
  editPackage,
  onMove,
  onRemove,
}: PackageRowProps) {
  return (
    <div
      {...dragSort.itemProps(index)}
      className={`rounded-xl       border bg-platinum p-3 transition ${
              dragSort.isDropTarget(index) ? "border-dusty-grape/60" : "border-alabaster-grey"
      } ${dragSort.isDragging(index) ? "opacity-60" : ""}`}
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
        <Field label="Цена">
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
        <Field label="Цена со скидкой">
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
        <Field label="Валюта">
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
