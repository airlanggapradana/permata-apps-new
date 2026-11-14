import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { calculateTreeStats } from "@/lib/treeProgress";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const sql = getDb();

    // Check if already watered today
    const wateredTodayRes = (await sql`
      SELECT COUNT(*)::int AS count 
      FROM "AuditLog" 
      WHERE "action" = 'WATER_HOPE_TREE' 
        AND "createdAt" >= CURRENT_DATE;
    `) as { count: number }[];
    const alreadyWateredToday = (wateredTodayRes[0]?.count || 0) > 0;

    if (alreadyWateredToday) {
      // Query current stats
      const entriesCount = (await sql`
        SELECT COUNT(*)::int AS count FROM "RecoveryJournalEntry" WHERE "deletedAt" IS NULL;
      `) as { count: number }[];

      const waterCount = (await sql`
        SELECT COUNT(*)::int AS count FROM "AuditLog" WHERE "action" = 'WATER_HOPE_TREE';
      `) as { count: number }[];

      const breatheCountRes = (await sql`
        SELECT COUNT(*)::int AS count FROM "AuditLog" WHERE "action" = 'BREATHING_EXERCISE';
      `) as { count: number }[];

      const treeStats = calculateTreeStats({
        journalCount: entriesCount[0]?.count || 0,
        waterCount: waterCount[0]?.count || 0,
        breatheCount: breatheCountRes[0]?.count || 0,
        wateredToday: true,
      });

      return NextResponse.json({
        success: true,
        alreadyWatered: true,
        message: "Pohon Harapan sudah disiram hari ini! Kembali lagi esok hari.",
        treeStats,
        treeXp: treeStats.totalXp,
      });
    }

    // Log the water action in AuditLog table
    const logId = `audit-water-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    await sql`
      INSERT INTO "AuditLog" (
        "id",
        "actorId",
        "action",
        "resourceType",
        "resourceId",
        "metadata",
        "createdAt"
      )
      VALUES (
        ${logId},
        'user-permata-demo',
        'WATER_HOPE_TREE',
        'HopeTree',
        'child-permata-demo',
        ${JSON.stringify({ xp: 20, reason: "Daily hope tree hydration" })},
        NOW()
      );
    `;

    // Query total counts
    const entriesCount = (await sql`
      SELECT COUNT(*)::int AS count FROM "RecoveryJournalEntry" WHERE "deletedAt" IS NULL;
    `) as { count: number }[];

    const waterCount = (await sql`
      SELECT COUNT(*)::int AS count FROM "AuditLog" WHERE "action" = 'WATER_HOPE_TREE';
    `) as { count: number }[];

    const breatheCountRes = (await sql`
      SELECT COUNT(*)::int AS count FROM "AuditLog" WHERE "action" = 'BREATHING_EXERCISE';
    `) as { count: number }[];

    const totalEntries = entriesCount[0]?.count || 0;
    const totalWaterings = waterCount[0]?.count || 1;
    const totalBreathing = breatheCountRes[0]?.count || 0;

    const treeStats = calculateTreeStats({
      journalCount: totalEntries,
      waterCount: totalWaterings,
      breatheCount: totalBreathing,
      wateredToday: true,
    });

    return NextResponse.json({
      success: true,
      message: "Pohon Harapan disiram! +20 XP kesuburan jiwa.",
      treeStats,
      treeXp: treeStats.totalXp,
      waterCount: totalWaterings,
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
