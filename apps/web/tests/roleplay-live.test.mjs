// Integration checks use disposable accounts on a running LOCAL app/database only.
import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import dotenv from "dotenv";
import pg from "pg";
import ts from "typescript";

const base = process.env.PERMATA_TEST_BASE_URL || "http://localhost:3000";
assert.ok(["localhost", "127.0.0.1"].includes(new URL(base).hostname));
const env = dotenv.parse(
  readFileSync(new URL("../.env.local", import.meta.url)),
);
const database = process.env.PERMATA_TEST_DATABASE_URL || env.DATABASE_URL;
const localDb =
  database && ["localhost", "127.0.0.1"].includes(new URL(database).hostname);
const { outputText } = ts.transpileModule(
  readFileSync(
    new URL("../src/lib/games/roleplay.ts", import.meta.url),
    "utf8",
  ),
  {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
    },
  },
);
const domain = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
);

test(
  "Roleplay SQL integration: concurrent finishes, pinned content, ownership and daily XP",
  { skip: !localDb && "Requires a local migrated PostgreSQL database" },
  async (t) => {
    const pool = new pg.Pool({ connectionString: database });
    const users = [];
    t.after(async () => {
      try {
        for (const user of users) {
          await pool.query('DELETE FROM "AuditLog" WHERE "userId" = $1', [
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
        body: await response.json(),
        cookie: response.headers.get("set-cookie")?.split(";")[0],
      };
    }
    for (let index = 0; index < 2; index++) {
      const response = await post("/api/auth/register", {
        email: `roleplay-${randomUUID()}@example.test`,
        password: randomUUID(),
        fullName: "Uji Roleplay",
        childDisplayName: "Uji Lokal",
      });
      assert.equal(response.status, 201);
      users.push({ ...response.body.user, cookie: response.cookie });
    }
    function run(user, scenarioId = "teman-di-posko") {
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
        culture: "aceh",
        version: 1,
        ownerId: user.userId,
        activeMs: 30000,
        updatedAt: Date.now(),
        answers,
      };
    }
    const endpoint = (action, run, user, headers) =>
      post(
        "/api/games/roleplay",
        { action, run, awardedXp: 99999 },
        user?.cookie,
        headers,
      );
    const first = run(users[0]);
    assert.equal((await endpoint("start", first)).status, 401);
    assert.equal(
      (
        await endpoint("start", first, users[0], {
          Origin: "https://external.example",
        })
      ).status,
      403,
    );
    assert.equal((await endpoint("start", first, users[0])).status, 200);
    assert.equal((await endpoint("start", first, users[0])).status, 200);
    assert.equal(
      (
        await endpoint(
          "start",
          { ...first, ownerId: users[1].userId },
          users[1],
        )
      ).status,
      409,
    );
    assert.equal(
      (
        await endpoint(
          "finish",
          { ...first, answers: first.answers.slice(1) },
          users[0],
        )
      ).status,
      400,
    );
    assert.equal(
      (
        await endpoint(
          "finish",
          { ...run(users[0], "rindu-rumah"), id: first.id },
          users[0],
        )
      ).status,
      409,
    );
    const finishes = await Promise.all([
      endpoint("finish", first, users[0]),
      endpoint("finish", first, users[0]),
    ]);
    assert.ok(finishes.every((response) => response.status === 200));
    assert.equal(
      finishes.reduce((sum, response) => sum + response.body.awardedXp, 0),
      20,
    );
    const second = run(users[0], "rindu-rumah");
    await endpoint("start", second, users[0]);
    assert.equal(
      (await endpoint("finish", second, users[0])).body.awardedXp,
      0,
    );
    const reward = await pool.query(
      'SELECT COUNT(*)::int AS count, SUM("xp")::int AS xp FROM "GameDailyReward" WHERE "userId"=$1 AND "gameId"=$2',
      [users[0].userId, domain.ROLEPLAY_GAME_ID],
    );
    assert.deepEqual(reward.rows[0], { count: 1, xp: 20 });
    assert.ok(
      finishes.some((response) => response.body.treeStats.gameXp === 20),
    );
  },
);
