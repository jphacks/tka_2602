"use client";

import Link from "next/link";
import { useState } from "react";
import { historyUnits, getUnit } from "@/data/units";
import type { DetectiveNote } from "@/lib/types";
import { Icon } from "@/components/icons";
import { useWorkspace } from "@/components/workspace-provider";

function dateLabel(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "日時不明" : date.toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo", year: "numeric", month: "long", day: "numeric" });
}

function NoteDetail({ note }: { note: DetectiveNote }) {
  const { saveNote, deleteNote, storageError } = useWorkspace();
  const unit = getUnit(note.unitId) ?? historyUnits[0];
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(note.title);
  const [hypothesis, setHypothesis] = useState(note.hypothesis);
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const sources = unit.sources.filter((source) => note.sourceIds.includes(source.id));
  return <>
    <main className="note-main">
      <section className="panel note-title-panel">
        <div className="eyebrow"><Icon name="notebook" size={16} /> 探偵ノート <span>›</span> {unit.title}</div>
        <h2>{note.title}</h2>
        <p className="muted small">作成 {dateLabel(note.createdAt)} <span className="date-gap">最終更新 {dateLabel(note.updatedAt)}</span></p>
        <div className="tag-row"><span className="tag">{unit.title}</span><span className="tag">{note.difficulty === "easy" ? "やさしく" : note.difficulty === "deep" ? "深掘り" : "標準"}</span><span className="tag">{note.learningStyle === "detective" ? "歴史好きの深読み" : "たとえで楽しく"}</span><span className="badge">この端末に保存</span></div>
      </section>
      <section className="parchment reflection-panel">
        <div className="panel-heading"><h3><Icon name="notebook" /> 自分の考察</h3><button className="button button-primary button-small" onClick={() => { if (!editing) { setTitle(note.title); setHypothesis(note.hypothesis); } setEditing(!editing); setSaved(false); }}><Icon name={editing ? "close" : "edit"} size={15} />{editing ? "閉じる" : "編集する"}</button></div>
        {editing ? <form onSubmit={(event) => { event.preventDefault(); saveNote({ ...note, title: title.trim() || unit.title, hypothesis: hypothesis.trim(), updatedAt: new Date().toISOString() }); setEditing(false); setSaved(true); }}>
          <label className="field-label" htmlFor="note-title">ノートのタイトル</label><input id="note-title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={100} required />
          <label className="field-label" htmlFor="note-reflection">資料や問答をもとに、自分の考えを書こう</label><textarea id="note-reflection" value={hypothesis} onChange={(event) => setHypothesis(event.target.value)} rows={9} maxLength={12000} placeholder="私は……と考えます。その根拠は……です。まだ確かめたいことは……です。" />
          <button className="button button-primary" type="submit"><Icon name="check" size={16} /> 考察を保存する</button>
        </form> : <p className="reflection-text">{note.hypothesis || "まだ考察を書いていません。調べた資料やAIとの問答を振り返って、今の自分の考えを残してみよう。"}</p>}
        {saved && <p role="status" className="small">{storageError ? "保存に問題があります。画面上部のお知らせを確認してください。" : "考察をこのブラウザーに保存しました。"}</p>}
      </section>
      <section className="panel conversation-panel">
        <div className="panel-heading"><h3><Icon name="message" /> AIとの問答</h3><span className="muted small">{note.messages.filter((message) => message.role === "user").length} 回の質問</span></div>
        {note.messages.length ? <div className="note-conversation">{note.messages.map((message) => <article key={message.id} className={`note-chat-message ${message.role}`}><div className="chat-avatar"><Icon name={message.role === "user" ? "compass" : "sparkles"} size={18} /></div><div className="note-chat-bubble"><span className="eyebrow">{message.role === "user" ? "あなた" : "AI調査官"}</span><p>{message.content}</p>{message.result?.analogy && <div className="answer-analogy"><strong><Icon name="sparkles" size={15}/>たとえてみると</strong><p>{message.result.analogy}</p><small>当時の出来事をイメージするためのたとえです。</small></div>}{message.result?.mode === "demo" && <span className="badge">デモ回答</span>}</div></article>)}</div> : <div className="empty-state compact"><Icon name="message" /><p>保存された問答はまだありません。</p></div>}
        <Link className="button button-secondary" href={`/research/${unit.id}?note=${encodeURIComponent(note.id)}`}><Icon name="search" size={16} /> 書物調査室で続きを調べる</Link>
      </section>
      <div className="note-footer-actions">{confirmDelete ? <><span className="small">このノートを削除しますか？</span><button className="button button-secondary button-small" onClick={() => setConfirmDelete(false)}>キャンセル</button><button className="button button-danger button-small" onClick={() => deleteNote(note.id)}>削除する</button></> : <button className="text-button muted" onClick={() => setConfirmDelete(true)}><Icon name="trash" size={15} /> このノートを削除</button>}</div>
    </main>
    <aside className="note-evidence">
      <section className="panel discoveries-panel"><div className="panel-heading"><h3><Icon name="lightbulb" /> 発見したこと</h3></div>{note.discoveries.length ? <ul className="discovery-list">{note.discoveries.map((discovery, index) => <li key={`${index}-${discovery}`}>{discovery}</li>)}</ul> : <p className="muted">書物調査室で気づいたことを保存すると、ここに表示されます。</p>}</section>
      <section className="panel saved-sources"><div className="panel-heading"><h3><Icon name="book" /> 参照した資料</h3></div>{sources.length ? sources.map((source) => <a key={source.id} className="saved-source-card" href={source.url} target="_blank" rel="noreferrer"><Icon name="book" size={23} /><div><strong>{source.title}</strong><p>{source.author} · {source.period}</p><span className="badge">{source.kind === "primary" ? "一次史料" : "解説・研究"}</span></div><Icon name="external" size={16} /></a>) : <p className="muted">参照資料はまだありません。資料を選んで調べると、ノートに残せます。</p>}</section>
      <Link href={`/board?unit=${unit.id}`} className="button button-secondary"><Icon name="message" size={17} /> 探偵掲示板で考えをまとめる</Link>
    </aside>
  </>;
}

