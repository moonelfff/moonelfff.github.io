"use client";

import type { MarkdownMap, SiteContent } from "@/lib/contentTypes";
import { SiteContentProvider } from "../providers/SiteContentProvider";
import Footer from "./Footer";
import Main from "./Main";

type Props = {
  content: SiteContent;
  markdown: MarkdownMap;
};

export default function HomePage({ content, markdown }: Props) {
  return (
    <SiteContentProvider content={content} markdown={markdown}>
      <div className="bg-platinum font-primary flex min-h-dvh w-full flex-col justify-between gap-8 px-3 py-3 md:px-12 xl:px-24 xl:pt-12 2xl:px-60">
        <Main />
        <Footer />
      </div>
    </SiteContentProvider>
  );
}
