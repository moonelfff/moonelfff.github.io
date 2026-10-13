"use client";

import type { EditableScoring, EditableTest } from "@/lib/admin/editable";
import Hint from "../atom/Hint";
import ScoringModePicker from "../molecule/ScoringModePicker";
import GroupsEditor from "./GroupsEditor";
import ScaleEditor from "./ScaleEditor";

type Props = {
  test: EditableTest;
  editScoring: (recipe: (draft: EditableScoring) => void) => void;
};

/** Chooses the scoring mode and shows the editor for it. */
function ScoringEditor({ test, editScoring }: Props) {
  const { scoring, questions } = test;

  return (
    <div className="flex flex-col gap-4">
      <ScoringModePicker
        value={scoring.mode}
        onChange={(mode) =>
          editScoring((draft) => {
            draft.mode = mode;
          })
        }
      />

      {scoring.mode === "scale" ? (
        <ScaleEditor test={test} editScoring={editScoring} />
      ) : null}
      {scoring.mode === "groups" ? (
        <GroupsEditor test={test} editScoring={editScoring} />
      ) : null}
      {scoring.mode === "none" ? (
        <Hint>
          Результат не считается: человек увидит общий текст после теста. Чтобы
          показывать баллы или тип, выберите способ подсчёта выше.
        </Hint>
      ) : null}
      {questions.length === 0 ? <Hint>Сначала добавьте вопросы.</Hint> : null}
    </div>
  );
}

export default ScoringEditor;
