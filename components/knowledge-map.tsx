"use client";

import { Background, Controls, ReactFlow, type Edge, type Node } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

const nodes: Node[] = [
  { id: "edo", position: { x: 250, y: 20 }, data: { label: "江戸幕府" }, style: { background: "#bf5b2b", color: "white", borderRadius: 12 } },
  { id: "bakuhan", position: { x: 30, y: 160 }, data: { label: "幕藩体制" } },
  { id: "sakoku", position: { x: 250, y: 160 }, data: { label: "鎖国" } },
  { id: "sankin", position: { x: 470, y: 160 }, data: { label: "参勤交代" } },
];

const edges: Edge[] = [
  { id: "e1", source: "edo", target: "bakuhan", label: "支えた" },
  { id: "e2", source: "edo", target: "sakoku", label: "政策" },
  { id: "e3", source: "edo", target: "sankin", label: "統制" },
];

export function KnowledgeMap() {
  return <div className="mt-6 h-[520px] overflow-hidden rounded-2xl border bg-white"><ReactFlow edges={edges} fitView nodes={nodes}><Background /><Controls /></ReactFlow></div>;
}
