export type SourceLink = {
  title: string;
  url: string;
};

export type ResearchCard = {
  id: string;
  question: string;
  summary: string;
  facts: string[];
  unknowns: string[];
  nextQuestions: string[];
  sources: SourceLink[];
};

export type ResearchPlan = {
  title: string;
  childFriendlyTask: string;
  starterClue: string;
  starterQuestion: string;
  suggestedQuestions: string[];
  sources: SourceLink[];
};

export type InquiryRequestBody =
  | { action: "start"; assignment: string }
  | { action: "investigate"; assignment: string; cards: ResearchCard[]; question: string };
