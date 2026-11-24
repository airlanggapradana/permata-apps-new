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
const domain = {};
vm.runInNewContext(compile("../src/lib/games/siagaMinang.ts"), {
  exports: domain,
});

function harness() {
  const attempts = new Map(),
    rewards = new Set();
  const pool = {
    connect: async () => pool,
    release() {},
    async query(sql, args = []) {
      if (sql.includes('INSERT INTO "GameAttempt"')) {
        attempts.set(args[0], {
          id: args[0],
          userId: args[1],
          childId: args[2],
          gameId: args[3],
          metadata: JSON.parse(args[4]),
          wallMs: 60000,
          finishedAt: null,
        });
      }
      if (sql.includes("SELECT *, EXTRACT")) {
        const attempt = attempts.get(args[0]);
        return {
          rows:
            attempt &&
            attempt.userId === args[1] &&
            attempt.childId === args[2] &&
            attempt.gameId === args[3]
              ? [attempt]
              : [],
        };
      }
      if (sql.includes('UPDATE "GameAttempt"')) {
        Object.assign(attempts.get(args[0]), {
          status: args[1],
          items: JSON.parse(args[2]),
          metadata: JSON.parse(args[3]),
          finishedAt: new Date(),
        });
      }
      if (sql.includes('INSERT INTO "GameDailyReward"')) {
        const key = args[1] + ":" + args[2];
        if (rewards.has(key)) return { rows: [] };
        rewards.add(key);
        return { rows: [{ xp: args[4] }] };
      }
      return { rows: [] };
    },
  };
  const route = {};
  vm.runInNewContext(compile("../src/app/api/games/siaga-minang/route.ts"), {
    exports: route,
    console,
    require: (name) => {
      if (name === "node:crypto") return { randomUUID };
      if (name === "next/server")
        return {
          NextResponse: {
            json: (body, init) =>
              new Response(JSON.stringify(body), {
                ...init,
                headers: { "content-type": "application/json" },
              }),
          },
        };
      if (name.endsWith("requestOrigin"))
        return { isSameOriginRequest: () => true };
      if (name.endsWith("/db")) return { getPgPool: () => pool };
      if (name.endsWith("/auth"))
        return {
          getSessionUser: async () => ({
            userId: "user-a",
            childId: "child-a",
          }),
          getUserTreeStats: async () => ({}),
        };
      if (name.endsWith("siagaMinang")) return domain;
      throw new Error(name);
    },
  });
  return {
    attempts,
    async post(body) {
      const response = await route.POST({ json: async () => body });
      return { status: response.status, data: await response.json() };
    },
  };
}
const v2 = {
  items: Array.from(domain.MINANG_ITEMS, (item) => item.id),
  collectedPickups: Array.from(domain.MINANG_PICKUPS, (item) => item.id),
  checkpoints: ["pos-1", "pos-2", "pos-3"],
  answers: Array.from(domain.MINANG_LESSONS, (lesson) => ({
    questionId: lesson.id,
    optionId: lesson.correct,
  })),
  bridgeActivated: true,
  reachedGoal: true,
  falls: 3,
  activeMs: 20000,
  version: 2,
};
async function start(h, version = 2) {
  const result = await h.post({
    action: "start",
    mode: "practice",
    ...(version ? { version } : {}),
  });
  assert.equal(result.status, 201);
  return result.data.attemptId;
}

test("new sessions pin the learning version and persist ten items plus all lessons", async () => {
  const h = harness(),
    id = await start(h);
  assert.equal(h.attempts.get(id).metadata.version, 2);
  const result = await h.post({ action: "finish", attemptId: id, ...v2 });
  assert.equal(result.status, 200);
  assert.equal(result.data.completed, true);
  assert.equal(result.data.awardedXp, 20);
  assert.equal(h.attempts.get(id).items.length, 10);
  assert.deepEqual(h.attempts.get(id).metadata.answers, v2.answers);
  assert.equal(h.attempts.get(id).metadata.bridgeActivated, true);
});

test("dropping or forging the client version cannot skip the pinned learning rules", async () => {
  for (const version of [undefined, 1]) {
    const h = harness(),
      id = await start(h);
    const result = await h.post({
      action: "finish",
      attemptId: id,
      ...v2,
      version,
      answers: undefined,
    });
    assert.equal(result.status, 400);
    assert.equal(h.attempts.get(id).finishedAt, null);
  }
});

test("incomplete learning, a wrong response or a closed bridge never award completion XP", async () => {
  for (const fields of [
    { answers: [] },
    { bridgeActivated: false },
    { items: v2.items.slice(0, 4) },
    {
      answers: [
        { questionId: "pos-1", optionId: "mainan" },
        ...v2.answers.slice(1),
      ],
    },
  ]) {
    const h = harness(),
      id = await start(h);
    const result = await h.post({
      action: "finish",
      attemptId: id,
      ...v2,
      ...fields,
    });
    assert.equal(result.status, 200);
    assert.equal(result.data.completed, false);
    assert.equal(result.data.awardedXp, 0);
  }
});

test("foreign or reordered lessons are rejected and unknown versions cannot start", async () => {
  const h = harness(),
    id = await start(h);
  for (const answers of [
    [v2.answers[1]],
    [{ questionId: "pos-1", optionId: "invented" }],
    [null],
  ]) {
    assert.equal(
      (await h.post({ action: "finish", attemptId: id, ...v2, answers }))
        .status,
      400,
    );
  }
  assert.equal(
    (await h.post({ action: "start", mode: "practice", version: 99 })).status,
    400,
  );
});

test("legacy four-type sessions remain compatible without changing the daily reward cap", async () => {
  const h = harness(),
    legacy = await start(h, null);
  const result = await h.post({
    action: "finish",
    attemptId: legacy,
    ...v2,
    items: v2.items.slice(0, 4),
    answers: undefined,
    bridgeActivated: undefined,
  });
  assert.equal(result.status, 200);
  assert.equal(result.data.completed, true);
  assert.equal(result.data.awardedXp, 20);
  assert.equal(h.attempts.get(legacy).metadata.version, "classic");
  const id = await start(h);
  const next = await h.post({ action: "finish", attemptId: id, ...v2 });
  assert.equal(next.data.completed, true);
  assert.equal(next.data.awardedXp, 0);
  const retry = await h.post({ action: "finish", attemptId: id, ...v2 });
  assert.equal(retry.data.alreadySaved, true);
  assert.equal(retry.data.awardedXp, 0);
});
