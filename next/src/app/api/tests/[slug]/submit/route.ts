import { getMockTestBySlug } from "@/lib/tests/mockTests";
import { evaluateTestResult } from "@/lib/tests/scoring";
import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { z } from "zod";

const submitSchema = z.object({
  answers: z.record(z.string(), z.unknown()),
});

type Params = {
  params: Promise<{ slug: string }>;
};

export async function POST(request: Request, { params }: Params) {
  const { slug } = await params;
  const test = getMockTestBySlug(slug);

  if (!test) {
    return NextResponse.json({ error: "Тест не найден" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = submitSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Некорректные ответы" }, { status: 400 });
  }

  const result = evaluateTestResult(parsed.data.answers, test.scoring);

  return NextResponse.json({
    resultId: nanoid(12),
    test: {
      id: test.id,
      slug: test.slug,
      title: test.title,
      version: test.version,
    },
    result,
    note: "MVP-режим: результат пока не сохраняется в базу",
  });
}
