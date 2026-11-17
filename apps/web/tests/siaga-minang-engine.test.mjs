import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
const source = readFileSync(
  new URL("../src/lib/games/siagaMinang.ts", import.meta.url),
  "utf8",
);
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
  },
});
const {
  createMinangState,
  stepMinang,
  getMinangSnapshot,
  returnToMinangCheckpoint,
  MINANG_PLATFORMS,
  MINANG_CHECKPOINTS,
  MINANG_ITEMS,
  MINANG_PICKUPS,
  MINANG_TARGET,
  MINANG_GROUND_Y,
  MINANG_WORLD_WIDTH,
  MINANG_HEIGHT,
  MINANG_GOAL_X,
} = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
);
const input = (values = {}) => ({
  enabled: true,
  left: false,
  right: false,
  jump: false,
  ...values,
});
function walkRoute(state) {
  const events = [];
  for (let frame = 0; frame < 9000 && !state.won; frame++) {
    const obstacle = MINANG_PLATFORMS.some(
      (p) => p.kind === "wood" && p.x - state.x > 10 && p.x - state.x < 80,
    );
    const edge = MINANG_PLATFORMS.some(
      (p) =>
        p.kind === "ground" &&
        p.x + p.width < MINANG_WORLD_WIDTH &&
        p.x + p.width - state.x < 55 &&
        p.x + p.width - state.x > -5,
    );
    events.push(
      ...stepMinang(
        state,
        input({ right: true, jump: state.onGround && (obstacle || edge) }),
      ),
    );
  }
  return events;
}
test("the planned route is completable using movement and jumps without falls", () => {
  const state = createMinangState();
  walkRoute(state);
  assert.ok(state.won, JSON.stringify(state));
  assert.equal(state.falls, 0);
  assert.equal(state.collectedPickups.length, MINANG_TARGET);
  assert.deepEqual(
    state.items,
    MINANG_ITEMS.map((item) => item.id),
  );
  assert.deepEqual(
    state.checkpoints,
    MINANG_CHECKPOINTS.map((pos) => pos.id),
  );
  assert.ok(state.elapsedMs >= 12000);
});
test("supplies are collected once when the character touches them", () => {
  const state = createMinangState();
  state.x = MINANG_PICKUPS[0].x;
  assert.equal(
    stepMinang(state, input()).filter((event) => event.type === "item").length,
    1,
  );
  assert.equal(
    stepMinang(state, input()).filter((event) => event.type === "item").length,
    0,
  );
});
test("falling returns to the last checkpoint with inventory intact", () => {
  const state = createMinangState();
  state.items = ["water"];
  state.checkpoints = ["pos-1"];
  state.x = 2450;
  state.y = MINANG_HEIGHT + 100;
  const events = stepMinang(state, input());
  assert.equal(state.x, MINANG_CHECKPOINTS[0].x);
  assert.equal(state.y, MINANG_GROUND_Y - 48);
  assert.equal(state.falls, 1);
  assert.deepEqual(state.items, ["water"]);
  assert.equal(
    events.some((event) => event.type === "fall"),
    true,
  );
});
test("only unlocked checkpoints can be revisited and progress is preserved", () => {
  const state = createMinangState();
  state.checkpoints = ["pos-1"];
  state.items = ["water"];
  assert.equal(returnToMinangCheckpoint(state, "pos-3"), false);
  assert.equal(returnToMinangCheckpoint(state, "pos-1"), true);
  assert.equal(state.x, MINANG_CHECKPOINTS[0].x);
  assert.equal(returnToMinangCheckpoint(state, "start"), true);
  assert.equal(state.x, 80);
  assert.deepEqual(state.items, ["water"]);
});
test("holding jump launches once rather than automatically jumping on landing", () => {
  const state = createMinangState();
  let jumps = 0;
  for (let frame = 0; frame < 180; frame++)
    jumps += stepMinang(state, input({ jump: true })).filter(
      (event) => event.type === "jump",
    ).length;
  assert.equal(jumps, 1);
  assert.equal(state.onGround, true);
  stepMinang(state, input());
  assert.equal(
    stepMinang(state, input({ jump: true })).some(
      (event) => event.type === "jump",
    ),
    true,
  );
});
test("a short tap released between frames is queued and still jumps", () => {
  const state = createMinangState();
  const controls = input({ jump: false, jumpQueued: true });
  assert.ok(stepMinang(state, controls).some((event) => event.type === "jump"));
  assert.equal(controls.jumpQueued, false);
  assert.ok(state.vy < 0);
});
test("jump buffer accepts a press just before landing", () => {
  const state = createMinangState();
  state.y = MINANG_GROUND_Y - 51;
  state.vy = 100;
  state.onGround = false;
  state.coyote = 0;
  stepMinang(state, input({ jump: true }));
  stepMinang(state, input({ jump: true }));
  stepMinang(state, input({ jump: true }));
  assert.ok(state.vy < 0);
});
test("opposite directions cancel and releasing input stops promptly", () => {
  const state = createMinangState();
  for (let i = 0; i < 30; i++) stepMinang(state, input({ right: true }));
  for (let i = 0; i < 8; i++)
    stepMinang(state, input({ left: true, right: true }));
  assert.equal(state.vx, 0);
  const x = state.x;
  for (let i = 0; i < 30; i++) stepMinang(state, input());
  assert.equal(state.x, x);
});
test("paused input freezes position, elapsed time and inventory", () => {
  const state = createMinangState();
  const before = JSON.stringify(state);
  for (let i = 0; i < 300; i++)
    stepMinang(state, input({ enabled: false, right: true, jump: true }));
  assert.equal(JSON.stringify(state), before);
});
test("missing supplies prevent completion and the route can be revisited", () => {
  const state = createMinangState();
  state.x = MINANG_GOAL_X + 5;
  state.checkpoints = ["pos-1", "pos-2", "pos-3"];
  const events = stepMinang(state, input());
  assert.equal(state.won, false);
  assert.equal(
    events.some((event) => event.type === "missing"),
    true,
  );
  assert.equal(getMinangSnapshot(state).completed, false);
  returnToMinangCheckpoint(state, "start");
  walkRoute(state);
  assert.equal(state.won, true);
});
test("snapshot arrays do not change after subsequent game updates", () => {
  const state = createMinangState();
  const snapshot = getMinangSnapshot(state);
  state.items.push("water");
  state.collectedPickups.push(MINANG_PICKUPS[0].id);
  state.checkpoints.push("pos-1");
  assert.deepEqual(snapshot.items, []);
  assert.deepEqual(snapshot.collectedPickups, []);
  assert.deepEqual(snapshot.checkpoints, []);
});
