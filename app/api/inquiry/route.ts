import { NextResponse } from "next/server";
import { answerInquiry } from "@/lib/gemini";
import { findStarterSources } from "@/lib/sources";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const question = typeof body?.question === "string" ? body.question.trim() : "";

  if (!question || question.length > 500) {
    return NextResponse.json({ error: "質問は1〜500文字で入力してください。" }, { status: 400 });
  }

  try {
    const sources = findStarterSources(question);
    const inquiry = await answerInquiry(question, sources);
    return NextResponse.json({ ...inquiry, sources });
  } catch (error) {
    console.error("Inquiry generation failed", error);
    return NextResponse.json(
      { error: "探究ガイドを作成できませんでした。設定を確認して、もう一度お試しください。" },
      { status: 500 },
    );
  }
}
