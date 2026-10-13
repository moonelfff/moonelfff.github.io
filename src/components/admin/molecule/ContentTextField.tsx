"use client";

import type { Dispatch, SetStateAction } from "react";
import type { ContentDraft, TextFieldConfig } from "@/lib/admin/content";
import { updateDraft } from "@/lib/admin/draft";
import TextInput from "../atom/TextInput";
import Field from "./Field";

type Props = {
  config: TextFieldConfig;
  draft: ContentDraft;
  setDraft: Dispatch<SetStateAction<ContentDraft | null>>;
};

/** Text input bound to one string field of the site content. */
function ContentTextField({ config, draft, setDraft }: Props) {
  const { key, label, wide } = config;

  return (
    <Field label={label} className={wide ? "md:col-span-2" : ""}>
      <TextInput
        value={draft.content[key]}
        onChange={(event) =>
          updateDraft(setDraft, (current) => {
            current.content[key] = event.target.value;
          })
        }
      />
    </Field>
  );
}

export default ContentTextField;
