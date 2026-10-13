"use client";

import {
  createDefaultChoices,
  isChoiceBasedQuestion,
  QUESTION_TYPE_LABELS,
  QUESTIONS_PER_PAGE,
  toQuestionType,
  type EditableQuestion,
} from "@/lib/admin/editable";
import Select from "../atom/Select";
import TextArea from "../atom/TextArea";
import TextInput from "../atom/TextInput";
import Checkbox from "../molecule/Checkbox";
import Collapsible from "../molecule/Collapsible";
import Field from "../molecule/Field";
import RowActions from "../molecule/RowActions";
import ChoicesEditor from "./ChoicesEditor";
import RatingFields from "./RatingFields";

type Props = {
  question: EditableQuestion;
  index: number;
  count: number;
  defaultOpen: boolean;
  editQuestion: (recipe: (draft: EditableQuestion) => void) => void;
  onMove: (from: number, to: number) => void;
  onRemove: () => void;
};

/** One test question with all of its settings. */
function QuestionCard({
  question,
  index,
  count,
  defaultOpen,
  editQuestion,
  onMove,
  onRemove,
}: Props) {
  const pageNumber = Math.floor(index / QUESTIONS_PER_PAGE) + 1;

  const onTypeChange = (value: string) => {
    const nextType = toQuestionType(value);
    editQuestion((draft) => {
      draft.type = nextType;
      if (!isChoiceBasedQuestion(nextType)) {
        draft.choices = [];
      } else if (draft.choices.length === 0) {
        draft.choices = createDefaultChoices();
      }
    });
  };

  return (
    <Collapsible
      defaultOpen={defaultOpen}
      className="bg-platinum"
      summary={
        <>
          <span className="block truncate text-sm font-medium">
            {index + 1}. {question.title || "Без текста"}
          </span>
          <span className="block text-xs text-black/55">
            {QUESTION_TYPE_LABELS[question.type]} · страница {pageNumber}
          </span>
        </>
      }
      actions={
        <RowActions
          noun="вопрос"
          index={index}
          count={count}
          onMove={onMove}
          onRemove={onRemove}
        />
      }
    >
      <Field
        label="Текст вопроса"
        tip="Сам вопрос, как его увидит человек. Пишите коротко и понятно."
      >
        <TextArea
          rows={3}
          value={question.title}
          onChange={(event) =>
            editQuestion((draft) => {
              draft.title = event.target.value;
            })
          }
        />
      </Field>

      <Field
        label="Тип"
        tip="Как человек будет отвечать: выбрать один вариант, несколько, поставить оценку или написать текст. При смене типа вопрос перестраивается, а варианты ответа сохраняются там, где они нужны."
      >
        <Select
          value={question.type}
          onChange={(event) => onTypeChange(event.target.value)}
        >
          {Object.entries(QUESTION_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </Field>

      <Field
        label="Пояснение к вопросу"
        tip="Необязательная серая подсказка под вопросом, например «Выберите самый близкий вариант». Можно оставить пустым."
      >
        <TextArea
          rows={2}
          value={question.description}
          onChange={(event) =>
            editQuestion((draft) => {
              draft.description = event.target.value;
            })
          }
        />
      </Field>

      <Checkbox
        label="Обязательный вопрос"
        tip="Если включено, человек не сможет перейти дальше или завершить тест, пока не ответит."
        checked={question.isRequired}
        onChange={(event) =>
          editQuestion((draft) => {
            draft.isRequired = event.target.checked;
          })
        }
      />

      {question.type === "rating" ? (
        <RatingFields question={question} editQuestion={editQuestion} />
      ) : null}

      {isChoiceBasedQuestion(question.type) ? (
        <ChoicesEditor question={question} editQuestion={editQuestion} />
      ) : null}

      <Collapsible
        summary={<span className="text-sm font-medium">Дополнительно</span>}
      >
        <Field
          label="Служебное имя вопроса"
          tip="Внутреннее название вопроса, по нему сайт связывает ответ с подсчётом результатов. Человек его не видит. Обычно менять не нужно."
          hint="Должно быть уникальным в этом тесте."
        >
          <TextInput
            value={question.name}
            autoCapitalize="none"
            onChange={(event) =>
              editQuestion((draft) => {
                draft.name = event.target.value;
              })
            }
          />
        </Field>
        <Field
          label="Служебные параметры вопроса (JSON)"
          tip="Для опытных: дополнительные параметры вопроса. Если не уверены, ничего не меняйте: ошибка в записи может сломать вопрос."
        >
          <TextArea
            mono
            rows={6}
            value={question.extraSettingsText}
            onChange={(event) =>
              editQuestion((draft) => {
                draft.extraSettingsText = event.target.value;
              })
            }
          />
        </Field>
      </Collapsible>
    </Collapsible>
  );
}

export default QuestionCard;
