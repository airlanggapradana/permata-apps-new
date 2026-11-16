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
          error: "Silakan masuk ke akun Anda untuk menyiram Pohon Harapan pribadi.",
        },
        { status: 401 }
      );
    }

    const sql = getDb();

    // Check if already watered today for this specific user/child
    const wateredTodayRes = (await sql`
      SELECT COUNT(*)::int AS count 
      FROM "AuditLog" 
      WHERE "actorId" = ${session.userId}
        AND "resourceId" = ${session.childId}
        AND "action" = 'WATER_HOPE_TREE' 
        AND "createdAt" >= CURRENT_DATE;
    `) as { count: number }[];
    const alreadyWateredToday = (wateredTodayRes[0]?.count || 0) > 0;

    if (alreadyWateredToday) {
      const treeStats = await getUserTreeStats(session.userId, session.childId);

      return NextResponse.json({
        success: true,
        alreadyWatered: true,
        message: "Pohon Harapan sudah disiram hari ini! Kembali lagi esok hari.",
        treeStats,
        treeXp: treeStats.totalXp,
      });
    }

    // Log the water action in AuditLog table scoped to user & child
    const logId = `audit-water-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
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
        'WATER_HOPE_TREE',
        'HopeTree',
        ${session.childId},
        ${JSON.stringify({ xp: 20, reason: "Daily hope tree hydration" })},
        NOW()
      );
    `;

    const treeStats = await getUserTreeStats(session.userId, session.childId);

    return NextResponse.json({
      success: true,
      message: "Pohon Harapan disiram! +20 XP kesuburan jiwa.",
      treeStats,
      treeXp: treeStats.totalXp,
      waterCount: treeStats.waterCount,
    });
  } catch (error) {
    console.error("POST /api/journal/water error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Gagal mencatat penyiraman pohon di database",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
