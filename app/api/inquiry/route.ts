import { NextResponse } from "next/server";
import { createInquiryPlan, investigateQuestion } from "@/lib/inquiry";
import { findStarterSources } from "@/lib/sources";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const assignment = typeof body?.assignment === "string" ? body.assignment.trim() : "";
  const question = typeof body?.question === "string" ? body.question.trim() : "";

  if (!assignment || assignment.length > 500) {
    return NextResponse.json({ error: "テーマ・課題は1〜500文字で入力してください。" }, { status: 400 });
  }

  try {
    if (body?.action === "investigate") {
      if (!question || question.length > 180) return NextResponse.json({ error: "疑問は1〜180文字で入力してください。" }, { status: 400 });
      return NextResponse.json(await investigateQuestion(assignment, question));
    }
    return NextResponse.json(await createInquiryPlan(assignment, findStarterSources()));
  } catch (error) {
    const stage = body?.action === "investigate" ? "evidence card" : "inquiry plan";
    console.error(`${stage} generation failed`, error);
    return NextResponse.json({ error: body?.action === "investigate" ? "資料カードを作れませんでした。もう一度試してください。" : "探究の入口を作れませんでした。もう一度試してください。" }, { status: 500 });
  }
}
