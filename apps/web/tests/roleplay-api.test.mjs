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
vm.runInNewContext(compile("../src/lib/games/roleplay.ts"), {
  exports: domain,
});
const requestOrigin = {};
vm.runInNewContext(compile("../src/lib/requestOrigin.ts"), {
  exports: requestOrigin,
  URL,
});

function harness() {
  let session = { userId: "user-a", childId: "child-a" };
  const attempts = new Map();
  const rewards = new Map();
  const queries = [];
  const client = {
    async query(sql, args = []) {
      queries.push(sql);
      if (/INSERT INTO "GameAttempt"/.test(sql)) {
        if (!attempts.has(args[0]))
          attempts.set(args[0], {
            id: args[0],
            userId: args[1],
            childId: args[2],
            gameId: args[3],
            metadata: JSON.parse(args[4]),
            finishedAt: null,
          });
        return { rows: [] };
      }
      if (/SELECT "metadata"/.test(sql)) {
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
      if (/UPDATE "GameAttempt"/.test(sql)) {
        const attempt = attempts.get(args[0]);
        attempt.metadata = JSON.parse(args[1]);
        attempt.finishedAt = new Date();
        return { rows: [] };
      }
      if (/INSERT INTO "GameDailyReward"/.test(sql)) {
        assert.match(
          sql,
          /ON CONFLICT \("userId", "gameId", "rewardDate"\) DO NOTHING/,
        );
        const key = `${args[1]}:${args[2]}`;
        if (rewards.has(key)) return { rows: [] };
        rewards.set(key, args[4]);
        return { rows: [{ xp: args[4] }] };
      }
      return { rows: [] };
    },
    release() {},
  };
  const exports = {};
  vm.runInNewContext(compile("../src/app/api/games/roleplay/route.ts"), {
    exports,
    console,
    require: (name) => {
      if (name === "node:crypto") return { randomUUID };
      if (name === "next/server")
        return {
          NextResponse: { json: (body, init) => Response.json(body, init) },
        };
      if (name === "@/lib/db")
        return { getPgPool: () => ({ connect: async () => client }) };
      if (name === "@/lib/auth")
        return {
          getSessionUser: async () => session,
          getUserTreeStats: async () => ({
            totalXp: 150 + [...rewards.values()].reduce((a, b) => a + b, 0),
          }),
        };
      if (name === "@/lib/games/roleplay") return domain;
      if (name === "@/lib/requestOrigin") return requestOrigin;
      throw new Error(`Unexpected import ${name}`);
    },
  });
  async function post(action, run, origin = "https://permata.example", host) {
    const request = {
      headers: new Headers({ origin, ...(host ? { host } : {}) }),
      nextUrl: new URL("https://permata.example/api/games/roleplay"),
      json: async () => ({ action, run, awardedXp: 999999 }),
    };
    const response = await exports.POST(request);
    return { status: response.status, body: await response.json() };
  }
  return {
    post,
    attempts,
    rewards,
    queries,
    setSession: (value) => {
      session = value;
    },
  };
}
function run(scenarioId = "teman-di-posko") {
  const answers = [];
  let replay = domain.replayRoleplay(scenarioId, answers);
  while (!replay.completed) {
    answers.push({
      nodeId: replay.node.id,
      optionId: replay.node.options[0].id,
    });
    replay = domain.replayRoleplay(scenarioId, answers);
  }
  return {
    id: randomUUID(),
    scenarioId,
    version: domain.ROLEPLAY_VERSION,
    culture: "aceh",
    ownerId: "user-a",
    answers,
    activeMs: 30000,
    updatedAt: Date.now(),
  };
}

test("request authority allows a local alias while foreign origins and schemes remain blocked", async () => {
  const app = harness();
  const story = run();
  assert.equal(
    (await app.post("start", story, "https://127.0.0.1:3000", "127.0.0.1:3000"))
      .status,
    200,
  );
  assert.equal(
    (
      await app.post(
        "finish",
        story,
        "https://external.example",
        "127.0.0.1:3000",
      )
    ).status,
    403,
  );
  assert.equal(
    (await app.post("finish", story, "http://127.0.0.1:3000", "127.0.0.1:3000"))
      .status,
    403,
  );
});

test("save endpoint requires authentication, same origin and a graph-validated completion", async () => {
  const app = harness();
  const complete = run();
  assert.equal(
    (await app.post("start", complete, "https://external.example")).status,
    403,
  );
  app.setSession(null);
  assert.equal((await app.post("finish", complete)).status, 401);
  app.setSession({ userId: "user-a", childId: "child-a" });
  for (const invalid of [
    { ...complete, ownerId: "user-b" },
    { ...complete, version: 2 },
    { ...complete, answers: [] },
    { ...complete, answers: complete.answers.slice(1) },
  ])
    assert.equal((await app.post("finish", invalid)).status, 400);
  assert.equal(app.attempts.size, 0);
});

test("retries retain the pinned scenario and cannot overwrite another account or award XP twice", async () => {
  const app = harness();
  const first = run();
  assert.equal((await app.post("start", first)).status, 200);
  assert.equal((await app.post("start", first)).status, 200);
  assert.equal(app.attempts.size, 1);
  assert.equal(
    (await app.post("finish", { ...run("rindu-rumah"), id: first.id })).status,
    409,
  );
  app.setSession({ userId: "user-b", childId: "child-b" });
  assert.equal(
    (await app.post("start", { ...first, ownerId: "user-b" })).status,
    409,
  );
  app.setSession({ userId: "user-a", childId: "child-a" });
  const finished = await app.post("finish", first);
  assert.equal(finished.body.awardedXp, 20);
  assert.equal(finished.body.treeStats.totalXp, 170);
  const retry = await app.post("finish", first);
  assert.equal(retry.body.alreadySaved, true);
  assert.equal(retry.body.awardedXp, 0);
  const second = run("rindu-rumah");
  await app.post("start", second);
  assert.equal((await app.post("finish", second)).body.awardedXp, 0);
  assert.equal(app.rewards.size, 1);
  assert.ok(app.queries.some((sql) => sql.includes("FOR UPDATE")));
  assert.deepEqual(Object.keys(app.attempts.get(first.id).metadata).sort(), [
    "answers",
    "culture",
    "scenarioId",
    "skills",
    "version",
  ]);
});
