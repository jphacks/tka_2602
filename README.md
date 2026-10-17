# レキしるべ

気になる歴史の「なぜ？」から、根拠を比べて自分の仮説を育てる歴史探究アプリです。AIは最初の資料と補助質問を示し、ユーザーは自分で見つけたURL・画像URLも追加して「探偵ノート」に保存できます。

## 技術構成

- フロントエンド／バックエンド: Next.js, TypeScript, Tailwind CSS, Route Handlers
- AI: Gemini API（構造化出力）
- 認証・データベース: Supabase
- 資料: 信頼できる資料ライブラリからのAI提案 + ユーザー追加URL
- 知識マップ: React Flow (`@xyflow/react`) — 将来の可視化用
- 公開: Vercel

## はじめかた

```bash
npm install
Copy-Item .env.example .env.local
npm run dev
```

`.env.local` にGeminiとSupabaseの値を設定してください。Geminiモデルは、高頻度の短い探究回答に適した低コストモデル `gemini-3.5-flash-lite` を既定にしています。実際の値はGitに追加しません。

Supabaseを使う前に、[`supabase/schema.sql`](supabase/schema.sql) をSupabase SQL Editorで実行してください。`detective_notes` テーブルと、本人のノートだけを読み書きできるRLSポリシーが作成されます。

## 主要な構成

```text
app/                 # 画面とサーバーAPI
components/          # 探究ワークスペースと知識マップ
lib/                 # Gemini、Supabase、資料ライブラリの連携処理
data/history.json    # AIが最初に提案する信頼できる資料のライブラリ
supabase/schema.sql  # DBスキーマとアクセス制御
```

## 探究の流れ

1. 主質問を入力する
2. AIが資料ライブラリから最初の資料を提示する
3. 補助質問を「調査メモ」として束ねる
4. 必要に応じて、自分で見つけたURL・画像URLを追加する
5. 根拠を使って100〜300字の仮説を書く
6. AIから別視点と次の調査行動を受け取る
7. 探偵ノートとして保存する

現時点の「ノートに保存」はブラウザのローカルストレージに保存します。Supabase認証を接続した後は、同じデータをアカウントへ同期する予定です。
