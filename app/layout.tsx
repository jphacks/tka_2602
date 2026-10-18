import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { WorkspaceProvider } from "@/components/workspace-provider";

export const metadata: Metadata = {
  title: "レキしるべ",
  description: "気になる「なぜ？」から歴史を探究するアプリ",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" data-scroll-behavior="smooth">
      <body><WorkspaceProvider><AppShell>{children}</AppShell></WorkspaceProvider></body>
    </html>
  );
}
