import { GoogleGenAI, Type } from "@google/genai";
import type { ResearchSource } from "@/lib/sources";

export type Inquiry = {
  answer: string;
  keyPoints: string[];
  followUpQuestions: string[];
  relatedTerms: string[];
};

export type HypothesisReview = {
  evidenceUsed: string[];
  blindSpot: string;
  nextStep: string;
};

const schema = {
  type: Type.OBJECT,
  properties: {
    answer: { type: Type.STRING, description: "中高生にも分かる、250字以内の説明" },
    keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
    followUpQuestions: { type: Type.ARRAY, items: { type: Type.STRING } },
    relatedTerms: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ["answer", "keyPoints", "followUpQuestions", "relatedTerms"],
};

function getAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");
  return new GoogleGenAI({ apiKey });
}

export async function answerInquiry(question: string, sources: ResearchSource[]): Promise<Inquiry> {
  const ai = getAI();
  const sourceSummary = sources.map(({ title, provider, kind, description }) => ({ title, provider, kind, description }));
  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL ?? "gemini-3.5-flash-lite",
    contents: `あなたは歴史探究を支える案内役です。中高生が自分の仮説を作れるように、答えを断定しすぎず、史実と解釈が分かれる点を区別してください。質問に短く答えた後、調査に使える補助質問を提案してください。資料の内容を実際に読んだふりをしてはいけません。\n\n主質問: ${question}\n\nAIが最初に提示する資料の一覧: ${JSON.stringify(sourceSummary)}`,
    config: { responseMimeType: "application/json", responseSchema: schema },
  });

  const content = JSON.parse(response.text ?? "{}") as Inquiry;
  return {
    answer: content.answer,
    keyPoints: content.keyPoints ?? [],
    followUpQuestions: content.followUpQuestions ?? [],
    relatedTerms: content.relatedTerms ?? [],
  };
}

export async function reviewHypothesis(question: string, hypothesis: string, sources: ResearchSource[]): Promise<HypothesisReview> {
  const ai = getAI();
  const sourceMemos = sources.map(({ title, origin, relation, note }) => ({ title, origin, relation, note }));
  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL ?? "gemini-3.5-flash-lite",
    contents: `あなたは歴史探究の対話コーチです。正誤を採点せず、ユーザーの仮説と資料メモのつながりを振り返らせてください。リンク先を読んだふりはせず、与えられた資料メモだけを対象にします。\n\n主質問: ${question}\n\nユーザーの仮説: ${hypothesis}\n\n資料メモ: ${JSON.stringify(sourceMemos)}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          evidenceUsed: { type: Type.ARRAY, items: { type: Type.STRING }, description: "仮説で使えている根拠を2点以内で示す" },
          blindSpot: { type: Type.STRING, description: "確認すると考えが深まる別視点を1つ示す" },
          nextStep: { type: Type.STRING, description: "次にできる小さな調査行動を1つ示す" },
        },
        required: ["evidenceUsed", "blindSpot", "nextStep"],
      },
    },
  });

  return JSON.parse(response.text ?? "{}") as HypothesisReview;
}
