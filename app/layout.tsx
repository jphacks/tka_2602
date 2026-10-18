import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "レキしるべ",
  description: "課題から疑問を深め、自分の考えを残す歴史探究ノート",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja"><body>{children}</body></html>
  );
}
