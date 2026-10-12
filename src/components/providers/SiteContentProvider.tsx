"use client";

import defaultContent from "@/assets/data/content.json";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type SiteContent = typeof defaultContent;

type SiteContentContextValue = {
  content: SiteContent;
};

const SiteContentContext = createContext<SiteContentContextValue>({
  content: defaultContent,
});

export function SiteContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<SiteContent>(defaultContent);

  useEffect(() => {
    let mounted = true;

    const loadContent = async () => {
      try {
        const response = await fetch("/api/content", { cache: "no-store" });
        if (!response.ok) {
          return;
        }

        const body = (await response.json()) as { content?: SiteContent };
        if (mounted && body.content) {
          setContent(body.content);
        }
      } catch {
        // Keep default content when dynamic content loading fails.
      }
    };

    loadContent();

    return () => {
      mounted = false;
    };
  }, []);

  const value = useMemo(() => ({ content }), [content]);

  return (
    <SiteContentContext.Provider value={value}>
      {children}
    </SiteContentContext.Provider>
  );
}

export function useSiteContent(): SiteContent {
  return useContext(SiteContentContext).content;
}
