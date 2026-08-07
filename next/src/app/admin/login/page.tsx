"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error ?? "Ошибка входа");
      setLoading(false);
      return;
    }

    router.replace("/admin");
    router.refresh();
  };

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl items-center px-4 py-8">
      <div className="w-full rounded-3xl border border-black/20 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Вход в админку</h1>
        <p className="mt-2 text-sm text-black/70">
          Введите пароль администратора из переменной окружения ADMIN_PASSWORD.
        </p>

        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-3">
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Пароль"
            className="rounded-xl border border-black/20 px-4 py-3 outline-none focus:border-black"
            required
          />

          {error ? <p className="text-sm text-red-700">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-black px-4 py-3 font-medium text-white disabled:opacity-50"
          >
            {loading ? "Входим..." : "Войти"}
          </button>
        </form>
      </div>
    </main>
  );
}
