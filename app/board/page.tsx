import { BoardWorkspace } from "@/components/board-workspace";

export default async function BoardPage({ searchParams }: { searchParams: Promise<{ unit?: string | string[] }> }) {
  const params = await searchParams;
  return <BoardWorkspace initialUnitId={typeof params.unit === "string" ? params.unit : undefined} />;
}
