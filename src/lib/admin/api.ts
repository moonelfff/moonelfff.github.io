type ErrorBody = { error?: string } | null;

/** Fetches JSON from an admin API; throws an Error with a user-facing message on failure. */
export async function fetchAdmin<T>(
  url: string,
  fallbackError: string,
  navigate: (href: string) => void,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(url, { cache: "no-store", ...init });

  if (response.status === 401) {
    navigate("/admin/login");
    throw new Error("Сессия истекла, войдите заново");
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ErrorBody;
    throw new Error(body?.error ?? fallbackError);
  }

  return (await response.json()) as T;
}

export function sendJson<T>(
  url: string,
  method: "PUT" | "POST",
  payload: unknown,
  fallbackError: string,
  navigate: (href: string) => void,
): Promise<T> {
  return fetchAdmin<T>(url, fallbackError, navigate, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
