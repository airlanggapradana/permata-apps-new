import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getPgPool } from "@/lib/db";
import { getSessionUser, getUserTreeStats } from "@/lib/auth";
import { BREATHING_GAME_ID, getBreathingPlan } from "@/lib/games/breathing";
import { recordBreathingReward } from "@/lib/games/breathingReward";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (
    req.headers.get("origin") &&
    req.headers.get("origin") !== req.nextUrl.origin
  )
    return NextResponse.json(
      { error: "Asal permintaan tidak sesuai." },
      { status: 403 },
    );
  try {
    const session = await getSessionUser();
    if (!session)
      return NextResponse.json(
        { error: "Masuk untuk menyimpan latihan napas." },
        { status: 401 },
      );
    const body = await req.json().catch(() => null);
    if (!body || !["start", "finish"].includes(body.action))
      return NextResponse.json(
        { error: "Permintaan latihan tidak valid." },
        { status: 400 },
      );
    const pool = getPgPool();
    if (body.action === "start") {
      if (typeof body.mode !== "string" || !getBreathingPlan(body.mode))
        return NextResponse.json(
          { error: "Pilih ritme dan jumlah putaran yang tersedia." },
          { status: 400 },
        );
      const attemptId = randomUUID();
      await pool.query(
        `INSERT INTO "GameAttempt" ("id", "userId", "childId", "gameId", "mode") VALUES ($1, $2, $3, $4, $5)`,
        [
          attemptId,
          session.userId,
          session.childId,
          BREATHING_GAME_ID,
          body.mode,
        ],
      );
      return NextResponse.json({ success: true, attemptId }, { status: 201 });
    }
    if (
      typeof body.attemptId !== "string" ||
      !/^[\da-f-]{36}$/i.test(body.attemptId) ||
      !Number.isInteger(body.activeMs) ||
      body.activeMs < 0 ||
      body.activeMs > 64000
    )
      return NextResponse.json(
        { error: "Hasil latihan tidak valid." },
        { status: 400 },
      );
    const client = await pool.connect();
    let completed = false;
    let alreadySaved = false;
    let awardedXp = 0;
    try {
      await client.query("BEGIN");
      const attempt = (
        await client.query(
          `SELECT *, EXTRACT(EPOCH FROM (LOCALTIMESTAMP - "startedAt")) * 1000 AS "wallMs"
         FROM "GameAttempt" WHERE "id" = $1 AND "userId" = $2 AND "childId" = $3 AND "gameId" = $4 FOR UPDATE`,
          [body.attemptId, session.userId, session.childId, BREATHING_GAME_ID],
        )
      ).rows[0];
      if (!attempt) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { error: "Sesi latihan tidak ditemukan." },
          { status: 404 },
        );
      }
      const plan = getBreathingPlan(attempt.mode);
      if (!plan) throw new Error("Invalid stored breathing plan");
      if (attempt.finishedAt) {
        alreadySaved = true;
        completed = attempt.status === "COMPLETED";
      } else {
        if (
          body.activeMs > plan.durationMs ||
          body.activeMs > Number(attempt.wallMs) + 1500
        ) {
          await client.query("ROLLBACK");
          return NextResponse.json(
            { error: "Durasi latihan belum sesuai dengan sesi yang dimulai." },
            { status: 400 },
          );
        }
        completed = body.activeMs === plan.durationMs;
        await client.query(
          `UPDATE "GameAttempt" SET "status" = $2, "durationSeconds" = $3, "finishedAt" = NOW() WHERE "id" = $1`,
          [
            body.attemptId,
            completed ? "COMPLETED" : "INCOMPLETE",
            Math.floor(body.activeMs / 1000),
          ],
        );
        if (completed)
          awardedXp = await recordBreathingReward(
            client,
            session.userId,
            session.childId,
            {
              source: BREATHING_GAME_ID,
              attemptId: body.attemptId,
              rhythm: plan.id,
              rounds: plan.rounds,
              durationSeconds: plan.durationMs / 1000,
            },
          );
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
    console.error("Breathing session save failed:", error);
    return NextResponse.json(
      { error: "Hasil belum tersimpan. Coba simpan lagi, ya." },
      { status: 500 },
    );
  }
}
