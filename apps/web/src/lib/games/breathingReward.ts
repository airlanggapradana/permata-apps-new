import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import { BREATHING_XP } from "./breathing";

// The game and dashboard share this lock and ledger to prevent duplicate XP.
export async function recordBreathingReward(
  client: PoolClient,
  userId: string,
  childId: string,
  metadata: Record<string, unknown>,
) {
  await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", [
    `breathing:${userId}:${childId}`,
  ]);
  const existing = await client.query(
    `SELECT "id" FROM "AuditLog" WHERE "actorId" = $1 AND "resourceId" = $2 AND "action" = 'BREATHING_EXERCISE'
     AND "createdAt" >= (DATE_TRUNC('day', NOW() AT TIME ZONE 'Asia/Makassar') AT TIME ZONE 'Asia/Makassar') LIMIT 1`,
    [userId, childId],
  );
  if (existing.rowCount) return 0;
  await client.query(
    `INSERT INTO "AuditLog" ("id", "actorId", "userId", "action", "resourceType", "resourceId", "metadata", "createdAt")
     VALUES ($1, $2, $2, 'BREATHING_EXERCISE', 'BreathingExercise', $3, $4::jsonb, NOW())`,
    [
      randomUUID(),
      userId,
      childId,
      JSON.stringify({ ...metadata, xp: BREATHING_XP }),
    ],
  );
  return BREATHING_XP;
}
