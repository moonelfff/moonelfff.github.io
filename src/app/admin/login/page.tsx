"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useToast } from "../_components/Toast";
import { Button, TextInput } from "../_components/ui";
import { errorMessage } from "../_lib/api";

export default function AdminLoginPage() {
  const router = useRouter();
  const toast = useToast();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(body?.error ?? "Неверный пароль");
      }

      router.replace("/admin");
      router.refresh();
    } catch (error) {
      toast.error(errorMessage(error, "Ошибка входа"));
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md items-center px-4 py-8">
      <div className="w-full rounded-2xl border border-alabaster-grey bg-platinum p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Вход в админку</h1>
        <p className="mt-2 text-sm text-black/65">Введите пароль администратора.</p>

        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-3">
          <TextInput
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Пароль"
            autoComplete="current-password"
            aria-label="Пароль"
            required
          />
          <Button type="submit" variant="primary" isLoading={loading}>
            Войти
          </Button>
        </form>
      </div>
    </main>
  );
}
