import history from "@/data/history.json";

export function findCuratedVideos(query: string) {
  const normalizedQuery = query.toLowerCase();
  return history.videos.filter(
    (video) => video.youtubeId && video.keywords.some((keyword) => normalizedQuery.includes(keyword.toLowerCase())),
  );
}
