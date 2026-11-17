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
const database = process.env.PERMATA_TEST_DATABASE_URL || env.DATABASE_URL;
assert.ok(["localhost", "127.0.0.1"].includes(new URL(base).hostname));
assert.ok(["localhost", "127.0.0.1"].includes(new URL(database).hostname));
const pool = new pg.Pool({ connectionString: database });
const users = [];
async function post(path, body, cookie, headers = {}) {
  const response = await fetch(base + path, {
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
  post("/api/games/sigap-bencana", body, cookie, headers);
const valid = {
  answers: [
    { questionId: "berlindung", optionId: "lindungi" },
    { questionId: "keluar", optionId: "tenang" },
    { questionId: "berkumpul", optionId: "terbuka" },
  ],
  rooms: ["berlindung", "keluar", "berkumpul"],
  reachedExit: true,
  mistakes: 2,
  activeMs: 20000,
  completed: true,
  awardedXp: 99999,
};
async function start(cookie) {
  const response = await game({ action: "start", mode: "practice" }, cookie);
  assert.equal(response.status, 201);
  return response.data.attemptId;
}
const finish = (cookie, attemptId, extra = {}) =>
  game({ action: "finish", attemptId, ...valid, ...extra }, cookie);
const age = (id) =>
  pool.query(
    `UPDATE "GameAttempt" SET "startedAt" = LOCALTIMESTAMP - INTERVAL '1 minute' WHERE "id"=$1`,
    [id],
  );
test("Sigap Bencana: persistence, verified answers and daily rewards", async (t) => {
  t.after(async () => {
    try {
      for (const user of users) {
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
    const response = await post("/api/auth/register", {
      email: `quake-qa-${randomUUID()}@example.test`,
      password: randomUUID(),
      fullName: "Uji Sigap",
      childDisplayName: "Uji Lokal",
    });
    assert.equal(response.status, 201);
    users.push({ ...response.data.user, cookie: response.cookie });
  }
  const [first, second] = users;
  await t.test(
    "requires authentication, same origin and practice mode",
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
        (await game({ action: "start", mode: "invalid" }, first.cookie)).status,
        400,
      );
    },
  );
  await t.test(
    "rejects invalid answers, order, durations and counters",
    async () => {
      const id = await start(first.cookie);
      for (const extra of [
        { answers: [null] },
        { answers: [{ questionId: "keluar", optionId: "tenang" }] },
        { answers: [{ questionId: "berlindung", optionId: "invalid" }] },
        { rooms: ["keluar"] },
        { rooms: [] },
        { activeMs: -1 },
        { activeMs: 0.2 },
        { mistakes: -1 },
        { reachedExit: "yes" },
      ])
        assert.equal(
          (await finish(first.cookie, id, extra)).status,
          400,
          JSON.stringify(extra),
        );
      await age(id);
      assert.equal(
        (await finish(first.cookie, id, { activeMs: 1000 })).status,
        400,
      );
    },
  );
  await t.test(
    "enforces ownership and the server session wall clock",
    async () => {
      const id = await start(first.cookie);
      assert.equal((await finish(second.cookie, id)).status, 404);
      await pool.query(
        'UPDATE "GameAttempt" SET "startedAt"=LOCALTIMESTAMP WHERE "id"=$1',
        [id],
      );
      assert.equal(
        (await finish(first.cookie, id, { activeMs: 60000 })).status,
        400,
      );
      await pool.query('UPDATE "GameAttempt" SET "gameId"=$2 WHERE "id"=$1', [
        id,
        "other-game",
      ]);
      assert.equal((await finish(first.cookie, id)).status, 404);
    },
  );
  await t.test(
    "saves early ending metadata without XP and prevents overwriting",
    async () => {
      const id = await start(first.cookie);
      await age(id);
      const partial = {
        answers: valid.answers.slice(0, 1),
        rooms: valid.rooms.slice(0, 1),
        reachedExit: false,
        activeMs: 3000,
        mistakes: 1,
      };
      const response = await finish(first.cookie, id, partial);
      assert.equal(response.status, 200);
      assert.equal(response.data.completed, false);
      assert.equal(response.data.awardedXp, 0);
      const stored = (
        await pool.query('SELECT * FROM "GameAttempt" WHERE "id"=$1', [id])
      ).rows[0];
      assert.equal(stored.status, "INCOMPLETE");
      assert.deepEqual(stored.metadata, { ...partial, version: 1 });
      const replay = await finish(first.cookie, id);
      assert.equal(replay.data.alreadySaved, true);
      assert.equal(replay.data.completed, false);
      assert.equal(replay.data.awardedXp, 0);
    },
  );
  await t.test(
    "client completion flags cannot replace correct answers, rooms or the exit",
    async () => {
      for (const extra of [
        {
          answers: [
            { questionId: "berlindung", optionId: "jendela" },
            ...valid.answers.slice(1),
          ],
        },
        { answers: valid.answers.slice(0, 2) },
        { answers: [], rooms: [] },
        { reachedExit: false },
      ]) {
        const id = await start(first.cookie);
        await age(id);
        const response = await finish(first.cookie, id, extra);
        assert.equal(response.status, 200);
        assert.equal(response.data.completed, false);
        assert.equal(response.data.awardedXp, 0);
      }
    },
  );
  await t.test(
    "concurrent completions and repeated requests award exactly 20 XP",
    async () => {
      const ids = await Promise.all([start(first.cookie), start(first.cookie)]);
      await Promise.all(ids.map(age));
      const results = await Promise.all([
        finish(first.cookie, ids[0]),
        finish(first.cookie, ids[0]),
        finish(first.cookie, ids[1]),
      ]);
      for (const response of results) {
        assert.equal(response.status, 200);
        assert.equal(response.data.completed, true);
      }
      assert.equal(
        results.reduce((sum, response) => sum + response.data.awardedXp, 0),
        20,
      );
      const stored = (
        await pool.query('SELECT * FROM "GameAttempt" WHERE "id"=$1', [ids[0]])
      ).rows[0];
      assert.deepEqual(stored.metadata.answers, valid.answers);
      assert.equal(stored.status, "COMPLETED");
      const replay = await finish(first.cookie, ids[0], {
        answers: [],
        rooms: [],
        reachedExit: false,
        activeMs: 0,
      });
      assert.equal(replay.data.completed, true);
      assert.equal(replay.data.alreadySaved, true);
      assert.equal(replay.data.awardedXp, 0);
    },
  );
  await t.test(
    "a new Makassar reward date permits XP and dashboard includes it",
    async () => {
      await pool.query(
        `UPDATE "GameDailyReward" SET "rewardDate"=((NOW() AT TIME ZONE 'Asia/Makassar')::date - 1) WHERE "userId"=$1 AND "gameId"='sigap-bencana'`,
        [first.userId],
      );
      const id = await start(first.cookie);
      await age(id);
      const response = await finish(first.cookie, id);
      assert.equal(response.data.awardedXp, 20);
      assert.equal(response.data.treeStats.gameXp, 40);
      const dashboard = await fetch(base + "/api/dashboard", {
        headers: { Cookie: first.cookie },
      });
      const data = await dashboard.json();
      assert.equal(data.treeStats.gameXp, 40);
    },
  );
});
