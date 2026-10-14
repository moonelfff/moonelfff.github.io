import Glass from "@/components/atom/Glass";
import Typography from "@/components/atom/Typography";
import Button from "@/components/molecule/Button";
import type { TestResultPayload } from "@/lib/tests/types";
import ProgressBar from "../atom/ProgressBar";

type Props = {
  result: TestResultPayload;
  contactHref?: string;
  contactTitle?: string;
  onRetry: () => void;
};

function TestResult({
  result,
  contactHref,
  contactTitle,
  onRetry,
}: Props) {
  const groups = result.groupScores ?? [];
  const maxGroup = Math.max(1, ...groups.map((group) => group.score));
  const top = result.topGroups ?? [];

  return (
    <div className="flex flex-col gap-6">
      <Glass>
        <div className="text-platinum flex flex-col gap-4 p-6 lg:p-8">
          <Typography
            component="p"
            className="text-left text-sm tracking-wide uppercase opacity-80"
          >
            Ваш результат
          </Typography>
          <Typography
            component="h2"
            className="text-platinum mb-0 text-2xl font-semibold lg:text-4xl"
          >
            {result.level}
          </Typography>
          {result.maxScore > 0 && groups.length === 0 ? (
            <div className="flex flex-col gap-2">
              <ProgressBar
                onGlass
                value={result.score / result.maxScore}
                label="Балл"
              />
              <Typography
                component="p"
                className="font-numerical text-left text-sm"
              >
                {result.score} / {result.maxScore}
              </Typography>
            </div>
          ) : null}
          {result.summary ? (
            <Typography
              component="p"
              className="text-left text-base lg:text-lg"
            >
              {result.summary}
            </Typography>
          ) : null}
        </div>
      </Glass>

      {top.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          {top.map((group, index) => (
            <div key={group.id} className="pb-2">
              <Glass>
                <div className="text-platinum flex h-full flex-col gap-2 p-6">
                  <Typography
                    component="span"
                    className="bg-gold w-fit rounded-full px-3 py-1 text-sm font-semibold text-black"
                  >
                    {index === 0 ? "Главное" : `№${index + 1}`}
                  </Typography>
                  <Typography
                    component="h3"
                    className="text-platinum mb-0 text-xl font-semibold lg:text-2xl"
                  >
                    {group.title || group.name}
                  </Typography>
                  {group.interpretation ? (
                    <Typography component="p" className="text-left text-base">
                      {group.interpretation}
                    </Typography>
                  ) : null}
                </div>
              </Glass>
            </div>
          ))}
        </div>
      ) : null}

      {groups.length > 1 ? (
        <div className="pb-2">
          <Glass>
            <div className="text-platinum flex flex-col gap-3 p-6">
              <Typography
                component="h3"
                className="text-platinum mb-0 text-xl font-semibold"
              >
                Все результаты
              </Typography>
              {groups.map((group) => (
                <div key={group.id} className="flex flex-col gap-1">
                  <div className="flex justify-between gap-3 text-sm">
                    <Typography component="span">
                      {group.name || group.title}
                    </Typography>
                    <Typography
                      component="span"
                      className="font-numerical text-right"
                    >
                      {group.score}
                    </Typography>
                  </div>
                  <ProgressBar onGlass value={group.score / maxGroup} />
                </div>
              ))}
            </div>
          </Glass>
        </div>
      ) : null}

      <Typography component="p" className="text-left text-sm opacity-70">
        Тест не является диагностикой и не заменяет консультацию психолога.
      </Typography>

      <div className="flex flex-col gap-4 lg:flex-row">
        {contactHref ? (
          <Button href={contactHref} external variant="success">
            {contactTitle || "Записаться на консультацию"}
          </Button>
        ) : null}
        <Button variant="soft" onClick={onRetry}>
          Пройти заново
        </Button>
        <Button variant="soft" href="/tests">
          Все тесты
        </Button>
      </div>
    </div>
  );
}

export default TestResult;
