import { getTestBySlug } from "@/lib/tests/testStore";
import { NextResponse } from "next/server";

type Params = {
  params: Promise<{ slug: string }>;
};

export async function GET(_: Request, { params }: Params) {
  const { slug } = await params;
  const test = await getTestBySlug(slug);

  if (!test) {
    return NextResponse.json({ error: "Тест не найден" }, { status: 404 });
  }

  return NextResponse.json({
    id: test.id,
    slug: test.slug,
    title: test.title,
    description: test.description,
    version: test.version,
    schema: test.schema,
  });
}
