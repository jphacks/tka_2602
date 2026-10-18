"use client";

import { createContext, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";
import type { BoardPost, DetectiveNote } from "@/lib/types";

const STORAGE_KEY = "rekishirube-workspace-v1";

const examplePosts: BoardPost[] = [
  {
    id: "sample-motive", unitId: "honnoji", author: "表示例", title: "明智光秀の動機をどう考える？",
    body: "光秀の動機について、どんな資料を根拠に考えられるでしょうか。資料からわかることと、自分の推測を分けて考えてみたいです。",
    tags: ["本能寺の変", "明智光秀", "動機"], sourceIds: [], createdAt: "2026-01-03T09:00:00+09:00", likes: 0, liked: false, bookmarked: false, comments: [], sample: true,
  },
  {
    id: "sample-sources", unitId: "honnoji", author: "表示例", title: "史料によって見方が違うのはなぜ？",
    body: "書かれた時期や、書いた人の立場を比べると、記述の違いを説明できるかもしれません。どの資料を比べるとよいでしょうか。",
    tags: ["本能寺の変", "史料", "問い"], sourceIds: [], createdAt: "2026-01-02T09:00:00+09:00", likes: 0, liked: false, bookmarked: false, comments: [], sample: true,
  },
  {
    id: "sample-summary", unitId: "honnoji", author: "表示例", title: "調べたことのまとめ方",
    body: "出来事の経過、使った資料、資料からわかること、まだ確かめたいこと。この4つを分けてまとめると、自分の考えを説明しやすくなりそうです。",
    tags: ["本能寺の変", "まとめ"], sourceIds: [], createdAt: "2026-01-01T09:00:00+09:00", likes: 0, liked: false, bookmarked: false, comments: [], sample: true,
  },
];

type Snapshot = { ready: boolean; notes: DetectiveNote[]; posts: BoardPost[]; storageError: string | null };
type WorkspaceContextValue = Snapshot & {
  saveNote: (note: DetectiveNote) => void;
  deleteNote: (id: string) => void;
  addPost: (post: BoardPost) => void;
  toggleLike: (id: string) => void;
  toggleBookmark: (id: string) => void;
  addComment: (id: string, body: string) => void;
};

const initialSnapshot: Snapshot = { ready: false, notes: [], posts: [], storageError: null };
let snapshot = initialSnapshot;
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
const getSnapshot = () => snapshot;
const getServerSnapshot = () => initialSnapshot;
const notify = () => listeners.forEach((listener) => listener());

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isLearningStyle(value: unknown) {
  return value === undefined || value === "story" || value === "detective";
}

function isInquiryResult(value: unknown) {
  if (!isRecord(value)) return false;
  const isEvidence = (item: unknown) => isRecord(item) && typeof item.text === "string" && isStringArray(item.sourceIds);
  const isSource = (source: unknown) => isRecord(source)
    && ["id", "title", "author", "period", "excerpt", "explanation", "url"].every((field) => typeof source[field] === "string")
    && (source.kind === "primary" || source.kind === "secondary")
    && (source.note === undefined || typeof source.note === "string");
  return typeof value.answer === "string" && (value.mode === "demo" || value.mode === "live")
    && (value.analogy === undefined || typeof value.analogy === "string") && isLearningStyle(value.learningStyle)
    && Array.isArray(value.facts) && value.facts.every(isEvidence)
    && Array.isArray(value.interpretations) && value.interpretations.every(isEvidence)
    && isStringArray(value.unknowns) && isStringArray(value.followUpQuestions) && isStringArray(value.relatedTerms)
    && Array.isArray(value.sources) && value.sources.every(isSource);
}

function isNote(value: unknown): value is DetectiveNote {
  if (!isRecord(value)) return false;
  return ["id", "unitId", "title", "hypothesis", "createdAt", "updatedAt"].every((field) => typeof value[field] === "string")
    && ["easy", "standard", "deep"].includes(String(value.difficulty))
    && isLearningStyle(value.learningStyle)
    && Array.isArray(value.discoveries) && value.discoveries.every((item) => typeof item === "string")
    && Array.isArray(value.sourceIds) && value.sourceIds.every((item) => typeof item === "string")
    && Array.isArray(value.messages) && value.messages.every((message) => isRecord(message)
      && typeof message.id === "string" && typeof message.content === "string" && typeof message.createdAt === "string"
      && (message.role === "user" || message.role === "assistant")
      && (message.result === undefined || isInquiryResult(message.result)));
}

function isPost(value: unknown): value is BoardPost {
  if (!isRecord(value)) return false;
  return ["id", "unitId", "author", "title", "body", "createdAt"].every((field) => typeof value[field] === "string")
    && Array.isArray(value.tags) && value.tags.every((item) => typeof item === "string")
    && Array.isArray(value.sourceIds) && value.sourceIds.every((item) => typeof item === "string")
    && typeof value.likes === "number" && Number.isFinite(value.likes) && value.likes >= 0
    && typeof value.liked === "boolean" && typeof value.bookmarked === "boolean"
    && (value.sample === undefined || typeof value.sample === "boolean")
    && Array.isArray(value.comments) && value.comments.every((comment) => isRecord(comment)
      && ["id", "author", "body", "createdAt"].every((field) => typeof comment[field] === "string"));
}

function readStorage() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      snapshot = { ready: true, notes: [], posts: examplePosts, storageError: null };
    } else {
      const parsed: unknown = JSON.parse(stored);
      if (!isRecord(parsed) || !Array.isArray(parsed.notes) || !Array.isArray(parsed.posts)) throw new Error("invalid storage");
      const notes = parsed.notes.filter(isNote);
      const posts = parsed.posts.filter(isPost);
      snapshot = {
        ready: true, notes, posts,
        storageError: notes.length !== parsed.notes.length || posts.length !== parsed.posts.length ? "読み込めない記録がありました。有効な記録のみ表示しています。" : null,
      };
    }
  } catch {
    snapshot = { ready: true, notes: [], posts: examplePosts, storageError: "このブラウザーの保存データを読み込めませんでした。新しい記録は保存操作をするまで書き込みません。" };
  }
  notify();
}

