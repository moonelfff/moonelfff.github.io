import type { ReactNode } from "react";

type Props = {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
};

/** Top-level page block with a heading and optional action buttons. */
function AdminCard({ title, description, actions, children }: Props) {
  return (
    <section className="border-alabaster-grey bg-platinum rounded-2xl border p-4 shadow-sm md:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold">{title}</h2>
          {description ? (
            <p className="mt-0.5 text-sm text-black/60">{description}</p>
          ) : null}
        </div>
        {actions}
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

export default AdminCard;
