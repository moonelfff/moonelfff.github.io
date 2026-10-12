import { useEffect, useMemo } from "react";
import { STATUS_MESSAGE_TIMEOUT_MS } from "./ui";

/** Calls `clear` once a non-empty status message has been shown for a while. */
export function useAutoClear(value: string | null, clear: () => void) {
  useEffect(() => {
    if (!value) {
      return;
    }

    const timeoutId = window.setTimeout(clear, STATUS_MESSAGE_TIMEOUT_MS);
    return () => window.clearTimeout(timeoutId);
  }, [value, clear]);
}

/** Object URL for previewing a local file; revoked when the file changes. */
export function useObjectUrl(file: File | null): string | null {
  const url = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  useEffect(() => {
    if (!url) {
      return;
    }

    return () => URL.revokeObjectURL(url);
  }, [url]);

  return url;
}
