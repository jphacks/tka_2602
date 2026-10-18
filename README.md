# レキしるべ

小学6年生が、先生から出された歴史課題を自分の疑問から深めるための探究ノートです。

```text
課題文を入力
  → AIが公開資料を探索して最初の手がかりを提示
  → 疑問をカードとして積み上げる（最低3枚、追加は自由）
  → 考察または考えの変化を書く
  → 完成ノートをこの端末に保存
```

## 大切にしていること

- 課題文は固定しません。先生ごとの指示をそのまま入力できます。
- AIはWeb Searchで取得した公開資料を根拠として、出典リンクを表示します。
- 根拠が十分に得られない場合は、答えを作らず課題を具体化するよう案内します。
- AIは児童の考察・感想を代筆しません。
- 3枚は提出に必要な最低枚数です。4枚目以降も自由に追加できます。

## 起動

```bash
npm install
Copy-Item .env.example .env.local
npm run dev
```

`.env.local` にOpenAI APIキーを設定してください。OpenAI Responses APIのWeb Searchを利用して、資料を探索します。

```env
OPENAI_API_KEY=your_api_key
OPENAI_MODEL=gpt-4.1-mini
```

APIキーはサーバー側の Route Handler だけで使用し、ブラウザには送信しません。

## 主な構成

```text
app/page.tsx                 # 課題入力から完成ノートまでの画面
components/inquiry-workspace # 探究カードのUIとブラウザ内保存
app/api/inquiry/route.ts     # 入力検証とAI呼び出し
lib/openai.ts                # 資料探索・小学生向け応答のプロンプト
lib/research-types.ts        # 課題・探究カード・出典の型
```

現時点ではノートをブラウザの `localStorage` に保存します。教師への提出、アカウント、掲示板、採点は今回のMVPの対象外です。
