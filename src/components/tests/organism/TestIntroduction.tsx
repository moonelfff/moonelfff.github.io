import type { ReactNode } from "react";
import Glass from "@/components/atom/Glass";
import Typography from "@/components/atom/Typography";
import Button from "@/components/molecule/Button";
import TestMetadata from "../molecule/TestMetadata";
import { parseMarkdown } from "@/utils/markdownParser";

type Props = {
  description: string;
  questionCount: number;
  minutes: number;
  startIcon: ReactNode;
  onStart: () => void;
};

function TestIntroduction({
  description,
  questionCount,
  minutes,
  startIcon,
  onStart,
}: Props) {
  return (
    <div className="flex flex-col gap-6 pb-6">
      <div className="pb-2">
        <Glass>
          <div className="text-platinum flex flex-col gap-4 p-6 lg:p-8">
            <div className="markdown content-markdown">
              {description.trim() ? (
                parseMarkdown(description)
              ) : (
                <Typography component="p" className="text-left">
                  Описание теста пока не заполнено.
                </Typography>
              )}
            </div>
            <TestMetadata questionCount={questionCount} minutes={minutes} />
          </div>
        </Glass>
      </div>
      <Button variant="success" icon={startIcon} onClick={onStart}>
        Начать
      </Button>
    </div>
  );
}

export default TestIntroduction;
