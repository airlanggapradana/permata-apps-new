import crypto from "crypto";
import { cookies } from "next/headers";
import { getDb } from "@/lib/db";
import { calculateTreeStats, TreeStats } from "@/lib/treeProgress";

export const SESSION_COOKIE_NAME = "permata_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export interface SessionUser {
  userId: string;
  email: string;
  fullName: string;
  childId: string;
  childName: string;
  roles: string[];
  preferredLanguage: string;
}

interface SessionPayload {
  userId: string;
  email: string;
  exp: number;
}

function getSessionSecret(): string {
  const configured =
    process.env.AUTH_SESSION_SECRET || process.env.ACCESS_TOKEN_SECRET;
  if (configured && configured.length >= 16) {
    return configured;
  }
  const dbFallback =
    process.env.DATABASE_URL || "permata-local-development-fallback";
  return crypto
    .createHash("sha256")
    .update(`permata-session-secret:${dbFallback}`)
    .digest("hex");
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash || !storedHash.startsWith("scrypt:")) {
    // Run dummy scrypt to keep response timing consistent
    crypto.scryptSync(password || "dummy", "dummy-salt", 64);
    return false;
  }
  const parts = storedHash.split(":");
  if (parts.length !== 3) return false;
  const [, salt, originalHex] = parts;
  const derivedBuf = crypto.scryptSync(password, salt, 64);
  const originalBuf = Buffer.from(originalHex, "hex");
  if (derivedBuf.length !== originalBuf.length) return false;
  return crypto.timingSafeEqual(derivedBuf, originalBuf);
}

