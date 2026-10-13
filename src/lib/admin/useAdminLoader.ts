"use client";

import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/components/admin/providers/ToastProvider";
import { errorMessage } from "./api";

/**
 * Runs `load` on mount and tracks its status. Failures are reported with a
 * toast; `retry` repeats the load. `load` must be stable (wrap it in useCallback).
 */
export function useAdminLoader(
  load: () => Promise<void>,
  fallbackError: string,
) {
  const toast = useToast();
  const [status, setStatus] = useState<"loading" | "failed" | "ready">(
    "loading",
  );

  const run = useCallback(async () => {
    try {
      await load();
      setStatus("ready");
    } catch (error) {
      toast.error(errorMessage(error, fallbackError));
      setStatus("failed");
    }
  }, [fallbackError, load, toast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch on mount
    void run();
  }, [run]);

  const retry = () => {
    setStatus("loading");
    void run();
  };

  return {
    isLoading: status === "loading",
    loadFailed: status === "failed",
    retry,
  };
}
