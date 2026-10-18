import { NextResponse } from "next/server";
import { answerInquiry } from "@/lib/gemini";
import { findCuratedVideos } from "@/lib/youtube";
import { getUnit } from "@/data/units";
import type { InquiryRequest } from "@/lib/types";

export const maxDuration = 60;

function badRequest(error: string) {
  return NextResponse.json({ error }, { status: 400 });
}

export async function POST(request: Request) {
  const raw = await request.text();
  if (raw.length > 50000) return badRequest("質問や会話履歴が長すぎます。新しい調査を始めてください。");
  let body: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return badRequest("質問の形式を確認してください。");
    body = parsed as Record<string, unknown>;
  } catch {
    return badRequest("質問の形式を確認してください。");
  }
  const question = typeof body.question === "string" ? body.question.trim() : "";
  if (!question || question.length > 500) return badRequest("質問は1〜500文字で入力してください。");
  const unitId = body.unitId === undefined ? "honnoji" : body.unitId;
  const unit = typeof unitId === "string" ? getUnit(unitId) : undefined;
  if (!unit) return badRequest("調査する単元を選んでください。");
  const difficulty = body.difficulty === undefined ? "standard" : body.difficulty;
  if (difficulty !== "easy" && difficulty !== "standard" && difficulty !== "deep") {
    return badRequest("難易度は「やさしく・標準・深掘り」から選んでください。");
  }
  const learningStyle = body.learningStyle === undefined ? "story" : body.learningStyle;
  if (learningStyle !== "story" && learningStyle !== "detective") {
    return badRequest("読み方は「たとえ話で楽しむ・史料から深める」から選んでください。");
  }
  const sourceIds = body.selectedSourceIds ?? [];
  const allowedSources = new Set(unit.sources.map((source) => source.id));
  if (!Array.isArray(sourceIds) || sourceIds.length > unit.sources.length || sourceIds.some((id: unknown) => typeof id !== "string" || !allowedSources.has(id))) {
    return badRequest("この単元に登録されている資料を選んでください。");
  }
  const messages = body.messages ?? [];
  if (!Array.isArray(messages) || messages.length > 12) return badRequest("会話履歴は直近12件まで送信できます。");
  const safeMessages: InquiryRequest["messages"] = [];
  for (const message of messages as unknown[]) {
    if (!message || typeof message !== "object" || Array.isArray(message)) return badRequest("会話履歴の形式を確認してください。");
    const entry = message as Record<string, unknown>;
    if ((entry.role !== "user" && entry.role !== "assistant") || typeof entry.content !== "string" || !entry.content.trim() || entry.content.length > 2000) {
      return badRequest("会話履歴は、各1〜2,000文字の質問と回答で送信してください。");
    }
    safeMessages.push({ role: entry.role, content: entry.content.trim() });
  }
  const input: InquiryRequest = {
    question, unitId: unit.id, difficulty, learningStyle,
    selectedSourceIds: [...new Set(sourceIds as string[])], messages: safeMessages,
  };
  try {
    const inquiry = await answerInquiry(input);
    return NextResponse.json({ ...inquiry, keyPoints: inquiry.facts.map((entry) => entry.text), videos: findCuratedVideos(question) });
  } catch (error) {
    console.error("Inquiry generation failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "AIの回答を取得できませんでした。接続やAPI設定を確認して、もう一度お試しください。" },
      { status: 502 },
    );
  }
}
