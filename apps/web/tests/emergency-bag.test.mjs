import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import dotenv from "dotenv";
import pg from "pg";

// Integration tests require a running local app and its migrated PostgreSQL DB.
const base = process.env.PERMATA_TEST_BASE_URL || "http://localhost:3000";
assert.ok(["localhost", "127.0.0.1"].includes(new URL(base).hostname), "Run against a local app only.");
const env = dotenv.parse(readFileSync(new URL("../.env.local", import.meta.url)));
const databaseUrl = process.env.PERMATA_TEST_DATABASE_URL || env.DATABASE_URL;
assert.ok(["localhost", "127.0.0.1"].includes(new URL(databaseUrl).hostname), "Use a local test database only.");
const pool = new pg.Pool({ connectionString: databaseUrl });
const essentials = ["water", "flashlight", "food", "first-aid", "raincoat", "mask"];
const fixtures = [];

async function request(path, body, cookie, headers = {}) {
  const response = await fetch(`${base}${path}`, {
    method: "POST", headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}), ...headers },
    body: JSON.stringify(body),
  });
  return { status: response.status, data: await response.json(), cookie: response.headers.get("set-cookie")?.split(";")[0] };
}
const game = (body, cookie, headers) => request("/api/games/emergency-bag", body, cookie, headers);
const start = async (cookie, mode = "practice") => {
  const response = await game({ action: "start", mode }, cookie);
  assert.equal(response.status, 201);
  return response.data.attemptId;
};
const finish = (cookie, attemptId, collectedItems = essentials) => game({ action: "finish", attemptId, collectedItems, wrongSelections: 1, awardedXp: 999999 }, cookie);

test("Tas Siaga: persistence, ownership, server scoring, and daily rewards", async (t) => {
  t.after(async () => {
    try {
      for (const user of fixtures) {
        await pool.query('DELETE FROM "AuditLog" WHERE "userId" = $1', [user.userId]);
        await pool.query('DELETE FROM "ChildProfile" WHERE "id" = $1 AND "createdByUserId" = $2', [user.childId, user.userId]);
        await pool.query('DELETE FROM "User" WHERE "id" = $1', [user.userId]);
      }
    } finally { await pool.end(); }
  });
  for (let index = 0; index < 2; index++) {
    const result = await request("/api/auth/register", { email: `bag-qa-${randomUUID()}@example.test`, password: randomUUID(), fullName: "Uji Tas Siaga", childDisplayName: "Uji Lokal" });
    assert.equal(result.status, 201);
    fixtures.push({ ...result.data.user, cookie: result.cookie });
  }
  const [first, second] = fixtures;

  await t.test("requires authentication and rejects cross-origin writes", async () => {
    assert.equal((await game({ action: "start", mode: "practice" })).status, 401);
    assert.equal((await game({ action: "start", mode: "practice" }, first.cookie, { Origin: "https://untrusted.example" })).status, 403);
  });
  await t.test("validates modes and collected items", async () => {
    assert.equal((await game({ action: "start", mode: "invented" }, first.cookie)).status, 400);
    const id = await start(first.cookie);
    assert.equal((await finish(first.cookie, id, ["unknown-item"])).status, 400);
    assert.equal((await finish(first.cookie, id, ["water", "water"])).status, 400);
  });
  await t.test("does not allow another user's attempt to be finished", async () => {
    const id = await start(first.cookie);
    assert.equal((await finish(second.cookie, id)).status, 404);
  });
  await t.test("persists incomplete sessions without XP", async () => {
    const id = await start(first.cookie);
    const result = await finish(first.cookie, id, ["water"]);
    assert.equal(result.status, 200);
    assert.equal(result.data.completed, false);
    assert.equal(result.data.awardedXp, 0);
    const saved = (await pool.query('SELECT * FROM "GameAttempt" WHERE "id" = $1', [id])).rows[0];
    assert.equal(saved.status, "INCOMPLETE");
    assert.deepEqual(saved.collectedItems, ["water"]);
    assert.equal(saved.wrongSelections, 1);
  });
  let completedAttempt;
  await t.test("awards exactly 20 XP across concurrent completions", async () => {
    const ids = await Promise.all([start(first.cookie), start(first.cookie)]);
    completedAttempt = ids[0];
    const responses = await Promise.all(ids.map((id) => finish(first.cookie, id)));
    responses.forEach((response) => { assert.equal(response.status, 200); assert.equal(response.data.completed, true); });
    assert.equal(responses.reduce((sum, response) => sum + response.data.awardedXp, 0), 20);
    const rewards = (await pool.query('SELECT COUNT(*)::int AS count, SUM("xp")::int AS xp FROM "GameDailyReward" WHERE "userId" = $1', [first.userId])).rows[0];
    assert.deepEqual(rewards, { count: 1, xp: 20 });
  });
  await t.test("retries and replayed results cannot award or overwrite results", async () => {
    const result = await finish(first.cookie, completedAttempt, []);
    assert.equal(result.data.alreadySaved, true);
    assert.equal(result.data.completed, true);
    assert.equal(result.data.awardedXp, 0);
    assert.equal(result.data.treeStats.gameXp, 20);
    assert.equal(result.data.treeStats.totalXp, 170);
  });
  await t.test("challenge timing is derived by the server", async () => {
    const id = await start(second.cookie, "challenge");
    await pool.query(`UPDATE "GameAttempt" SET "startedAt" = NOW() - INTERVAL '2 minutes' WHERE "id" = $1 AND "userId" = $2`, [id, second.userId]);
    const result = await finish(second.cookie, id);
    assert.equal(result.data.completed, false);
    assert.equal(result.data.awardedXp, 0);
    assert.equal(result.data.treeStats.gameXp, 0);
  });
  await t.test("a new reward day permits another 20 XP and dashboard reflects it", async () => {
    await pool.query(`UPDATE "GameDailyReward" SET "rewardDate" = (NOW() AT TIME ZONE 'Asia/Makassar')::date - 1 WHERE "userId" = $1`, [first.userId]);
    const id = await start(first.cookie);
    const result = await finish(first.cookie, id);
    assert.equal(result.data.awardedXp, 20);
    const dashboard = await fetch(`${base}/api/dashboard`, { headers: { Cookie: first.cookie } });
    const data = await dashboard.json();
    assert.equal(dashboard.status, 200);
    assert.equal(data.treeStats.gameXp, 40);
    assert.equal(data.treeStats.totalXp, 190);
  });
});
