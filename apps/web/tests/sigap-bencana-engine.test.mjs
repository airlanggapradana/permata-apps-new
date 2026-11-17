import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
const { outputText } = ts.transpileModule(
  readFileSync(
    new URL("../src/lib/games/sigapBencana.ts", import.meta.url),
    "utf8",
  ),
  {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
    },
  },
);
const {
  createQuakeState,
  stepQuake,
  answerQuake,
  quakeSnapshot,
  revisitQuakeRoom,
  QUAKE_LESSONS,
  QUAKE_OBSTACLES,
  QUAKE_FLOOR,
  QUAKE_MIN_MS,
} = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
);
const input = (fields = {}) => ({
  enabled: true,
  left: false,
  right: false,
  jump: false,
  ...fields,
});
function route(state) {
  for (let i = 0; i < 4000 && !state.won; i++) {
    if (state.question) {
      const lesson = QUAKE_LESSONS.find((l) => l.id === state.question);
      answerQuake(state, lesson.correct);
    }
    const jump =
      state.grounded &&
      QUAKE_OBSTACLES.some((o) => o.x - state.x > 0 && o.x - state.x < 105);
    stepQuake(state, input({ right: true, jump }));
  }
}
test("the full house route is completable with real movement and jumps", () => {
  const state = createQuakeState();
  route(state);
  const snapshot = quakeSnapshot(state);
  assert.equal(snapshot.completed, true);
  assert.equal(snapshot.answers.length, 3);
  assert.equal(snapshot.rooms.length, 3);
  assert.ok(snapshot.activeMs >= QUAKE_MIN_MS);
});
test("each question gates the route even while jumping, and wrong answers stay retryable", () => {
  const state = createQuakeState();
  for (let i = 0; i < 300; i++)
    stepQuake(state, input({ right: true, jump: i === 45 }));
  assert.equal(state.question, "berlindung");
  assert.ok(state.x < QUAKE_LESSONS[0].x);
  const before = quakeSnapshot(state);
  for (let i = 0; i < 300; i++) stepQuake(state, input({ right: true }));
  assert.deepEqual(quakeSnapshot(state), before);
  assert.equal(answerQuake(state, "invalid"), null);
  assert.equal(state.mistakes, 0);
  assert.equal(answerQuake(state, "jendela").correct, false);
  assert.equal(state.question, "berlindung");
  assert.equal(state.mistakes, 1);
  assert.equal(answerQuake(state, "lindungi").correct, true);
  assert.equal(state.question, null);
  assert.equal(answerQuake(state, "lindungi"), null);
  assert.equal(state.answers.length, 1);
});
test("an obstacle blocks walking and can be crossed by a jump", () => {
  const state = createQuakeState();
  answerFirst(state);
  state.x = 700;
  for (let i = 0; i < 100; i++) stepQuake(state, input({ right: true }));
  assert.equal(state.x, QUAKE_OBSTACLES[0].x - 14);
  stepQuake(state, input({ right: true, jump: true }));
  for (let i = 0; i < 80; i++) stepQuake(state, input({ right: true }));
  assert.ok(state.x > QUAKE_OBSTACLES[0].x + QUAKE_OBSTACLES[0].width);
});
function answerFirst(state) {
  state.question = "berlindung";
  state.rooms = ["berlindung"];
  answerQuake(state, "lindungi");
}
test("pause freezes movement, timer and collected learning", () => {
  const state = createQuakeState();
  stepQuake(state, input({ right: true }));
  const before = structuredClone(state);
  for (let i = 0; i < 100; i++)
    stepQuake(state, input({ enabled: false, right: true, jump: true }));
  assert.deepEqual(state, before);
});
test("short jump taps are queued; held jump does not repeat", () => {
  const state = createQuakeState(),
    tap = input({ jumpQueued: true });
  stepQuake(state, tap);
  assert.ok(state.vy < 0);
  assert.equal(tap.jumpQueued, false);
  const held = createQuakeState();
  let jumps = 0;
  for (let i = 0; i < 130; i++)
    jumps += stepQuake(held, input({ jump: true })).filter(
      (e) => e.type === "jump",
    ).length;
  assert.equal(jumps, 1);
  assert.equal(held.y, QUAKE_FLOOR - 48);
});
test("opposite controls cancel and released movement brakes promptly", () => {
  const state = createQuakeState();
  stepQuake(state, input({ left: true, right: true }));
  assert.equal(state.x, 100);
  for (let i = 0; i < 20; i++) stepQuake(state, input({ right: true }));
  for (let i = 0; i < 7; i++) stepQuake(state, input());
  assert.equal(state.vx, 0);
});
test("revisiting a room preserves learning and snapshots are independent", () => {
  const state = createQuakeState();
  answerFirst(state);
  const snapshot = quakeSnapshot(state);
  state.x = 900;
  revisitQuakeRoom(state);
  assert.equal(state.x, QUAKE_LESSONS[0].x + 85);
  assert.equal(state.answers.length, 1);
  state.answers[0].optionId = "changed";
  state.rooms.push("keluar");
  assert.equal(snapshot.answers[0].optionId, "lindungi");
  assert.equal(snapshot.rooms.length, 1);
});
