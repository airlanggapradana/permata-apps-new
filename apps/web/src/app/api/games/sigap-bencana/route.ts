import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { isSameOriginRequest } from "@/lib/requestOrigin";
import { getPgPool } from "@/lib/db";
import { getSessionUser, getUserTreeStats } from "@/lib/auth";
import {
  QUAKE_GAME_ID,
  QUAKE_XP,
  QUAKE_LESSONS,
  QUAKE_MIN_MS,
  isQuakeComplete,
} from "@/lib/games/sigapBencana";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!isSameOriginRequest(req))
    return NextResponse.json(
      { error: "Asal permintaan tidak sesuai." },
      { status: 403 },
    );
  try {
    const session = await getSessionUser();
    if (!session)
      return NextResponse.json(
        { error: "Masuk untuk menyimpan latihanmu." },
        { status: 401 },
      );
    const body = await req.json().catch(() => null);
    if (!body || !["start", "finish"].includes(body.action))
      return NextResponse.json(
        { error: "Permintaan permainan tidak valid." },
        { status: 400 },
      );
    const pool = getPgPool();
    if (body.action === "start") {
      if (body.mode !== "practice")
        return NextResponse.json(
          { error: "Pilih mode latihan." },
          { status: 400 },
        );
      const attemptId = randomUUID();
      await pool.query(
        `INSERT INTO "GameAttempt" ("id", "userId", "childId", "gameId", "mode") VALUES ($1, $2, $3, $4, 'practice')`,
        [attemptId, session.userId, session.childId, QUAKE_GAME_ID],
      );
      return NextResponse.json({ success: true, attemptId }, { status: 201 });
    }
    if (
      typeof body.attemptId !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        body.attemptId,
      ) ||
      !Array.isArray(body.answers) ||
      body.answers.length > QUAKE_LESSONS.length ||
      body.answers.some(
        (
          answer: { questionId?: unknown; optionId?: unknown } | null,
          index: number,
        ) =>
          !answer ||
          answer.questionId !== QUAKE_LESSONS[index]?.id ||
          !QUAKE_LESSONS[index].options.some(
            (option) => option.id === answer.optionId,
          ),
      ) ||
      !Array.isArray(body.rooms) ||
      body.rooms.length > QUAKE_LESSONS.length ||
      body.rooms.some(
        (id: unknown, index: number) => id !== QUAKE_LESSONS[index]?.id,
      ) ||
      body.answers.length > body.rooms.length ||
      typeof body.reachedExit !== "boolean" ||
      !Number.isInteger(body.mistakes) ||
      body.mistakes < 0 ||
      body.mistakes > 10000 ||
      !Number.isInteger(body.activeMs) ||
      body.activeMs < 0 ||
      body.activeMs > 86400000
    )
      return NextResponse.json(
        { error: "Hasil latihan tidak valid." },
        { status: 400 },
      );
    const client = await pool.connect();
    let completed = false,
      alreadySaved = false,
      awardedXp = 0;
    try {
      await client.query("BEGIN");
      const attempt = (
        await client.query(
          `SELECT *, EXTRACT(EPOCH FROM (LOCALTIMESTAMP - "startedAt")) * 1000 AS "wallMs" FROM "GameAttempt" WHERE "id" = $1 AND "userId" = $2 AND "childId" = $3 AND "gameId" = $4 FOR UPDATE`,
          [body.attemptId, session.userId, session.childId, QUAKE_GAME_ID],
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
        completed = isQuakeComplete(body);
        if (
          body.activeMs > Number(attempt.wallMs) + 1500 ||
          (completed && body.activeMs < QUAKE_MIN_MS)
        ) {
          await client.query("ROLLBACK");
          return NextResponse.json(
            {
              error: "Durasi latihan belum sesuai dengan sesi yang dimulai.",
            },
            { status: 400 },
          );
        }
        await client.query(
          `UPDATE "GameAttempt" SET "status" = $2, "collectedItems" = $3::jsonb, "metadata" = $4::jsonb, "durationSeconds" = $5, "finishedAt" = NOW() WHERE "id" = $1`,
          [
            body.attemptId,
            completed ? "COMPLETED" : "INCOMPLETE",
            JSON.stringify(
              body.answers.map(
                (answer: { questionId: string }) => answer.questionId,
              ),
            ),
            JSON.stringify({
              answers: body.answers,
              rooms: body.rooms,
              reachedExit: body.reachedExit,
              mistakes: body.mistakes,
              activeMs: body.activeMs,
              version: 1,
            }),
            Math.floor(body.activeMs / 1000),
          ],
        );
        if (completed) {
          const reward = await client.query(
            `INSERT INTO "GameDailyReward" ("id", "userId", "gameId", "rewardDate", "attemptId", "xp") VALUES ($1, $2, $3, (NOW() AT TIME ZONE 'Asia/Makassar')::date, $4, $5) ON CONFLICT ("userId", "gameId", "rewardDate") DO NOTHING RETURNING "xp"`,
            [
              randomUUID(),
              session.userId,
              QUAKE_GAME_ID,
              body.attemptId,
              QUAKE_XP,
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
    console.error("Sigap Bencana save failed:", error);
    return NextResponse.json(
      { error: "Hasil belum tersimpan. Coba simpan lagi, ya." },
      { status: 500 },
    );
  }
}
