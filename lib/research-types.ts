export type ResearchSource = {
  id: string;
  title: string;
  provider: string;
  url: string;
  description: string;
};

export type CuriosityHook = {
  scenes: CuriosityScene[];
};

export type CuriosityScene = {
  id: string;
  title: string;
  teaser: string;
  detail: string;
  facts: string[];
};
export type EvidenceCard = { claim: string; relevance: string; sourceTitle: string; sourceUrl: string };
export type ResearchCard = { id: string; question: string; evidence: EvidenceCard[]; unknowns: string[]; nextQuestions: string[] };

export type InquiryPlan = {
  title: string;
  background: string;
  curiosityHook: CuriosityHook;
  sources: ResearchSource[];
};

export type InquiryRequest = { assignment: string };
