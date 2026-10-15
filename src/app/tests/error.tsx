"use client";

import { useEffect } from "react";
import Typography from "@/components/atom/Typography";
import Button from "@/components/molecule/Button";

export default function TestsError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    console.error("Failed to load tests", error);
  }, [error]);

  return (
    <main className="bg-platinum font-primary min-h-dvh px-3 py-3 md:px-12 xl:px-24 2xl:px-60">
      <div role="alert" className="mx-auto flex max-w-4xl flex-col gap-4">
        <Typography component="h1">Не удалось загрузить тест</Typography>
        <Typography component="p">
          Проверьте подключение к интернету и попробуйте ещё раз.
        </Typography>
        <Button onClick={() => window.location.reload()}>
          Перезагрузить страницу
        </Button>
      </div>
    </main>
  );
}
