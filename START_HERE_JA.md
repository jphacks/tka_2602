# VS Codeで開く手順

このフォルダーには、ホーム・書物調査室・探偵ノート・探偵掲示板を実装したコード一式が入っています。

## このPCのプロジェクトを起動する

このフォルダーをVS Codeで開いている場合、変更は反映済みです。コピーし直す必要はありません。ターミナルで次を実行します。

```powershell
.\start-dev.cmd
```

表示されたローカルURLを開き、「本能寺の変」に進みます。新しく追加した2択の予想と、2種類の読み方を試せます。起動中ならページを再読み込みしてください。

## 新しいフォルダーで動かす

1. ZIPファイルを右クリックして「すべて展開」を選びます。
2. 展開された `rekishirube` フォルダー内の `rekishirube.code-workspace` をVS Codeで開きます。「ファイル」→「フォルダーを開く」から、このフォルダーを選んでも同じです。
3. VS Codeの「ターミナル」→「新しいターミナル」を開きます。`package.json` があるフォルダーで、次のコマンドを順に実行します。

```powershell
npm ci
npm run dev
```

4. ターミナルに表示されたローカルURLをブラウザーで開きます。通常は `http://localhost:3000` です。

Node.js 20.9以上とnpmが必要です。`node -v` と `npm -v` で確認できます。依存パッケージは `npm ci` の実行時にダウンロードされるため、初回はインターネット接続が必要です。

APIキーを入力しなくても画面を試せます。質問には登録資料に基づく体験用回答が表示されます。ノートと掲示板の内容はブラウザー内に保存されます。

## 既存の同じプロジェクトへ反映する

既存のレキしるべを更新する場合は、現在のフォルダーをコピーしてバックアップし、このフォルダーの `app`、`components`、`data`、`lib`、`public`、`supabase` と、`package.json`、`package-lock.json`、各設定ファイルを同じ位置へコピーします。コピー後に `npm ci` と `npm run dev` を実行します。

独自に追加した変更がある場合は、新しいフォルダーで先に起動し、VS Codeのファイル比較で取り込む内容を確認してください。既存の `.env.local` はそのまま利用できます。このZIPには実際のAPIキーは含まれていません。

## よく編集するファイル

| 画面・機能 | ファイル |
| --- | --- |
| ホーム | `components/home-workspace.tsx` |
| 書物調査室 | `components/research-room.tsx` |
| 2択から調べる入口 | `components/curiosity-mission.tsx` |
| 資料の読みもの | `components/source-reader.tsx` |
| 探偵ノート | `components/notes-workspace.tsx` |
| 探偵掲示板 | `components/board-workspace.tsx` |
| 単元・資料・質問候補 | `data/units.ts` |
| AI処理 | `lib/gemini.ts` |
| 共通・調査室のデザイン | `app/globals.css` |
| ノート・掲示板のデザイン | `app/notes-board.css` |

Geminiを接続する手順や詳細は `README.md` を参照してください。背景画像も同梱しています。
