import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { ensureUserChildAndPassport, getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

interface ContactInput {
  name: string;
  phone: string;
  relationship: string;
  isPrimary?: boolean;
}

interface FamilyMemberInput {
  name: string;
  relationship: string;
  phoneNumber?: string;
}

interface MeetingPointInput {
  name: string;
  address?: string;
  description?: string;
}

interface EmergencyNeedInput {
  needType: string;
  description: string;
}

async function fetchPassportPayload(userId: string, childId: string, fullName: string) {
  const sql = getDb();
  const { passportId } = await ensureUserChildAndPassport({
    userId,
    fullName,
  });

  const [passportRows, childRows, contacts, familyMembers, meetingPoints, emergencyNeeds] =
    await Promise.all([
      sql`
        SELECT "id", "childId", "passportCode", "status", "issuedAt", "updatedAt"
        FROM "SafetyPassport"
        WHERE "id" = ${passportId} AND "childId" = ${childId}
        LIMIT 1;
      `,
      sql`
        SELECT "id", COALESCE("displayName", "fullName") AS "displayName", "medicalNotes", "specialNeeds"
        FROM "ChildProfile"
        WHERE "id" = ${childId} AND "createdByUserId" = ${userId}
        LIMIT 1;
      `,
      sql`
        SELECT "id", "name", "phone", "relationship", "isPrimary", "orderIndex"
        FROM "SafetyPassportContact"
        WHERE "passportId" = ${passportId}
        ORDER BY "isPrimary" DESC, "orderIndex" ASC, "createdAt" ASC;
      `,
      sql`
        SELECT "id", "name", "relationship", "phoneNumber"
        FROM "FamilyMember"
        WHERE "passportId" = ${passportId}
        ORDER BY "createdAt" ASC;
      `,
      sql`
        SELECT "id", "name", "address", "description", "orderIndex"
        FROM "MeetingPoint"
        WHERE "passportId" = ${passportId}
        ORDER BY "orderIndex" ASC, "createdAt" ASC;
      `,
      sql`
        SELECT "id", "needType", "description"
        FROM "EmergencyNeed"
        WHERE "passportId" = ${passportId}
        ORDER BY "createdAt" ASC;
      `,
    ]);

  const passport = passportRows[0] as
    | {
        id: string;
        childId: string;
        passportCode: string | null;
        status: string;
        issuedAt: string | Date;
        updatedAt: string | Date;
      }
    | undefined;

  const child = childRows[0] as
    | {
        id: string;
        displayName: string | null;
        medicalNotes: string | null;
        specialNeeds: string | null;
      }
    | undefined;

  return {
    id: passport?.id || passportId,
    childId,
    passportCode: passport?.passportCode || "",
    status: passport?.status || "ACTIVE",
    issuedAt: passport?.issuedAt || new Date().toISOString(),
    updatedAt: passport?.updatedAt || new Date().toISOString(),
    childDisplayName: child?.displayName || fullName,
    medicalNotes: child?.medicalNotes || "",
    specialNeeds: child?.specialNeeds || "",
    contacts,
    familyMembers,
    meetingPoints,
    emergencyNeeds,
  };
}

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          requiresAuth: true,
          error:
            "Autentikasi diperlukan untuk mengakses My Safety Passport.",
        },
        { status: 401 }
      );
    }

    const passport = await fetchPassportPayload(
      session.userId,
      session.childId,
      session.fullName
    );

    const sql = getDb();
    await sql`
      INSERT INTO "AuditLog" (
        "id", "actorId", "userId", "action", "resourceType", "resourceId", "metadata", "createdAt"
      )
      VALUES (
        ${crypto.randomUUID()},
        ${session.userId},
        ${session.userId},
        'SAFETY_PASSPORT_READ',
        'SafetyPassport',
        ${passport.id},
        ${JSON.stringify({ childId: session.childId })},
        NOW()
      );
    `;

    return NextResponse.json({
      success: true,
      passport,
    });
  } catch (error) {
    console.error("GET /api/safety-passport error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Gagal memuat My Safety Passport.",
      },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          requiresAuth: true,
          error:
            "Autentikasi diperlukan untuk mengubah My Safety Passport.",
        },
        { status: 401 }
      );
    }

    const body = await req.json();
    const childDisplayName =
      typeof body.childDisplayName === "string"
        ? body.childDisplayName.trim()
        : session.childName;
    const medicalNotes =
      typeof body.medicalNotes === "string" ? body.medicalNotes.trim() : "";
    const specialNeeds =
      typeof body.specialNeeds === "string" ? body.specialNeeds.trim() : "";

    const contacts: ContactInput[] = Array.isArray(body.contacts)
      ? body.contacts
          .filter(
            (c: ContactInput) =>
              c && typeof c.name === "string" && c.name.trim() && typeof c.phone === "string" && c.phone.trim()
          )
          .slice(0, 10)
      : [];

    const familyMembers: FamilyMemberInput[] = Array.isArray(body.familyMembers)
      ? body.familyMembers
          .filter(
            (m: FamilyMemberInput) =>
              m && typeof m.name === "string" && m.name.trim() && typeof m.relationship === "string" && m.relationship.trim()
          )
          .slice(0, 15)
      : [];

    const meetingPoints: MeetingPointInput[] = Array.isArray(body.meetingPoints)
      ? body.meetingPoints
          .filter(
            (p: MeetingPointInput) =>
              p && typeof p.name === "string" && p.name.trim()
          )
          .slice(0, 10)
      : [];

    const emergencyNeeds: EmergencyNeedInput[] = Array.isArray(body.emergencyNeeds)
      ? body.emergencyNeeds
          .filter(
            (n: EmergencyNeedInput) =>
              n && typeof n.needType === "string" && n.needType.trim() && typeof n.description === "string" && n.description.trim()
          )
          .slice(0, 15)
      : [];

    const sql = getDb();
    const { passportId } = await ensureUserChildAndPassport({
      userId: session.userId,
      fullName: session.fullName,
    });

    await sql`
      UPDATE "ChildProfile"
      SET
        "displayName" = ${childDisplayName || session.childName},
        "nickname" = ${childDisplayName || session.childName},
        "medicalNotes" = ${medicalNotes || null},
        "specialNeeds" = ${specialNeeds || null},
        "updatedAt" = NOW()
      WHERE "id" = ${session.childId}
        AND "createdByUserId" = ${session.userId};
    `;

    await sql`
      UPDATE "SafetyPassport"
      SET "updatedAt" = NOW()
      WHERE "id" = ${passportId} AND "childId" = ${session.childId};
    `;

    await sql`DELETE FROM "SafetyPassportContact" WHERE "passportId" = ${passportId};`;
    for (let i = 0; i < contacts.length; i++) {
      const c = contacts[i];
      await sql`
        INSERT INTO "SafetyPassportContact" (
          "id", "passportId", "name", "phone", "relationship", "isPrimary", "orderIndex", "createdAt", "updatedAt"
        )
        VALUES (
          ${crypto.randomUUID()},
          ${passportId},
          ${c.name.trim()},
          ${c.phone.trim()},
          ${(c.relationship || "Wali").trim()},
          ${Boolean(c.isPrimary)},
          ${i},
          NOW(),
          NOW()
        );
      `;
    }

    await sql`DELETE FROM "FamilyMember" WHERE "passportId" = ${passportId};`;
    for (const m of familyMembers) {
      await sql`
        INSERT INTO "FamilyMember" (
          "id", "passportId", "name", "relationship", "phoneNumber", "createdAt"
        )
        VALUES (
          ${crypto.randomUUID()},
          ${passportId},
          ${m.name.trim()},
          ${m.relationship.trim()},
          ${m.phoneNumber?.trim() || null},
          NOW()
        );
      `;
    }

    await sql`DELETE FROM "MeetingPoint" WHERE "passportId" = ${passportId};`;
    for (let i = 0; i < meetingPoints.length; i++) {
      const p = meetingPoints[i];
      await sql`
        INSERT INTO "MeetingPoint" (
          "id", "passportId", "name", "address", "description", "orderIndex", "createdAt"
        )
        VALUES (
          ${crypto.randomUUID()},
          ${passportId},
          ${p.name.trim()},
          ${p.address?.trim() || null},
          ${p.description?.trim() || null},
          ${i},
          NOW()
        );
      `;
    }

    await sql`DELETE FROM "EmergencyNeed" WHERE "passportId" = ${passportId};`;
    for (const n of emergencyNeeds) {
      await sql`
        INSERT INTO "EmergencyNeed" (
          "id", "passportId", "needType", "description", "createdAt"
        )
        VALUES (
          ${crypto.randomUUID()},
          ${passportId},
          ${n.needType.trim()},
          ${n.description.trim()},
          NOW()
        );
      `;
    }

    await sql`
      INSERT INTO "AuditLog" (
        "id", "actorId", "userId", "action", "resourceType", "resourceId", "metadata", "createdAt"
      )
      VALUES (
        ${crypto.randomUUID()},
        ${session.userId},
        ${session.userId},
        'SAFETY_PASSPORT_UPDATE',
        'SafetyPassport',
        ${passportId},
        ${JSON.stringify({
          childId: session.childId,
          contactsCount: contacts.length,
          familyCount: familyMembers.length,
          meetingPointsCount: meetingPoints.length,
          needsCount: emergencyNeeds.length,
        })},
        NOW()
      );
    `;

    const passport = await fetchPassportPayload(
      session.userId,
      session.childId,
      session.fullName
    );

    return NextResponse.json({
      success: true,
      message: "My Safety Passport berhasil diperbarui dan dilindungi akun Anda.",
      passport,
    });
  } catch (error) {
    console.error("PUT /api/safety-passport error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Gagal menyimpan My Safety Passport.",
      },
      { status: 500 }
    );
  }
}
