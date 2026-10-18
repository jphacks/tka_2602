const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");

// Load the real TypeScript modules without a Next server, a network call, or
// access to the developer's environment variables and API credentials.
function harness({ live = false, generated } = {}) {
  const calls = [];
  const errors = [];
  const cache = new Map();
  const context = vm.createContext({
    process: { env: live ? { GEMINI_API_KEY: "synthetic-test-key", GEMINI_MODEL: "test-model" } : {} },
    console: { error: (...args) => errors.push(args), warn() {}, log() {} },
    Request, Response, URL, TextEncoder, TextDecoder,
  });
  const genai = {
    Type: Object.fromEntries(["OBJECT", "ARRAY", "STRING", "NUMBER", "BOOLEAN"].map((type) => [type, type])),
    GoogleGenAI: class {
      constructor(options) {
        assert.equal(options.apiKey, "synthetic-test-key");
        this.models = {
          generateContent: async (options) => {
            calls.push(options);
            return { text: JSON.stringify(typeof generated === "function" ? generated(options) : generated) };
          },
        };
      }
    },
  };
  function load(specifier, parent = path.join(root, "test-entry.ts")) {
    if (specifier === "@google/genai") return genai;
    if (specifier === "next/server") {
      return { NextResponse: { json: (body, init) => Response.json(body, init) } };
    }
    assert.ok(specifier.startsWith("@/") || specifier.startsWith("."), `Unexpected test dependency: ${specifier}`);
    const candidate = specifier.startsWith("@/")
      ? path.join(root, specifier.slice(2))
      : path.resolve(path.dirname(parent), specifier);
    const filename = [candidate, `${candidate}.ts`, path.join(candidate, "index.ts")]
      .find((entry) => fs.existsSync(entry) && fs.statSync(entry).isFile());
    assert.ok(filename && filename.startsWith(root + path.sep), `Module must exist inside project: ${specifier}`);
    if (cache.has(filename)) return cache.get(filename).exports;
    const module = { exports: {} };
    cache.set(filename, module);
    const source = fs.readFileSync(filename, "utf8");
    if (filename.endsWith(".json")) {
      module.exports = JSON.parse(source);
      return module.exports;
    }
    const { outputText } = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
      fileName: filename,
    });
    const execute = new vm.Script(`(function(require, module, exports) {\n${outputText}\n})`, { filename });
    execute.runInContext(context)((id) => load(id, filename), module, module.exports);
    return module.exports;
  }
  return {
    ...load("@/lib/gemini"),
    ...load("@/data/units"),
    post: load("@/app/api/inquiry/route").POST,
    calls,
    errors,
  };
}

function input(overrides = {}) {
  return {
    question: "織田信長って誰？", unitId: "honnoji", difficulty: "standard",
    learningStyle: "story", selectedSourceIds: [], messages: [], ...overrides,
  };
}

async function post(h, body) {
  const response = await h.post({ text: async () => JSON.stringify(body) });
  return { status: response.status, body: await response.json() };
}

function checkEvidence(result, unit) {
  const registered = new Set(unit.sources.map((source) => source.id));
  const returned = new Set(result.sources.map((source) => source.id));
  const cited = new Set();
  for (const evidence of [...result.facts, ...result.interpretations]) {
    assert.ok(evidence.text.trim(), "Each piece of evidence needs text");
    assert.ok(evidence.sourceIds.length, "Each piece of evidence needs a citation");
    for (const id of evidence.sourceIds) {
      assert.ok(registered.has(id), `Unregistered evidence source: ${id}`);
      assert.ok(returned.has(id), `Cited source missing from response: ${id}`);
      cited.add(id);
    }
  }
  for (const id of returned) assert.ok(cited.has(id), `Response attaches an unused source: ${id}`);
}

test("older API requests default to story; unknown styles are rejected before generation", async () => {
  const h = harness();
  const oldRequest = input();
  delete oldRequest.learningStyle;
  const fallback = await post(h, oldRequest);
  assert.equal(fallback.status, 200);
  assert.equal(fallback.body.learningStyle, "story");
  const explicit = await post(h, input());
  assert.equal(explicit.body.answer, fallback.body.answer);
  for (const learningStyle of ["expert", "", null, 42, ["story"]]) {
    assert.equal((await post(h, input({ learningStyle }))).status, 400);
  }
  assert.equal(h.calls.length, 0);
  const legacyCall = await h.answerInquiry("織田信長って誰？");
  assert.equal(legacyCall.learningStyle, "story");
  assert.equal(legacyCall.answer, fallback.body.answer);
});

