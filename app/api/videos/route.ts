import { NextResponse } from "next/server";
import { findCuratedVideos } from "@/lib/youtube";

// MVPでは確認済み動画をJSONから返す。自由検索を追加する際にYouTube Data APIをここへ接続する。
export function GET(request: Request) {
  const topic = new URL(request.url).searchParams.get("topic") ?? "";
  return NextResponse.json({ videos: findCuratedVideos(topic) });
}
