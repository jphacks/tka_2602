# レキしるべ

気になる歴史の「なぜ？」から、資料を読み、AIと対話し、自分の考察を残す歴史探究アプリです。紺・金・青の和風デザインで、ホーム・書物調査室・探偵ノート・探偵掲示板の4画面を実装しています。

## まず動かす

```bash
npm install
npm run dev
```

Windowsで `npm` が認識されない場合、このPCにあるNode.jsとインストール済みパッケージを使って起動できます。VS Codeでプロジェクトのターミナルを開き、次を実行してください。

```powershell
.\start-dev.cmd
```

起動ファイルはPATH上のNode.jsを優先し、見つからなければこのPCのCodex用Node.jsを探します。`npm` の追加インストールやシステム設定の変更は行いません。新しいPCで依存パッケージがまだない場合は、通常のNode.jsとnpmを用意して先に `npm ci` を実行してください。

表示されたローカルURLを開きます。APIキーやSupabaseを設定しなくても、登録資料に基づく体験用の回答と、ブラウザ内への保存で一連の操作を試せます。本プロジェクトの開発・本番ビルドはWebpackを使用します。

| 画面 | URL | 実装 |
| --- | --- | --- |
| ホーム | `/` | 教科書の体験用対応番号、キーワード検索、単元選択、補助質問 |
| 書物調査室 | `/research/honnoji` | 資料・成立背景の表示、難易度、自由質問、対話履歴、根拠と解釈、考察保存 |
| 探偵ノート | `/notes` | 単元別の記録状況、自分の考察、問答、発見、参照資料、編集・削除 |
| 探偵掲示板 | `/board` | 単元別表示、投稿・コメント・共感・保存、種類・タグ・並び順の変更 |

本能寺の変の体験用対応番号は `3-2-1`、`12A`、`p.45-2` です。出版社の正式な対応表ではありません。

## 保存先と体験モード

- ノートと掲示板は `localStorage` に保存します。再読み込み後も同じブラウザで読み返せます。端末間の同期と他の人への共有はまだ接続していません。
- 掲示板の初期投稿は「表示例」として区別しています。投稿・コメント・リアクションは外部へ送信されません。
- `GEMINI_API_KEY` が未設定の場合は、難易度と質問内容に応じた体験用回答を返します。登録資料で答えられない質問は、不明として表示します。
- Geminiを設定するとAIとの対話に切り替わります。接続失敗や不正な回答を体験用回答に置き換えることはなく、エラーを表示します。
- 資料本文は公的機関等の公開解説をもとにした教材用の要約です。史料原文・翻刻の引用ではありません。資料内のリンクから公開元を確認できます。

## 読み方と説明の切り替え

授業で初めて開いた小学校6年生を想定し、本能寺の変には「予想する → 資料の手がかりを見る → AIに聞く」という短い入口を用意しています。知識がなくても2択から始められ、気になる発見をノートの下書きに追加できます。追加した発見は、最後に「探偵ノートに保存」を押すとブラウザに残ります。得点や制限時間はありません。

書物調査室の「歴史の楽しみ方」から、次の読み方を選べます。

- **たとえで楽しく**：歴史にまだなじみがなくても、学校や友だちなどの身近なたとえから入れます。
- **歴史好きの深読み**：具体的なエピソードと意外な手がかりから、史料の謎を追います。

選択すると資料の読みものがすぐに変わり、AIの説明は次の質問から変わります。「やさしく・標準・深掘り」は説明の詳しさとして別に選べます。

資料は出来事を読みものとして紹介し、手がかりと次の問いを添えています。たとえは専用の枠に表示し、歴史上の出来事や原文の引用と区別します。保存したノートにも、読み方と回答のたとえが残ります。以前の保存ノートも引き続き読み込めます。

## 主要なコード

```text
components/home-workspace.tsx       # ホーム
components/research-room.tsx        # 書物調査室と考察の保存
components/source-reader.tsx        # 読み方別の資料の物語・手がかり
components/curiosity-mission.tsx    # 本能寺の変を予想から調べる短い入口
components/notes-workspace.tsx      # 探偵ノート
components/board-workspace.tsx      # 探偵掲示板
components/workspace-provider.tsx   # ブラウザ内保存と画面間のデータ共有
components/app-shell.tsx            # 共通ナビゲーション
data/units.ts                      # 単元・対応番号・資料・質問候補
lib/types.ts                       # 画面・API共通のデータ型
lib/gemini.ts                      # AIの入力・回答形式・体験用回答
app/api/inquiry/route.ts            # 質問APIと入力検証
app/globals.css                    # 共通・ホーム・調査室のスタイル
app/notes-board.css                # ノート・掲示板のスタイル
app/learning-styles.css            # 読み方の選択とたとえの表示
app/curiosity-mission.css          # 予想・手がかりの表示
public/images/ASSETS.md            # 背景画像の生成方法・プロンプト
```

`npm run build` で本番ビルド、`npx tsc --noEmit` で型を確認できます。

`npm test` で、読み方別の回答、史料ID、後方互換、未確認の質問、AI回答の検証をテストできます。テストは実際のAPIキーや外部接続を使用しません。

## 技術構成

- フロントエンド／バックエンド: Next.js, TypeScript, Tailwind CSS, Route Handlers
- AI: Gemini API（構造化出力）
- 認証・データベース: Supabase
- 知識マップ: React Flow (`@xyflow/react`)
- 動画: 確認済み動画のYouTube埋め込み。自由検索が必要になった時点でYouTube Data APIを追加します。
- 公開: Vercel

## Gemini・Supabaseの任意設定

```bash
Copy-Item .env.example .env.local
```

AIを接続する場合は `.env.local` にGeminiの値を設定し、開発サーバーを再起動してください。実際の値はGitに追加しません。Supabaseの環境変数は既存のノートAPI `/api/notes` を利用する場合に設定します。現在の4画面の保存はブラウザ内保存を使用します。

Supabaseを使う前に、[`supabase/schema.sql`](supabase/schema.sql) をSupabase SQL Editorで実行してください。`detective_notes` テーブルと、本人のノートだけを読み書きできるRLSポリシーが作成されます。

## 主要な構成

```text
app/                 # 画面とサーバーAPI
components/          # 質問フォームと知識マップ
lib/                 # Gemini、Supabase、動画の連携処理
data/history.json    # 出典情報を含む基礎歴史データ
supabase/schema.sql  # DBスキーマとアクセス制御
```
