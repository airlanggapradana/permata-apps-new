import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSessionUser, getUserTreeStats } from "@/lib/auth";

export const dynamic = "force-dynamic";

// POST: Save DASS-21 tele-screening assessment submission for authenticated user
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          requiresAuth: true,
          error:
            "Silakan masuk ke akun Anda untuk menyimpan hasil skrining dan XP Pohon Harapan.",
        },
        { status: 401 }
      );
    }

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

    // Log the screening in AuditLog scoped to user & child
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
        'TELESCREENING_DASS21',
        'AssessmentSubmission',
        ${session.childId},
        ${JSON.stringify(metadata)},
        NOW()
      );
    `;

    const treeStats = await getUserTreeStats(session.userId, session.childId);

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

// GET: Retrieve latest screening results for authenticated user
export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          requiresAuth: true,
          error: "Silakan masuk ke akun Anda untuk melihat riwayat skrining.",
        },
        { status: 401 }
      );
    }

    const sql = getDb();

    const logs = (await sql`
      SELECT "id", "metadata", "createdAt"
      FROM "AuditLog"
      WHERE "action" = 'TELESCREENING_DASS21'
        AND "actorId" = ${session.userId}
        AND "resourceId" = ${session.childId}
      ORDER BY "createdAt" DESC
      LIMIT 1;
    `) as { id: string; metadata: unknown; createdAt: string | Date }[];

    if (!logs.length) {
      return NextResponse.json({
        success: true,
        hasScreening: false,
      });
    }

    const latest = logs[0];
    const metadata =
      typeof latest.metadata === "string"
        ? JSON.parse(latest.metadata)
        : (latest.metadata as Record<string, unknown>);

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
