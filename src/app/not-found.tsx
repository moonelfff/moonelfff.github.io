import type { Metadata } from "next";
import NotFoundPage from "@/components/organism/NotFoundPage";

export const metadata: Metadata = {
  title: "Страница не найдена | Екатерина Жук",
  description: "Такой страницы нет. Вернитесь на главную страницу сайта Екатерины Жук.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return <NotFoundPage />;
}
