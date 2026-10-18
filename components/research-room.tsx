"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Icon } from "@/components/icons";
import { UnitArtwork } from "@/components/unit-artwork";
import { SourceReader } from "@/components/source-reader";
import { CuriosityMission } from "@/components/curiosity-mission";
import { useWorkspace } from "@/components/workspace-provider";
import type { ChatMessage, DetectiveNote, Difficulty, EvidencePoint, HistoricalSource, HistoryUnit, InquiryResult, LearningStyle } from "@/lib/types";

const levels: { id: Difficulty; label: string; description: string }[] = [
  { id: "easy", label: "やさしく", description: "短く、わかりやすく" },
  { id: "standard", label: "標準", description: "基本をしっかり" },
  { id: "deep", label: "深掘り", description: "資料を比べて考える" },
];

const learningStyles: { id: LearningStyle; label: string; description: string; icon: string }[] = [
  { id: "story", label: "たとえで楽しく", description: "はじめてでも、身近な話からわかる", icon: "sparkles" },
  { id: "detective", label: "歴史好きの深読み", description: "意外なエピソードと、史料の謎を追う", icon: "search" },
];

export function ResearchRoom({ unit, initialQuestion = "", initialNoteId, startNew = false }: { unit: HistoryUnit; initialQuestion?: string; initialNoteId?: string; startNew?: boolean }) {
  const { ready, notes, saveNote, storageError } = useWorkspace();
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [learningStyle, setLearningStyle] = useState<LearningStyle>("story");
  const [sourceId, setSourceId] = useState(unit.sources[0]?.id ?? "");
  const [sourceIds, setSourceIds] = useState<string[]>([]);
  const [question, setQuestion] = useState(initialQuestion);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hypothesis, setHypothesis] = useState("");
  const [discoveries, setDiscoveries] = useState<string[]>([]);
  const [noteId, setNoteId] = useState("");
  const [noteTitle, setNoteTitle] = useState("");
  const [createdAt, setCreatedAt] = useState("");
  const [restored, setRestored] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [questionMode, setQuestionMode] = useState<"guided" | "free">(initialQuestion ? "free" : "guided");
  const requestRef = useRef<AbortController | null>(null);
  const conversationRef = useRef<HTMLDivElement>(null);
  const source = unit.sources.find((item) => item.id === sourceId) ?? unit.sources[0];

  useEffect(() => {
    if (!ready || restored) return;
    const lastNote = startNew ? undefined : notes.find((note) => note.unitId === unit.id && (!initialNoteId || note.id === initialNoteId));
    if (lastNote) {
      setNoteId(lastNote.id);
      setNoteTitle(lastNote.title);
      setCreatedAt(lastNote.createdAt);
      setHypothesis(lastNote.hypothesis);
      setDiscoveries(lastNote.discoveries);
      setSourceIds(lastNote.sourceIds.filter((id) => unit.sources.some((item) => item.id === id)));
      setMessages(lastNote.messages);
      setDifficulty(lastNote.difficulty);
      setLearningStyle(lastNote.learningStyle ?? "story");
      setSaved(true);
    }
    setRestored(true);
  }, [ready, restored, notes, unit, initialNoteId, startNew]);

  useEffect(() => () => requestRef.current?.abort(), []);

  async function askQuestion(text: string, referenceSourceId = sourceId) {
    const trimmed = text.trim();
    if (!trimmed || isLoading || trimmed.length > 500) return;
    setError("");
    setIsLoading(true);
    setSaved(false);
    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: "user", content: trimmed, createdAt: new Date().toISOString() };
    const history = messages.slice(-12).map(({ role, content }) => ({ role, content: content.slice(0, 2000) }));
    setMessages((current) => [...current, userMessage]);
    setQuestion("");
    const controller = new AbortController();
    requestRef.current = controller;
    const timeout = setTimeout(() => controller.abort(), 45000);
    try {
      const response = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({ question: trimmed, unitId: unit.id, difficulty, learningStyle, selectedSourceIds: referenceSourceId ? [referenceSourceId] : [], messages: history }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "回答を取得できませんでした。");
      if (typeof data.answer !== "string" || !Array.isArray(data.facts) || !Array.isArray(data.interpretations)) throw new Error("回答の形式を読み取れませんでした。もう一度質問してください。");
      const result = data as InquiryResult;
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", content: result.answer, createdAt: new Date().toISOString(), result }]);
      setSourceIds((current) => [...new Set([...current, ...result.sources.map((item) => item.id), ...(referenceSourceId ? [referenceSourceId] : [])])]);
      requestAnimationFrame(() => conversationRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
    } catch (cause) {
      setError(cause instanceof Error && cause.name !== "AbortError" ? cause.message : "回答に時間がかかっています。もう一度お試しください。");
      setQuestion(trimmed);
    } finally {
      clearTimeout(timeout);
      requestRef.current = null;
      setIsLoading(false);
    }
  }

  function submitQuestion(event: FormEvent) { event.preventDefault(); void askQuestion(question); }

  function saveDraft() {
    if (!ready || (!hypothesis.trim() && messages.length === 0 && sourceIds.length === 0)) return;
    const now = new Date().toISOString();
    const id = noteId || crypto.randomUUID();
    const firstQuestion = messages.find((message) => message.role === "user")?.content;
    const note: DetectiveNote = {
      id, unitId: unit.id, title: noteTitle || (firstQuestion ? firstQuestion.slice(0, 60) : `${unit.title}の調査`), hypothesis,
      discoveries, sourceIds, messages, difficulty, learningStyle, createdAt: createdAt || now, updatedAt: now,
    };
    saveNote(note);
    setNoteId(id);
    setNoteTitle(note.title);
    setCreatedAt(note.createdAt);
    setSaved(true);
  }

  function addDiscovery(text: string, ids: string[]) {
    setDiscoveries((current) => [...new Set([...current, text])]);
    setSourceIds((current) => [...new Set([...current, ...ids])]);
    setSaved(false);
  }

  function showSource(id: string) {
    setSourceId(id);
    requestAnimationFrame(() => document.getElementById("source-evidence")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  const lastResult = [...messages].reverse().find((message) => message.result)?.result;

  return (
    <main className="workspace research-workspace">
      <section className="page-hero research-hero"><div><p className="eyebrow gold">THE HISTORICAL RESEARCH ROOM</p><h1><Icon name="book" size={36}/>書物調査室</h1><p>資料をひもとき、問いを重ねて、キミだけの考察へ。</p></div><div className="hero-steps"><span className="current">01 調べる</span><i/><span>02 考える</span><i/><span>03 記録する</span></div></section>
      <div className="research-heading"><div className="research-unit"><UnitArtwork unitId={unit.id}/><div><div className="tag-row"><span className="badge">{unit.category}</span><span className="muted">{unit.period}</span></div><h2>{unit.title}</h2><p>{unit.summary}</p></div></div><Link href="/#units" className="text-button"><Icon name="arrow-left" size={16}/>単元を選び直す</Link></div>
      <CuriosityMission unitId={unit.id} onSource={showSource} onAsk={(item, id) => {setSourceId(id);void askQuestion(item, id);}} onSaveClue={addDiscovery} isLoading={isLoading} savedClues={discoveries}/>
      <section className="panel learning-style-panel" aria-labelledby="learning-style-title">
        <div className="learning-style-intro"><span className="eyebrow gold">YOUR WAY TO EXPLORE</span><h2 id="learning-style-title">どんな読み方で、歴史を楽しむ？</h2><p>資料はすぐ切り替わります。AIの説明は、次の質問から変わります。</p></div>
        <div className="learning-style-options" role="group" aria-label="歴史の楽しみ方">{learningStyles.map((style) => <button key={style.id} className={learningStyle === style.id ? "active" : ""} onClick={() => {setLearningStyle(style.id);setSaved(false);}} aria-pressed={learningStyle === style.id}><Icon name={style.icon} size={22}/><span><strong>{style.label}</strong><small>{style.description}</small></span>{learningStyle === style.id && <Icon name="check" size={16}/>}</button>)}</div>
      </section>
      <div className="research-grid">
        <section id="source-evidence" className="source-column" aria-label="資料を調べる">
          <div className="section-heading compact"><div><span className="step-number">01</span><h2>資料の手がかりを探す</h2></div><span className="section-count">{unit.sources.length} SOURCES</span></div>
          <div className="source-selector" aria-label="読む資料">{unit.sources.map((item, index) => <button className={`source-selector-item ${sourceId === item.id ? "active" : ""}`} key={item.id} onClick={() => setSourceId(item.id)} aria-pressed={sourceId === item.id}><span>資料 {index+1}</span><strong>{item.title}</strong><Icon name="book" size={16}/></button>)}</div>
          {source && <SourceReader key={source.id} source={source} sourceNumber={unit.sources.indexOf(source) + 1} learningStyle={learningStyle} bookmarked={sourceIds.includes(source.id)} isLoading={isLoading} onBookmark={() => {setSourceIds((current) => current.includes(source.id) ? current.filter((id) => id !== source.id) : [...current, source.id]);setSaved(false);}} onAsk={(item) => void askQuestion(item)}/>}
          <div className="research-tip"><span><Icon name="lightbulb" size={25}/></span><p><strong>同じ出来事も、見る人によって違う。</strong><br/>誰が、いつ、どんな立場で書いたかにも注目しよう。</p></div>
          <div className="evidence-legend"><span><i className="fact-dot"/>資料から確認できること</span><span><i className="interpretation-dot"/>解釈・諸説があること</span></div>
        </section>
        <div className="question-column">
          <section className="panel inquiry-panel" aria-label="AIと調査する">
            <div className="inquiry-panel-header"><span className="ai-symbol"><Icon name="sparkles" size={22}/></span><div><h2>何が気になった？ ひとつ聞いてみよう</h2><p>下の質問を選ぶだけでもOK。知らない言葉も聞いてみよう。</p></div><span className="badge badge-ai">AIサポート</span></div>
            <div className="difficulty-tabs" role="group" aria-label="説明の難易度">{levels.map((level) => <button key={level.id} className={difficulty === level.id ? "active" : ""} onClick={() => {setDifficulty(level.id);setSaved(false);}} aria-pressed={difficulty === level.id}><strong>{level.label}</strong><span>{level.description}</span></button>)}</div>
            <div className="question-mode-row"><div className="mini-tabs" role="group" aria-label="質問の方法"><button className={questionMode === "guided" ? "active" : ""} onClick={() => setQuestionMode("guided")} aria-pressed={questionMode === "guided"}><Icon name="lightbulb" size={14}/>ヒントから質問</button><button className={questionMode === "free" ? "active" : ""} onClick={() => {setQuestionMode("free");document.getElementById("research-question")?.focus();}} aria-pressed={questionMode === "free"}><Icon name="edit" size={14}/>自由に質問</button></div></div>
            {questionMode === "guided" && <div className="guided-questions">{unit.questions[difficulty].map((item) => <button key={item} className="guided-question" onClick={() => void askQuestion(item)} disabled={isLoading}><span className="question-mark">?</span><span>{item}</span><Icon name="arrow-right" size={16}/></button>)}</div>}
            <form onSubmit={submitQuestion} className="research-question-form"><label htmlFor="research-question" className="sr-only">歴史について質問する</label><textarea id="research-question" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder={questionMode === "free" ? "知りたいことを、自分の言葉で聞いてみよう…" : "自分の言葉でも質問できます…"} maxLength={500} rows={2}/><button className="button button-primary" type="submit" disabled={isLoading || !question.trim()}><Icon name="send" size={17}/>{isLoading ? "調査中…" : "質問する"}</button></form>
            <div className="question-form-footer"><span>{source ? `参照中：${source.title}` : "資料を選んで質問しよう"}</span><span>{question.length} / 500</span></div>
            {error && <p className="form-error" role="alert">{error}</p>}
          </section>
          <section className="panel conversation-panel" aria-label="AIとの問答" aria-live="polite">
            <div className="panel-heading"><h2><Icon name="message" size={21}/>AIとの問答</h2><span className="muted">{messages.filter((message) => message.role === "user").length}回の問い</span></div>
            {messages.length === 0 ? <div className="conversation-empty"><div className="detective-avatar"><Icon name="compass" size={35}/></div><div><strong>質問が思いつかなくても、大丈夫。</strong><p>「織田信長ってだれ？」から始めてもOK。<br/>上の質問をひとつ選ぶと、ここで話せるよ。</p></div></div> : <div className="research-conversation">{messages.map((message) => <div className={`research-message ${message.role}`} key={message.id}><span className="chat-avatar"><Icon name={message.role === "user" ? "user" : "sparkles"} size={18}/></span><div className="research-message-content"><div className="message-byline"><strong>{message.role === "user" ? "あなたの問い" : "探究ガイド"}</strong>{message.result?.mode === "demo" && <span className="demo-badge">体験用の回答</span>}{message.result?.learningStyle && <span className="answer-style-label">{message.result.learningStyle === "story" ? "たとえで楽しく" : "歴史好きの深読み"}</span>}</div><p>{message.content}</p>{message.result?.analogy && <div className="answer-analogy"><strong><Icon name="sparkles" size={15}/>たとえてみると</strong><p>{message.result.analogy}</p><small>当時の出来事をイメージするためのたとえです。</small></div>}{message.result && <><EvidenceGroup label="資料から確認できること" kind="fact" points={message.result.facts} sources={unit.sources} onSource={showSource} onSave={addDiscovery} discoveries={discoveries}/><EvidenceGroup label="解釈・諸説があること" kind="interpretation" points={message.result.interpretations} sources={unit.sources} onSource={showSource} onSave={addDiscovery} discoveries={discoveries}/>{message.result.unknowns.length > 0 && <details className="unknown-details"><summary>まだ確かめたいこと</summary><ul>{message.result.unknowns.map((item) => <li key={item}>{item}</li>)}</ul></details>}</>}</div></div>)}<div ref={conversationRef}/></div>}
            {isLoading && <div className="loading-answer" role="status"><span/><span/><span/>資料をもとに、問いを考えています…</div>}
            {lastResult?.mode === "demo" && <p className="demo-note">体験モード：登録資料に基づく回答例です。Geminiを設定すると、AIとの自由な対話に切り替わります。</p>}
            {lastResult && lastResult.followUpQuestions.length > 0 && !isLoading && <div className="followup-section"><span>次は、こんな問いも</span><div>{lastResult.followUpQuestions.map((item) => <button className="followup-chip" key={item} onClick={() => void askQuestion(item)}>{item}<Icon name="plus" size={13}/></button>)}</div></div>}
          </section>
        </div>
      </div>
      <section className="hypothesis-section parchment"><div className="hypothesis-intro"><span className="step-number">02</span><div><h2><Icon name="edit" size={23}/>最後に、自分のひとこと</h2><p>「意外だった」「まだ気になる」からでOK。資料で見つけたことと、自分の考えを残そう。</p></div><span className="hypothesis-save-state">{saved && !storageError ? <><Icon name="check" size={15}/>保存済み</> : "あなたの考えが、ノートの主役。"}</span></div><label className="sr-only" htmlFor="hypothesis">自分の仮説・考察</label><textarea id="hypothesis" value={hypothesis} onChange={(event) => {setHypothesis(event.target.value);setSaved(false);}} placeholder={`例：いちばん意外だったのは…。資料には…とあった。だから私は…と思った。`} maxLength={5000} rows={4}/><div className="hypothesis-footer"><div className="saved-evidence-count"><Icon name="bookmark" size={15}/>{sourceIds.length}件の資料<span>·</span><Icon name="lightbulb" size={16}/>{discoveries.length}件の発見<span>·</span>問答も一緒に保存</div><div>{noteId && <Link className="text-button" href={`/notes?id=${encodeURIComponent(noteId)}`}>探偵ノートを見る<Icon name="arrow-right" size={15}/></Link>}<button className="button button-ink" onClick={saveDraft} disabled={!ready || isLoading || (!hypothesis.trim() && messages.length === 0 && sourceIds.length === 0)}><Icon name={saved ? "check" : "bookmark"} size={17}/>{saved ? "もう一度保存" : "探偵ノートに保存"}</button></div></div>{storageError && <p className="form-error" role="alert">{storageError}</p>}{saved && !storageError && <p className="save-notice" role="status">このブラウザに保存しました。探偵ノートで考察と問答を振り返れます。</p>}</section>
      <div className="research-bottom-links"><Link href="/notes"><Icon name="notebook" size={17}/>これまでの考察を振り返る<Icon name="arrow-right" size={15}/></Link><Link href={`/board?unit=${unit.id}`}><Icon name="message" size={17}/>この単元の探偵掲示板へ<Icon name="arrow-right" size={15}/></Link></div>
    </main>
  );
}

function EvidenceGroup({ label, kind, points, sources, onSource, onSave, discoveries }: { label: string; kind: "fact" | "interpretation"; points: EvidencePoint[]; sources: HistoricalSource[]; onSource: (id: string) => void; onSave: (text: string, ids: string[]) => void; discoveries: string[] }) {
  if (points.length === 0) return null;
  return <div className={`evidence-group ${kind}`}><h4><i/>{label}</h4>{points.map((point) => <div className="evidence-point" key={point.text}><p>{point.text}</p><div className="evidence-point-actions"><div>{point.sourceIds.map((id) => {const source = sources.find((item) => item.id === id);return source ? <button key={id} onClick={() => onSource(id)} title={source.title}><Icon name="book" size={12}/>{source.title}</button> : null;})}</div><button className={discoveries.includes(point.text) ? "added" : ""} onClick={() => onSave(point.text, point.sourceIds)} disabled={discoveries.includes(point.text)} aria-label={`発見を追加：${point.text}`}><Icon name={discoveries.includes(point.text) ? "check" : "plus"} size={13}/>{discoveries.includes(point.text) ? "追加済み" : "発見に追加"}</button></div></div>)}</div>;
}