export function NotesWorkspace({ initialNoteId }: { initialNoteId?: string }) {
  const { ready, notes, storageError } = useWorkspace();
  const [unitFilter, setUnitFilter] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState(initialNoteId ?? null);
  const filteredNotes = notes.filter((note) => !unitFilter || note.unitId === unitFilter);
  const selectedNote = filteredNotes.find((note) => note.id === selectedId) ?? filteredNotes[0];
  return <>
    <header className="page-heading notes-page-heading"><div><div className="eyebrow">YOUR INVESTIGATION LOG</div><h1><Icon name="notebook" size={36} /> 探偵ノート</h1><p>学んだことやAIとの対話をもとに、自分だけの歴史の探究記録をつくろう。</p></div><Link href="/research/honnoji?new=1" className="button button-primary"><Icon name="plus" size={20} /> 新しいノートをつくる</Link></header>
    <p className="storage-notice"><Icon name="bookmark" size={15} /> ノートはこのブラウザーに保存されます。別の端末には同期されません。</p>
    {storageError && <p role="alert" className="status-message status-warning">{storageError}</p>}
    {!ready ? <div className="panel empty-state" role="status">ノートを読み込んでいます…</div> : <div className="notes-layout">
      <aside className="notes-sidebar"><section className="panel"><div className="panel-heading"><h3><Icon name="compass" /> 単元ごとの記録</h3></div><p className="muted small">問い・考察・資料・発見の4項目</p><div className="unit-progress-list">{historyUnits.map((unit) => { const unitNotes = notes.filter((note) => note.unitId === unit.id); const steps = [unitNotes.some((note) => note.messages.some((message) => message.role === "user")), unitNotes.some((note) => note.hypothesis.trim()), unitNotes.some((note) => note.sourceIds.length), unitNotes.some((note) => note.discoveries.length)].filter(Boolean).length; return <button key={unit.id} className={`unit-progress-item ${unitFilter === unit.id ? "active" : ""}`} onClick={() => { setUnitFilter(unitFilter === unit.id ? null : unit.id); setSelectedId(null); }}><span className={`unit-miniature unit-${unit.id}`}><Icon name={unit.icon} size={24} /></span><span className="unit-progress-content"><strong>{unit.title}</strong><progress max={4} value={steps} aria-label={`${unit.title}、4項目中${steps}項目を記録`} /><span className="muted small">{unitNotes.length} 冊 · {steps}/4 項目を記録</span></span><Icon name="arrow-right" size={15} /></button>; })}</div></section>
      <section className="panel"><div className="panel-heading"><h3><Icon name="notebook" /> 保存したノート</h3>{unitFilter && <button className="text-button small" onClick={() => setUnitFilter(null)}>すべて</button>}</div>{filteredNotes.length ? <div className="note-selection-list">{filteredNotes.map((note) => <button key={note.id} className={`note-selection ${selectedNote?.id === note.id ? "active" : ""}`} onClick={() => setSelectedId(note.id)}><strong>{note.title}</strong><span className="muted small">{getUnit(note.unitId)?.title ?? note.unitId} · {dateLabel(note.updatedAt)}</span></button>)}</div> : <p className="muted">この単元のノートはまだありません。</p>}</section></aside>
      {selectedNote ? <NoteDetail key={selectedNote.id} note={selectedNote} /> : <section className="panel empty-state notes-empty"><Icon name="notebook" size={52} /><h2>最初の探究を、ノートに残そう。</h2><p>書物調査室で問いを選び、資料を調べ、自分の仮説を保存すると、ここにあなたの記録が並びます。</p><Link href={`/research/${unitFilter ?? "honnoji"}?new=1`} className="button button-primary"><Icon name="search" size={18} /> 書物調査室へ</Link></section>}
    </div>}
  </>;
}