export function signSessionToken(payload: {
  userId: string;
  email: string;
}): string {
  const fullPayload: SessionPayload = {
    userId: payload.userId,
    email: payload.email,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
  };
  const encoded = Buffer.from(JSON.stringify(fullPayload), "utf8").toString(
    "base64url"
  );
  const sig = crypto
    .createHmac("sha256", getSessionSecret())
    .update(encoded)
    .digest("base64url");
  return `${encoded}.${sig}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  if (!token || !token.includes(".")) return null;
  const [encoded, sig] = token.split(".");
  if (!encoded || !sig) return null;

  const expectedSig = crypto
    .createHmac("sha256", getSessionSecret())
    .update(encoded)
    .digest("base64url");

  const sigBuf = Buffer.from(sig, "utf8");
  const expectedBuf = Buffer.from(expectedSig, "utf8");
  if (
    sigBuf.length !== expectedBuf.length ||
    !crypto.timingSafeEqual(sigBuf, expectedBuf)
  ) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8")
    ) as SessionPayload;
    if (
      !parsed.userId ||
      typeof parsed.exp !== "number" ||
      parsed.exp < Math.floor(Date.now() / 1000)
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function buildSessionCookieOptions(maxAge = SESSION_MAX_AGE_SECONDS) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

export async function ensureUserChildAndPassport(params: {
  userId: string;
  fullName: string;
  childDisplayName?: string;
}): Promise<{ childId: string; childName: string; passportId: string }> {
  const sql = getDb();

  const existingChildren = (await sql`
    SELECT "id", COALESCE("displayName", "nickname", "fullName") AS "name"
    FROM "ChildProfile"
    WHERE "createdByUserId" = ${params.userId}
      AND "deletedAt" IS NULL
    ORDER BY "createdAt" ASC
    LIMIT 1;
  `) as { id: string; name: string | null }[];

  let childId = existingChildren[0]?.id;
  let childName =
    existingChildren[0]?.name ||
    params.childDisplayName ||
    params.fullName.split(" ")[0] ||
    "Penyintas";

  if (!childId) {
    childId = crypto.randomUUID();
    const display =
      params.childDisplayName?.trim() ||
      params.fullName.trim().split(" ")[0] ||
      "Penyintas";
    childName = display;

    await sql`
      INSERT INTO "ChildProfile" (
        "id",
        "createdByUserId",
        "fullName",
        "displayName",
        "nickname",
        "preferredLanguage",
        "isActive",
        "createdAt",
        "updatedAt"
      )
      VALUES (
        ${childId},
        ${params.userId},
        ${params.fullName.trim()},
        ${display},
        ${display},
        'id',
        true,
        NOW(),
        NOW()
      );
    `;
  }

  const existingPassport = (await sql`
    SELECT "id"
    FROM "SafetyPassport"
    WHERE "childId" = ${childId}
    LIMIT 1;
  `) as { id: string }[];

  let passportId = existingPassport[0]?.id;
  if (!passportId) {
    passportId = crypto.randomUUID();
    const passportCode = `PRM-${crypto
      .randomBytes(3)
      .toString("hex")
      .toUpperCase()}`;
    await sql`
      INSERT INTO "SafetyPassport" (
        "id",
        "childId",
        "passportCode",
        "status",
        "issuedAt",
        "createdAt",
        "updatedAt"
      )
      VALUES (
        ${passportId},
        ${childId},
        ${passportCode},
        'ACTIVE',
        NOW(),
        NOW(),
        NOW()
      );
    `;
  }

  return { childId, childName, passportId };
}

export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = verifySessionToken(token);
    if (!payload) return null;

    const sql = getDb();
    const users = (await sql`
      SELECT
        u."id",
        u."email",
        u."isActive",
        u."status",
        u."deletedAt",
        p."fullName",
        p."preferredLanguage"
      FROM "User" u
      LEFT JOIN "UserProfile" p ON p."userId" = u."id"
      WHERE u."id" = ${payload.userId}
      LIMIT 1;
    `) as {
      id: string;
      email: string | null;
      isActive: boolean;
      status: string | null;
      deletedAt: string | Date | null;
      fullName: string | null;
      preferredLanguage: string | null;
    }[];

    const user = users[0];
    if (
      !user ||
      !user.isActive ||
      user.deletedAt ||
      (user.status && user.status !== "ACTIVE")
    ) {
      return null;
    }

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

    return {
      userId: user.id,
      email: user.email || payload.email,
      fullName,
      childId,
      childName,
      roles: roleRows.map((r) => r.code),
      preferredLanguage: user.preferredLanguage || "id",
    };
  } catch (err) {
    console.warn("getSessionUser error:", err);
    return null;
  }
}

export async function getUserTreeStats(
  userId: string,
  childId: string
): Promise<TreeStats> {
  const sql = getDb();

  const [
    entriesCountRes,
    waterCountRes,
    breatheCountRes,
    screeningCountRes,
    moodFoodCountRes,
    wateredTodayRes,
    gameXpRes,
  ] = await Promise.all([
    sql`
      SELECT COUNT(*)::int AS count
      FROM "RecoveryJournalEntry"
      WHERE "childId" = ${childId}
        AND "deletedAt" IS NULL;
    `,
    sql`
      SELECT COUNT(*)::int AS count
      FROM "AuditLog"
      WHERE "actorId" = ${userId}
        AND "resourceId" = ${childId}
        AND "action" = 'WATER_HOPE_TREE';
    `,
    sql`
      SELECT COUNT(*)::int AS count
      FROM "AuditLog"
      WHERE "actorId" = ${userId}
        AND "resourceId" = ${childId}
        AND "action" = 'BREATHING_EXERCISE';
    `,
    sql`
      SELECT COUNT(*)::int AS count
      FROM "AuditLog"
      WHERE "actorId" = ${userId}
        AND "resourceId" = ${childId}
        AND "action" = 'TELESCREENING_DASS21';
    `,
    sql`
      SELECT COUNT(*)::int AS count
      FROM "AuditLog"
      WHERE "actorId" = ${userId}
        AND "resourceId" = ${childId}
        AND "action" = 'MOOD_FOOD_ANALYSIS';
    `,
    sql`
      SELECT COUNT(*)::int AS count
      FROM "AuditLog"
      WHERE "actorId" = ${userId}
        AND "resourceId" = ${childId}
        AND "action" = 'WATER_HOPE_TREE'
        AND "createdAt" >= CURRENT_DATE;
    `,
    sql`
      SELECT COALESCE(SUM(r."xp"), 0)::int AS xp
      FROM "GameDailyReward" r
      JOIN "GameAttempt" a ON a."id" = r."attemptId"
      WHERE r."userId" = ${userId} AND a."childId" = ${childId};
    `,
  ]);

  return calculateTreeStats({
    gameXp: (gameXpRes[0] as { xp: number } | undefined)?.xp || 0,
    journalCount: (entriesCountRes[0] as { count: number } | undefined)?.count || 0,
    waterCount: (waterCountRes[0] as { count: number } | undefined)?.count || 0,
    breatheCount: (breatheCountRes[0] as { count: number } | undefined)?.count || 0,
    screeningCount: (screeningCountRes[0] as { count: number } | undefined)?.count || 0,
    moodFoodCount: (moodFoodCountRes[0] as { count: number } | undefined)?.count || 0,
    wateredToday:
      ((wateredTodayRes[0] as { count: number } | undefined)?.count || 0) > 0,
  });
}

export function sanitizeNextPath(raw: string | null | undefined): string {
  if (!raw || typeof raw !== "string") return "/dashboard";
  const trimmed = raw.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return "/dashboard";
  }
  return trimmed;
}