test("Nobunaga profile answers the exact question in both reading styles", async () => {
  const h = harness();
  const story = await h.answerInquiry(input());
  const detective = await h.answerInquiry(input({ learningStyle: "detective" }));
  for (const result of [story, detective]) {
    assert.equal(result.mode, "demo");
    assert.match(result.answer, /信長/);
    assert.match(result.answer, /武将|大名|戦国/);
    assert.match(result.answer, /うつけ/);
    assert.ok(result.facts.length > 0, "A supported profile must not fall through to the unknown-topic reply");
    assert.doesNotMatch(result.answer, /(?:少年時代|若い頃)(?:の信長)?は(?:とても|本当に)?(?:馬鹿|バカ|頭が悪かった)/);
    assert.doesNotMatch(result.answer, /(?:信長|彼)は(?:わざと|計画的に)(?:馬鹿|バカ|うつけ)(?:のふり|を演じ)/);
    checkEvidence(result, h.getUnit("honnoji"));
  }
  assert.notEqual(story.answer, detective.answer);
  assert.ok(story.analogy?.trim(), "Story mode provides a separately labeled modern analogy");
  assert.ok(!story.answer.includes(story.analogy), "The analogy is not mixed into the historical account");
  for (const evidence of [...story.facts, ...story.interpretations]) {
    assert.ok(!evidence.text.includes(story.analogy));
    assert.doesNotMatch(evidence.text, /ローランド|クラスメート|クラスの友だち/);
  }
});

test("reading style remains independent of easy, standard, and deep difficulty", async () => {
  const h = harness();
  for (const difficulty of ["easy", "standard", "deep"]) {
    const story = await h.answerInquiry(input({ learningStyle: "story", difficulty }));
    const detective = await h.answerInquiry(input({ learningStyle: "detective", difficulty }));
    assert.equal(story.learningStyle, "story");
    assert.equal(detective.learningStyle, "detective");
    assert.notEqual(story.answer, detective.answer, `Styles should differ at ${difficulty} difficulty`);
    assert.match(story.answer, /信長/);
    assert.match(detective.answer, /信長/);
    assert.ok(story.analogy?.trim());
  }
});

test("all registered source readings provide two distinct stories and concrete clues", () => {
  const h = harness();
  for (const unit of h.historyUnits) {
    for (const source of unit.sources) {
      for (const learningStyle of ["story", "detective"]) {
        const reading = source.readings?.[learningStyle];
        assert.ok(reading, `${source.id} needs ${learningStyle} reading`);
        for (const field of ["title", "lead", "story", "question"]) {
          assert.ok(reading[field]?.trim().length >= 8, `${source.id}/${learningStyle}/${field} needs meaningful content`);
        }
        assert.ok(reading.story.length >= 60, `${source.id}/${learningStyle} needs an actual story`);
        assert.ok(reading.clues.length >= 2, `${source.id}/${learningStyle} needs multiple clues`);
        for (const clue of reading.clues) assert.ok(clue.trim().length >= 8, "Clues must be more than labels");
      }
      assert.notEqual(source.readings.story.story, source.readings.detective.story);
    }
  }
});

test("selected source questions use the requested reading style, with registered evidence", async () => {
  const h = harness();
  for (const unit of h.historyUnits) {
    for (const source of unit.sources) {
      for (const learningStyle of ["story", "detective"]) {
        const result = await h.answerInquiry(input({
          unitId: unit.id, question: "この資料の手がかりを教えて", learningStyle,
          selectedSourceIds: [source.id],
        }));
        assert.ok(result.answer.includes(source.readings[learningStyle].story), `${source.id} did not use ${learningStyle} story`);
        assert.equal(result.learningStyle, learningStyle);
        if (source.readings[learningStyle].analogy) assert.equal(result.analogy, source.readings[learningStyle].analogy);
        checkEvidence(result, unit);
        assert.ok(result.sources.some((returned) => returned.id === source.id));
      }
    }
  }
});

