import Link from "next/link";
import { KnowledgeMap } from "@/components/knowledge-map";

export default function MapPage() {
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-10">
      <Link className="text-sm font-bold text-orange-700 underline" href="/">← 質問画面へ戻る</Link>
      <h1 className="mt-4 text-3xl font-black">理解の地図</h1>
      <p className="mt-2 text-slate-600">人物・出来事・背景のつながりをたどれます。</p>
      <KnowledgeMap />
    </main>
  );
}
