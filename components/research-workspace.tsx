"use client";
import { FormEvent, useState } from "react";
import type { CuriosityScene, InquiryPlan, ResearchCard } from "@/lib/research-types";

const examples = ["白村江の戦いについて調べてください", "明智光秀はなぜ本能寺の変を起こしたの？"];
export function ResearchWorkspace() {
  const [assignment, setAssignment] = useState(""); const [plan, setPlan] = useState<InquiryPlan | null>(null); const [scene, setScene] = useState<CuriosityScene | null>(null); const [question, setQuestion] = useState(""); const [cards, setCards] = useState<ResearchCard[]>([]); const [reflection, setReflection] = useState(""); const [loading, setLoading] = useState(false); const [error, setError] = useState("");
  async function request(body: object) {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 60_000);
    try {
      const r = await fetch("/api/inquiry", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: controller.signal });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "探究を進められませんでした。");
      return d;
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") throw new Error("資料の確認に時間がかかっています。もう一度試してください。");
      throw e;
    } finally {
      window.clearTimeout(timeoutId);
    }
  }
  async function start(e: FormEvent) { e.preventDefault(); if (!assignment.trim()) return; setLoading(true); setError(""); try { setPlan(await request({ assignment })); setScene(null); setCards([]); } catch (e) { setError(e instanceof Error ? e.message : "エラーが起きました。"); } finally { setLoading(false); } }
  async function investigate(e: FormEvent) { e.preventDefault(); if (!question.trim()) return; setLoading(true); setError(""); try { const card = await request({ action: "investigate", assignment, question }); setCards((c) => [...c, card]); setQuestion(""); } catch (e) { setError(e instanceof Error ? e.message : "エラーが起きました。"); } finally { setLoading(false); } }
  if (!plan) return <main className="inquiry-app"><header className="app-header"><p className="brand">レキしるべ</p><p>歴史の「なんで？」を、自分の言葉でたどろう。</p></header><section className="start-card"><span className="step-label">STEP 1</span><h1>探究の入口を<br />見つけよう</h1><p>先生から出されたテーマを入れると、AIが歴史の中で気になりそうな場面を示します。</p><form onSubmit={start}><label htmlFor="assignment">今日調べる歴史のテーマ・課題</label><textarea id="assignment" value={assignment} onChange={(e) => setAssignment(e.target.value)} required /><div className="example-row">{examples.map((x) => <button key={x} type="button" onClick={() => setAssignment(x)}>{x}</button>)}</div><button className="primary-button" disabled={loading}>{loading ? "考えています…" : "気になる場面を探す"}</button></form></section>{error && <p className="message error-message">{error}</p>}</main>;
  const questionForm = <form className="personal-question" onSubmit={investigate}><label htmlFor="question">わたしの疑問</label><div><input id="question" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="例：なぜ倭は百済を助けようとしたの？" required /><button className="primary-button" disabled={loading}>{loading ? "資料を確かめています…" : "この疑問を調べる"}</button></div></form>;
  return <main className="inquiry-app"><header className="app-header"><div><p className="brand">レキしるべ</p><p>歴史の「なんで？」を、自分の言葉でたどろう。</p></div><button className="quiet-button" onClick={() => setPlan(null)}>新しいテーマ</button></header><section className="theme-card"><span className="step-label">今日のテーマ</span><h1>{plan.title}</h1><p>{plan.background}</p></section><section className="curiosity-card"><div><span className="step-label">STEP 2</span><h2>どの場面が気になる？</h2><p>問いを選ぶのではなく、まず事実を見てみよう。</p></div><div className="question-choices">{plan.curiosityHook.scenes.map((s) => <button key={s.id} className={scene?.id === s.id ? "selected" : ""} onClick={() => setScene(s)}>{s.title}</button>)}</div>{scene && <div className="scene-facts"><h3>{scene.title}</h3><p>{scene.summary}</p><ul>{scene.facts.map((f) => <li key={f}>{f}</li>)}</ul></div>}</section>{scene && <><section className="explore-card"><span className="step-label">STEP 3</span><h2>ここから、自分の「なんで？」を見つけよう</h2><p>「どこが不思議？」「誰の立場が気になる？」「なぜそうなった？」と考えてみよう。</p>{cards.length === 0 && questionForm}</section><section className="cards">{cards.map((card, i) => <article className="research-card" key={card.id}><span className="step-label">疑問 {i + 1}</span><h2>{card.question}</h2><h3>資料から分かったこと</h3>{card.evidence.map((e) => <div className="evidence-card" key={e.sourceUrl + e.claim}><p>{e.claim}</p><small>{e.relevance}</small><a href={e.sourceUrl} target="_blank" rel="noreferrer">{e.sourceTitle} を開く ↗</a></div>)}<h3>まだ決められないこと</h3><ul>{card.unknowns.map((x) => <li key={x}>{x}</li>)}</ul>{i === cards.length - 1 && <div className="next-questions"><h3>次に気になること</h3>{card.nextQuestions.map((x) => <button key={x} onClick={() => setQuestion(x)}>{x}</button>)}</div>}</article>)}</section>{cards.length > 0 && <section className="explore-card question-composer"><span className="step-label">次の疑問</span><h2>続けて、気になることを調べよう</h2>{questionForm}</section>}{cards.length > 0 && <section className="reflection-card"><span className="step-label">最後に自分の言葉で</span><h2>考えの変化を書こう</h2><textarea value={reflection} onChange={(e) => setReflection(e.target.value)} placeholder="最初は〜と思ったが、資料を読んで〜と考えた。" /></section>}</>}{error && <p className="message error-message">{error}</p>}</main>;
}
