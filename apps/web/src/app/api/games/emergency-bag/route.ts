import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { isSameOriginRequest } from "@/lib/requestOrigin";
import { getPgPool } from "@/lib/db";
import { getSessionUser, getUserTreeStats } from "@/lib/auth";
import {
  BAG_GAME_ID,
  BAG_GAME_XP,
  BAG_CHALLENGE_SECONDS,
  BAG_ITEMS,
  isBagComplete,
} from "@/lib/games/emergencyBag";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // JSON requests from another origin cannot spend a user's signed-in session.
  if (!isSameOriginRequest(req)) {
    return NextResponse.json(
      { error: "Asal permintaan tidak sesuai." },
      { status: 403 },
    );
  }
  try {
    const session = await getSessionUser();
    if (!session)
      return NextResponse.json(
        { error: "Masuk untuk menyimpan hasil permainan." },
        { status: 401 },
      );
    const body = await req.json().catch(() => null);
    if (!body || !["start", "finish"].includes(body.action)) {
      return NextResponse.json(
        { error: "Permintaan permainan tidak valid." },
        { status: 400 },
      );
    }
    const pool = getPgPool();
    if (body.action === "start") {
      if (!["practice", "challenge"].includes(body.mode)) {
        return NextResponse.json(
          { error: "Pilih mode latihan atau tantangan." },
          { status: 400 },
        );
      }
      const id = randomUUID();
      const result = await pool.query(
        `INSERT INTO "GameAttempt" ("id", "userId", "childId", "gameId", "mode") VALUES ($1, $2, $3, $4, $5) RETURNING "startedAt"`,
        [id, session.userId, session.childId, BAG_GAME_ID, body.mode],
      );
      return NextResponse.json(
        { success: true, attemptId: id, startedAt: result.rows[0].startedAt },
        { status: 201 },
      );
    }
    if (
      typeof body.attemptId !== "string" ||
      !/^[\da-f-]{36}$/i.test(body.attemptId) ||
      !Array.isArray(body.collectedItems) ||
      body.collectedItems.length > BAG_ITEMS.length ||
      body.collectedItems.some(
        (id: unknown) =>
          typeof id !== "string" || !BAG_ITEMS.some((item) => item.id === id),
      ) ||
      new Set(body.collectedItems).size !== body.collectedItems.length ||
      !Number.isInteger(body.wrongSelections) ||
      body.wrongSelections < 0 ||
      body.wrongSelections > 10000
    ) {
      return NextResponse.json(
        { error: "Hasil permainan tidak valid." },
        { status: 400 },
      );
    }
    const client = await pool.connect();
    let awardedXp = 0;
    let alreadySaved = false;
    let completed = false;
    try {
      await client.query("BEGIN");
      const attempt = (
        await client.query(
          `SELECT * FROM "GameAttempt" WHERE "id" = $1 AND "userId" = $2 AND "childId" = $3 AND "gameId" = $4 FOR UPDATE`,
          [body.attemptId, session.userId, session.childId, BAG_GAME_ID],
        )
      ).rows[0];
      if (!attempt) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { error: "Sesi permainan tidak ditemukan." },
          { status: 404 },
        );
      }
      if (attempt.finishedAt) {
        alreadySaved = true;
        completed = attempt.status === "COMPLETED";
      } else {
        const duration = Math.max(
          0,
          Math.floor(
            (Date.now() - new Date(attempt.startedAt).getTime()) / 1000,
          ),
        );
        completed =
          isBagComplete(body.collectedItems) &&
          (attempt.mode === "practice" ||
            duration <= BAG_CHALLENGE_SECONDS + 2);
        await client.query(
          `UPDATE "GameAttempt" SET "status" = $2, "collectedItems" = $3::jsonb, "wrongSelections" = $4, "durationSeconds" = $5, "finishedAt" = NOW() WHERE "id" = $1`,
          [
            body.attemptId,
            completed ? "COMPLETED" : "INCOMPLETE",
            JSON.stringify(body.collectedItems),
            body.wrongSelections,
            duration,
          ],
        );
        if (completed) {
          // The unique daily key also prevents duplicate XP from concurrent sessions.
          const reward = await client.query(
            `INSERT INTO "GameDailyReward" ("id", "userId", "gameId", "rewardDate", "attemptId", "xp")
             VALUES ($1, $2, $3, (NOW() AT TIME ZONE 'Asia/Makassar')::date, $4, $5)
             ON CONFLICT ("userId", "gameId", "rewardDate") DO NOTHING RETURNING "xp"`,
            [
              randomUUID(),
              session.userId,
              BAG_GAME_ID,
              body.attemptId,
              BAG_GAME_XP,
            ],
          );
          awardedXp = reward.rows[0]?.xp ?? 0;
        }
      }
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
    return NextResponse.json({
      success: true,
      completed,
      alreadySaved,
      awardedXp,
      treeStats: await getUserTreeStats(session.userId, session.childId),
    });
  } catch (error) {
    console.error("Emergency bag save failed:", error);
    return NextResponse.json(
      { error: "Hasil belum tersimpan. Coba simpan lagi, ya." },
      { status: 500 },
    );
  }
}
