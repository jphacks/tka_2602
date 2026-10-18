"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Icon } from "@/components/icons";
import { useWorkspace } from "@/components/workspace-provider";

const navigation = [
  { href: "/", label: "ホーム", icon: "home", match: "/" },
  { href: "/#search", label: "探す", icon: "search", match: "search" },
  { href: "/research/honnoji", label: "書物調査室", icon: "book", match: "/research" },
  { href: "/notes", label: "探偵ノート", icon: "notebook", match: "/notes" },
  { href: "/board", label: "探偵掲示板", icon: "message", match: "/board" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { notes } = useWorkspace();
  const current = navigation.find((item) => item.match === "/" ? pathname === "/" : pathname.startsWith(item.match));
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">本文へ移動する</a>
      <aside className="sidebar">
        <Link className="brand" href="/" aria-label="レキしるべ ホーム"><span className="brand-mark"><Icon name="compass" size={38}/></span><span>レキしるべ<small>REKISHIRUBE</small></span></Link>
        <p className="nav-caption">YOUR EXPLORATION</p>
        <nav aria-label="メインナビゲーション">{navigation.map((item) => {
          const active = item.match === "/" ? pathname === "/" : pathname.startsWith(item.match);
          return <Link key={item.label} href={item.href} className={`nav-link ${active ? "is-active" : ""}`} aria-current={active ? "page" : undefined}><Icon name={item.icon}/><span>{item.label}</span>{item.match === "/notes" && notes.length > 0 && <span className="nav-count">{notes.length}</span>}</Link>;
        })}</nav>
        <div className="sidebar-bottom"><div className="sidebar-emblem"><Icon name="compass" size={104}/></div><p>問いを手がかりに、<br/>歴史のその先へ。</p><Link href="/map" className="sidebar-map"><Icon name="map" size={17}/>理解の地図<Icon name="arrow-right" size={15}/></Link><span className="sidebar-version">歴史探究ワークスペース · v0.2</span></div>
      </aside>
      <div className="app-main">
        <header className="topbar"><div className="breadcrumbs"><Icon name="compass" size={15}/><span>レキしるべ</span><span className="breadcrumb-separator">/</span><strong>{current?.label ?? "理解の地図"}</strong></div><div className="topbar-actions"><span className="status-dot"/><span>あなたの学びの記録</span><Link href="/notes" className="avatar-link" aria-label="探偵ノートを開く"><Icon name="user" size={17}/></Link></div></header>
        <div id="main-content">{children}</div>
        <footer className="app-footer"><span>REKISHIRUBE <span className="footer-dot">✦</span> 興味から、歴史を深掘りする。</span><span>考察と対話はこのブラウザに保存されます</span></footer>
      </div>
    </div>
  );
}
