import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSessionUser, getUserTreeStats } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          requiresAuth: true,
          error: "Silakan masuk ke akun Anda untuk mencatat progres latihan napas.",
        },
        { status: 401 }
      );
    }

    const sql = getDb();

    // Log the breathing exercise action in AuditLog table scoped to user & child
    const logId = `audit-breathe-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    await sql`
      INSERT INTO "AuditLog" (
        "id",
        "actorId",
        "userId",
        "action",
        "resourceType",
        "resourceId",
        "metadata",
        "createdAt"
      )
      VALUES (
        ${logId},
        ${session.userId},
        ${session.userId},
        'BREATHING_EXERCISE',
        'BreathingExercise',
        ${session.childId},
        ${JSON.stringify({ xp: 15, durationSec: 4, type: "4-4-4 Box Breathing" })},
        NOW()
      );
    `;

    const treeStats = await getUserTreeStats(session.userId, session.childId);

    return NextResponse.json({
      success: true,
      message: "Latihan napas tenang selesai! +15 XP ketenangan batin.",
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
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
