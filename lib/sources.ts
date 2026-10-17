import history from "@/data/history.json";

export type SourceKind = "一次・公的資料" | "教育解説" | "動画" | "画像" | "ユーザー追加";
export type EvidenceRelation = "背景" | "根拠になる" | "別の見方" | "まだ分からない";

export type ResearchSource = {
  id: string;
  title: string;
  provider: string;
  url: string;
  kind: SourceKind;
  description: string;
  whyThisMatters: string;
  tags: string[];
  origin: "ai" | "user";
  relation?: EvidenceRelation;
  note?: string;
};

const stopWords = ["なぜ", "どうして", "とは", "について", "本当", "理由", "歴史", "の", "は", "を", "が", "に", "て", "で", "と", "た", "る"];

function termsFrom(question: string) {
  return question
    .replace(/[？?！!、。]/g, " ")
    .split(/\s+/)
    .flatMap((word) => [word, ...[...word].filter((character) => /[一-龠ぁ-んァ-ヶ]/.test(character))])
    .filter((word) => word.length > 0 && !stopWords.includes(word));
}

export function findStarterSources(question: string): ResearchSource[] {
  const terms = termsFrom(question);
  const scored = history.sources.map((source) => ({
    source,
    score: source.tags.reduce((total, tag) => total + terms.filter((term) => tag.includes(term) || term.includes(tag)).length, 0),
  }));

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ source }) => ({ ...source, kind: source.kind as SourceKind, origin: "ai" as const }));
}
