import type { ResearchSource } from "@/lib/research-types";

const starterSources: ResearchSource[] = [
  { id: "ndl-digital", title: "国立国会図書館デジタルコレクション", provider: "国立国会図書館", url: "https://dl.ndl.go.jp/", description: "歴史資料・古典籍・地図などを調べられるデジタルアーカイブです。" },
  { id: "japan-search", title: "ジャパンサーチ", provider: "ジャパンサーチ", url: "https://jpsearch.go.jp/", description: "図書館・博物館・文書館などの資料を横断して探せます。" },
  { id: "nhk-school", title: "NHK for School", provider: "NHK", url: "https://www.nhk.or.jp/school/", description: "地図や映像とともに、時代の背景を確認できる教育コンテンツです。" },
];

export function findStarterSources(): ResearchSource[] {
  return starterSources;
}
