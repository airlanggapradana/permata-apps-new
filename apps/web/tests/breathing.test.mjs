import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import dotenv from "dotenv";
import pg from "pg";

const base = process.env.PERMATA_TEST_BASE_URL || "http://localhost:3000";
const env = dotenv.parse(readFileSync(new URL("../.env.local", import.meta.url)));
const databaseUrl = process.env.PERMATA_TEST_DATABASE_URL || env.DATABASE_URL;
assert.ok(["localhost", "127.0.0.1"].includes(new URL(base).hostname));
assert.ok(["localhost", "127.0.0.1"].includes(new URL(databaseUrl).hostname));
const pool = new pg.Pool({ connectionString: databaseUrl });
const fixtures = [];
async function request(path, body, cookie, headers = {}) {
  const response = await fetch(`${base}${path}`, {
    method: "POST", headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}), ...headers },
    body: JSON.stringify(body),
  });
  return { status: response.status, data: await response.json(), cookie: response.headers.get("set-cookie")?.split(";")[0] };
}
const game = (body, cookie, headers) => request("/api/games/breathing", body, cookie, headers);
const manual = (cookie) => request("/api/journal/breathe", undefined, cookie);
async function start(cookie, mode = "gentle:5") {
  const result = await game({ action: "start", mode }, cookie);
  assert.equal(result.status, 201);
  return result.data.attemptId;
}
const finish = (cookie, attemptId, activeMs = 30000) => game({ action: "finish", attemptId, activeMs, awardedXp: 999999 }, cookie);
const age = (id) => pool.query(`UPDATE "GameAttempt" SET "startedAt" = LOCALTIMESTAMP - INTERVAL '70 seconds' WHERE "id" = $1`, [id]);

test("Napas Tenang: sessions and shared daily reward", async (t) => {
  t.after(async () => {
    try {
      for (const user of fixtures) {
        await pool.query('DELETE FROM "AuditLog" WHERE "userId" = $1', [user.userId]);
        await pool.query('DELETE FROM "ChildProfile" WHERE "id" = $1 AND "createdByUserId" = $2', [user.childId, user.userId]);
        await pool.query('DELETE FROM "User" WHERE "id" = $1', [user.userId]);
      }
    } finally { await pool.end(); }
  });
  for (let i = 0; i < 2; i++) {
    const result = await request("/api/auth/register", { email: `breath-qa-${randomUUID()}@example.test`, password: randomUUID(), fullName: "Uji Napas", childDisplayName: "Uji Lokal" });
    assert.equal(result.status, 201);
    fixtures.push({ ...result.data.user, cookie: result.cookie });
  }
  const [first, second] = fixtures;
  await t.test("requires login, rejects cross-origin writes and invalid plans", async () => {
    assert.equal((await game({ action: "start", mode: "gentle:5" })).status, 401);
    assert.equal((await game({ action: "start", mode: "gentle:5" }, first.cookie, { Origin: "https://untrusted.example" })).status, 403);
    assert.equal((await request("/api/journal/breathe", undefined, first.cookie, { Origin: "https://untrusted.example" })).status, 403);
    for (const mode of ["invalid", "gentle:0", "gentle:50", "steady:5:extra", "gentle:05"]) assert.equal((await game({ action: "start", mode }, first.cookie)).status, 400);
  });
  await t.test("enforces ownership and rejects impossible active durations", async () => {
    const id = await start(first.cookie);
    assert.equal((await finish(second.cookie, id)).status, 404);
    assert.equal((await finish(first.cookie, id)).status, 400);
    for (const duration of [-1, 0.5, 64001, "30000"]) assert.equal((await finish(first.cookie, id, duration)).status, 400);
  });
  await t.test("saves early endings without XP and cannot overwrite them", async () => {
    const id = await start(first.cookie);
    const result = await finish(first.cookie, id, 0);
    assert.equal(result.status, 200);
    assert.equal(result.data.completed, false);
    assert.equal(result.data.awardedXp, 0);
    const saved = (await pool.query('SELECT "status", "durationSeconds", "mode" FROM "GameAttempt" WHERE "id" = $1', [id])).rows[0];
    assert.deepEqual(saved, { status: "INCOMPLETE", durationSeconds: 0, mode: "gentle:5" });
    const retry = await finish(first.cookie, id);
    assert.equal(retry.data.alreadySaved, true);
    assert.equal(retry.data.completed, false);
  });
  let completedId;
  await t.test("concurrent game completions and dashboard share exactly 15 XP", async () => {
    const ids = await Promise.all([start(first.cookie), start(first.cookie)]);
    completedId = ids[0];
    await Promise.all(ids.map(age));
    const results = await Promise.all([...ids.map((id) => finish(first.cookie, id)), manual(first.cookie)]);
    results.forEach((result) => assert.equal(result.status, 200));
    assert.equal(results.reduce((sum, result) => sum + result.data.awardedXp, 0), 15);
    const logs = (await pool.query(`SELECT COUNT(*)::int AS count FROM "AuditLog" WHERE "actorId" = $1 AND "action" = 'BREATHING_EXERCISE'`, [first.userId])).rows[0];
    assert.equal(logs.count, 1);
  });
  await t.test("retry and repeat keep XP unchanged and dashboard reflects completion", async () => {
    const retry = await finish(first.cookie, completedId, 0);
    assert.equal(retry.data.alreadySaved, true);
    assert.equal(retry.data.completed, true);
    assert.equal(retry.data.awardedXp, 0);
    assert.equal(retry.data.treeStats.totalXp, 165);
    assert.equal((await manual(first.cookie)).data.awardedXp, 0);
    const response = await fetch(`${base}/api/dashboard`, { headers: { Cookie: first.cookie } });
    const dashboard = await response.json();
    assert.equal(dashboard.dailyStatus.breathedToday, true);
    assert.equal(dashboard.treeStats.breatheCount, 1);
  });
  await t.test("all planned rhythms and durations are stored with the session", async () => {
    for (const [mode, activeMs] of [["gentle:8", 48000], ["steady:5", 40000], ["steady:8", 64000]]) {
      const id = await start(second.cookie, mode);
      await age(id);
      const result = await finish(second.cookie, id, activeMs);
      assert.equal(result.status, 200);
      assert.equal(result.data.completed, true);
      const saved = (await pool.query('SELECT "durationSeconds" FROM "GameAttempt" WHERE "id" = $1', [id])).rows[0];
      assert.equal(saved.durationSeconds, activeMs / 1000);
    }
    assert.equal((await manual(second.cookie)).data.awardedXp, 0);
  });
  await t.test("a new Makassar reward day allows another award", async () => {
    await pool.query(`UPDATE "AuditLog" SET "createdAt" = (DATE_TRUNC('day', NOW() AT TIME ZONE 'Asia/Makassar') AT TIME ZONE 'Asia/Makassar') - INTERVAL '1 hour' WHERE "actorId" = $1 AND "action" = 'BREATHING_EXERCISE'`, [first.userId]);
    const result = await manual(first.cookie);
    assert.equal(result.data.awardedXp, 15);
    assert.equal(result.data.treeStats.totalXp, 180);
  });
});
