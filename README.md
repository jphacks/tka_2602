# レキしるべ

気になる歴史の「なぜ？」から、根拠を確かめながら学びを深める歴史探究アプリです。AIが短い説明、次に調べられる問い、関連する知識を提示し、ユーザーは発見を「歴史探偵ノート」に保存します。

## 技術構成

- フロントエンド／バックエンド: Next.js, TypeScript, Tailwind CSS, Route Handlers
- AI: Gemini API（構造化出力）
- 認証・データベース: Supabase
- 知識マップ: React Flow (`@xyflow/react`)
- 動画: 確認済み動画のYouTube埋め込み。自由検索が必要になった時点でYouTube Data APIを追加します。
- 公開: Vercel

## はじめかた

```bash
npm install
Copy-Item .env.example .env.local
npm run dev
```

`.env.local` にGeminiとSupabaseの値を設定してください。実際の値はGitに追加しません。

Supabaseを使う前に、[`supabase/schema.sql`](supabase/schema.sql) をSupabase SQL Editorで実行してください。`detective_notes` テーブルと、本人のノートだけを読み書きできるRLSポリシーが作成されます。

## 主要な構成

```text
app/                 # 画面とサーバーAPI
components/          # 質問フォームと知識マップ
lib/                 # Gemini、Supabase、動画の連携処理
data/history.json    # 出典情報を含む基礎歴史データ
supabase/schema.sql  # DBスキーマとアクセス制御
```
