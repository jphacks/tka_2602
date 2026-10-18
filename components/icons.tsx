import type { ReactNode } from "react";

const shapes: Record<string, ReactNode> = {
  flame: <path d="M12 2c2 5-1 7 2 10 1-1 2-2 2-4 4 4 5 7 3 10-3 6-12 5-14 0-2-5 3-8 4-12 0 4 1 5 2 5 2-3 0-5 1-9Z"/>,
  castle: <><path d="m3 7 9-4 9 4H3Zm2 5 7-3 7 3H5Zm-2 5 9-3 9 3H3ZM6 17v5m12-5v5M4 22h16M9 7v3m6-3v3M8 12v4m8-4v4M10 22v-3h4v3"/></>,
  lantern: <><path d="M8 3h8M12 1v2M8 21h8M12 21v2"/><rect x="5" y="5" width="14" height="14" rx="5"/><path d="M12 5v14M5 10h14M5 14h14"/></>,
  mountain: <><path d="m2 21 8-16 6 11 2-4 4 9H2Zm5-10 3 2 3-2"/><circle cx="18" cy="5" r="2"/></>,
  home: <><path d="m3 10 9-7 9 7"/><path d="M5 9v12h14V9M9 21v-8h6v8"/></>,
  search: <><circle cx="10.5" cy="10.5" r="7.5"/><path d="m16 16 5 5"/></>,
  book: <><path d="M12 5c-3-2-7-2-10-1v15c3-1 7-1 10 1 3-2 7-2 10-1V4c-3-1-7-1-10 1Zm0 0v15"/><path d="M5 8h4M5 12h4m6-4h4m-4 4h4"/></>,
  notebook: <><rect x="5" y="3" width="15" height="19" rx="2"/><path d="M8 3v19M2 7h5M2 12h5M2 17h5m4-10h6m-6 4h6m-6 4h4"/></>,
  message: <><path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5H4l-2 2V11.5a9.5 9.5 0 0 1 19 0Z"/><path d="M7 11h.01M12 11h.01M17 11h.01"/></>,
  compass: <><circle cx="12" cy="12" r="9"/><path d="m16 8-2 6-6 2 2-6 6-2ZM12 1v3m0 16v3M1 12h3m16 0h3"/></>,
  "arrow-right": <path d="M4 12h16m-6-6 6 6-6 6"/>,
  "arrow-left": <path d="M20 12H4m6-6-6 6 6 6"/>,
  "chevron-down": <path d="m6 9 6 6 6-6"/>,
  plus: <path d="M12 5v14M5 12h14"/>,
  bookmark: <path d="M5 21V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v17l-7-4-7 4Z"/>,
  check: <path d="m5 12 4 4L19 6"/>,
  send: <path d="m22 2-7 20-4-9-9-4 20-7Zm0 0L11 13"/>,
  sparkles: <path d="m12 3 2.7 6.3L21 12l-6.3 2.7L12 21l-2.7-6.3L3 12l6.3-2.7L12 3ZM20 2v4m-2-2h4"/>,
  lightbulb: <path d="M9 18h6m-6 3h6M8 15a7 7 0 1 1 8 0c-1 1-1 2-1 3H9c0-1 0-2-1-3Z"/>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v6l4 2"/></>,
  close: <path d="m6 6 12 12M6 18 18 6"/>,
  heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0l-1 1-1-1a5.5 5.5 0 0 0-7.8 7.8L12 22l8.8-9.6a5.5 5.5 0 0 0 0-7.8Z"/>,
  edit: <><path d="m15 5 4 4M4 20l5-1L21 7a2.8 2.8 0 0 0-4-4L5 15l-1 5Z"/></>,
  trash: <path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/>,
  menu: <path d="M4 6h16M4 12h16M4 18h16"/>,
  map: <path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2V5Zm6-2v16m6-14v16"/>,
  external: <><path d="M14 3h7v7m0-7L10 14"/><path d="M10 3H4a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-6"/></>,
  user: <><circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/></>,
  shield: <><path d="m12 2 9 4v6c0 6-9 10-9 10S3 18 3 12V6l9-4Z"/><path d="m8 11 3 3 5-5"/></>,
};

export function Icon({ name, size = 22, className = "" }: { name: string; size?: number; className?: string }) {
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className}>{shapes[name] ?? shapes.compass}</svg>;
}
