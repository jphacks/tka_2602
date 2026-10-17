"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { HypothesisReview, Inquiry } from "@/lib/gemini";
import type { EvidenceRelation, ResearchSource, SourceKind } from "@/lib/sources";

type Investigation = Inquiry & { sources: ResearchSource[] };
type QuestionMemo = { id: string; text: string; status: "未整理" | "調査中" | "仮説に使った" };
type SavedNote = { id: string; question: string; hypothesis: string; sources: ResearchSource[]; savedAt: string };

const examples = ["明智光秀はなぜ本能寺の変を起こしたの？", "なぜ江戸幕府は長く続いたの？"];
const relations: EvidenceRelation[] = ["背景", "根拠になる", "別の見方", "まだ分からない"];
const sourceKinds: SourceKind[] = ["教育解説", "動画", "画像", "ユーザー追加"];
const noteStorageKey = "rekishirube-saved-notes";

export function ResearchWorkspace() {
  const [question, setQuestion] = useState("");
  const [investigation, setInvestigation] = useState<Investigation | null>(null);
  const [subQuestions, setSubQuestions] = useState<QuestionMemo[]>([]);
  const [newSubQuestion, setNewSubQuestion] = useState("");
  const [activeQuestionId, setActiveQuestionId] = useState("main");
  const [hypothesis, setHypothesis] = useState("");
  const [review, setReview] = useState<HypothesisReview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [error, setError] = useState("");
  const [showSourceForm, setShowSourceForm] = useState(false);
  const [sourceDraft, setSourceDraft] = useState({ url: "", title: "", note: "", kind: "教育解説" as SourceKind, relation: "背景" as EvidenceRelation });
  const [savedNotes, setSavedNotes] = useState<SavedNote[]>([]);
  const [showNotes, setShowNotes] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");

  useEffect(() => {
    const stored = window.localStorage.getItem(noteStorageKey);
    if (stored) setSavedNotes(JSON.parse(stored) as SavedNote[]);
  }, []);

  const allSources = investigation?.sources ?? [];
  const activeLabel = activeQuestionId === "main"
    ? "主質問"
    : subQuestions.find((item) => item.id === activeQuestionId)?.status ?? "未整理";

  async function startInvestigation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) return;

    setError("");
    setIsLoading(true);
    setReview(null);
    setSavedMessage("");
    const response = await fetch("/api/inquiry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: trimmedQuestion }),
    });
    const data = await response.json();
    setIsLoading(false);

    if (!response.ok) {
      setError(data.error ?? "調査室を始められませんでした。");
      return;
    }

    setInvestigation(data as Investigation);
    setSubQuestions((data.followUpQuestions as string[]).map((text, index) => ({ id: `suggested-${index}`, text, status: "未整理" })));
    setActiveQuestionId("main");
    setHypothesis("");
  }

  function addSubQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = newSubQuestion.trim();
    if (!text) return;
    const memo = { id: crypto.randomUUID(), text, status: "未整理" as const };
    setSubQuestions((current) => [...current, memo]);
    setActiveQuestionId(memo.id);
    setNewSubQuestion("");
  }

  function addPersonalSource(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!investigation) return;
    const url = sourceDraft.url.trim();
    const title = sourceDraft.title.trim();
    if (!url || !title) return;

    try {
      new URL(url);
    } catch {
      setError("資料のURLは https:// から始まる形式で入力してください。");
      return;
    }

    const source: ResearchSource = {
      id: crypto.randomUUID(),
      title,
      provider: "自分で追加",
      url,
      kind: sourceDraft.kind,
      description: sourceDraft.note || "自分で見つけた資料です。",
      whyThisMatters: "この資料を選んだ理由を、自分の仮説と結びつけて考えましょう。",
      tags: [],
      origin: "user",
      relation: sourceDraft.relation,
      note: sourceDraft.note,
    };
    setInvestigation({ ...investigation, sources: [...investigation.sources, source] });
    setSourceDraft({ url: "", title: "", note: "", kind: "教育解説", relation: "背景" });
    setShowSourceForm(false);
    setError("");
  }

  function useQuestionInHypothesis(id: string) {
    setActiveQuestionId(id);
    if (id !== "main") {
      setSubQuestions((current) => current.map((item) => item.id === id ? { ...item, status: "調査中" } : item));
    }
  }

  async function askForReview() {
    if (!investigation || hypothesis.trim().length < 20) return;
    setError("");
    setIsReviewing(true);
    const response = await fetch("/api/reflection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, hypothesis, sources: allSources }),
    });
    const data = await response.json();
    setIsReviewing(false);
    if (!response.ok) {
      setError(data.error ?? "振り返りを作成できませんでした。");
      return;
    }
    setReview(data as HypothesisReview);
    setSubQuestions((current) => current.map((item) => item.id === activeQuestionId ? { ...item, status: "仮説に使った" } : item));
  }

  function saveNotebook() {
    if (!investigation) return;
    const note: SavedNote = {
      id: crypto.randomUUID(),
      question,
      hypothesis,
      sources: allSources,
      savedAt: new Date().toISOString(),
    };
    const next = [note, ...savedNotes];
    window.localStorage.setItem(noteStorageKey, JSON.stringify(next));
    setSavedNotes(next);
    setSavedMessage("この端末の探偵ノートに保存しました。");
  }

  const sourceCountText = useMemo(() => `${allSources.length} 件の資料`, [allSources.length]);

  if (!investigation) {
    return (
      <section className="start-screen">
        <div className="start-copy">
          <p className="eyebrow">HISTORY RESEARCH STUDIO</p>
          <h1>気になる「なぜ？」を<br />探究の入り口に。</h1>
          <p>AIが最初の資料を用意します。あなたは、根拠を比べ、自分だけの仮説をつくります。</p>
        </div>
        <form className="question-launcher" onSubmit={startInvestigation}>
          <label htmlFor="main-question">今日、追いかけたい歴史の疑問</label>
          <textarea id="main-question" maxLength={500} onChange={(event) => setQuestion(event.target.value)} placeholder="例：なぜ明智光秀は本能寺の変を起こしたの？" required value={question} />
          <div className="launcher-footer">
            <div className="example-row">{examples.map((example) => <button key={example} onClick={() => setQuestion(example)} type="button">{example}</button>)}</div>
            <button className="primary-button" disabled={isLoading} type="submit">{isLoading ? "資料を集めています…" : "調査室をひらく →"}</button>
          </div>
        </form>
        {error && <p className="message error-message">{error}</p>}
        <div className="principles">
          <div><strong>1. AIが最初の資料を提案</strong><span>信頼できる資料を起点にします。</span></div>
          <div><strong>2. 自分の資料も追加できる</strong><span>URL・動画・画像URLを根拠に残せます。</span></div>
          <div><strong>3. 正解でなく、根拠を残す</strong><span>仮説は何度でも育て直せます。</span></div>
        </div>
      </section>
    );
  }

  return (
    <section className="investigation-shell">
      <header className="workspace-header">
        <button className="brand-button" onClick={() => setInvestigation(null)} type="button"><span>✦</span> レキしるべ</button>
        <div className="workspace-progress"><span>探究中</span><b>{sourceCountText}</b><b>{subQuestions.length} 個の調査メモ</b></div>
        <button className="quiet-button" onClick={() => setShowNotes((value) => !value)} type="button">探偵ノート {savedNotes.length}</button>
      </header>

      {showNotes && <aside className="saved-notes" aria-label="保存済みの探偵ノート"><h2>保存済みの探偵ノート</h2>{savedNotes.length === 0 ? <p>まだ保存したノートはありません。</p> : <ul>{savedNotes.map((note) => <li key={note.id}><strong>{note.question}</strong><span>{new Date(note.savedAt).toLocaleDateString("ja-JP")} ・ 資料 {note.sources.length}件</span></li>)}</ul>}</aside>}

      <div className="workspace-title">
        <p className="eyebrow">主質問</p>
        <h1>{question}</h1>
        <p>{investigation.answer}</p>
      </div>

      <div className="research-layout">
        <aside className="question-rail">
          <div className="rail-heading"><div><p className="eyebrow">調査の道筋</p><h2>質問を束ねる</h2></div><span className="status-tag">{activeLabel}</span></div>
          <button className={`question-item main-question ${activeQuestionId === "main" ? "active" : ""}`} onClick={() => useQuestionInHypothesis("main")} type="button"><span>主</span><strong>{question}</strong></button>
          <div className="subquestion-list">
            {subQuestions.map((item, index) => <details className={`subquestion ${activeQuestionId === item.id ? "active" : ""}`} key={item.id}><summary><span>{index + 1}</span><b>{item.text}</b><em>{item.status}</em></summary><div><p>この問いは、主質問に答えるための補助的な調査メモです。</p><button onClick={() => useQuestionInHypothesis(item.id)} type="button">この問いを調べる</button></div></details>)}
          </div>
          <form className="add-subquestion" onSubmit={addSubQuestion}><label htmlFor="sub-question">＋ 自分の調査メモを追加</label><input id="sub-question" maxLength={120} onChange={(event) => setNewSubQuestion(event.target.value)} placeholder="例：光秀の立場は？" value={newSubQuestion} /><button type="submit">追加</button></form>
        </aside>

        <main className="evidence-workbench">
          <div className="section-heading"><div><p className="eyebrow">資料ボード</p><h2>まずは、資料を比べよう</h2><p>AIが資料ライブラリから提案した入口です。結論ではなく、考える材料として使います。</p></div><button className="outline-button" onClick={() => setShowSourceForm((value) => !value)} type="button">＋ 自分の資料を追加</button></div>

          {showSourceForm && <form className="source-form" onSubmit={addPersonalSource}><div className="form-grid"><label>資料のURL または画像URL<input onChange={(event) => setSourceDraft({ ...sourceDraft, url: event.target.value })} placeholder="https://..." required type="url" value={sourceDraft.url} /></label><label>資料のタイトル<input onChange={(event) => setSourceDraft({ ...sourceDraft, title: event.target.value })} placeholder="例：明智光秀に関する解説動画" required value={sourceDraft.title} /></label><label>資料の種類<select onChange={(event) => setSourceDraft({ ...sourceDraft, kind: event.target.value as SourceKind })} value={sourceDraft.kind}>{sourceKinds.map((kind) => <option key={kind}>{kind}</option>)}</select></label><label>仮説との関係<select onChange={(event) => setSourceDraft({ ...sourceDraft, relation: event.target.value as EvidenceRelation })} value={sourceDraft.relation}>{relations.map((relation) => <option key={relation}>{relation}</option>)}</select></label></div><label>この資料から分かったこと<textarea maxLength={300} onChange={(event) => setSourceDraft({ ...sourceDraft, note: event.target.value })} placeholder="リンクを選んだ理由や、分かったことを自分の言葉で残します。" value={sourceDraft.note} /></label><div className="form-actions"><button className="quiet-button" onClick={() => setShowSourceForm(false)} type="button">やめる</button><button className="primary-button" type="submit">資料として追加</button></div></form>}

          <div className="source-grid">{allSources.map((source) => <SourceCard key={source.id} source={source} />)}</div>
          <p className="source-disclaimer">AIはリンク先の本文を読んだふりをしません。自分で追加した資料は、提供元と内容を確かめてから根拠に使いましょう。</p>
        </main>

        <aside className="thinking-panel">
          <section className="ai-guide"><p className="eyebrow">AI 調査ガイド</p><h2>答えより、次の問いを。</h2><ul>{investigation.followUpQuestions.map((item) => <li key={item}><span>?</span>{item}</li>)}</ul></section>
          <section className="hypothesis-panel"><div className="panel-title"><div><p className="eyebrow">仮説ノート</p><h2>自分の考えを書く</h2></div><span>{hypothesis.length}/300</span></div><p className="writing-help">「私は〜と考える。なぜなら、〜という資料から…」のように、根拠とつなげてみよう。</p><textarea maxLength={300} onChange={(event) => setHypothesis(event.target.value)} placeholder="ここに、自分の仮説を書きます。" value={hypothesis} /><div className="hypothesis-actions"><button className="outline-button" disabled={hypothesis.trim().length < 20 || isReviewing} onClick={askForReview} type="button">{isReviewing ? "AIが振り返り中…" : "AIに見方を聞く"}</button><button className="primary-button" onClick={saveNotebook} type="button">ノートに保存</button></div>{savedMessage && <p className="message success-message">{savedMessage}</p>}
          {review && <div className="review-card"><strong>AIからの振り返り</strong><div><b>使えている根拠</b><ul>{review.evidenceUsed.map((item) => <li key={item}>{item}</li>)}</ul></div><div><b>別の見方</b><p>{review.blindSpot}</p></div><div><b>次の一歩</b><p>{review.nextStep}</p></div></div>}</section>
          {error && <p className="message error-message">{error}</p>}
        </aside>
      </div>
    </section>
  );
}

function SourceCard({ source }: { source: ResearchSource }) {
  const label = source.origin === "ai" ? "AIが最初に提案" : "自分で追加";
  return <article className={`source-card ${source.origin === "user" ? "user-source" : ""}`}><div className="source-meta"><span>{label}</span><em>{source.kind}</em></div><h3>{source.title}</h3><p className="provider">{source.provider}</p><p>{source.description}</p>{source.note && <blockquote>「{source.note}」</blockquote>}<div className="source-footer"><span>{source.relation ?? "調査の入口"}</span><a href={source.url} rel="noreferrer" target="_blank">資料を開く ↗</a></div></article>;
}
