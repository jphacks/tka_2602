"use client";

import { FormEvent, useEffect, useState } from "react";
import type { CuriosityScene, InquiryPlan, ResearchCard } from "@/lib/research-types";

const examples = ["白村江の戦いについて調べてください", "明智光秀はなぜ本能寺の変を起こしたの？"];
const notesStorageKey = "rekishirube:research-notes:v1";
const legacyStorageKey = "rekishirube:research-note:v1";

type ResearchNote = {
  id: string;
  assignment: string;
  plan: InquiryPlan;
  sceneId: string | null;
  question: string;
  cards: ResearchCard[];
  reflection: string;
  createdAt: string;
  updatedAt: string;
};

type LegacyResearch = Omit<ResearchNote, "id" | "createdAt" | "updatedAt"> & { version: 1 };
type ResearchContent = Omit<ResearchNote, "id" | "createdAt" | "updatedAt">;

function normalizeStoredPlan(plan: InquiryPlan): InquiryPlan {
  return {
    ...plan,
    curiosityHook: {
      ...plan.curiosityHook,
      scenes: plan.curiosityHook.scenes.map((scene) => {
        const olderScene = scene as CuriosityScene & { summary?: string };
        return {
          ...scene,
          angle: scene.angle ?? "歴史の場面",
          timeframe: scene.timeframe ?? "このころ",
          place: scene.place ?? "関係した地域",
          teaser: scene.teaser ?? olderScene.summary ?? "",
          detail: scene.detail ?? olderScene.summary ?? "",
        };
      }),
    },
  };
}

function parseNotes(value: string): ResearchNote[] {
  try {
    const notes = JSON.parse(value) as unknown;
    if (!Array.isArray(notes)) return [];
    return notes.filter((note): note is ResearchNote => Boolean(note && typeof note === "object" && "id" in note && "assignment" in note && "plan" in note && "cards" in note)).map((note) => ({ ...note, plan: normalizeStoredPlan(note.plan) }));
  } catch {
    return [];
  }
}

function parseLegacyNote(value: string): LegacyResearch | null {
  try {
    const note = JSON.parse(value) as Partial<LegacyResearch>;
    if (note.version !== 1 || typeof note.assignment !== "string" || !note.plan || !Array.isArray(note.cards)) return null;
    return note as LegacyResearch;
  } catch {
    return null;
  }
}

