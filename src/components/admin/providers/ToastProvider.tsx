"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  AlertIcon,
  CheckIcon,
  CloseIcon,
  InfoIcon,
} from "@/assets/icons/admin";

type ToastKind = "success" | "error" | "info";

type ToastItem = { id: number; kind: ToastKind; message: string };

type ToastApi = {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
};

const DURATION_MS: Record<ToastKind, number> = {
  success: 4000,
  info: 4000,
  error: 8000,
};

const MAX_VISIBLE_TOASTS = 3;

const KIND_STYLES: Record<
  ToastKind,
  { accent: string; Icon: typeof CheckIcon }
> = {
  success: { accent: "border-l-success text-success-dark", Icon: CheckIcon },
  error: { accent: "border-l-danger text-danger", Icon: AlertIcon },
  info: { accent: "border-l-dusty-grape text-dusty-grape", Icon: InfoIcon },
};

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const api = useContext(ToastContext);
  if (!api) {
    throw new Error("useToast must be used inside <ToastProvider>");
  }
  return api;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback(
    (kind: ToastKind, message: string) => {
      const id = nextId.current++;
      setToasts((current) =>
        [...current, { id, kind, message }].slice(-MAX_VISIBLE_TOASTS),
      );
      window.setTimeout(() => dismiss(id), DURATION_MS[kind]);
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(
    () => ({
      success: (message) => show("success", message),
      error: (message) => show("error", message),
      info: (message) => show("info", message),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex flex-col items-center gap-2 px-3 pt-[max(0.75rem,env(safe-area-inset-top))]"
      >
        {toasts.map(({ id, kind, message }) => {
          const { accent, Icon } = KIND_STYLES[kind];
          return (
            <div
              key={id}
              role={kind === "error" ? "alert" : "status"}
              className={`admin-toast pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-xl border border-l-4 border-alabaster-grey bg-platinum p-3 shadow-lg ${accent}`}
            >
              <Icon className="mt-0.5 shrink-0" />
              <p className="min-w-0 flex-1 text-sm whitespace-pre-line text-black">
                {message}
              </p>
              <button
                type="button"
                onClick={() => dismiss(id)}
                aria-label="Закрыть уведомление"
                className="-m-1 inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-dusty-grape transition hover:bg-dusty-grape/10"
              >
                <CloseIcon width={16} height={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
