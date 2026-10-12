import type { ReactNode } from "react";

type AdminSectionProps = {
  title: string;
  collapsed: boolean;
  onToggle: () => void;
  actions?: ReactNode;
  children: ReactNode;
};

export function AdminSection({
  title,
  collapsed,
  onToggle,
  actions,
  children,
}: AdminSectionProps) {
  return (
    <section className="shadow-effect shadow-effect-offset mt-2">
      <div className="backdrop-glass backdrop-glass-offset text-platinum rounded-2xl p-5 md:rounded-3xl md:p-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={onToggle}
            className="inline-flex cursor-pointer items-center gap-2 text-left"
            aria-expanded={!collapsed}
          >
            <span className="text-lg font-medium">{title}</span>
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className={`text-platinum/75 transition-transform duration-500 ease-in-out ${
                collapsed ? "rotate-0" : "rotate-180"
              }`}
              aria-hidden="true"
            >
              <path
                d="M5 7.5L10 12.5L15 7.5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <div className="flex items-center gap-2">{actions}</div>
        </div>

        <div
          className={`grid transition-all duration-500 ease-in-out ${
            collapsed
              ? "grid-rows-[0fr] opacity-0"
              : "grid-rows-[1fr] opacity-100"
          }`}
        >
          <div className="overflow-hidden">
            <div className="space-y-2 pt-0.5 md:space-y-4 md:pt-1">
              {children}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