function displayDate(iso: string) {
  return new Intl.DateTimeFormat("ja-JP", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
}

function contentSnapshot(content: ResearchContent) {
  return JSON.stringify({ assignment: content.assignment, plan: content.plan, sceneId: content.sceneId, question: content.question, cards: content.cards, reflection: content.reflection });
}

export function ResearchWorkspace() {
  const [assignment, setAssignment] = useState("");
  const [plan, setPlan] = useState<InquiryPlan | null>(null);
  const [scene, setScene] = useState<CuriosityScene | null>(null);
  const [question, setQuestion] = useState("");
  const [cards, setCards] = useState<ResearchCard[]>([]);
  const [reflection, setReflection] = useState("");
  const [notes, setNotes] = useState<ResearchNote[]>([]);
  const [noteId, setNoteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [savedSnapshot, setSavedSnapshot] = useState<string | null>(null);
  const currentSnapshot = plan ? contentSnapshot({ assignment, plan, sceneId: scene?.id ?? null, question, cards, reflection }) : null;
  const hasUnsavedChanges = Boolean(plan && currentSnapshot !== savedSnapshot);

  useEffect(() => {
    const savedNotes = parseNotes(window.localStorage.getItem(notesStorageKey) ?? "");
    if (savedNotes.length > 0) {
      setNotes(savedNotes);
      return;
    }

    const legacy = parseLegacyNote(window.localStorage.getItem(legacyStorageKey) ?? "");
    if (!legacy) return;
    const now = new Date().toISOString();
    const migrated: ResearchNote = { ...legacy, plan: normalizeStoredPlan(legacy.plan), id: crypto.randomUUID(), createdAt: now, updatedAt: now };
    window.localStorage.setItem(notesStorageKey, JSON.stringify([migrated]));
    window.localStorage.removeItem(legacyStorageKey);
    setNotes([migrated]);
    setSaveMessage("以前に保存した探究ノートを一覧へ移しました。");
  }, []);

  useEffect(() => {
    function warnBeforeUnload(event: BeforeUnloadEvent) {
      if (!hasUnsavedChanges) return;
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [hasUnsavedChanges]);

  function writeNotes(nextNotes: ResearchNote[]) {
    const sorted = [...nextNotes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    window.localStorage.setItem(notesStorageKey, JSON.stringify(sorted));
    setNotes(sorted);
  }

  function clearWorkspace() {
    if (hasUnsavedChanges && !window.confirm("保存していない変更があります。保存せずに探究ノート一覧へ移動しますか？")) return;
    setAssignment("");
    setPlan(null);
    setScene(null);
    setQuestion("");
    setCards([]);
    setReflection("");
    setNoteId(null);
    setError("");
    setSavedSnapshot(null);
  }

  function openNote(note: ResearchNote) {
    setAssignment(note.assignment);
    setPlan(note.plan);
    setScene(note.plan.curiosityHook.scenes.find((item) => item.id === note.sceneId) ?? null);
    setQuestion(note.question);
    setCards(note.cards);
    setReflection(note.reflection);
    setNoteId(note.id);
    setSavedSnapshot(contentSnapshot(note));
    setError("");
    setSaveMessage(`「${note.plan.title}」を開きました。`);
  }

  function deleteNote(id: string) {
    const note = notes.find((item) => item.id === id);
    if (!note || !window.confirm(`「${note.plan.title}」を削除しますか？ この操作は元に戻せません。`)) return;
    writeNotes(notes.filter((item) => item.id !== id));
    setSaveMessage("探究ノートを削除しました。");
  }

  function saveResearch() {
    if (!plan) return;
    const now = new Date().toISOString();
    const current = notes.find((item) => item.id === noteId);
    const saved: ResearchNote = {
      id: current?.id ?? crypto.randomUUID(),
      assignment,
      plan,
      sceneId: scene?.id ?? null,
      question,
      cards,
      reflection,
      createdAt: current?.createdAt ?? now,
      updatedAt: now,
    };
    writeNotes([saved, ...notes.filter((item) => item.id !== saved.id)]);
    setNoteId(saved.id);
    setSavedSnapshot(contentSnapshot(saved));
    setSaveMessage(current ? "この探究ノートを更新しました。" : "新しい探究ノートとして保存しました。ノート一覧からいつでも開けます。");
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
      setPlan(nextPlan);
      setScene(null);
      setCards([]);
      setQuestion("");
      setReflection("");
      setNoteId(null);
      setSavedSnapshot(null);
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

  const questionForm = <form className="personal-question" onSubmit={investigate}><label htmlFor="question">わたしの疑問</label><div><input id="question" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="例：なぜ倭は百済を助けようとしたの？" required /><button className="primary-button" disabled={loading}>{loading ? "資料を確かめています…" : "この疑問を調べる"}</button></div></form>;

  if (!plan) {
    return <main className="inquiry-app"><header className="app-header"><p className="brand">レキしるべ</p><p>歴史の「なんで？」を、自分の言葉でたどろう。</p></header>{saveMessage && <p className="message saved-message">{saveMessage}</p>}<section className="start-card"><span className="step-label">新しい探究</span><h1>探究の入口を<br />見つけよう</h1><p>先生から出されたテーマを入れると、AIが歴史の中で気になりそうな場面を示します。</p><form onSubmit={start}><label htmlFor="assignment">今日調べる歴史のテーマ・課題</label><textarea id="assignment" value={assignment} onChange={(event) => setAssignment(event.target.value)} required /><div className="example-row">{examples.map((example) => <button key={example} type="button" onClick={() => setAssignment(example)}>{example}</button>)}</div><button className="primary-button" disabled={loading}>{loading ? "考えています…" : "気になる場面を探す"}</button></form></section><section className="notebook-list-card"><span className="step-label">探究ノート一覧</span><h2>これまでの探究を開く</h2>{notes.length === 0 ? <p>まだ保存した探究ノートはありません。</p> : <div className="notebook-list">{notes.map((note) => <article key={note.id} className="notebook-item"><div><h3>{note.plan.title}</h3><p>{note.assignment}</p><small>最終保存：{displayDate(note.updatedAt)} ・ 疑問：{note.cards.length}件</small></div><div className="notebook-actions"><button className="outline-button" onClick={() => openNote(note)}>開く</button><button className="delete-button" onClick={() => deleteNote(note.id)}>削除</button></div></article>)}</div>}</section>{error && <p className="message error-message">{error}</p>}</main>;
  }

  return (
    <main className="inquiry-app">
      <header className="app-header">
        <div><p className="brand">レキしるべ</p><p>歴史の「なんで？」を、自分の言葉でたどろう。</p></div>
        <div className="header-actions"><button className="quiet-button" onClick={saveResearch}>ブラウザに保存</button><button className="quiet-button" onClick={clearWorkspace}>探究ノート一覧</button><button className="quiet-button" onClick={clearWorkspace}>新しいテーマ</button></div>
      </header>
      {saveMessage && <p className="message saved-message">{saveMessage}</p>}
      <section className="theme-card"><span className="step-label">今日のテーマ</span><h1>{plan.title}</h1><p>{plan.background}</p></section>
      <section className="curiosity-card">
        <div><span className="step-label">STEP 2</span><h2>どの場面が気になる？</h2><p>問いを選ぶのではなく、まず短い場面を読んでみよう。</p></div>
        <div className="question-choices">
          {plan.curiosityHook.scenes.map((item) => <button key={item.id} className={scene?.id === item.id ? "selected" : ""} onClick={() => setScene(item)}><span className="scene-choice-meta">{item.angle} ・ {item.timeframe} ・ {item.place}</span><span className="scene-choice-title">{item.title}</span><span className="scene-teaser">{item.teaser}</span></button>)}
        </div>
        {scene && <div className="scene-facts"><span className="step-label">この場面を詳しく見る</span><p className="scene-choice-meta">{scene.angle} ・ {scene.timeframe} ・ {scene.place}</p><h3>{scene.title}</h3><p className="scene-detail">{scene.detail}</p><h4>この場面で確かめられること</h4><ul>{scene.facts.map((fact, index) => <li key={`${scene.id}-${index}`}>{fact}</li>)}</ul></div>}
      </section>
      {cards.length === 0 && <section className="explore-card direct-question-card"><span className="step-label">{scene ? "STEP 3" : "すでに調べたいことがある人へ"}</span><h2>{scene ? "ここから、自分の「なんで？」を見つけよう" : "自分の「なんで？」を書いてみよう"}</h2><p>{scene ? "「どこが不思議？」「誰の立場が気になる？」「なぜそうなった？」と考えてみよう。" : "場面を選ばなくても、気になっていることから調べ始められます。"}</p>{questionForm}</section>}
      {cards.length > 0 && <section className="cards">{cards.map((card, cardIndex) => <article className="research-card" key={card.id}><span className="step-label">疑問 {cardIndex + 1}</span><h2>{card.question}</h2><h3>資料から分かったこと</h3>{card.evidence.map((evidence, evidenceIndex) => <div className="evidence-card" key={`${card.id}-evidence-${evidenceIndex}`}><p>{evidence.claim}</p><small>{evidence.relevance}</small><a href={evidence.sourceUrl} target="_blank" rel="noreferrer">{evidence.sourceTitle} を開く ↗</a></div>)}<h3>まだ決められないこと</h3><ul>{card.unknowns.map((unknown, unknownIndex) => <li key={`${card.id}-unknown-${unknownIndex}`}>{unknown}</li>)}</ul>{cardIndex === cards.length - 1 && <div className="next-questions"><h3>次に気になること</h3>{card.nextQuestions.map((nextQuestion, nextIndex) => <button key={`${card.id}-next-${nextIndex}`} onClick={() => setQuestion(nextQuestion)}>{nextQuestion}</button>)}</div>}</article>)}</section>}
      {cards.length > 0 && <section className="explore-card question-composer"><span className="step-label">次の疑問</span><h2>続けて、気になることを調べよう</h2>{questionForm}</section>}
      {cards.length > 0 && <section className="reflection-card"><span className="step-label">最後に自分の言葉で</span><h2>考えの変化を書こう</h2><textarea value={reflection} onChange={(event) => setReflection(event.target.value)} placeholder="最初は〜と思ったが、資料を読んで〜と考えた。" /></section>}
      {error && <p className="message error-message">{error}</p>}
    </main>
  );
}
