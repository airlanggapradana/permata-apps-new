import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import {
  buildSessionCookieOptions,
  ensureUserChildAndPassport,
  getUserTreeStats,
  SESSION_COOKIE_NAME,
  signSessionToken,
  verifyPassword,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email dan kata sandi wajib diisi." },
        { status: 400 }
      );
    }

    const sql = getDb();
    const rows = (await sql`
      SELECT
        u."id",
        u."email",
        u."passwordHash",
        u."status",
        u."isActive",
        u."deletedAt",
        p."fullName",
        p."preferredLanguage"
      FROM "User" u
      LEFT JOIN "UserProfile" p ON p."userId" = u."id"
      WHERE LOWER(u."email") = ${email}
      LIMIT 1;
    `) as {
      id: string;
      email: string | null;
      passwordHash: string | null;
      status: string | null;
      isActive: boolean;
      deletedAt: string | Date | null;
      fullName: string | null;
      preferredLanguage: string | null;
    }[];

    const user = rows[0];
    const passwordValid = verifyPassword(password, user?.passwordHash || "");

    if (!user || !passwordValid) {
      return NextResponse.json(
        { success: false, error: "Email atau kata sandi salah." },
        { status: 401 }
      );
    }

    if (
      !user.isActive ||
      user.deletedAt ||
      (user.status && user.status !== "ACTIVE")
    ) {
      return NextResponse.json(
        { success: false, error: "Akun ini sedang tidak aktif." },
        { status: 403 }
      );
    }

    await sql`
      UPDATE "User"
      SET "lastLoginAt" = NOW(), "updatedAt" = NOW()
      WHERE "id" = ${user.id};
    `;

    const roleRows = (await sql`
      SELECT r."code"
      FROM "UserRole" ur
      JOIN "Role" r ON r."id" = ur."roleId"
      WHERE ur."userId" = ${user.id};
    `) as { code: string }[];

    const fullName = user.fullName || user.email || "Pengguna PERMATA";
    const { childId, childName } = await ensureUserChildAndPassport({
      userId: user.id,
      fullName,
    });

    await sql`
      INSERT INTO "AuditLog" (
        "id", "actorId", "userId", "action", "resourceType", "resourceId", "createdAt"
      )
      VALUES (
        ${crypto.randomUUID()}, ${user.id}, ${user.id}, 'USER_LOGIN', 'User', ${user.id}, NOW()
      );
    `;

    const treeStats = await getUserTreeStats(user.id, childId);
    const token = signSessionToken({
      userId: user.id,
      email: user.email || email,
    });

    const res = NextResponse.json({
      success: true,
      user: {
        userId: user.id,
        email: user.email || email,
        fullName,
        childId,
        childName,
        roles: roleRows.map((r) => r.code),
        preferredLanguage: user.preferredLanguage || "id",
      },
      treeStats,
    });

    res.cookies.set(SESSION_COOKIE_NAME, token, buildSessionCookieOptions());
    return res;
  } catch (error) {
    console.error("POST /api/auth/login error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Gagal memproses login. Periksa koneksi database Anda.",
      },
      { status: 500 }
    );
  }
}
