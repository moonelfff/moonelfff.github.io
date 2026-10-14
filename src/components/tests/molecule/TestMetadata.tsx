import Typography from "@/components/atom/Typography";
import { pluralize } from "@/lib/tests/meta";

type Props = {
  questionCount: number;
  minutes: number;
};

function TestMetadata({ questionCount, minutes }: Props) {
  return (
    <div className="flex flex-wrap gap-2 text-sm">
      <Typography
        component="span"
        className="rounded-full bg-white/20 px-3 py-1"
      >
        {questionCount}{" "}
        {pluralize(questionCount, ["вопрос", "вопроса", "вопросов"])}
      </Typography>
      <Typography
        component="span"
        className="rounded-full bg-white/20 px-3 py-1"
      >
        ~{minutes} {pluralize(minutes, ["минута", "минуты", "минут"])}
      </Typography>
    </div>
  );
}

export default TestMetadata;