function commit(next: Pick<Snapshot, "notes" | "posts">) {
  let storageError: string | null = null;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, ...next }));
  } catch {
    storageError = "ブラウザーに保存できませんでした。この画面を閉じると、今回の変更が失われる場合があります。";
  }
  snapshot = { ready: true, ...next, storageError };
  notify();
}

const actions = {
  saveNote(note: DetectiveNote) {
    commit({ notes: [note, ...snapshot.notes.filter((item) => item.id !== note.id)].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), posts: snapshot.posts });
  },
  deleteNote(id: string) { commit({ notes: snapshot.notes.filter((note) => note.id !== id), posts: snapshot.posts }); },
  addPost(post: BoardPost) { commit({ notes: snapshot.notes, posts: [{ ...post, sample: false }, ...snapshot.posts] }); },
  toggleLike(id: string) {
    commit({ notes: snapshot.notes, posts: snapshot.posts.map((post) => post.id === id ? { ...post, liked: !post.liked, likes: Math.max(0, post.likes + (post.liked ? -1 : 1)) } : post) });
  },
  toggleBookmark(id: string) {
    commit({ notes: snapshot.notes, posts: snapshot.posts.map((post) => post.id === id ? { ...post, bookmarked: !post.bookmarked } : post) });
  },
  addComment(id: string, body: string) {
    const trimmed = body.trim();
    if (!trimmed) return;
    const comment = { id: crypto.randomUUID(), author: "あなた", body: trimmed, createdAt: new Date().toISOString() };
    commit({ notes: snapshot.notes, posts: snapshot.posts.map((post) => post.id === id ? { ...post, comments: [...post.comments, comment] } : post) });
  },
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const current = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  useEffect(() => {
    if (!snapshot.ready) readStorage();
    const onStorage = (event: StorageEvent) => { if (event.key === STORAGE_KEY || event.key === null) readStorage(); };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  const value = useMemo(() => ({ ...current, ...actions }), [current]);
  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const workspace = useContext(WorkspaceContext);
  if (!workspace) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return workspace;
}