test("every suggested demo question cites only registered, returned sources in both styles", async () => {
  const h = harness();
  for (const unit of h.historyUnits) {
    for (const difficulty of ["easy", "standard", "deep"]) {
      for (const learningStyle of ["story", "detective"]) {
        for (const question of unit.questions[difficulty]) {
          const result = await h.answerInquiry(input({ unitId: unit.id, question, difficulty, learningStyle }));
          checkEvidence(result, unit);
        }
      }
    }
  }
});

test("new guided questions answer their specific clues rather than a generic topic", async () => {
  const h = harness();
  const questions = [
    {
      question: "光秀は事件のあと、だれを仲間に誘ったの？", sourceId: "honnoji-akechi",
      expected: [/藤孝/, /忠興/, /協力|誘|勧誘/],
    },
    {
      question: "光秀の次世代への約束を、どう読み解く？", sourceId: "honnoji-akechi",
      expected: [/次世代|次の世代|子/, /覚書|手紙|文書|一通/],
    },
    {
      question: "信長の襲撃を知ったときの一言は？", sourceId: "honnoji-shinchoki",
      expected: [/是非に及ばず/],
    },
  ];
  for (const { question, sourceId, expected } of questions) {
    for (const learningStyle of ["story", "detective"]) {
      for (const difficulty of ["easy", "standard", "deep"]) {
        const result = await h.answerInquiry(input({ question, learningStyle, difficulty }));
        for (const expression of expected) assert.match(result.answer, expression, `${question}/${learningStyle}/${difficulty}`);
        assert.ok(result.sources.some((source) => source.id === sourceId), `${question} needs its actual source`);
        checkEvidence(result, h.getUnit("honnoji"));
      }
    }
  }
});

test("each source's own question works verbatim, without a title prefix", async () => {
  const h = harness();
  for (const unit of h.historyUnits) {
    for (const source of unit.sources) {
      for (const learningStyle of ["story", "detective"]) {
        for (const selectedSourceIds of [[], [source.id]]) {
          const result = await h.answerInquiry(input({
            unitId: unit.id, learningStyle, selectedSourceIds,
            question: source.readings[learningStyle].question,
          }));
          assert.ok(result.sources.some((returned) => returned.id === source.id), `${source.id}/${learningStyle} question lost its source`);
          assert.ok(result.answer.includes(source.readings[learningStyle].story), `${source.id}/${learningStyle} question did not use its reading`);
          checkEvidence(result, unit);
        }
      }
    }
  }
});

test("a reluctant pupil gets a concrete source-backed first action and a usable next question", async () => {
  const h = harness();
  const subjects = {
    honnoji: /本能寺/,
    edo: /江戸|すし|寿司|守貞/,
    kamakura: /頼朝|三浦/,
    sengoku: /信長|秀吉|家康/,
  };
  for (const unit of h.historyUnits) {
    for (const learningStyle of ["story", "detective"]) {
      for (const question of ["歴史が苦手", "何を調べればいい？", "めんどくさい", "よくわからない"]) {
        const result = await h.answerInquiry(input({ unitId: unit.id, question, learningStyle, difficulty: "easy" }));
        const context = `${unit.id}/${learningStyle}/${question}`;
        assert.ok(result.facts.length > 0 && result.sources.length > 0, `${context}: an entry prompt is not an unsupported-topic question`);
        assert.match(result.answer, subjects[unit.id], `${context}: name a concrete person, place, or object`);
        assert.match(result.answer, /資料|年表/, `${context}: say what to open`);
        assert.match(result.answer, /開い|探そ|見つけ/, `${context}: offer an action the pupil can take now`);
        assert.match(result.answer, /メモ|ノート|一行/, `${context}: explain what the pupil should record`);
        const nextQuestion = result.followUpQuestions.find((entry) => subjects[unit.id].test(entry) && /[？?]/.test(entry));
        assert.ok(nextQuestion, `${context}: suggest a specific question about this unit`);
        checkEvidence(result, unit);
        const next = await h.answerInquiry(input({ unitId: unit.id, question: nextQuestion, learningStyle, difficulty: "easy" }));
        assert.ok(next.facts.length > 0, `${context}: the proposed next question must actually be answerable`);
        checkEvidence(next, unit);
      }
    }
  }
  for (const learningStyle of ["story", "detective"]) {
    const result = await h.answerInquiry(input({ question: "光秀の覚書がよくわからない", learningStyle, difficulty: "easy" }));
    assert.ok(result.sources.some((source) => source.id === "honnoji-akechi"), "A named-source question takes priority over a general starter mission");
    assert.match(result.answer, /藤孝|忠興/);
  }
});

