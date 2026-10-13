"use client";

import type { Dispatch, SetStateAction } from "react";
import { MAIN_FIELDS, type ContentDraft } from "@/lib/admin/content";
import { updateDraft } from "@/lib/admin/draft";
import TextInput from "../atom/TextInput";
import AdminCard from "../molecule/AdminCard";
import ContentTextField from "../molecule/ContentTextField";
import Field from "../molecule/Field";

type Props = {
  draft: ContentDraft;
  setDraft: Dispatch<SetStateAction<ContentDraft | null>>;
};

function SiteInfoCard({ draft, setDraft }: Props) {
  return (
    <AdminCard title="Основные данные сайта">
      <div className="grid gap-3 md:grid-cols-2">
        {MAIN_FIELDS.map((config) => (
          <ContentTextField
            key={config.key}
            config={config}
            draft={draft}
            setDraft={setDraft}
          />
        ))}
        <Field label="Подзаголовок профиля">
          <TextInput
            value={draft.content.info.title}
            onChange={(event) =>
              updateDraft(setDraft, (current) => {
                current.content.info.title = event.target.value;
              })
            }
          />
        </Field>
      </div>
    </AdminCard>
  );
}

export default SiteInfoCard;
