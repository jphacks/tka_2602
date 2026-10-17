"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

type InquiryResult = {
  answer: string;
  keyPoints: string[];
  followUpQuestions: string[];
  relatedTerms: string[];
  sources: { title: string; url: string }[];
  videos: { title: string; youtubeId: string; description: string }[];
};

export function InquiryForm() {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<InquiryResult | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    const response = await fetch("/api/inquiry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
    const data = await response.json();
    setIsLoading(false);

    if (!response.ok) {
      setError(data.error ?? "回答を取得できませんでした。");
      return;
    }
    setResult(data);
  }

  return (
    <section className="mt-10 rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-lg font-bold" htmlFor="question">今日は、どんな「なぜ？」を追いかけますか？</label>
        <textarea
          className="min-h-28 w-full rounded-2xl border border-slate-300 p-4 text-base outline-none ring-orange-300 focus:ring"
          id="question"
          maxLength={500}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="例：なぜ江戸幕府は長く続いたの？"
          required
          value={question}
        />
        <button className="rounded-full bg-orange-700 px-6 py-3 font-bold text-white disabled:opacity-50" disabled={isLoading} type="submit">
          {isLoading ? "探究ガイドを作成中…" : "探究をはじめる"}
        </button>
        <Link className="ml-4 text-sm font-bold text-orange-700 underline" href="/map">理解の地図を見る</Link>
      </form>

      {error && <p className="mt-5 rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}

      {result && (
        <div className="mt-8 space-y-6 border-t pt-6">
          <div><h2 className="text-2xl font-black">まずはここを押さえよう</h2><p className="mt-2 leading-8">{result.answer}</p></div>
          <List title="大事なポイント" items={result.keyPoints} />
          <List title="次に深められる「なぜ？」" items={result.followUpQuestions} onPick={setQuestion} />
          <List title="関連する言葉" items={result.relatedTerms} />
          {result.videos.length > 0 && <VideoList videos={result.videos} />}
          <div><h3 className="font-bold">根拠・出典</h3><ul className="mt-2 space-y-1">{result.sources.map((source) => <li key={source.url}><a className="text-orange-700 underline" href={source.url} rel="noreferrer" target="_blank">{source.title}</a></li>)}</ul></div>
        </div>
      )}
    </section>
  );
}

function List({ title, items, onPick }: { title: string; items: string[]; onPick?: (item: string) => void }) {
  return <div><h3 className="font-bold">{title}</h3><ul className="mt-2 space-y-2">{items.map((item) => <li key={item}>{onPick ? <button className="text-left text-orange-700 underline" onClick={() => onPick(item)} type="button">{item}</button> : item}</li>)}</ul></div>;
}

function VideoList({ videos }: { videos: InquiryResult["videos"] }) {
  return <div><h3 className="font-bold">もっと知る動画</h3><div className="mt-3 grid gap-4 md:grid-cols-2">{videos.map((video) => <article className="rounded-xl border p-3" key={video.youtubeId}><iframe allowFullScreen className="aspect-video w-full rounded-lg" src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}`} title={video.title} /><p className="mt-2 font-bold">{video.title}</p><p className="text-sm text-slate-600">{video.description}</p></article>)}</div></div>;
}
