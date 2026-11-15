import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { calculateTreeStats } from "@/lib/treeProgress";

export const dynamic = "force-dynamic";

// Ensure demo user & child profile exists in database
async function ensureDefaultProfile() {
  const sql = getDb();
  await sql`
    INSERT INTO "User" ("id", "isVerified", "isActive", "createdAt", "updatedAt")
    VALUES ('user-permata-demo', true, true, NOW(), NOW())
    ON CONFLICT ("id") DO NOTHING;
  `;
  await sql`
    INSERT INTO "ChildProfile" (
      "id", "createdByUserId", "fullName", "displayName", "nickname", "isActive", "createdAt", "updatedAt"
    )
    VALUES (
      'child-permata-demo', 'user-permata-demo', 'Cut Rayyan Al-Farizi', 'Rayyan', 'Rayyan', true, NOW(), NOW()
    )
    ON CONFLICT ("id") DO NOTHING;
  `;
}

// POST: Save DASS-21 tele-screening assessment submission
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      depression = 0,
      anxiety = 0,
      stress = 0,
      depressionLevel = "Normal",
      anxietyLevel = "Normal",
      stressLevel = "Normal",
      answers = [],
      culture = "aceh",
    } = body;

    const sql = getDb();
    await ensureDefaultProfile();

    const logId = `audit-screening-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const metadata = {
      xp: 100,
      depression,
      anxiety,
      stress,
      depressionLevel,
      anxietyLevel,
      stressLevel,
      culture,
      answers,
      timestamp: new Date().toISOString(),
    };

    // Log the screening in AuditLog
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
        'TELESCREENING_DASS21',
        'AssessmentSubmission',
        'child-permata-demo',
        ${JSON.stringify(metadata)},
        NOW()
      );
    `;

    // Query updated counts for tree stats
    const entriesCount = (await sql`
      SELECT COUNT(*)::int AS count FROM "RecoveryJournalEntry" WHERE "deletedAt" IS NULL;
    `) as { count: number }[];

    const waterCount = (await sql`
      SELECT COUNT(*)::int AS count FROM "AuditLog" WHERE "action" = 'WATER_HOPE_TREE';
    `) as { count: number }[];

    const breatheCountRes = (await sql`
      SELECT COUNT(*)::int AS count FROM "AuditLog" WHERE "action" = 'BREATHING_EXERCISE';
    `) as { count: number }[];

    const screeningCountRes = (await sql`
      SELECT COUNT(*)::int AS count FROM "AuditLog" WHERE "action" = 'TELESCREENING_DASS21';
    `) as { count: number }[];

    const wateredTodayRes = (await sql`
      SELECT COUNT(*)::int AS count 
      FROM "AuditLog" 
      WHERE "action" = 'WATER_HOPE_TREE' 
        AND "createdAt" >= CURRENT_DATE;
    `) as { count: number }[];
    const wateredToday = (wateredTodayRes[0]?.count || 0) > 0;

    const treeStats = calculateTreeStats({
      journalCount: entriesCount[0]?.count || 0,
      waterCount: waterCount[0]?.count || 0,
      breatheCount: breatheCountRes[0]?.count || 0,
      screeningCount: screeningCountRes[0]?.count || 1,
      wateredToday,
    });

    return NextResponse.json({
      success: true,
      message: "Hasil skrining DASS-21 berhasil dicatat! +100 XP Pohon Harapan diperoleh.",
      xpAwarded: 100,
      treeStats,
    });
  } catch (error) {
    console.error("POST /api/screening error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Gagal menyimpan hasil skrining ke database",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// GET: Retrieve latest screening results if available
export async function GET() {
  try {
    const sql = getDb();
    await ensureDefaultProfile();

    const logs = (await sql`
      SELECT "id", "metadata", "createdAt"
      FROM "AuditLog"
      WHERE "action" = 'TELESCREENING_DASS21'
        AND "resourceId" = 'child-permata-demo'
      ORDER BY "createdAt" DESC
      LIMIT 1;
    `) as { id: string; metadata: any; createdAt: string | Date }[];

    if (!logs.length) {
      return NextResponse.json({
        success: true,
        hasScreening: false,
      });
    }

    const latest = logs[0];
    const metadata = typeof latest.metadata === "string" ? JSON.parse(latest.metadata) : latest.metadata;

    return NextResponse.json({
      success: true,
      hasScreening: true,
      screening: {
        id: latest.id,
        createdAt: latest.createdAt,
        ...metadata,
      },
    });
  } catch (error) {
    console.error("GET /api/screening error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Gagal mengambil riwayat skrining",
      },
      { status: 500 }
    );
  }
}
