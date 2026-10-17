import { GoogleGenAI, Type } from "@google/genai";
import history from "@/data/history.json";

export type Inquiry = {
  answer: string;
  keyPoints: string[];
  followUpQuestions: string[];
  relatedTerms: string[];
  sources: { title: string; url: string }[];
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

export async function answerInquiry(question: string): Promise<Inquiry> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
    contents: `あなたは歴史探究を支える案内役です。ユーザーの質問に対し、断定できる史実と解釈が分かれる点を区別してください。JSON資料は補助的な根拠です。資料にない事実を断言せず、情報が不足するときは追加調査を促してください。\n\n質問: ${question}\n\n基礎資料: ${JSON.stringify(history.events)}`,
    config: { responseMimeType: "application/json", responseSchema: schema },
  });

  const content = JSON.parse(response.text ?? "{}") as Omit<Inquiry, "sources">;
  return {
    answer: content.answer,
    keyPoints: content.keyPoints ?? [],
    followUpQuestions: content.followUpQuestions ?? [],
    relatedTerms: content.relatedTerms ?? [],
    sources: history.sources,
  };
}
