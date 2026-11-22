import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import vm from "node:vm";
import ts from "typescript";

const compile = (file) =>
  ts.transpileModule(readFileSync(new URL(file, import.meta.url), "utf8"), {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
    },
  }).outputText;
const domainModule = { exports: {} };
vm.runInNewContext(compile("../src/lib/games/roleplay.ts"), {
  exports: domainModule.exports,
});
const domain = domainModule.exports;
const {
  ROLEPLAY_SCENARIOS,
  ROLEPLAY_VERSION,
  ROLEPLAY_MAX_ANSWERS,
  replayRoleplay,
  isRoleplayRun,
  roleplayText,
} = domain;
const exampleRun = (extra = {}) => ({
  id: randomUUID(),
  scenarioId: ROLEPLAY_SCENARIOS[0].id,
  version: ROLEPLAY_VERSION,
  culture: "aceh",
  ownerId: null,
  answers: [],
  activeMs: 12000,
  updatedAt: Date.now(),
  ...extra,
});

test("every choice in all four stories reaches an ending without dead ends or loops", () => {
  assert.equal(ROLEPLAY_SCENARIOS.length, 4);
  for (const scenario of ROLEPLAY_SCENARIOS) {
    assert.equal(
      new Set(scenario.nodes.map((node) => node.id)).size,
      scenario.nodes.length,
    );
    const visited = new Set();
    let paths = 0;
    function walk(node, answers, ancestors) {
      assert.ok(!ancestors.has(node.id), `Loop in ${scenario.id}/${node.id}`);
      assert.ok(answers.length <= ROLEPLAY_MAX_ANSWERS);
      visited.add(node.id);
      const replay = replayRoleplay(scenario.id, answers);
      assert.equal(replay.node.id, node.id);
      if (!node.options.length) {
        assert.equal(replay.completed, true);
        assert.ok(replay.skills.length >= 2);
        paths++;
        return;
      }
      assert.equal(replay.completed, false);
      assert.ok(
        node.options.length >= 2 && node.options.length <= 3,
        "Every playable scene offers two or three choices",
      );
      assert.equal(
        new Set(node.options.map((item) => item.id)).size,
        node.options.length,
      );
      for (const option of node.options) {
        assert.ok(
          option.text && option.reaction && option.explanation && option.skill,
        );
        const next = scenario.nodes.find(
          (candidate) => candidate.id === option.next,
        );
        assert.ok(next, `${scenario.id}/${option.next} must exist`);
        assert.ok(next.stage >= node.stage);
        walk(
          next,
          [...answers, { nodeId: node.id, optionId: option.id }],
          new Set([...ancestors, node.id]),
        );
      }
    }
    walk(scenario.nodes[0], [], new Set());
    assert.equal(visited.size, scenario.nodes.length, "No unreachable content");
    assert.ok(paths > 1, "Each story branches");
  }
});

test("graph validation rejects skipped scenes, foreign choices and answers after the ending", () => {
  assert.equal(replayRoleplay("unknown", []), null);
  assert.equal(replayRoleplay(ROLEPLAY_SCENARIOS[0].id, null), null);
  for (const answers of [
    [null],
    [1],
    [{ nodeId: "hubungkan", optionId: "izin" }],
    [{ nodeId: "sapa", optionId: "foreign" }],
    new Array(ROLEPLAY_MAX_ANSWERS + 1).fill({}),
  ]) {
    assert.equal(replayRoleplay(ROLEPLAY_SCENARIOS[0].id, answers), null);
  }
  const scenario = ROLEPLAY_SCENARIOS[0];
  const answers = [];
  let replay = replayRoleplay(scenario.id, answers);
  while (!replay.completed) {
    answers.push({
      nodeId: replay.node.id,
      optionId: replay.node.options[0].id,
    });
    replay = replayRoleplay(scenario.id, answers);
  }
  assert.equal(replayRoleplay(scenario.id, [...answers, answers[0]]), null);
  assert.equal(replayRoleplay(scenario.id, answers.slice().reverse()), null);
});

test("both cultural variants resolve all story placeholders without changing graph IDs", () => {
  for (const culture of ["aceh", "kalimantan"])
    for (const scenario of ROLEPLAY_SCENARIOS)
      for (const node of scenario.nodes) {
        const strings = [
          node.situation,
          node.dialogue,
          ...node.options.flatMap((item) => [
            item.text,
            item.reaction,
            item.explanation,
          ]),
        ];
        for (const value of strings)
          assert.ok(!/[{}]/.test(roleplayText(value, culture)));
      }
  assert.match(roleplayText("{friend} di {place}", "aceh"), /Rafi.*gampong/);
  assert.match(
    roleplayText("{friend} di {place}", "kalimantan"),
    /Lala.*Betang/,
  );
});

test("checkpoint validation rejects unknown versions, malformed IDs, durations and cultures", () => {
  assert.equal(isRoleplayRun(exampleRun()), true);
  for (const extra of [
    { id: "not-uuid" },
    { version: 99 },
    { culture: "unknown" },
    { ownerId: 12 },
    { activeMs: Infinity },
    { activeMs: NaN },
    { activeMs: -1 },
    { activeMs: 1.5 },
    { activeMs: 86400001 },
    { updatedAt: NaN },
    { answers: [{}] },
  ])
    assert.equal(isRoleplayRun(exampleRun(extra)), false);
});

function storageHarness({ blocked = false } = {}) {
  const entries = new Map();
  const storage = {
    get length() {
      return entries.size;
    },
    key: (index) => [...entries.keys()][index] ?? null,
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, value) => {
      if (blocked) throw new Error("Quota");
      entries.set(key, value);
    },
    removeItem: (key) => entries.delete(key),
  };
  const exports = {};
  vm.runInNewContext(compile("../src/lib/games/roleplayStorage.ts"), {
    exports,
    require: () => domain,
    localStorage: storage,
  });
  return { ...exports, entries };
}

test("local progress isolates accounts, survives offline and expires after seven days", () => {
  const storage = storageHarness();
  const first = exampleRun({ ownerId: "first", updatedAt: Date.now() - 2000 });
  const second = exampleRun({ ownerId: "second" });
  assert.equal(storage.writeRoleplayRun(first), true);
  storage.writeRoleplayRun(second);
  assert.equal(storage.readRoleplayRun("first").id, first.id);
  assert.equal(storage.readRoleplayRun(null), null);
  assert.equal(storage.readOfflineRoleplayRun().id, second.id);
  storage.clearRoleplayRun("second");
  assert.equal(storage.readRoleplayRun("first").id, first.id);
  storage.writeRoleplayRun(
    exampleRun({ updatedAt: Date.now() - 8 * 86400000 }),
  );
  assert.equal(storage.readRoleplayRun(null), null);
  storage.entries.set("permata_roleplay_v1:guest", "{broken");
  assert.equal(storage.readRoleplayRun(null), null);
  assert.equal(
    storageHarness({ blocked: true }).writeRoleplayRun(first),
    false,
  );
  const pruned = storageHarness();
  pruned.writeRoleplayRun(
    exampleRun({ ownerId: "expired", updatedAt: Date.now() - 8 * 86400000 }),
  );
  pruned.writeRoleplayRun(second);
  assert.equal(
    pruned.readOfflineRoleplayRun().id,
    second.id,
    "Pruning an expired entry must not skip the next checkpoint",
  );
});
