import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { calculateTreeStats } from "@/lib/treeProgress";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const sql = getDb();

    // Log the breathing exercise action in AuditLog table
    const logId = `audit-breathe-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
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
        'BREATHING_EXERCISE',
        'BreathingExercise',
        'child-permata-demo',
        ${JSON.stringify({ xp: 15, durationSec: 4, type: "4-4-4 Box Breathing" })},
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

    const wateredTodayRes = (await sql`
      SELECT COUNT(*)::int AS count 
      FROM "AuditLog" 
      WHERE "action" = 'WATER_HOPE_TREE' 
        AND "createdAt" >= CURRENT_DATE;
    `) as { count: number }[];
    const wateredToday = (wateredTodayRes[0]?.count || 0) > 0;

    const totalEntries = entriesCount[0]?.count || 0;
    const totalWaterings = waterCount[0]?.count || 0;
    const totalBreathing = breatheCountRes[0]?.count || 1;

    const treeStats = calculateTreeStats({
      journalCount: totalEntries,
      waterCount: totalWaterings,
      breatheCount: totalBreathing,
      wateredToday,
    });

    return NextResponse.json({
      success: true,
      message: "Latihan napas tenang selesai! +15 XP ketenangan batin.",
      treeStats,
      treeXp: treeStats.totalXp,
      breatheCount: totalBreathing,
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
