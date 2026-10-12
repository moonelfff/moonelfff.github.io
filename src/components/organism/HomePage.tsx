"use client";

import type { MarkdownMap, SiteContent } from "@/lib/contentTypes";
import type { Tariff } from "@/lib/tariffStore";
import { SiteContentProvider } from "../providers/SiteContentProvider";
import Footer from "./Footer";
import Main from "./Main";

type Props = {
  content: SiteContent;
  markdown: MarkdownMap;
  tariffs: Tariff[];
};

export default function HomePage({ content, markdown, tariffs }: Props) {
  return (
    <SiteContentProvider content={content} markdown={markdown} tariffs={tariffs}>
      <div className="bg-platinum font-primary flex min-h-dvh w-full flex-col justify-between gap-8 px-3 py-3 md:px-12 xl:px-24 xl:pt-12 2xl:px-60">
        <Main />
        <Footer />
      </div>
    </SiteContentProvider>
  );
}
