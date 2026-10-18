const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("探究カードは最低3枚で、追加を止めない", () => {
  const component = read("components/inquiry-workspace.tsx");
  assert.match(component, /REQUIRED_CARDS = 3/);
  assert.match(component, /\[\.\.\.current, card\]/);
  assert.match(component, /cards\.length >= REQUIRED_CARDS/);
});

test("AIは資料探索・出典表示・代筆しないルールを持つ", () => {
  const openai = read("lib/openai.ts");
  assert.match(openai, /web_search/);
  assert.match(openai, /tool_choice: "required"/);
  assert.match(openai, /代わりに考察や感想を完成させてはいけません/);
  assert.match(openai, /先生に出された課題を早く終わらせたい/);
  assert.match(openai, /最初の手がかりは80字以内/);
  assert.match(openai, /sourcesFrom/);
  assert.match(openai, /sourcesFromJson/);
});
