import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import {
  buildSessionCookieOptions,
  ensureUserChildAndPassport,
  getUserTreeStats,
  hashPassword,
  SESSION_COOKIE_NAME,
  signSessionToken,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

const ALLOWED_SELF_REGISTER_ROLES = new Set([
  "CHILD",
  "PARENT_GUARDIAN",
  "TEACHER_COUNSELOR",
  "VOLUNTEER",
]);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const fullName =
      typeof body.fullName === "string" ? body.fullName.trim() : "";
    const childDisplayName =
      typeof body.childDisplayName === "string"
        ? body.childDisplayName.trim()
        : "";
    const requestedRole =
      typeof body.roleCode === "string" ? body.roleCode.trim().toUpperCase() : "CHILD";
    const roleCode = ALLOWED_SELF_REGISTER_ROLES.has(requestedRole)
      ? requestedRole
      : "CHILD";

    if (!fullName || fullName.length < 2) {
      return NextResponse.json(
        { success: false, error: "Nama lengkap minimal 2 karakter." },
        { status: 400 }
      );
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, error: "Format alamat email tidak valid." },
        { status: 400 }
      );
    }

    if (password.length < 8 || password.length > 128) {
      return NextResponse.json(
        {
          success: false,
          error: "Kata sandi harus terdiri dari 8 sampai 128 karakter.",
        },
        { status: 400 }
      );
    }

    const sql = getDb();

    const existing = (await sql`
      SELECT "id" FROM "User" WHERE LOWER("email") = ${email} LIMIT 1;
    `) as { id: string }[];

    if (existing.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Email sudah terdaftar. Silakan masuk menggunakan akun Anda atau gunakan email lain.",
        },
        { status: 409 }
      );
    }

    const userId = crypto.randomUUID();
    const profileId = crypto.randomUUID();
    const passwordHash = hashPassword(password);
    const nickname =
      childDisplayName || fullName.split(" ")[0] || fullName;

    await sql`
      INSERT INTO "User" (
        "id", "email", "passwordHash", "status", "isVerified", "isActive", "lastLoginAt", "createdAt", "updatedAt"
      )
      VALUES (
        ${userId}, ${email}, ${passwordHash}, 'ACTIVE', true, true, NOW(), NOW(), NOW()
      );
    `;

    await sql`
      INSERT INTO "UserProfile" (
        "id", "userId", "fullName", "nickname", "preferredLanguage", "languageCode", "createdAt", "updatedAt"
      )
      VALUES (
        ${profileId}, ${userId}, ${fullName}, ${nickname}, 'id', 'id', NOW(), NOW()
      );
    `;

    const roleRows = (await sql`
      SELECT "id", "code" FROM "Role" WHERE "code" = ${roleCode} LIMIT 1;
    `) as { id: string; code: string }[];

    if (roleRows[0]) {
      await sql`
        INSERT INTO "UserRole" ("id", "userId", "roleId", "grantedAt")
        VALUES (${crypto.randomUUID()}, ${userId}, ${roleRows[0].id}, NOW())
        ON CONFLICT DO NOTHING;
      `;
    }

    const { childId, childName } = await ensureUserChildAndPassport({
      userId,
      fullName,
      childDisplayName: nickname,
    });

    await sql`
      INSERT INTO "AuditLog" (
        "id", "actorId", "userId", "action", "resourceType", "resourceId", "createdAt"
      )
      VALUES (
        ${crypto.randomUUID()}, ${userId}, ${userId}, 'USER_REGISTER', 'User', ${userId}, NOW()
      );
    `;

    const treeStats = await getUserTreeStats(userId, childId);
    const token = signSessionToken({ userId, email });

    const res = NextResponse.json(
      {
        success: true,
        user: {
          userId,
          email,
          fullName,
          childId,
          childName,
          roles: [roleCode],
          preferredLanguage: "id",
        },
        treeStats,
      },
      { status: 201 }
    );

    res.cookies.set(SESSION_COOKIE_NAME, token, buildSessionCookieOptions());
    return res;
  } catch (error) {
    console.error("POST /api/auth/register error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Gagal mendaftarkan akun. Periksa koneksi database Anda.",
      },
      { status: 500 }
    );
  }
}
