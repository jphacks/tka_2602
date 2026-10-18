"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Icon } from "@/components/icons";
import { UnitArtwork } from "@/components/unit-artwork";
import { useWorkspace } from "@/components/workspace-provider";
import { findUnitByCode, historyUnits } from "@/data/units";

const prompts = ["光秀はなぜ、信長を討ったの？", "同じ人物でも、評価が分かれるのはなぜ？", "本能寺の変のあと、何が変わった？", "史料によって、見方が違うのはなぜ？", "本能寺の変は、いつ・どこで起きた？", "信長と光秀は、どんな関係だった？", "信長記から、何が読み取れる？", "資料は、だれが何のために書いた？"];

export function HomeWorkspace() {
  const router = useRouter();
  const { notes } = useWorkspace();
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [promptPage, setPromptPage] = useState(0);
  const shownUnits = search ? historyUnits.filter((unit) => `${unit.title} ${unit.summary} ${unit.category} ${unit.keyPoints.join(" ")}`.includes(search)) : historyUnits;

  function openTextbook(event: FormEvent) {
    event.preventDefault();
    const unit = findUnitByCode(code.trim());
    if (unit) router.push(`/research/${unit.id}`);
    else setCodeError("対応番号が見つかりません。下の単元から選ぶか、例の番号を入力してください。");
  }

  return (
    <main className="workspace home-workspace">
      <section className="home-hero">
        <div className="hero-copy"><p className="eyebrow gold"><span/>歴史の「なぜ？」を、あなたの発見に。</p><h1>興味の先に、<br/><span>新しい歴史</span>がある。</h1><p className="hero-description">教科書の出来事から、まだ知らない物語へ。<br/>資料をひもとき、AIと考え、自分だけの答えを探そう。</p><Link className="button button-primary" href="/research/honnoji"><Icon name="compass" size={19}/>調査をはじめる<Icon name="arrow-right" size={18}/></Link><span className="hero-footnote">キミの「知りたい」が、探究のはじまり。</span></div><div className="hero-seal" aria-hidden="true">歴史の手がかりは、<br/>いつも問いの中に。</div><span className="hero-image-caption">歴史をイメージしたイラスト</span>
      </section>
      <section className="entry-grid" aria-label="学びの入口">
        <article className="panel entry-panel"><div className="entry-icon gold"><Icon name="book" size={29}/></div><div className="entry-content"><div className="entry-title-row"><h2>教科書に合わせて学ぶ</h2><span className="badge">教科書対応</span></div><p>対応番号を入力して、その単元の書物調査室へ。</p><form onSubmit={openTextbook} className="inline-form"><label className="sr-only" htmlFor="textbook-code">教科書の対応番号</label><input id="textbook-code" value={code} onChange={(event) => {setCode(event.target.value);setCodeError("");}} placeholder="例：3-2-1 ／ 12A" required/><button className="button button-primary" type="submit">調査室へ<Icon name="arrow-right" size={17}/></button></form><p className="field-hint">体験用番号：本能寺の変「3-2-1」「12A」</p>{codeError && <p className="form-error" role="alert">{codeError}</p>}</div></article>
        <article className="panel entry-panel" id="search"><div className="entry-icon cyan"><Icon name="search" size={29}/></div><div className="entry-content"><h2>気になるワードから探す</h2><p>出来事・人物・時代。気になることを手がかりに。</p><form onSubmit={(event) => {event.preventDefault();setSearch(query.trim());}} className="inline-form"><label className="sr-only" htmlFor="unit-search">単元を検索</label><input id="unit-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="本能寺、江戸、鎌倉…"/><button className="button button-secondary" type="submit"><Icon name="search" size={17}/>検索する</button></form><p className="field-hint">人物や出来事の名前から、学習単元を探せます。</p></div></article>
      </section>
      <section className="panel curiosity-panel"><div className="section-heading compact"><div><span className="ai-symbol"><Icon name="sparkles" size={19}/></span><h2>こんな「なぜ？」から、はじめてみよう</h2><span className="muted">AIと考える、探究のヒント</span></div><button className="text-button" onClick={() => setPromptPage((page) => page + 1)}>別の問いを見る<Icon name="arrow-right" size={16}/></button></div><div className="prompt-grid">{Array.from({ length: 4 }, (_, index) => {const question = prompts[(index + promptPage * 4) % prompts.length];return <Link href={`/research/honnoji?question=${encodeURIComponent(question)}`} key={question} className="prompt-card"><span className="question-mark">?</span><span>{question}</span><Icon name="arrow-right" size={15}/></Link>;})}</div></section>
      <section id="units" className="units-section"><div className="section-heading"><div><Icon name="book" className="gold" size={26}/><h2>{search ? `「${search}」の検索結果` : "教科書から広がる、学びの入り口"}</h2></div>{search ? <button className="text-button" onClick={() => {setSearch("");setQuery("");}}>すべての単元を見る<Icon name="close" size={15}/></button> : <span className="section-count">04 UNITS</span>}</div><p className="section-description">ひとつの出来事を、いくつもの視点から調べてみよう。</p><div className="unit-grid">{shownUnits.map((unit, index) => <Link className="unit-card" href={`/research/${unit.id}`} key={unit.id}><UnitArtwork unitId={unit.id}/><div className="unit-card-top"><span className="badge badge-dark">{unit.category}</span><span className="unit-number">0{index+1}</span></div><div className="unit-card-body"><span className="unit-period">{unit.period}</span><h3>{unit.title}</h3><p>{unit.inquiry}</p><div className="unit-card-footer"><span><Icon name="book" size={13}/>{unit.sources.length}件の資料</span><span className="circle-arrow"><Icon name="arrow-right" size={17}/></span></div></div></Link>)}</div>{shownUnits.length === 0 && <div className="empty-state panel"><Icon name="search" size={28}/><h3>この言葉に対応する単元は見つかりませんでした</h3><p>「本能寺」「戦国」「江戸」「鎌倉」から探してみてください。</p></div>}</section>
      <div className="home-bottom-note"><Icon name="shield" size={19}/><span>資料に触れ、自分で考える。その過程を大切にしています。</span><Link href="/notes">あなたの探偵ノート <span>{notes.length}</span><Icon name="arrow-right" size={15}/></Link></div>
    </main>
  );
}
