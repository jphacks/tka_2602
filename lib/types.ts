export type Difficulty = "easy" | "standard" | "deep";
export type LearningStyle = "story" | "detective";

export type SourceReading = {
  title: string;
  lead: string;
  story: string;
  clues: string[];
  analogy?: string;
  question: string;
};

export type HistoricalSource = {
  id: string;
  title: string;
  author: string;
  period: string;
  kind: "primary" | "secondary";
  excerpt: string;
  explanation: string;
  url: string;
  note?: string;
  readings?: Record<LearningStyle, SourceReading>;
};

export type HistoryUnit = {
  id: string;
  title: string;
  period: string;
  category: string;
  textbookCodes: string[];
  summary: string;
  inquiry: string;
  color: string;
  icon: string;
  questions: Record<Difficulty, string[]>;
  keyPoints: string[];
  sources: HistoricalSource[];
};

export type EvidencePoint = { text: string; sourceIds: string[] };

export type InquiryResult = {
  answer: string;
  facts: EvidencePoint[];
  interpretations: EvidencePoint[];
  unknowns: string[];
  followUpQuestions: string[];
  relatedTerms: string[];
  sources: HistoricalSource[];
  mode: "demo" | "live";
  analogy?: string;
  learningStyle?: LearningStyle;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  result?: InquiryResult;
};

export type InquiryRequest = {
  question: string;
  unitId: string;
  difficulty: Difficulty;
  selectedSourceIds: string[];
  messages: Pick<ChatMessage, "role" | "content">[];
  learningStyle?: LearningStyle;
};

export type DetectiveNote = {
  id: string;
  unitId: string;
  title: string;
  hypothesis: string;
  discoveries: string[];
  sourceIds: string[];
  messages: ChatMessage[];
  difficulty: Difficulty;
  learningStyle?: LearningStyle;
  createdAt: string;
  updatedAt: string;
};

export type BoardPost = {
  id: string;
  unitId: string;
  author: string;
  title: string;
  body: string;
  tags: string[];
  sourceIds: string[];
  createdAt: string;
  likes: number;
  liked: boolean;
  bookmarked: boolean;
  comments: { id: string; author: string; body: string; createdAt: string }[];
  sample?: boolean;
};
