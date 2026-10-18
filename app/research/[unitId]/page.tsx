import { notFound } from "next/navigation";
import { ResearchRoom } from "@/components/research-room";
import { getUnit } from "@/data/units";

export default async function ResearchPage({ params, searchParams }: { params: Promise<{ unitId: string }>; searchParams: Promise<{ question?: string; note?: string; new?: string }> }) {
  const { unitId } = await params;
  const { question, note, new: newNote } = await searchParams;
  const unit = getUnit(unitId);
  if (!unit) notFound();
  return <ResearchRoom key={`${unit.id}:${note ?? ""}:${newNote ?? ""}:${question ?? ""}`} unit={unit} initialNoteId={typeof note === "string" ? note : undefined} startNew={newNote === "1"} initialQuestion={typeof question === "string" ? question.slice(0, 500) : ""}/>;
}
