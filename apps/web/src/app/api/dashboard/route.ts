import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import {
  ensureUserChildAndPassport,
  getSessionUser,
  getUserTreeStats,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          requiresAuth: true,
          error: "Autentikasi diperlukan untuk memuat dashboard pribadi.",
        },
        { status: 401 }
      );
    }

    const sql = getDb();
    const { passportId } = await ensureUserChildAndPassport({
      userId: session.userId,
      fullName: session.fullName,
    });

    const [
      passportRows,
      contactsRows,
      familyCountRows,
      meetingRows,
      needsCountRows,
      journalTodayRows,
      breatheTodayRows,
      latestScreeningRows,
      treeStats,
    ] = await Promise.all([
      sql`
        SELECT "passportCode", "status"
        FROM "SafetyPassport"
        WHERE "id" = ${passportId}
        LIMIT 1;
      `,
      sql`
        SELECT "name", "phone", "relationship", "isPrimary"
        FROM "SafetyPassportContact"
        WHERE "passportId" = ${passportId}
        ORDER BY "isPrimary" DESC, "orderIndex" ASC, "createdAt" ASC;
      `,
      sql`
        SELECT COUNT(*)::int AS count
        FROM "FamilyMember"
        WHERE "passportId" = ${passportId};
      `,
      sql`
        SELECT "name", "address"
        FROM "MeetingPoint"
        WHERE "passportId" = ${passportId}
        ORDER BY "orderIndex" ASC, "createdAt" ASC;
      `,
      sql`
        SELECT COUNT(*)::int AS count
        FROM "EmergencyNeed"
        WHERE "passportId" = ${passportId};
      `,
      sql`
        SELECT COUNT(*)::int AS count, MAX("createdAt") AS "lastAt"
        FROM "RecoveryJournalEntry"
        WHERE "childId" = ${session.childId}
          AND "deletedAt" IS NULL
          AND "createdAt" >= CURRENT_DATE;
      `,
      sql`
        SELECT COUNT(*)::int AS count
        FROM "AuditLog"
        WHERE "actorId" = ${session.userId}
          AND "resourceId" = ${session.childId}
          AND "action" = 'BREATHING_EXERCISE'
          AND "createdAt" >= CURRENT_DATE;
      `,
      sql`
        SELECT "metadata", "createdAt"
        FROM "AuditLog"
        WHERE "actorId" = ${session.userId}
          AND "resourceId" = ${session.childId}
          AND "action" = 'TELESCREENING_DASS21'
        ORDER BY "createdAt" DESC
        LIMIT 1;
      `,
      getUserTreeStats(session.userId, session.childId),
    ]);

    const passport = passportRows[0] as
      | { passportCode: string | null; status: string }
      | undefined;
    const contacts = contactsRows as Array<{
      name: string;
      phone: string;
      relationship: string;
      isPrimary: boolean;
    }>;
    const meetings = meetingRows as Array<{
      name: string;
      address: string | null;
    }>;

    const contactsCount = contacts.length;
    const familyCount =
      (familyCountRows[0] as { count: number } | undefined)?.count || 0;
    const meetingPointsCount = meetings.length;
    const emergencyNeedsCount =
      (needsCountRows[0] as { count: number } | undefined)?.count || 0;

    const filledSections = [
      contactsCount > 0,
      familyCount > 0,
      meetingPointsCount > 0,
      emergencyNeedsCount > 0,
    ].filter(Boolean).length;

    const journalTodayRow = journalTodayRows[0] as
      | { count: number; lastAt: string | Date | null }
      | undefined;
    const breatheTodayRow = breatheTodayRows[0] as { count: number } | undefined;

    let screeningLabel = "Belum Skrining";
    const latestScreening = latestScreeningRows[0] as
      | { metadata: unknown; createdAt: string | Date }
      | undefined;
    if (latestScreening) {
      const meta =
        typeof latestScreening.metadata === "string"
          ? JSON.parse(latestScreening.metadata)
          : (latestScreening.metadata as Record<string, string>);
      const levels = [
        meta?.depressionLevel,
        meta?.anxietyLevel,
        meta?.stressLevel,
      ].filter(Boolean);
      if (levels.includes("Sangat Berat") || levels.includes("Berat")) {
        screeningLabel = "Perlu Perhatian";
      } else if (levels.includes("Sedang")) {
        screeningLabel = "Sedang";
      } else {
        screeningLabel = "Normal (Stabil)";
      }
    }

    return NextResponse.json({
      success: true,
      passportSummary: {
        passportCode: passport?.passportCode || "PRM-BARU",
        status: passport?.status || "ACTIVE",
        completenessPercent: Math.round((filledSections / 4) * 100),
        contactsCount,
        familyCount,
        meetingPointsCount,
        emergencyNeedsCount,
        primaryContact: contacts[0] || null,
        primaryMeetingPoint: meetings[0] || null,
      },
      dailyStatus: {
        journaledToday: (journalTodayRow?.count || 0) > 0,
        lastJournalAt: journalTodayRow?.lastAt || null,
        breathedToday: (breatheTodayRow?.count || 0) > 0,
      },
      screeningStatus: screeningLabel,
      treeStats,
    });
  } catch (error) {
    console.error("GET /api/dashboard error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Gagal memuat ringkasan dashboard pengguna.",
      },
      { status: 500 }
    );
  }
}
