import { NextRequest, NextResponse } from "next/server";
import { getPgPool } from "@/lib/db";
import { getSessionUser, getUserTreeStats } from "@/lib/auth";
import { recordBreathingReward } from "@/lib/games/breathingReward";

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
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          requiresAuth: true,
          error:
            "Silakan masuk ke akun Anda untuk mencatat progres latihan napas.",
        },
        { status: 401 },
      );
    }

    const client = await getPgPool().connect();
    let awardedXp = 0;
    try {
      await client.query("BEGIN");
      awardedXp = await recordBreathingReward(
        client,
        session.userId,
        session.childId,
        { source: "dashboard", selfReported: true },
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    const treeStats = await getUserTreeStats(session.userId, session.childId);

    return NextResponse.json({
      success: true,
      awardedXp,
      alreadyRecorded: awardedXp === 0,
      message: awardedXp
        ? `Latihan napas tercatat. +${awardedXp} XP untuk Pohon Harapan.`
        : "Latihan napas hari ini sudah tercatat. Kamu tetap boleh berlatih lagi.",
      treeStats,
      treeXp: treeStats.totalXp,
      breatheCount: treeStats.breatheCount,
    });
  } catch (error) {
    console.error("POST /api/journal/breathe error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Gagal mencatat latihan napas di database",
      },
      { status: 500 },
    );
  }
}
