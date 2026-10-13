"use client";

import AdminButton from "../atom/AdminButton";

type Props = {
  message: string;
  onRetry: () => void;
};

/** Shown instead of a page body when its data failed to load. */
function AdminLoadError({ message, onRetry }: Props) {
  return (
    <div className="bg-platinum flex flex-col items-start gap-3 rounded-2xl border border-red-200 p-4">
      <p className="text-sm">{message}</p>
      <AdminButton onClick={onRetry}>Повторить</AdminButton>
    </div>
  );
}

export default AdminLoadError;
