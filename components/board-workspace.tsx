"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { getUnit, historyUnits } from "@/data/units";
import type { BoardPost, HistoryUnit } from "@/lib/types";
import { Icon } from "@/components/icons";
import { useWorkspace } from "@/components/workspace-provider";

function dateLabel(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "日時不明" : date.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function PostComposer({ unit, onClose }: { unit: HistoryUnit; onClose: () => void }) {
  const { addPost, ready } = useWorkspace();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [postType, setPostType] = useState("考察");
  const [tags, setTags] = useState("");
  const [sourceIds, setSourceIds] = useState<string[]>([]);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || !body.trim() || !ready) return;
    addPost({ id: crypto.randomUUID(), unitId: unit.id, author: "あなた", title: title.trim(), body: body.trim(), tags: [...new Set([unit.title, postType, ...tags.split(/[、,\s]+/).map((tag) => tag.replace(/^#/, "")).filter(Boolean)])].slice(0, 8), sourceIds, createdAt: new Date().toISOString(), likes: 0, liked: false, bookmarked: false, comments: [], sample: false });
    onClose();
  }
  return <section className="panel post-composer" aria-labelledby="composer-title"><div className="panel-heading"><h2 id="composer-title"><Icon name="edit" /> 自分の考えを投稿する</h2><button type="button" className="icon-button" onClick={onClose} aria-label="投稿フォームを閉じる"><Icon name="close" /></button></div><p className="muted small">この端末内の試作です。投稿は他の人には送信されません。</p><form onSubmit={submit}>
    <div className="composer-first-row"><div><label className="field-label" htmlFor="post-type">投稿の種類</label><select id="post-type" value={postType} onChange={(event) => setPostType(event.target.value)}><option>考察</option><option>まとめ</option><option>質問</option></select></div><div><label className="field-label" htmlFor="post-title">タイトル</label><input id="post-title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={100} required placeholder="例：光秀の動機について、私はこう考えた" /></div></div>
    <label className="field-label" htmlFor="post-body">自分の考え・問い</label><textarea id="post-body" value={body} onChange={(event) => setBody(event.target.value)} rows={5} maxLength={5000} required placeholder="資料からわかること、自分の考え、まだ確かめたいことを書いてみよう。" />
    <label className="field-label" htmlFor="post-tags">タグ（スペースや「、」で区切る）</label><input id="post-tags" value={tags} onChange={(event) => setTags(event.target.value)} maxLength={150} placeholder="例：明智光秀 史料 動機" />
    {unit.sources.length > 0 && <fieldset className="composer-sources"><legend className="field-label">根拠にした資料（任意）</legend>{unit.sources.map((source) => <label key={source.id}><input type="checkbox" checked={sourceIds.includes(source.id)} onChange={(event) => setSourceIds(event.target.checked ? [...sourceIds, source.id] : sourceIds.filter((id) => id !== source.id))} />{source.title}</label>)}</fieldset>}
    <div className="composer-actions"><span className="muted small">{body.length}/5,000文字</span><button className="button button-primary" disabled={!ready || !title.trim() || !body.trim()} type="submit"><Icon name="plus" size={17} /> この端末に投稿を保存</button></div>
  </form></section>;
}

function PostCard({ post }: { post: BoardPost }) {
  const { toggleLike, toggleBookmark, addComment } = useWorkspace();
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comment, setComment] = useState("");
  const sources = getUnit(post.unitId)?.sources.filter((source) => post.sourceIds.includes(source.id)) ?? [];
  return <article className="panel board-post"><div className="post-avatar" aria-hidden="true"><Icon name={post.sample ? "compass" : "notebook"} size={25} /></div><div className="post-content"><div className="post-byline"><strong>{post.author}</strong><span className="muted small">{post.sample ? "サンプルの投稿" : dateLabel(post.createdAt)}</span><span className={`badge ${post.sample ? "sample-badge" : ""}`}>{post.sample ? "表示例" : "この端末に保存"}</span></div><h3>{post.title}</h3><p className="post-body">{post.body}</p><div className="tag-row">{post.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div>{sources.length > 0 && <div className="post-source-links">{sources.map((source) => <a key={source.id} href={source.url} target="_blank" rel="noreferrer"><Icon name="book" size={14} />{source.title}<Icon name="external" size={12} /></a>)}</div>}<div className="post-actions"><button className={`reaction-button ${commentsOpen ? "active" : ""}`} onClick={() => setCommentsOpen(!commentsOpen)} aria-expanded={commentsOpen} aria-controls={`comments-${post.id}`}><Icon name="message" size={17} /><span>{post.comments.length}</span><span className="sr-only">コメント</span></button><button className={`reaction-button ${post.liked ? "active" : ""}`} onClick={() => toggleLike(post.id)} aria-pressed={post.liked} aria-label={post.liked ? "共感を取り消す" : "共感する"}><Icon name="heart" size={17} /><span>{post.likes}</span></button><button className={`reaction-button ${post.bookmarked ? "active" : ""}`} onClick={() => toggleBookmark(post.id)} aria-pressed={post.bookmarked} aria-label={post.bookmarked ? "ブックマークを外す" : "ブックマークする"}><Icon name="bookmark" size={17} /><span className="small">{post.bookmarked ? "保存済み" : "保存"}</span></button></div>{commentsOpen && <section className="post-comments" id={`comments-${post.id}`} aria-label="この端末のコメント"><p className="muted small">コメントもこのブラウザーだけに保存されます。</p>{post.comments.map((item) => <div key={item.id} className="comment-item"><strong>{item.author}</strong><time className="muted small">{dateLabel(item.createdAt)}</time><p>{item.body}</p></div>)}<form className="comment-form" onSubmit={(event) => { event.preventDefault(); if (comment.trim()) { addComment(post.id, comment); setComment(""); } }}><label className="sr-only" htmlFor={`comment-input-${post.id}`}>コメントを入力</label><input id={`comment-input-${post.id}`} value={comment} onChange={(event) => setComment(event.target.value)} required maxLength={1000} placeholder="自分の気づきや問いを書いてみよう" /><button type="submit" className="button button-primary button-small" disabled={!comment.trim()}><Icon name="send" size={16} /> 保存</button></form></section>}</div></article>;
}

export function BoardWorkspace({ initialUnitId }: { initialUnitId?: string }) {
  const { ready, posts, storageError } = useWorkspace();
  const [unitId, setUnitId] = useState(getUnit(initialUnitId ?? "honnoji")?.id ?? historyUnits[0].id);
  const [tab, setTab] = useState("all");
  const [sort, setSort] = useState("newest");
  const [bookmarksOnly, setBookmarksOnly] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const unit = getUnit(unitId) ?? historyUnits[0];
  const unitPosts = posts.filter((post) => post.unitId === unitId);
  const visiblePosts = unitPosts.filter((post) => (!bookmarksOnly || post.bookmarked) && (!tagFilter || post.tags.includes(tagFilter)) && (tab === "all" || (tab === "summary" ? post.tags.includes("まとめ") : post.tags.includes("質問") || post.tags.includes("問い") || /[？?]/.test(post.title)))).sort((a, b) => sort === "likes" ? b.likes - a.likes || b.createdAt.localeCompare(a.createdAt) : b.createdAt.localeCompare(a.createdAt));
  const tagCounts = unitPosts.reduce<Record<string, number>>((all, post) => { post.tags.forEach((tag) => { all[tag] = (all[tag] ?? 0) + 1; }); return all; }, {});
  const popularTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);
  return <>
    <header className="page-heading board-page-heading"><div><div className="eyebrow">SHARE YOUR DISCOVERIES</div><h1><Icon name="message" size={38} /> 探偵掲示板</h1><p>この章で学んだことや気づきをまとめて、いろいろな視点から考えてみよう。</p></div></header>
    <p className="storage-notice"><Icon name="compass" size={16} /> 掲示板の試作です。投稿・コメント・リアクションはこのブラウザー内に保存され、他の人には共有されません。</p>
    {storageError && <p role="alert" className="status-message status-warning">{storageError}</p>}
    <div className="board-layout"><main className="board-main"><section className="panel board-unit-panel"><span className={`unit-miniature unit-${unit.id}`}><Icon name={unit.icon} size={30} /></span><div className="board-unit-select"><label className="eyebrow" htmlFor="board-unit">対象の章</label><select id="board-unit" value={unitId} onChange={(event) => { setUnitId(event.target.value); setTagFilter(null); setComposerOpen(false); }}>{historyUnits.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></div><p>{unit.summary}</p></section>
    <section className="panel board-toolbar"><div className="segmented-control" aria-label="投稿の種類">{[{ id: "all", label: "みんなの考え" }, { id: "summary", label: "章のまとめ" }, { id: "questions", label: "質問" }].map((item) => <button key={item.id} className={tab === item.id ? "active" : ""} aria-pressed={tab === item.id} onClick={() => setTab(item.id)}>{item.label}</button>)}</div><div className="board-toolbar-actions"><label className="sr-only" htmlFor="board-sort">並び順</label><select id="board-sort" value={sort} onChange={(event) => setSort(event.target.value)}><option value="newest">新しい順</option><option value="likes">共感の多い順</option></select><button className={`icon-button ${bookmarksOnly ? "active" : ""}`} aria-label="保存した投稿だけ表示" aria-pressed={bookmarksOnly} onClick={() => setBookmarksOnly(!bookmarksOnly)}><Icon name="bookmark" size={20} /></button><button className="button button-primary" onClick={() => setComposerOpen(!composerOpen)} aria-expanded={composerOpen}><Icon name="plus" size={18} /> 投稿する</button></div></section>
    {tagFilter && <div className="active-filter"><span>タグ：{tagFilter}</span><button className="text-button" onClick={() => setTagFilter(null)}><Icon name="close" size={14} /> 絞り込みを解除</button></div>}
    {composerOpen && <PostComposer key={unit.id} unit={unit} onClose={() => setComposerOpen(false)} />}
    {!ready ? <div className="panel empty-state" role="status">投稿を読み込んでいます…</div> : visiblePosts.length ? <div className="board-posts">{visiblePosts.map((post) => <PostCard key={post.id} post={post} />)}</div> : <div className="panel empty-state"><Icon name="message" size={44} /><h2>まだ投稿がありません。</h2><p>{bookmarksOnly ? "気になった投稿のブックマークを押すと、ここから読み返せます。" : "調べたことや、これから確かめたい問いを残してみよう。"}</p><button className="button button-primary" onClick={() => setComposerOpen(true)}><Icon name="plus" size={18} /> 最初の投稿を書く</button></div>}
    </main><aside className="board-aside"><section className="panel chapter-points"><div className="panel-heading"><h3><Icon name="book" /> この章のポイント</h3></div><ol>{unit.keyPoints.map((point) => <li key={point}>{point}</li>)}</ol><Link href={`/research/${unit.id}`} className="text-button">資料を確かめる <Icon name="arrow-right" size={16} /></Link></section><section className="panel"><div className="panel-heading"><h3><Icon name="bookmark" /> この章のタグ</h3></div>{popularTags.length ? <div className="popular-tags">{popularTags.map(([tag, count]) => <button key={tag} className={`tag ${tagFilter === tag ? "active" : ""}`} onClick={() => setTagFilter(tagFilter === tag ? null : tag)}>{tag}<span>{count}</span></button>)}</div> : <p className="muted small">投稿するとタグが表示されます。</p>}<p className="muted small">表示例を含む、この画面の投稿数です。</p></section><section className="panel board-questions"><div className="panel-heading"><h3><Icon name="lightbulb" /> 探究のヒント</h3></div><ul>{[...unit.questions.standard, ...unit.questions.deep].slice(0, 4).map((question) => <li key={question}><Link href={`/research/${unit.id}?question=${encodeURIComponent(question)}`}>{question}<Icon name="arrow-right" size={15} /></Link></li>)}</ul></section></aside></div>
  </>;
}
