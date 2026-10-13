"use client";

import { PlusIcon } from "@/assets/icons/admin";
import { createChoice, type EditableQuestion } from "@/lib/admin/editable";
import AdminButton from "../atom/AdminButton";
import Hint from "../atom/Hint";
import Checkbox from "../molecule/Checkbox";
import ChoiceRow from "./ChoiceRow";

type Props = {
  question: EditableQuestion;
  editQuestion: (recipe: (draft: EditableQuestion) => void) => void;
};

/** Answer options of a choice-based question. */
function ChoicesEditor({ question, editQuestion }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h4 className="font-semibold">Варианты ответа</h4>
        <AdminButton
          onClick={() =>
            editQuestion((draft) => {
              draft.choices.push(createChoice(draft.choices.length));
            })
          }
        >
          <PlusIcon width={18} height={18} />
          Добавить вариант
        </AdminButton>
      </div>
      <Hint>
        «Значение» — число, по которому считаются баллы (например, 1, 2, 3).
        «Текст» — то, что видит человек.
      </Hint>

      {question.choices.map((choice, index) => (
        <ChoiceRow
          key={choice.id}
          question={question}
          index={index}
          editQuestion={editQuestion}
        />
      ))}

      <Checkbox
        label="Перемешивать варианты для каждого прохождения"
        tip="Варианты ответа будут идти в случайном порядке при каждом прохождении. Помогает, если люди склонны выбирать первый вариант. Баллы от порядка не зависят."
        checked={question.shuffleChoices}
        onChange={(event) =>
          editQuestion((draft) => {
            draft.shuffleChoices = event.target.checked;
          })
        }
      />
    </div>
  );
}

export default ChoicesEditor;
