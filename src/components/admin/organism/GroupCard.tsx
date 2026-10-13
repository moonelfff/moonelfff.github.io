"use client";

import { moveItem } from "@/lib/admin/moveItem";
import type { EditableScoring, EditableTest } from "@/lib/admin/editable";
import TextArea from "../atom/TextArea";
import TextInput from "../atom/TextInput";
import Collapsible from "../molecule/Collapsible";
import Field from "../molecule/Field";
import QuestionPicker from "../molecule/QuestionPicker";
import RowActions from "../molecule/RowActions";

type Props = {
  test: EditableTest;
  index: number;
  editScoring: (recipe: (draft: EditableScoring) => void) => void;
};

/** One result group: name, title, interpretation and its questions. */
function GroupCard({ test, index, editScoring }: Props) {
  const { scoring, questions } = test;
  const group = scoring.groups[index];

  return (
    <Collapsible
      defaultOpen={!group.name && !group.title}
      className="bg-platinum"
      summary={
        <>
          <span className="block truncate text-sm font-medium">
            {group.name || group.title || "Новая группа"}
          </span>
          <span className="block text-xs text-black/55">
            вопросов: {group.questionIds.length}
          </span>
        </>
      }
      actions={
        <RowActions
          noun="группу"
          index={index}
          count={scoring.groups.length}
          onMove={(from, to) =>
            editScoring((draft) => {
              draft.groups = moveItem(draft.groups, from, to);
            })
          }
          onRemove={() =>
            editScoring((draft) => {
              draft.groups.splice(index, 1);
            })
          }
        />
      }
    >
      <div className="grid gap-3 md:grid-cols-2">
        <Field
          label="Название группы"
          hint="Показывается в списке «Все результаты»."
        >
          <TextInput
            value={group.name}
            onChange={(event) =>
              editScoring((draft) => {
                draft.groups[index].name = event.target.value;
              })
            }
          />
        </Field>
        <Field
          label="Заголовок результата"
          hint="Крупно, если группа среди лидирующих. Можно оставить пустым."
        >
          <TextInput
            value={group.title}
            onChange={(event) =>
              editScoring((draft) => {
                draft.groups[index].title = event.target.value;
              })
            }
          />
        </Field>
      </div>
      <Field
        label="Толкование"
        hint="Текст, который увидит человек, если группа лидирует."
      >
        <TextArea
          rows={4}
          value={group.interpretation}
          onChange={(event) =>
            editScoring((draft) => {
              draft.groups[index].interpretation = event.target.value;
            })
          }
        />
      </Field>
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-black/80">
          Вопросы группы
        </span>
        <QuestionPicker
          questions={questions}
          selected={group.questionIds}
          onChange={(ids) =>
            editScoring((draft) => {
              draft.groups[index].questionIds = ids;
            })
          }
        />
      </div>
    </Collapsible>
  );
}

export default GroupCard;
