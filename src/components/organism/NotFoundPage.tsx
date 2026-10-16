import { ArrowRight } from "lucide-react";
import GlassText from "@/components/atom/GlassText";
import Typography from "@/components/atom/Typography";
import Button from "@/components/molecule/Button";

export default function NotFoundPage() {
  return (
    <main className="bg-platinum font-primary flex min-h-dvh items-center justify-center px-3 py-12 md:px-12 xl:px-24 2xl:px-60">
      <div className="flex w-full max-w-xl flex-col items-center gap-6 text-center">
        <GlassText className="font-numerical text-8xl font-bold lg:text-9xl">
          404
        </GlassText>
        <div>
          <Typography component="h1">Страница не найдена</Typography>
          <Typography component="p" className="mt-3 text-center! text-black/65">
            Возможно, ссылка устарела или в адресе есть опечатка.
            Вернитесь на главную, чтобы узнать о консультациях и способах записи.
          </Typography>
        </div>
        <Button href="/" icon={<ArrowRight size={20} strokeWidth={2.5} aria-hidden />}>
          На главную
        </Button>
      </div>
    </main>
  );
}
