import type { InquiryPlan, ResearchCard, ResearchSource } from "@/lib/research-types";

const inquirySchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string", description: "授業テーマを表す短い題名" },
    background: { type: "string", description: "小学高学年向け、120字以内の背景説明。結論や人物の動機を断定しない" },
    curiosityHook: {
      type: "object",
      additionalProperties: false,
      properties: { scenes: { type: "array", items: { type: "object", additionalProperties: false, properties: { id: { type: "string" }, title: { type: "string" }, angle: { type: "string" }, timeframe: { type: "string" }, place: { type: "string" }, teaser: { type: "string" }, detail: { type: "string" }, facts: { type: "array", items: { type: "string" } } }, required: ["id", "title", "angle", "timeframe", "place", "teaser", "detail", "facts"] } } },
      required: ["scenes"],
    },
  },
  required: ["title", "background", "curiosityHook"],
};

const cardSchema = { type: "object", additionalProperties: false, properties: { evidence: { type: "array", items: { type: "object", additionalProperties: false, properties: { claim: { type: "string" }, relevance: { type: "string" }, sourceTitle: { type: "string" }, sourceUrl: { type: "string" } }, required: ["claim", "relevance", "sourceTitle", "sourceUrl"] } }, unknowns: { type: "array", items: { type: "string" } }, nextQuestions: { type: "array", items: { type: "string" } } }, required: ["evidence", "unknowns", "nextQuestions"] };

async function structuredResponse<T>(instructions: string, schema: Record<string, unknown>, useSearch = false): Promise<T> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
      instructions,
      input: "必ず指定されたJSON Schemaに従って応答してください。",
      text: { format: { type: "json_schema", name: "history_inquiry_plan", strict: true, schema } },
      // gpt-4.1-mini は web_search の filters をサポートしない。
      // 信頼性の選別は investigateQuestion の指示と、画面上の出典表示で担保する。
      ...(useSearch ? { tools: [{ type: "web_search" }], tool_choice: "required" } : {}),
    }),
  });

  if (!response.ok) {
    // OpenAI の詳細は利用者に返さず、開発サーバーのログだけに残す。
    // 400 の原因（モデル名・ツール設定・Schema など）をここで特定できるようにする。
    const detail = await response.text();
    throw new Error(`OpenAI Responses API failed: ${response.status} ${detail.slice(0, 1_000)}`);
  }
  const payload = await response.json() as { output_text?: string; output?: Array<{ type?: string; content?: Array<{ type?: string; text?: string }> }> };
  const text = payload.output_text ?? payload.output?.find((item) => item.type === "message")?.content?.find((item) => item.type === "output_text")?.text;
  if (!text) throw new Error("OpenAI Responses API did not return structured output");
  return JSON.parse(text) as T;
}

export async function createInquiryPlan(assignment: string, sources: ResearchSource[]): Promise<InquiryPlan> {
  const sourceSummary = sources.map(({ title, provider, description }) => ({ title, provider, description }));
  const plan = await structuredResponse<Omit<InquiryPlan, "sources">>(`あなたは小学高学年の歴史探究を支える案内役です。

児童が「歴史を調べなさい」という課題を義務として終わらせず、自分の「なんで？」を見つけられるようにしてください。最初に答えや人物の本心を教えてはいけません。scenesには、問いではなく、児童が気になれる歴史上の場面を2〜3個入れてください。

まず課題の範囲を判断してください。第二次世界大戦、日本の近代化、江戸時代のように、複数の年・地域・人々を含む広いテーマでは、3つの場面を同じ時期・地域・立場へ集中させてはいけません。次の観点のうち、少なくとも2つ以上を異なる場面にしてください: 「原因や政治の選択」「国や地域どうしの関係・戦地」「暮らしや子どもへの影響」「終結・戦後の変化」。同じ「暮らし」の観点を複数選ぶ場合も、時期か地域か立場を明確に変えてください。

白村江の戦いのように範囲が狭いテーマでは、無理に時代や地域を散らさず、関係した人々の立場・結果・その後の変化など、出来事を異なる角度から示してください。

各場面は次の役割を必ず守ってください。
- title: 見出しだけで「え、どういうこと？」と思える、対比・制約・変化を含む短い表現。疑問文にはしない。
- angle: この場面の見方を表す、児童にも分かる短いラベル（例: 「くらしの変化」「国どうしの関係」「政治の選択」）。広いテーマでは3場面で同じラベルを繰り返さない。
- timeframe: いつごろの場面かを表す短い表現（例: 「1944年ごろ」「終戦直後」）。
- place: 主な場所・範囲を表す短い表現（例: 「日本の都市部」「太平洋の島々」）。
- teaser: 選ぶ前に読む、2文・60〜100字程度のミニ場面。誰が何をしたかと、意外さ・対立・変化のどれかを一つ入れる。答えや理由は明かさない。
- detail: 選んだ後に読む、3〜4文・160〜240字程度の背景説明。小学校高学年が、自分で疑問を作れるだけの状況を示す。人物の本心や唯一の原因は断定しない。
- facts: detailを支える確認可能な事実を3〜4個。1項目は一文で、推測は書かない。

単なる用語の説明や行動の列挙ではなく、「手に入れたが自由ではない」「同じ出来事で立場によって見え方が変わる」のような引っかかりを具体的な場面で示してください。

backgroundは探究のための補助であり、児童の考察を代筆してはいけません。資料の本文を読んだふりをしてはいけません。

先生からの課題: ${assignment}

表示する資料の候補: ${JSON.stringify(sourceSummary)}`,
  inquirySchema);

  return {
    ...plan,
    curiosityHook: { scenes: plan.curiosityHook.scenes.slice(0, 3).map((scene) => ({ ...scene, facts: scene.facts.slice(0, 4) })) },
    sources,
  };
}

export async function investigateQuestion(assignment: string, question: string): Promise<ResearchCard> {
  const card = await structuredResponse<Omit<ResearchCard, "id" | "question">>(`小学高学年の歴史探究のため、次の疑問に直接関係する根拠をWeb検索で確かめてください。必ず検索を行い、公的機関・博物館・図書館・教育機関を優先します。evidenceは最大3枚で、各claimは検索で確かめた事実のみを短く言い換え、sourceTitleとsourceUrlを必ず対応させます。人物の本心や原因は断定せず、結論が出ない点はunknownsに残してください。nextQuestionsは児童が次に自分で選べる問いです。\n\n課題: ${assignment}\n疑問: ${question}`, cardSchema, true);
  return { id: crypto.randomUUID(), question, ...card, evidence: card.evidence.slice(0, 3), unknowns: card.unknowns.slice(0, 3), nextQuestions: card.nextQuestions.slice(0, 3) };
}
