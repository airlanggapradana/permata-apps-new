import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import dotenv from "dotenv";
import pg from "pg";
const base = process.env.PERMATA_TEST_BASE_URL || "http://localhost:3000";
const env = dotenv.parse(
  readFileSync(new URL("../.env.local", import.meta.url)),
);
const databaseUrl = process.env.PERMATA_TEST_DATABASE_URL || env.DATABASE_URL;
assert.ok(["localhost", "127.0.0.1"].includes(new URL(base).hostname));
assert.ok(["localhost", "127.0.0.1"].includes(new URL(databaseUrl).hostname));
const pool = new pg.Pool({ connectionString: databaseUrl });
const fixtures = [];
async function request(path, body, cookie, headers = {}) {
  const response = await fetch(`${base}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
      ...headers,
    },
    body: JSON.stringify(body),
  });
  return {
    status: response.status,
    data: await response.json(),
    cookie: response.headers.get("set-cookie")?.split(";")[0],
  };
}
const game = (body, cookie, headers) =>
  request("/api/games/siaga-minang", body, cookie, headers);
async function start(cookie) {
  const result = await game({ action: "start", mode: "practice" }, cookie);
  assert.equal(result.status, 201);
  return result.data.attemptId;
}
const valid = {
  items: ["water", "food", "first-aid", "flashlight"],
  collectedPickups: [
    "water-1",
    "food-1",
    "first-aid-1",
    "flashlight-1",
    "water-2",
    "food-2",
    "first-aid-2",
    "flashlight-2",
    "water-3",
    "food-3",
  ],
  checkpoints: ["pos-1", "pos-2", "pos-3"],
  reachedGoal: true,
  falls: 2,
  activeMs: 20000,
  completed: true,
  awardedXp: 99999,
};
const finish = (cookie, attemptId, fields = {}) =>
  game({ action: "finish", attemptId, ...valid, ...fields }, cookie);
const age = (id) =>
  pool.query(
    `UPDATE "GameAttempt" SET "startedAt" = LOCALTIMESTAMP - INTERVAL '1 minute' WHERE "id" = $1`,
    [id],
  );
test("Siaga Minang: persistence, ownership and daily game XP", async (t) => {
  t.after(async () => {
    try {
      for (const user of fixtures) {
        await pool.query('DELETE FROM "AuditLog" WHERE "userId"=$1', [
          user.userId,
        ]);
        await pool.query(
          'DELETE FROM "ChildProfile" WHERE "id"=$1 AND "createdByUserId"=$2',
          [user.childId, user.userId],
        );
        await pool.query('DELETE FROM "User" WHERE "id"=$1', [user.userId]);
      }
    } finally {
      await pool.end();
    }
  });
  for (let i = 0; i < 2; i++) {
    const result = await request("/api/auth/register", {
      email: `minang-qa-${randomUUID()}@example.test`,
      password: randomUUID(),
      fullName: "Uji Siaga Minang",
      childDisplayName: "Uji Lokal",
    });
    assert.equal(result.status, 201);
    fixtures.push({ ...result.data.user, cookie: result.cookie });
  }
  const [first, second] = fixtures;
  await t.test(
    "authentication, origin and session mode are checked",
    async () => {
      assert.equal(
        (await game({ action: "start", mode: "practice" })).status,
        401,
      );
      assert.equal(
        (
          await game({ action: "start", mode: "practice" }, first.cookie, {
            Origin: "https://untrusted.example",
          })
        ).status,
        403,
      );
      assert.equal(
        (await game({ action: "start", mode: "unknown" }, first.cookie)).status,
        400,
      );
    },
  );
  await t.test(
    "invalid inventory, checkpoint order and durations are rejected",
    async () => {
      const id = await start(first.cookie);
      for (const fields of [
        { items: ["water", "water"] },
        { items: ["invalid"] },
        { collectedPickups: ["water-1", "water-1"] },
        { collectedPickups: ["invalid"] },
        { checkpoints: ["pos-2"] },
        { checkpoints: ["pos-1", "pos-1"] },
        { falls: -1 },
        { activeMs: 0.5 },
        { reachedGoal: "true" },
      ])
        assert.equal((await finish(first.cookie, id, fields)).status, 400);
      assert.equal(
        (await finish(first.cookie, id)).status,
        400,
        "Cannot claim more active time than the session age",
      );
      await age(id);
      assert.equal(
        (await finish(first.cookie, id, { activeMs: 100 })).status,
        400,
        "Completion cannot be instantaneous",
      );
    },
  );
  await t.test(
    "another user and another game cannot finish this session",
    async () => {
      const id = await start(first.cookie);
      await age(id);
      assert.equal((await finish(second.cookie, id)).status, 404);
      const other = await request(
        "/api/games/emergency-bag",
        { action: "start", mode: "practice" },
        first.cookie,
      );
      assert.equal(
        (await finish(first.cookie, other.data.attemptId)).status,
        404,
      );
    },
  );
  await t.test(
    "incomplete sessions persist inventory and checkpoint details without XP",
    async () => {
      const id = await start(first.cookie);
      const result = await finish(first.cookie, id, {
        items: ["water"],
        collectedPickups: ["water-1"],
        checkpoints: ["pos-1"],
        reachedGoal: false,
        activeMs: 0,
      });
      assert.equal(result.status, 200);
      assert.equal(result.data.completed, false);
      assert.equal(result.data.awardedXp, 0);
      const saved = (
        await pool.query(
          'SELECT "status", "collectedItems", "metadata" FROM "GameAttempt" WHERE "id"=$1',
          [id],
        )
      ).rows[0];
      assert.equal(saved.status, "INCOMPLETE");
      assert.deepEqual(saved.collectedItems, ["water"]);
      assert.deepEqual(saved.metadata, {
        checkpoints: ["pos-1"],
        reachedGoal: false,
        falls: 2,
        activeMs: 0,
        collectedPickups: ["water-1"],
        version: "classic",
      });
      const retry = await finish(first.cookie, id);
      assert.equal(retry.data.alreadySaved, true);
      assert.equal(retry.data.completed, false);
    },
  );
  let completedId;
  await t.test(
    "concurrent sessions award only 20 XP and retries cannot overwrite results",
    async () => {
      const ids = await Promise.all([start(first.cookie), start(first.cookie)]);
      completedId = ids[0];
      await Promise.all(ids.map(age));
      const results = await Promise.all([
        finish(first.cookie, ids[0]),
        finish(first.cookie, ids[0]),
        finish(first.cookie, ids[1]),
      ]);
      results.forEach((result) => {
        assert.equal(result.status, 200);
        assert.equal(result.data.completed, true);
      });
      assert.equal(
        results.reduce((sum, result) => sum + result.data.awardedXp, 0),
        20,
      );
      const retry = await finish(first.cookie, completedId, {
        items: [],
        checkpoints: [],
        reachedGoal: false,
        activeMs: 0,
      });
      assert.equal(retry.data.completed, true);
      assert.equal(retry.data.awardedXp, 0);
      assert.equal(retry.data.alreadySaved, true);
      assert.equal(retry.data.treeStats.gameXp, 20);
      assert.equal(retry.data.treeStats.totalXp, 170);
    },
  );
  await t.test(
    "missing supplies or checkpoints cannot be replaced by a client completion flag",
    async () => {
      for (const fields of [
        { items: ["water"] },
        { checkpoints: ["pos-1"] },
        { reachedGoal: false },
        { collectedPickups: valid.collectedPickups.slice(0, 9) },
      ]) {
        const id = await start(second.cookie);
        await age(id);
        const result = await finish(second.cookie, id, fields);
        assert.equal(result.data.completed, false);
        assert.equal(result.data.awardedXp, 0);
      }
    },
  );
  await t.test(
    "another reward day allows XP again and dashboard includes both rewards",
    async () => {
      await pool.query(
        `UPDATE "GameDailyReward" SET "rewardDate" = (NOW() AT TIME ZONE 'Asia/Makassar')::date - 1 WHERE "userId"=$1 AND "gameId"='siaga-minang'`,
        [first.userId],
      );
      const id = await start(first.cookie);
      await age(id);
      assert.equal((await finish(first.cookie, id)).data.awardedXp, 20);
      const response = await fetch(`${base}/api/dashboard`, {
        headers: { Cookie: first.cookie },
      });
      const data = await response.json();
      assert.equal(response.status, 200);
      assert.equal(data.treeStats.gameXp, 40);
      assert.equal(data.treeStats.totalXp, 190);
    },
  );
});
