import { isRoleplayRun, type RoleplayRun } from "./roleplay";

const PREFIX = "permata_roleplay_v1:";
const MAX_AGE_MS = 7 * 86400000;
function key(ownerId: string | null) {
  return `${PREFIX}${ownerId ?? "guest"}`;
}

export function readRoleplayRun(ownerId: string | null): RoleplayRun | null {
  try {
    const raw = localStorage.getItem(key(ownerId));
    if (!raw) return null;
    const value: unknown = JSON.parse(raw);
    if (
      !isRoleplayRun(value) ||
      value.ownerId !== ownerId ||
      Date.now() - value.updatedAt > MAX_AGE_MS ||
      value.updatedAt > Date.now() + 60000
    ) {
      localStorage.removeItem(key(ownerId));
      return null;
    }
    return value;
  } catch {
    return null;
  }
}

export function writeRoleplayRun(run: RoleplayRun): boolean {
  try {
    localStorage.setItem(key(run.ownerId), JSON.stringify(run));
    return true;
  } catch {
    return false;
  }
}

export function clearRoleplayRun(ownerId: string | null) {
  try {
    localStorage.removeItem(key(ownerId));
  } catch {
    /* Storage can be disabled. */
  }
}

/** On an offline reload there is no server session lookup. Keep the original owner
 * on a local continuation; uploading still requires that same account online. */
export function readOfflineRoleplayRun(): RoleplayRun | null {
  try {
    const runs: RoleplayRun[] = [];
    const keys = Array.from({ length: localStorage.length }, (_, index) =>
      localStorage.key(index),
    );
    for (const itemKey of keys) {
      if (!itemKey?.startsWith(PREFIX)) continue;
      const owner = itemKey.slice(PREFIX.length);
      const run = readRoleplayRun(owner === "guest" ? null : owner);
      if (run) runs.push(run);
    }
    return (
      runs.sort((left, right) => right.updatedAt - left.updatedAt)[0] ?? null
    );
  } catch {
    return null;
  }
}
