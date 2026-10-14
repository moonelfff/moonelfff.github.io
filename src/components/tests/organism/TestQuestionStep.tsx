import type { ReactNode } from "react";
import { Survey } from "survey-react-ui";
import type { Model } from "survey-core";
import Glass from "@/components/atom/Glass";
import Typography from "@/components/atom/Typography";
import Button from "@/components/molecule/Button";
import ProgressBar from "../atom/ProgressBar";
import "survey-core/survey-core.min.css";

type Props = {
  survey: Model;
  progress: number;
  answered: number;
  questionCount: number;
  error: string | null;
  isSubmitting: boolean;
  isFirst: boolean;
  isLast: boolean;
  previousIcon: ReactNode;
  nextIcon: ReactNode;
  onPrevious: () => void;
  onNext: () => void;
};

function TestQuestionStep({
  survey,
  progress,
  answered,
  questionCount,
  error,
  isSubmitting,
  isFirst,
  isLast,
  previousIcon,
  nextIcon,
  onPrevious,
  onNext,
}: Props) {
  return (
    <div className="flex flex-col gap-6 pb-6">
      <div className="flex flex-col gap-2">
        <ProgressBar value={progress} label="Прогресс" />
        <Typography
          component="p"
          className="font-numerical text-left text-dusty-grape text-sm"
        >
          Отвечено {answered} из {questionCount}
        </Typography>
      </div>

      {error ? (
        <Typography
          component="p"
          className="border-danger/40 bg-danger/10 text-danger rounded-xl border px-4 py-3 text-left text-sm"
        >
          {error}
        </Typography>
      ) : null}

      <div className="relative z-20 pb-2">
        <Glass>
          <div className="test-survey text-platinum p-6 lg:p-8">
            <Survey model={survey} />
          </div>
        </Glass>
      </div>

      <div className="flex gap-3 lg:justify-between">
        <Button
          variant="soft"
          className="flex-1 lg:flex-none"
          icon={previousIcon}
          iconPosition="left"
          onClick={onPrevious}
          disabled={isSubmitting || isFirst}
        >
          Назад
        </Button>
        <Button
          variant="success"
          icon={nextIcon}
          onClick={onNext}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Считаем..." : isLast ? "Результат" : "Далее"}
        </Button>
      </div>
    </div>
  );
}

export default TestQuestionStep;
