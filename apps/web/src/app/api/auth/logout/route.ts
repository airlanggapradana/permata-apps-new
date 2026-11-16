import crypto from "crypto";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import {
  buildSessionCookieOptions,
  getSessionUser,
  SESSION_COOKIE_NAME,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const session = await getSessionUser();
    if (session) {
      const sql = getDb();
      await sql`
        INSERT INTO "AuditLog" (
          "id", "actorId", "userId", "action", "resourceType", "resourceId", "createdAt"
        )
        VALUES (
          ${crypto.randomUUID()}, ${session.userId}, ${session.userId}, 'USER_LOGOUT', 'User', ${session.userId}, NOW()
        );
      `;
    }
  } catch (err) {
    console.warn("POST /api/auth/logout audit warning:", err);
  }

  const res = NextResponse.json({ success: true });
  res.cookies.set(SESSION_COOKIE_NAME, "", buildSessionCookieOptions(0));
  return res;
}
