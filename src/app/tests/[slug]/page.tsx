import { notFound } from "next/navigation";
import SurveyRunner from "@/components/tests/SurveyRunner";
import { getTestBySlug } from "@/lib/tests/testStore";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function TestPage({ params }: PageProps) {
  const { slug } = await params;
  const test = await getTestBySlug(slug);

  if (!test) {
    notFound();
  }

  return (
    <SurveyRunner
      slug={test.slug}
      title={test.title}
      description={test.description}
      schema={test.schema}
    />
  );
}
