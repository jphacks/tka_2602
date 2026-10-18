"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";
import type { HistoricalSource, LearningStyle } from "@/lib/types";

type SourceReaderProps = {
  source: HistoricalSource;
  sourceNumber: number;
  learningStyle: LearningStyle;
  bookmarked: boolean;
  isLoading: boolean;
  onBookmark: () => void;
  onAsk: (question: string) => void;
};

export function SourceReader({ source, sourceNumber, learningStyle, bookmarked, isLoading, onBookmark, onAsk }: SourceReaderProps) {
  const [tab, setTab] = useState<"read" | "about">("read");
  const reading = source.readings?.[learningStyle];
  const question = reading?.question ?? `「${source.title}」から、何がわかる？`;
  const ask = () => onAsk(`「${source.title}」について。${question}`);

  return (
    <article className="source-reader">
      <div className="source-reader-header">
        <div><Icon name="book" size={19}/><span>{source.kind === "primary" ? "史料を調べる" : "解説資料を調べる"}</span></div>
        <button className={`icon-button ${bookmarked ? "is-selected" : ""}`} aria-label={bookmarked ? "資料の保存を解除" : "資料をノートに追加"} aria-pressed={bookmarked} onClick={onBookmark}><Icon name="bookmark" size={18}/></button>
      </div>
      <div className="source-reader-tabs">
        <button className={tab === "read" ? "active" : ""} onClick={() => setTab("read")} aria-pressed={tab === "read"}>手がかりを読む</button>
        <button className={tab === "about" ? "active" : ""} onClick={() => setTab("about")} aria-pressed={tab === "about"}>書かれた背景</button>
      </div>
      <div className="book-pages parchment">
        <div className="book-page-inner">
          <span className="source-kicker">{tab === "read" ? source.title : "この資料は、だれが・いつ・なぜ？"}</span>
          <h3>{tab === "read" && reading ? reading.title : source.title}</h3>
          <div className="book-rule"/>
          {tab === "read" ? (
            <>
              <span className="source-summary-label">公開資料をもとにした読みもの・原文の引用ではありません</span>
              {reading ? (
                <div className={`source-story source-story--${learningStyle}`}>
                  <p className="source-story-lead">{reading.lead}</p>
                  <div className="source-story-body">{reading.story.split(/\n\n+/).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
                  {reading.analogy && <div className="analogy-callout"><span><Icon name="sparkles" size={17}/>身近なことにたとえると</span><p>{reading.analogy}</p><small>理解するためのたとえです。当時の出来事そのものではありません。</small></div>}
                  <div className="source-clues"><h4><Icon name="search" size={18}/>この資料から見つかる手がかり</h4><ol>{reading.clues.map((clue) => <li key={clue}>{clue}</li>)}</ol></div>
                  <div className="source-mystery"><span><Icon name="lightbulb" size={18}/>ここが気になる！</span><p>{reading.question}</p><button onClick={ask} disabled={isLoading}><Icon name="message" size={15}/>AIとこの謎を考える<Icon name="arrow-right" size={14}/></button></div>
                  <details className="original-source-summary"><summary>資料のもとの要約を確認する</summary><p>{source.excerpt}</p></details>
                </div>
              ) : (
                <>
                  <p className="source-excerpt">{source.excerpt}</p>
                  <div className="source-explanation"><Icon name="lightbulb" size={20}/><div><h4>読み解くヒント</h4><p>{source.explanation}</p></div></div>
                </>
              )}
            </>
          ) : (
            <>
              <dl className="source-metadata">
                <div><dt>作成者・提供元</dt><dd>{source.author}</dd></div>
                <div><dt>成立時期・対象時期</dt><dd>{source.period}</dd></div>
                <div><dt>資料の種類</dt><dd>{source.kind === "primary" ? "当時の記録・史料に関する資料" : "後世の研究・公的機関の解説"}</dd></div>
              </dl>
              <p className="source-excerpt">{source.note || "書いた人の立場や、書かれた時期を比べてみよう。別の人が書いたら、どこが変わるかな？"}</p>
              <div className="source-explanation"><Icon name="lightbulb" size={20}/><div><h4>書き手の立場にも注目</h4><p>{source.explanation}</p></div></div>
            </>
          )}
          <span className="book-page-number">REKISHIRUBE ARCHIVE · {String(sourceNumber).padStart(2, "0")}</span>
        </div>
      </div>
      <div className="source-reader-footer">
        <a className="text-button" href={source.url} target="_blank" rel="noreferrer">公開元の資料を開く<Icon name="external" size={14}/></a>
        <button className="source-question-button" onClick={ask} disabled={isLoading}><Icon name="message" size={15}/>この資料について聞く</button>
      </div>
    </article>
  );
}
