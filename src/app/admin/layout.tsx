import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ToastProvider } from "./_components/Toast";
import "./admin.css";

export const metadata: Metadata = {
  title: "Админка",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-soft-linnen font-primary min-h-dvh text-black">
      <ToastProvider>{children}</ToastProvider>
    </div>
  );
}
