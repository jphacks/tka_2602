import { NextResponse } from "next/server";
import { createResearchPlan, investigateQuestion } from "@/lib/openai";
import type { InquiryRequestBody, ResearchCard } from "@/lib/research-types";

export const maxDuration = 60;

function error(message: string, status = 400) { return NextResponse.json({ error: message }, { status }); }
function isCard(value: unknown): value is ResearchCard {
  return Boolean(value) && typeof value === "object" && typeof (value as ResearchCard).question === "string" && Array.isArray((value as ResearchCard).facts);
}

function modelError(cause: unknown) {
  const message = cause instanceof Error ? cause.message : "";
  if (/RESOURCE_EXHAUSTED|\b429\b/i.test(message)) {
    return error("AIの利用上限に達しています。しばらく待ってから、もう一度試してください。", 429);
  }
  if (/API_KEY|API key|UNAUTHENTICATED|\b401\b/i.test(message)) {
    return error("AIの設定を確認してください。", 502);
  }
  return error("資料を準備できませんでした。人物・時代・出来事をもう少し具体的にして、もう一度試してください。", 502);
}

export async function POST(request: Request) {
  let body: Partial<InquiryRequestBody>;
  try { body = await request.json() as Partial<InquiryRequestBody>; } catch { return error("入力の形式を確認してください。"); }
  const assignment = typeof body.assignment === "string" ? body.assignment.trim() : "";
  if (!assignment || assignment.length > 600) return error("課題は1〜600文字で入力してください。");
  try {
    if (body.action === "start") return NextResponse.json(await createResearchPlan(assignment));
    if (body.action === "investigate") {
      const question = typeof body.question === "string" ? body.question.trim() : "";
      if (!question || question.length > 300) return error("疑問は1〜300文字で入力してください。");
      if (!Array.isArray(body.cards) || body.cards.length > 20 || !body.cards.every(isCard)) return error("これまでの探究記録を確認してください。");
      return NextResponse.json(await investigateQuestion(assignment, body.cards, question));
    }
    return error("探究の操作を確認してください。");
  } catch (cause) {
    console.error("Research generation failed", cause instanceof Error ? cause.message : "Unknown error");
    return modelError(cause);
  }
}
