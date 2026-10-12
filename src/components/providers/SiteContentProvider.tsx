"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { MarkdownMap, SiteContent } from "@/lib/contentTypes";

type SiteContentContextValue = {
  content: SiteContent;
  markdown: MarkdownMap;
};

const SiteContentContext = createContext<SiteContentContextValue | null>(null);

export function SiteContentProvider({
  content,
  markdown,
  children,
}: SiteContentContextValue & { children: ReactNode }) {
  return (
    <SiteContentContext.Provider value={{ content, markdown }}>
      {children}
    </SiteContentContext.Provider>
  );
}

function useSiteContentContext(): SiteContentContextValue {
  const value = useContext(SiteContentContext);
  if (!value) {
    throw new Error("SiteContentProvider is missing");
  }
  return value;
}

export function useSiteContent(): SiteContent {
  return useSiteContentContext().content;
}

export function useSiteMarkdown(markdownPath: string): string {
  return useSiteContentContext().markdown[markdownPath.replace(/^\/+/, "")] ?? "";
}