"use client";

import { FormEvent, useMemo, useState } from "react";
import type { InquiryRequestBody, ResearchCard, ResearchPlan, SourceLink } from "@/lib/research-types";

const STORAGE_KEY = "rekishirube-inquiry-v2";
const REQUIRED_CARDS = 3;
type SavedInquiry = { assignment: string; plan: ResearchPlan; cards: ResearchCard[]; reflection: string; updatedAt: string };

function loadSavedInquiry(): Partial<SavedInquiry> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) as Partial<SavedInquiry> : {};
  } catch { return {}; }
}

function SourceList({ sources }: { sources: SourceLink[] }) {
  if (!sources.length) return null;
  return <details className="sources"><summary>今回の根拠・出典（{sources.length}件）</summary><ul>{sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.title || source.url}</a></li>)}</ul></details>;
}

export function InquiryWorkspace() {
  const [initial] = useState(loadSavedInquiry);
  const [assignment, setAssignment] = useState(initial.assignment ?? "");
  const [plan, setPlan] = useState<ResearchPlan | null>(initial.plan ?? null);
  const [cards, setCards] = useState<ResearchCard[]>(initial.cards ?? []);
  const [question, setQuestion] = useState("");
  const [reflection, setReflection] = useState(initial.reflection ?? "");
  const [loading, setLoading] = useState<"start" | "card" | null>(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const canReflect = cards.length >= REQUIRED_CARDS;
  const progress = Math.min(cards.length, REQUIRED_CARDS);
  const allSources = useMemo(() => { const unique = new Map<string, SourceLink>(); [...(plan?.sources ?? []), ...cards.flatMap((card) => card.sources)].forEach((source) => unique.set(source.url, source)); return [...unique.values()]; }, [plan, cards]);
  const starterQuestions = useMemo(() => plan ? [...new Set([plan.starterQuestion, ...plan.suggestedQuestions])].filter(Boolean).slice(0, 3) : [], [plan]);

  async function request(body: InquiryRequestBody) {
    const response = await fetch("/api/inquiry", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await response.json() as ResearchPlan | ResearchCard | { error?: string };
    if (!response.ok) throw new Error("error" in data && typeof data.error === "string" ? data.error : "AIの回答を取得できませんでした。");
    return data;
  }

  async function start(event: FormEvent) { event.preventDefault(); const value = assignment.trim(); if (!value) return; setLoading("start"); setError(""); setSaved(false); try { const nextPlan = await request({ action: "start", assignment: value }) as ResearchPlan; setPlan(nextPlan); setCards([]); setReflection(""); setQuestion(nextPlan.starterQuestion); } catch (cause) { setError(cause instanceof Error ? cause.message : "課題を準備できませんでした。"); } finally { setLoading(null); } }
  async function investigate(nextQuestion = question) { const value = nextQuestion.trim(); if (!plan || !value || loading) return; setLoading("card"); setError(""); setSaved(false); try { const card = await request({ action: "investigate", assignment: assignment.trim(), cards, question: value }) as ResearchCard; setCards((current) => [...current, card]); setQuestion(""); } catch (cause) { setError(cause instanceof Error ? cause.message : "この疑問を調べられませんでした。"); } finally { setLoading(null); } }
  function saveNote() { if (!plan) return; const snapshot: SavedInquiry = { assignment, plan, cards, reflection, updatedAt: new Date().toISOString() }; try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot)); setSaved(true); } catch { setError("この端末に保存できませんでした。画面を閉じる前に内容をコピーしてください。"); } }
  function reset() { if (!window.confirm("今の探究を閉じて、新しい課題を始めますか？")) return; window.localStorage.removeItem(STORAGE_KEY); setPlan(null); setCards([]); setQuestion(""); setReflection(""); setError(""); setSaved(false); }

  return <main className="inquiry-app"><header className="app-header"><div><p className="brand">レキしるべ</p><p className="subtitle">身近な「なぜ？」を、根拠と自分の言葉でたどろう。</p></div>{plan && <button className="quiet-button" onClick={reset}>新しい課題</button>}</header>
    {!plan ? <section className="start-card"><span className="step-label">STEP 1</span><h1>先生からの課題を<br />はじめよう</h1><p>課題文を入れると、AIが資料を探し、最初の手がかりを準備します。</p><form onSubmit={start}><label htmlFor="assignment">課題</label><textarea id="assignment" value={assignment} onChange={(event) => setAssignment(event.target.value)} maxLength={600} required placeholder="例：明智光秀はなぜ信長を討ったのか、資料をもとに自分の考えを書きましょう。" /><button className="primary-button" disabled={loading === "start"}>{loading === "start" ? "資料を探しています…" : "探究をはじめる"}</button></form><p className="hint">課題の内容は先生の指示どおりに入力しよう。個人情報は書かないでね。</p></section> : <>
      <section className="assignment-card"><span className="step-label">今日の課題</span><h1>{plan.title}</h1><p>{plan.childFriendlyTask}</p></section>
      <section className="progress-card" aria-label={`探究カード ${cards.length} 枚。最低 ${REQUIRED_CARDS} 枚で課題達成`}><div><strong>探究の進み具合</strong><span>{canReflect ? "課題の条件を達成！" : `あと ${REQUIRED_CARDS - progress} 回、疑問を深めよう`}</span></div><ol>{Array.from({ length: REQUIRED_CARDS }, (_, index) => <li className={cards[index] ? "done" : ""} key={index}>{cards[index] ? "✓" : index + 1}</li>)}{cards.length > REQUIRED_CARDS && <li className="more">+{cards.length - REQUIRED_CARDS}</li>}</ol></section>
      {cards.length === 0 && <section className="starter-card"><span className="step-label">まずはここだけ読もう</span><h2>{plan.starterClue}</h2><p>下から一つ選ぶだけで進められるよ。気になるものがなければ、自分の疑問を書いてもOK。</p><div className="suggestions">{starterQuestions.map((item) => <button key={item} onClick={() => void investigate(item)} disabled={loading !== null}>{item}</button>)}</div><SourceList sources={plan.sources} /></section>}
      <section className="cards" aria-label="探究の記録">{cards.map((card, index) => <article className="research-card" key={card.id}><span className="card-number">疑問 {index + 1}</span><h2>{card.question}</h2><p className="card-summary">{card.summary}</p><div className="fact-box"><h3>資料から分かったこと</h3><ul>{card.facts.map((fact) => <li key={fact}>{fact}</li>)}</ul></div>{card.unknowns.length > 0 && <div className="unknown-box"><h3>まだ決められないこと</h3><ul>{card.unknowns.map((item) => <li key={item}>{item}</li>)}</ul></div>}<SourceList sources={card.sources} /></article>)}</section>
      <section className="question-card"><span className="step-label">{cards.length + 1}つ目の疑問</span><h2>{cards.length === 0 ? "どれが気になる？" : "次はどれを調べる？"}</h2>{cards.length > 0 && cards.at(-1)?.nextQuestions.length ? <div className="suggestions">{cards.at(-1)?.nextQuestions.map((item) => <button key={item} onClick={() => void investigate(item)} disabled={loading !== null}>{item}</button>)}</div> : null}<form onSubmit={(event) => { event.preventDefault(); void investigate(); }}><label className="sr-only" htmlFor="question">疑問を書く</label><textarea id="question" value={question} onChange={(event) => setQuestion(event.target.value)} maxLength={300} placeholder="例：どうして、そうなったのだろう？" required /><button className="primary-button" disabled={loading === "card"}>{loading === "card" ? "資料を確かめています…" : "この疑問を調べる"}</button></form></section>
      {canReflect && <section className="reflection-card"><span className="step-label">最後に自分の言葉で</span><h2>考察、または考えの変化を書こう</h2><p>「最初は〜と思ったが、資料を読んで〜と分かった。」から始めても大丈夫。</p><textarea value={reflection} onChange={(event) => { setReflection(event.target.value); setSaved(false); }} maxLength={1000} placeholder="私は…と考える。根拠は…。／最初は…と思ったが、資料を読んで…と分かった。" /><button className="primary-button" onClick={saveNote}>完成ノートを保存する</button>{saved && <p className="saved">この端末に保存しました。疑問はこの後も追加できます。</p>}<SourceList sources={allSources} /></section>}
    </>}{error && <p className="error" role="alert">{error}</p>}</main>;
}
