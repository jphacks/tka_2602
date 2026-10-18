# レキしるべ

小学高学年が、歴史の課題を「覚えること」で終わらせず、自分の「なんで？」から資料を読み、考えをつくるための探究支援アプリです。

AIは答えや考察を代筆しません。課題の中にある驚き・選択・対立・変化を見つけ、児童が自分で気になる入口を選べるようにします。

## 探究の流れ

1. 先生から出された歴史のテーマ・課題を入力する
2. AIが「気になる場所」を示す
3. 児童が自分の「なんで？」を選ぶ、または書く
4. 信頼できる資料の入口を確認する
5. 資料を読んだうえで、自分の考えを探究ノートに残す

## 大切にしていること

- 歴史を、年号や答えだけでなく、人や出来事の選択を考えるものとして扱う
- 児童自身の問いと考察を守り、AIが作文を代筆しない
- AIの説明だけで決めず、資料を根拠に考える
- 学校の課題をそのまま入力できる

## 起動

```bash
npm install
Copy-Item .env.example .env.local
npm run dev
```

`.env.local`にOpenAI APIキーを設定してください。

```env
OPENAI_API_KEY=your_api_key
OPENAI_MODEL=gpt-4.1-mini
```

APIキーはサーバー側のRoute Handlerだけで使われ、ブラウザには送信されません。

## 主な構成

```text
app/api/inquiry/route.ts       # 課題を受け、探究の入口を返すAPI
components/research-workspace  # 課題から考察までの画面
lib/inquiry.ts                 # OpenAI Responses APIと構造化出力
lib/research-types.ts          # 探究計画の型
lib/sources.ts                 # 探究を始めるための資料の入口
```

現時点では、探究ノートをこのブラウザの`localStorage`へ保存します。アカウント、提出、採点はMVPの対象外です。
