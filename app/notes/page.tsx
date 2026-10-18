import { NotesWorkspace } from "@/components/notes-workspace";

export default async function NotesPage({ searchParams }: { searchParams: Promise<{ id?: string | string[] }> }) {
  const params = await searchParams;
  return <NotesWorkspace initialNoteId={typeof params.id === "string" ? params.id : undefined} />;
}
