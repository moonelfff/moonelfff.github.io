"use client";

import type { Dispatch, SetStateAction } from "react";
import { LINK_FIELDS, type ContentDraft } from "@/lib/admin/content";
import AdminCard from "../molecule/AdminCard";
import ContentTextField from "../molecule/ContentTextField";

type Props = {
  draft: ContentDraft;
  setDraft: Dispatch<SetStateAction<ContentDraft | null>>;
};

function SiteLinksCard({ draft, setDraft }: Props) {
  return (
    <AdminCard title="Ссылки и подписи">
      <div className="grid gap-3 md:grid-cols-2">
        {LINK_FIELDS.map((config) => (
          <ContentTextField
            key={config.key}
            config={config}
            draft={draft}
            setDraft={setDraft}
          />
        ))}
      </div>
    </AdminCard>
  );
}

export default SiteLinksCard;