test("an unsupported question does not gain invented facts or citations", async () => {
  const h = harness();
  for (const learningStyle of ["story", "detective"]) {
    const result = await h.answerInquiry(input({ question: "火星で最初に食べられたお菓子は？", learningStyle }));
    assert.equal(result.facts.length, 0);
    assert.equal(result.interpretations.length, 0);
    assert.equal(result.sources.length, 0);
    assert.ok(result.unknowns.length > 0);
    assert.equal(result.learningStyle, learningStyle);
  }
});

function validLiveResult(sourceId) {
  return {
    answer: "織田信長は戦国時代の武将です。若い頃の評判と、その後の実績を見比べてみよう。",
    facts: [{ text: "若い信長には『うつけ者』と呼ばれたという逸話がある。", sourceIds: [sourceId] }],
    interpretations: [], unknowns: ["逸話から当時の内心までは判断できません。"],
    followUpQuestions: ["どんな出来事で信長の評判が変わった？"], relatedTerms: ["織田信長"],
    analogy: "たとえば、第一印象と試合での活躍が違うクラスメートを考えてみよう。",
  };
}

test("live generation receives style and difficulty, keeps analogy separate, and validates citations", async () => {
  for (const learningStyle of ["story", "detective"]) {
    const h = harness({ live: true, generated: validLiveResult("honnoji-nobunaga-youth") });
    const { status, body } = await post(h, input({ learningStyle, difficulty: "deep" }));
    assert.equal(status, 200);
    assert.equal(body.mode, "live");
    assert.equal(body.learningStyle, learningStyle);
    assert.ok(body.analogy);
    checkEvidence(body, h.getUnit("honnoji"));
    assert.equal(h.calls.length, 1);
    const call = h.calls[0];
    const payload = JSON.parse(call.contents);
    assert.equal(payload.learningStyle, learningStyle);
    assert.equal(payload.difficulty, "deep");
    assert.ok(payload.sources.some((source) => source.readings?.[learningStyle]), "Live model needs the selected-style source readings");
    assert.match(call.config.systemInstruction, /story/);
    assert.match(call.config.systemInstruction, /detective/);
    assert.match(call.config.systemInstruction, /analogy/);
    assert.match(call.config.systemInstruction, /たとえ|例え|比喩/);
    assert.match(call.config.systemInstruction, /小学(?:校)?6年生/);
    assert.match(call.config.systemInstruction, /(?:知らない言葉|専門語).*(?:その場|最初|説明)/);
    assert.match(call.config.systemInstruction, /(?:何を調べ|めんどくさ|歴史が苦手)/);
    assert.match(call.config.systemInstruction, /(?:一分|1分).*(?:具体的|謎)/);
    assert.ok(call.config.responseSchema.properties.analogy, "Structured response exposes a separate analogy field");
  }
});

test("a live unregistered citation is an API error, never a silent demo answer", async () => {
  const h = harness({ live: true, generated: validLiveResult("invented-source-id") });
  const { status, body } = await post(h, input());
  assert.equal(status, 502);
  assert.equal(typeof body.error, "string");
  assert.equal(body.answer, undefined);
  assert.equal(body.mode, undefined);
  assert.equal(h.calls.length, 1);
  assert.equal(h.errors.length, 1);
});

test("a malformed live analogy is rejected instead of reaching the student UI", async () => {
  const h = harness({
    live: true,
    generated: { ...validLiveResult("honnoji-nobunaga-youth"), analogy: { text: "wrong shape" } },
  });
  const { status, body } = await post(h, input());
  assert.equal(status, 502);
  assert.equal(typeof body.error, "string");
  assert.equal(body.analogy, undefined);
});
