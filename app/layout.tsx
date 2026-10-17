import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "レキしるべ",
  description: "気になる「なぜ？」から歴史を探究するアプリ",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
