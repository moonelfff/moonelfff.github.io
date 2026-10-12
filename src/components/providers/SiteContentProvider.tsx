"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { MarkdownMap, SiteContent } from "@/lib/contentTypes";
import type { Tariff } from "@/lib/tariffStore";

type SiteContentContextValue = {
  content: SiteContent;
  markdown: MarkdownMap;
  tariffs: Tariff[];
};

const SiteContentContext = createContext<SiteContentContextValue | null>(null);

export function SiteContentProvider({
  content,
  markdown,
  tariffs,
  children,
}: SiteContentContextValue & { children: ReactNode }) {
  return (
    <SiteContentContext.Provider value={{ content, markdown, tariffs }}>
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

export function useSiteTariffs(): Tariff[] {
  return useSiteContentContext().tariffs;
}

export function useSiteMarkdown(markdownPath: string): string {
  return useSiteContentContext().markdown[markdownPath.replace(/^\/+/, "")] ?? "";
}