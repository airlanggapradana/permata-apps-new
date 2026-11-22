import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { isSameOriginRequest } from "@/lib/requestOrigin";
import { getPgPool } from "@/lib/db";
import { getSessionUser, getUserTreeStats } from "@/lib/auth";
import {
  isRoleplayRun,
  replayRoleplay,
  ROLEPLAY_GAME_ID,
  ROLEPLAY_VERSION,
  ROLEPLAY_XP,
  type RoleplayRun,
} from "@/lib/games/roleplay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
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
        { error: "Masuk untuk menyimpan latihanmu." },
        { status: 401 },
      );
    const body = await req.json().catch(() => null);
    if (
      !body ||
      !["start", "finish"].includes(body.action) ||
      !isRoleplayRun(body.run) ||
      body.run.ownerId !== session.userId
    ) {
      return NextResponse.json(
        { error: "Sesi cerita tidak valid." },
        { status: 400 },
      );
    }
    const run: RoleplayRun = body.run;
    const replay = replayRoleplay(run.scenarioId, run.answers)!;
    if (body.action === "finish" && !replay.completed) {
      return NextResponse.json(
        { error: "Cerita belum sampai pada penutup." },
        { status: 400 },
      );
    }
    const client = await getPgPool().connect();
    let alreadySaved = false;
    let awardedXp = 0;
    try {
      await client.query("BEGIN");
      if (body.action === "start") {
        // Client UUID makes retries after a lost response idempotent, including offline sessions.
        await client.query(
          `INSERT INTO "GameAttempt" ("id", "userId", "childId", "gameId", "mode", "metadata")
           VALUES ($1, $2, $3, $4, 'practice', $5::jsonb) ON CONFLICT ("id") DO NOTHING`,
          [
            run.id,
            session.userId,
            session.childId,
            ROLEPLAY_GAME_ID,
            JSON.stringify({
              scenarioId: run.scenarioId,
              version: ROLEPLAY_VERSION,
              culture: run.culture,
            }),
          ],
        );
      }
      const attempt = (
        await client.query(
          `SELECT "metadata", "finishedAt" FROM "GameAttempt"
         WHERE "id" = $1 AND "userId" = $2 AND "childId" = $3 AND "gameId" = $4 FOR UPDATE`,
          [run.id, session.userId, session.childId, ROLEPLAY_GAME_ID],
        )
      ).rows[0];
      if (
        !attempt ||
        attempt.metadata.scenarioId !== run.scenarioId ||
        attempt.metadata.version !== run.version ||
        attempt.metadata.culture !== run.culture
      ) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { error: "Sesi tidak ditemukan atau versi cerita berbeda." },
          { status: 409 },
        );
      }
      alreadySaved = Boolean(attempt.finishedAt);
      if (body.action === "finish" && !alreadySaved) {
        // Store only curated choice IDs, learning skills and duration; no free text or personal story.
        await client.query(
          `UPDATE "GameAttempt" SET "status" = 'COMPLETED', "metadata" = $2::jsonb,
           "durationSeconds" = $3, "finishedAt" = NOW() WHERE "id" = $1`,
          [
            run.id,
            JSON.stringify({
              scenarioId: run.scenarioId,
              version: run.version,
              culture: run.culture,
              answers: run.answers.map((answer) => ({
                nodeId: answer.nodeId,
                optionId: answer.optionId,
              })),
              skills: replay.skills,
            }),
            Math.floor(run.activeMs / 1000),
          ],
        );
        const reward = await client.query(
          `INSERT INTO "GameDailyReward" ("id", "userId", "gameId", "rewardDate", "attemptId", "xp")
           VALUES ($1, $2, $3, (NOW() AT TIME ZONE 'Asia/Makassar')::date, $4, $5)
           ON CONFLICT ("userId", "gameId", "rewardDate") DO NOTHING RETURNING "xp"`,
          [randomUUID(), session.userId, ROLEPLAY_GAME_ID, run.id, ROLEPLAY_XP],
        );
        awardedXp = reward.rows[0]?.xp ?? 0;
      }
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
    if (body.action === "start")
      return NextResponse.json({
        success: true,
        attemptId: run.id,
        alreadySaved,
      });
    return NextResponse.json({
      success: true,
      completed: true,
      alreadySaved,
      awardedXp,
      treeStats: await getUserTreeStats(session.userId, session.childId),
    });
  } catch (error) {
    console.error("Roleplay save failed:", error);
    return NextResponse.json(
      {
        error:
          "Hasil belum tersimpan di akun. Kamu bisa mencoba menyimpan lagi.",
      },
      { status: 500 },
    );
  }
}
