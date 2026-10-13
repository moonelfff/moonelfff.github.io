"use client";

import { useMemo, type Dispatch, type SetStateAction } from "react";
import { MARKDOWN_LABELS, type ContentDraft } from "@/lib/admin/content";
import { updateDraft } from "@/lib/admin/draft";
import AdminCard from "../molecule/AdminCard";
import MarkdownEditor from "../molecule/MarkdownEditor";

type Props = {
  draft: ContentDraft;
  setDraft: Dispatch<SetStateAction<ContentDraft | null>>;
};

function SiteTextsCard({ draft, setDraft }: Props) {
  const keys = useMemo(
    () =>
      Object.keys(draft.markdown)
        .filter((key) => !key.startsWith("pricelist/"))
        .sort(),
    [draft.markdown],
  );

  return (
    <AdminCard title="Тексты">
      {keys.map((key) => (
        <MarkdownEditor
          key={key}
          label={MARKDOWN_LABELS[key] ?? `/${key}`}
          value={draft.markdown[key]}
          onChange={(value) =>
            updateDraft(setDraft, (current) => {
              current.markdown[key] = value;
            })
          }
        />
      ))}
    </AdminCard>
  );
}

export default SiteTextsCard;
