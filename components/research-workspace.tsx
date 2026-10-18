"use client";

import { FormEvent, useEffect, useState } from "react";
import type { CuriosityScene, InquiryPlan, ResearchCard } from "@/lib/research-types";

const examples = ["白村江の戦いについて調べてください", "明智光秀はなぜ本能寺の変を起こしたの？"];
const storageKey = "rekishirube:research-note:v1";

type SavedResearch = {
  version: 1;
  assignment: string;
  plan: InquiryPlan;
  sceneId: string | null;
  question: string;
  cards: ResearchCard[];
  reflection: string;
};

function readSavedResearch(value: string): SavedResearch | null {
  try {
    const saved = JSON.parse(value) as Partial<SavedResearch>;
    if (saved.version !== 1 || typeof saved.assignment !== "string" || !saved.plan || !Array.isArray(saved.cards)) return null;
    return saved as SavedResearch;
  } catch {
    return null;
  }
}

export function ResearchWorkspace() {
  const [assignment, setAssignment] = useState("");
  const [plan, setPlan] = useState<InquiryPlan | null>(null);
  const [scene, setScene] = useState<CuriosityScene | null>(null);
  const [question, setQuestion] = useState("");
  const [cards, setCards] = useState<ResearchCard[]>([]);
  const [reflection, setReflection] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    const saved = readSavedResearch(window.localStorage.getItem(storageKey) ?? "");
    if (!saved) return;
    setAssignment(saved.assignment);
    setPlan(saved.plan);
    setScene(saved.plan.curiosityHook.scenes.find((item) => item.id === saved.sceneId) ?? null);
    setQuestion(saved.question);
    setCards(saved.cards);
    setReflection(saved.reflection);
    setSaveMessage("保存していた探究ノートを復元しました。");
  }, []);

  function clearSavedResearch() {
    window.localStorage.removeItem(storageKey);
  }

  function saveResearch() {
    if (!plan) return;
    const saved: SavedResearch = { version: 1, assignment, plan, sceneId: scene?.id ?? null, question, cards, reflection };
    window.localStorage.setItem(storageKey, JSON.stringify(saved));
    setSaveMessage("このブラウザに保存しました。次回この端末・ブラウザで開くと続きから始められます。");
  }

  function startNewTheme() {
    clearSavedResearch();
    setAssignment("");
    setPlan(null);
    setScene(null);
    setQuestion("");
    setCards([]);
    setReflection("");
    setError("");
    setSaveMessage("");
  }

  async function request(body: object) {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 60_000);
    try {
      const response = await fetch("/api/inquiry", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: controller.signal });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "探究を進められませんでした。");
      return data;
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") throw new Error("資料の確認に時間がかかっています。もう一度試してください。");
      throw cause;
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  async function start(event: FormEvent) {
    event.preventDefault();
    if (!assignment.trim()) return;
    setLoading(true);
    setError("");
    setSaveMessage("");
    try {
      const nextPlan = await request({ assignment });
      clearSavedResearch();
      setPlan(nextPlan);
      setScene(null);
      setCards([]);
      setQuestion("");
      setReflection("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "エラーが起きました。");
    } finally {
      setLoading(false);
    }
  }

  async function investigate(event: FormEvent) {
    event.preventDefault();
    if (!question.trim()) return;
    setLoading(true);
    setError("");
    try {
      const card = await request({ action: "investigate", assignment, question });
      setCards((current) => [...current, card]);
      setQuestion("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "エラーが起きました。");
    } finally {
      setLoading(false);
    }
  }

  const questionForm = (
    <form className="personal-question" onSubmit={investigate}>
      <label htmlFor="question">わたしの疑問</label>
      <div>
        <input id="question" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="例：なぜ倭は百済を助けようとしたの？" required />
        <button className="primary-button" disabled={loading}>{loading ? "資料を確かめています…" : "この疑問を調べる"}</button>
      </div>
    </form>
  );

  if (!plan) {
    return <main className="inquiry-app"><header className="app-header"><p className="brand">レキしるべ</p><p>歴史の「なんで？」を、自分の言葉でたどろう。</p></header><section className="start-card"><span className="step-label">STEP 1</span><h1>探究の入口を<br />見つけよう</h1><p>先生から出されたテーマを入れると、AIが歴史の中で気になりそうな場面を示します。</p><form onSubmit={start}><label htmlFor="assignment">今日調べる歴史のテーマ・課題</label><textarea id="assignment" value={assignment} onChange={(event) => setAssignment(event.target.value)} required /><div className="example-row">{examples.map((example) => <button key={example} type="button" onClick={() => setAssignment(example)}>{example}</button>)}</div><button className="primary-button" disabled={loading}>{loading ? "考えています…" : "気になる場面を探す"}</button></form></section>{error && <p className="message error-message">{error}</p>}</main>;
  }

  return <main className="inquiry-app"><header className="app-header"><div><p className="brand">レキしるべ</p><p>歴史の「なんで？」を、自分の言葉でたどろう。</p></div><div className="header-actions"><button className="quiet-button" onClick={saveResearch}>ブラウザに保存</button><button className="quiet-button" onClick={startNewTheme}>新しいテーマ</button></div></header>{saveMessage && <p className="message saved-message">{saveMessage}</p>}<section className="theme-card"><span className="step-label">今日のテーマ</span><h1>{plan.title}</h1><p>{plan.background}</p></section><section className="curiosity-card"><div><span className="step-label">STEP 2</span><h2>どの場面が気になる？</h2><p>問いを選ぶのではなく、まず事実を見てみよう。</p></div><div className="question-choices">{plan.curiosityHook.scenes.map((item) => <button key={item.id} className={scene?.id === item.id ? "selected" : ""} onClick={() => setScene(item)}>{item.title}</button>)}</div>{scene && <div className="scene-facts"><h3>{scene.title}</h3><p>{scene.summary}</p><ul>{scene.facts.map((fact, index) => <li key={`${scene.id}-${index}`}>{fact}</li>)}</ul></div>}</section>{scene && <><section className="explore-card"><span className="step-label">STEP 3</span><h2>ここから、自分の「なんで？」を見つけよう</h2><p>「どこが不思議？」「誰の立場が気になる？」「なぜそうなった？」と考えてみよう。</p>{cards.length === 0 && questionForm}</section><section className="cards">{cards.map((card, cardIndex) => <article className="research-card" key={card.id}><span className="step-label">疑問 {cardIndex + 1}</span><h2>{card.question}</h2><h3>資料から分かったこと</h3>{card.evidence.map((evidence, evidenceIndex) => <div className="evidence-card" key={`${card.id}-evidence-${evidenceIndex}`}><p>{evidence.claim}</p><small>{evidence.relevance}</small><a href={evidence.sourceUrl} target="_blank" rel="noreferrer">{evidence.sourceTitle} を開く ↗</a></div>)}<h3>まだ決められないこと</h3><ul>{card.unknowns.map((unknown, unknownIndex) => <li key={`${card.id}-unknown-${unknownIndex}`}>{unknown}</li>)}</ul>{cardIndex === cards.length - 1 && <div className="next-questions"><h3>次に気になること</h3>{card.nextQuestions.map((nextQuestion, nextIndex) => <button key={`${card.id}-next-${nextIndex}`} onClick={() => setQuestion(nextQuestion)}>{nextQuestion}</button>)}</div>}</article>)}</section>{cards.length > 0 && <section className="explore-card question-composer"><span className="step-label">次の疑問</span><h2>続けて、気になることを調べよう</h2>{questionForm}</section>}{cards.length > 0 && <section className="reflection-card"><span className="step-label">最後に自分の言葉で</span><h2>考えの変化を書こう</h2><textarea value={reflection} onChange={(event) => setReflection(event.target.value)} placeholder="最初は〜と思ったが、資料を読んで〜と考えた。" /></section>}</>}{error && <p className="message error-message">{error}</p>}</main>;
}
