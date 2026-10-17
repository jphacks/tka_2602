import { NextResponse } from "next/server";
import { reviewHypothesis } from "@/lib/gemini";
import type { ResearchSource } from "@/lib/sources";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const question = typeof body?.question === "string" ? body.question.trim() : "";
  const hypothesis = typeof body?.hypothesis === "string" ? body.hypothesis.trim() : "";
  const sources = Array.isArray(body?.sources) ? body.sources as ResearchSource[] : [];

  if (!question || hypothesis.length < 20 || hypothesis.length > 300) {
    return NextResponse.json({ error: "主質問と20〜300字の仮説を入力してください。" }, { status: 400 });
  }

  try {
    return NextResponse.json(await reviewHypothesis(question, hypothesis, sources));
  } catch (error) {
    console.error("Hypothesis review failed", error);
    return NextResponse.json({ error: "AIからの振り返りを作成できませんでした。" }, { status: 500 });
  }
}
