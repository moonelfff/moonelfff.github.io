import { CheckIcon, UndoIcon } from "@/assets/icons/admin";
import AdminButton from "../atom/AdminButton";

type Props = {
  isDirty: boolean;
  isSaving: boolean;
  onSave: () => void;
  onReset: () => void;
};

/** Sticky bottom bar with the unsaved-changes status and Save / Reset. */
function AdminSaveBar({ isDirty, isSaving, onSave, onReset }: Props) {
  const canSave = isDirty && !isSaving;

  return (
    <div className="border-alabaster-grey bg-platinum/95 fixed inset-x-0 bottom-0 z-30 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center gap-2 px-3 py-2.5 md:px-6">
        <p
          className="hidden min-w-0 flex-1 items-center gap-2 text-sm text-black/70 md:flex"
          aria-live="polite"
        >
          <span
            className={`size-2 shrink-0 rounded-full ${
              isDirty ? "bg-gold" : "bg-success"
            }`}
          />
          {isDirty ? "Есть несохранённые изменения" : "Все изменения сохранены"}
        </p>
        {isDirty ? (
          <span
            className="size-2.5 shrink-0 rounded-full bg-gold md:hidden"
            role="img"
            aria-label="Есть несохранённые изменения"
          />
        ) : null}

        <AdminButton disabled={!canSave} onClick={onReset}>
          <UndoIcon width={18} height={18} />
          <span className="max-md:sr-only">Отменить</span>
        </AdminButton>
        <AdminButton
          variant="primary"
          className="max-md:flex-1"
          disabled={!canSave}
          isLoading={isSaving}
          onClick={onSave}
        >
          {isSaving ? null : <CheckIcon width={18} height={18} />}
          Сохранить
        </AdminButton>
      </div>
    </div>
  );
}

export default AdminSaveBar;
