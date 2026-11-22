import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function compile(file) {
  return ts.transpileModule(
    readFileSync(new URL(file, import.meta.url), "utf8"),
    {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.CommonJS,
      },
    },
  ).outputText;
}
const domain = {};
vm.runInNewContext(compile("../src/lib/games/roleplay.ts"), {
  exports: domain,
});
const presentation = {};
vm.runInNewContext(compile("../src/lib/games/roleplayPresentation.ts"), {
  exports: presentation,
  require: () => domain,
});
const { getRoleplayScene, getRoleplayReflections, ROLEPLAY_MOODS } =
  presentation;

test("every scene has a compact introduction and an accessible expression in both cultures", () => {
  const moods = new Set();
  for (const scenario of domain.ROLEPLAY_SCENARIOS)
    for (const node of scenario.nodes) {
      const scene = getRoleplayScene(scenario.id, node.id);
      assert.ok(ROLEPLAY_MOODS[scene.mood]);
      moods.add(scene.mood);
      assert.ok(
        scene.intro.length <= 150,
        `${scenario.id}/${node.id} stays concise`,
      );
      for (const culture of ["aceh", "kalimantan"])
        assert.ok(!/[{}]/.test(domain.roleplayText(scene.intro, culture)));
    }
  assert.equal(moods.size, 6);
  assert.match(
    getRoleplayScene("tenang-bersama", "sapa").intro,
    /Guncangan sudah berhenti/,
  );
  assert.match(
    getRoleplayScene("kabar-di-posko", "dengar-arahan").intro,
    /Dalam cerita ini/,
  );
});

test("reflections on every complete route quote actual choices without praising redirection choices", () => {
  for (const scenario of domain.ROLEPLAY_SCENARIOS) {
    function walk(answers) {
      const replay = domain.replayRoleplay(scenario.id, answers);
      if (!replay.completed) {
        for (const option of replay.node.options)
          walk([...answers, { nodeId: replay.node.id, optionId: option.id }]);
        return;
      }
      const reflections = getRoleplayReflections(scenario.id, answers);
      assert.ok(reflections.length >= 1 && reflections.length <= 3);
      assert.equal(
        new Set(reflections.map((item) => item.id)).size,
        reflections.length,
      );
      let previousIndex = -1;
      for (const reflection of reflections) {
        const index = answers.findIndex(
          (answer) => `${answer.nodeId}:${answer.optionId}` === reflection.id,
        );
        assert.ok(
          index > previousIndex,
          "Reflections follow the story's order",
        );
        previousIndex = index;
        const answer = answers[index];
        const node = scenario.nodes.find((item) => item.id === answer.nodeId);
        const option = node.options.find((item) => item.id === answer.optionId);
        assert.equal(reflection.choice, option.text);
        assert.equal(reflection.explanation, option.explanation);
        assert.notEqual(
          scenario.nodes.find((item) => item.id === option.next).stage,
          node.stage,
        );
      }
    }
    walk([]);
  }
});

test("a repaired response is highlighted without attributing an unchosen response to the player", () => {
  const answers = [
    { nodeId: "sapa", optionId: "cerita" },
    { nodeId: "ruang", optionId: "temani" },
  ];
  let replay = domain.replayRoleplay("teman-di-posko", answers);
  while (!replay.completed) {
    answers.push({
      nodeId: replay.node.id,
      optionId: replay.node.options[0].id,
    });
    replay = domain.replayRoleplay("teman-di-posko", answers);
  }
  const reflections = getRoleplayReflections("teman-di-posko", answers);
  const adjustment = reflections.find((item) => item.id === "ruang:temani");
  assert.equal(adjustment.adjusted, true);
  assert.match(adjustment.choice, /tanpa harus bercerita/);
  assert.ok(
    !reflections.some(
      (item) => item.id === "sapa:cerita" || item.id === "sapa:izin",
    ),
  );
});

test("partial or invalid paths produce no invented learning reflections", () => {
  for (const [id, answers] of [
    ["teman-di-posko", []],
    ["unknown", []],
    ["teman-di-posko", [{ nodeId: "selesai", optionId: "foreign" }]],
  ])
    assert.equal(getRoleplayReflections(id, answers).length, 0);
});
