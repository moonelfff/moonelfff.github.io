import { notFound } from "next/navigation";
import SurveyRunner from "@/components/tests/SurveyRunner";
import { getPublicSiteContent } from "@/lib/contentStore";
import { getPublicTestBySlug } from "@/lib/tests/testStore";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export default async function TestPage({ params }: PageProps) {
  const { slug } = await params;
  const [test, content] = await Promise.all([
    getPublicTestBySlug(slug),
    getPublicSiteContent(),
  ]);

  if (!test) {
    notFound();
  }

  return (
    <SurveyRunner
      slug={test.slug}
      title={test.title}
      description={test.description}
      schema={test.schema}
      contactHref={content.telegramLink}
      contactTitle={content.bookConsultation}
    />
  );
}
