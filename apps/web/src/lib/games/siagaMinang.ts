export const MINANG_GAME_ID = "siaga-minang";
export const MINANG_XP = 20;
export const MINANG_WORLD_WIDTH = 5000;
export const MINANG_HEIGHT = 600;
export const MINANG_GROUND_Y = 520;
export const MINANG_GOAL_X = 4840;
export const MINANG_SPEED = 340;
export const MINANG_MIN_COMPLETION_MS = 12000;

export const MINANG_ITEMS = [
  {
    id: "water",
    name: "Air minum",
    emoji: "💧",
    x: 260,
    y: 492,
    lesson:
      "Air minum membantu memenuhi kebutuhan cairan saat persediaan air bersih terbatas.",
  },
  {
    id: "food",
    name: "Makanan siap santap",
    emoji: "🥫",
    x: 505,
    y: 400,
    lesson:
      "Pilih makanan tahan lama yang dapat dimakan tanpa memasak. Periksa kedaluwarsa bersama orang dewasa.",
  },
  {
    id: "first-aid",
    name: "Kotak P3K",
    emoji: "🩹",
    x: 900,
    y: 492,
    lesson:
      "Perlengkapan P3K membantu pertolongan pertama. Gunakan dengan pendampingan orang dewasa.",
  },
  {
    id: "flashlight",
    name: "Senter",
    emoji: "🔦",
    x: 1500,
    y: 492,
    lesson:
      "Senter membantu saat listrik padam. Siapkan juga baterai cadangan bersama keluarga.",
  },
] as const;
export const MINANG_CHECKPOINTS = [
  { id: "pos-1", name: "Pos 1", x: 1270 },
  { id: "pos-2", name: "Pos 2", x: 2580 },
  { id: "pos-3", name: "Pos 3", x: 3880 },
] as const;
export const MINANG_PICKUPS = [
  { id: "water-1", type: "water", x: 260, y: 492 },
  { id: "food-1", type: "food", x: 505, y: 400 },
  { id: "first-aid-1", type: "first-aid", x: 900, y: 492 },
  { id: "flashlight-1", type: "flashlight", x: 1500, y: 492 },
  { id: "water-2", type: "water", x: 1715, y: 395 },
  { id: "food-2", type: "food", x: 2150, y: 492 },
  { id: "first-aid-2", type: "first-aid", x: 2945, y: 400 },
  { id: "flashlight-2", type: "flashlight", x: 3400, y: 492 },
  { id: "water-3", type: "water", x: 4330, y: 395 },
  { id: "food-3", type: "food", x: 4650, y: 492 },
] as const;
export const MINANG_TARGET = MINANG_PICKUPS.length;
export const MINANG_PLATFORMS = [
  { x: 0, y: 520, width: 1100, height: 240, kind: "ground" },
  { x: 1200, y: 520, width: 1200, height: 240, kind: "ground" },
  { x: 2510, y: 520, width: 1190, height: 240, kind: "ground" },
  { x: 3810, y: 520, width: 1190, height: 240, kind: "ground" },
  { x: 430, y: 430, width: 150, height: 20, kind: "wood" },
  { x: 1630, y: 425, width: 170, height: 20, kind: "wood" },
  { x: 2860, y: 430, width: 170, height: 20, kind: "wood" },
  { x: 4240, y: 425, width: 180, height: 20, kind: "wood" },
] as const;

export type MinangInput = {
  left: boolean;
  right: boolean;
  jump: boolean;
  enabled: boolean;
  jumpQueued?: boolean;
};
export type MinangSnapshot = {
  items: string[];
  collectedPickups: string[];
  checkpoints: string[];
  reachedGoal: boolean;
  falls: number;
  activeMs: number;
  completed: boolean;
};
export type MinangState = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  onGround: boolean;
  facing: number;
  coyote: number;
  jumpBuffer: number;
  jumpHeld: boolean;
  elapsedMs: number;
  items: string[];
  collectedPickups: string[];
  checkpoints: string[];
  falls: number;
  won: boolean;
  goalNotified: boolean;
};
export type MinangEvent = {
  type: "jump" | "item" | "checkpoint" | "fall" | "missing" | "win";
  message: string;
  x?: number;
  y?: number;
};

export function createMinangState(): MinangState {
  return {
    x: 80,
    y: MINANG_GROUND_Y - 48,
    vx: 0,
    vy: 0,
    onGround: true,
    facing: 1,
    coyote: 0.1,
    jumpBuffer: 0,
    jumpHeld: false,
    elapsedMs: 0,
    items: [],
    collectedPickups: [],
    checkpoints: [],
    falls: 0,
    won: false,
    goalNotified: false,
  };
}

export function isMinangComplete(
  result: Pick<MinangSnapshot, "items" | "checkpoints" | "reachedGoal"> & {
    collectedPickups?: string[];
  },
): boolean {
  return (
    result.reachedGoal &&
    MINANG_PICKUPS.every((pickup) =>
      result.collectedPickups?.includes(pickup.id),
    ) &&
    MINANG_ITEMS.every((item) => result.items.includes(item.id)) &&
    MINANG_CHECKPOINTS.every((pos) => result.checkpoints.includes(pos.id))
  );
}

export function getMinangSnapshot(state: MinangState): MinangSnapshot {
  const result = {
    items: [...state.items],
    collectedPickups: [...state.collectedPickups],
    checkpoints: [...state.checkpoints],
    reachedGoal: state.x >= MINANG_GOAL_X && state.onGround,
    falls: state.falls,
    activeMs: Math.floor(state.elapsedMs),
  };
  return { ...result, completed: isMinangComplete(result) };
}

export function returnToMinangCheckpoint(
  state: MinangState,
  id = "start",
): boolean {
  const checkpoint = MINANG_CHECKPOINTS.find((pos) => pos.id === id);
  if (id !== "start" && (!checkpoint || !state.checkpoints.includes(id)))
    return false;
  state.x = checkpoint?.x ?? 80;
  state.y = MINANG_GROUND_Y - 48;
  state.vx = 0;
  state.vy = 0;
  state.onGround = true;
  state.coyote = 0.1;
  state.jumpBuffer = 0;
  state.jumpHeld = false;
  state.goalNotified = false;
  return true;
}

// Called at a fixed 60 Hz; speed, collisions and jumps are independent of the
// display refresh rate. Holding jump cannot repeatedly launch the character.
export function stepMinang(
  state: MinangState,
  input: MinangInput,
  dt = 1 / 60,
): MinangEvent[] {
  if (!input.enabled || state.won) {
    input.jumpQueued = false;
    state.jumpHeld = false;
    state.jumpBuffer = 0;
    return [];
  }
  dt = Math.min(1 / 30, Math.max(0, dt));
  state.elapsedMs += dt * 1000;
  const events: MinangEvent[] = [];
  const direction = Number(input.right) - Number(input.left);
  const desired = direction * MINANG_SPEED;
  const change = (direction ? 1800 : 3200) * dt;
  state.vx += Math.max(-change, Math.min(change, desired - state.vx));
  if (direction) state.facing = direction;
  state.coyote = state.onGround ? 0.1 : Math.max(0, state.coyote - dt);
  state.jumpBuffer =
    input.jumpQueued || (input.jump && !state.jumpHeld)
      ? 0.14
      : Math.max(0, state.jumpBuffer - dt);
  input.jumpQueued = false;
  state.jumpHeld = input.jump;
  if (state.jumpBuffer > 0 && state.coyote > 0) {
    state.vy = -590;
    state.onGround = false;
    state.coyote = 0;
    state.jumpBuffer = 0;
    events.push({ type: "jump", message: "" });
  }
  state.x += state.vx * dt;
  for (const p of MINANG_PLATFORMS) {
    if (p.kind === "wood") continue;
    if (
      state.x + 15 > p.x &&
      state.x - 15 < p.x + p.width &&
      state.y + 48 > p.y &&
      state.y < p.y + p.height
    ) {
      if (state.vx > 0) state.x = p.x - 15;
      else if (state.vx < 0) state.x = p.x + p.width + 15;
      state.vx = 0;
    }
  }
  state.x = Math.max(20, Math.min(MINANG_WORLD_WIDTH - 20, state.x));
  const oldY = state.y;
  state.vy = Math.min(900, state.vy + 1450 * dt);
  state.y += state.vy * dt;
  state.onGround = false;
  for (const p of MINANG_PLATFORMS) {
    if (state.x + 15 <= p.x || state.x - 15 >= p.x + p.width) continue;
    if (state.vy >= 0 && oldY + 48 <= p.y + 0.1 && state.y + 48 >= p.y) {
      state.y = p.y - 48;
      state.vy = 0;
      state.onGround = true;
    } else if (
      state.vy < 0 &&
      p.kind !== "wood" &&
      oldY >= p.y + p.height - 0.1 &&
      state.y < p.y + p.height
    ) {
      state.y = p.y + p.height;
      state.vy = 0;
    }
  }
  if (state.y > MINANG_HEIGHT + 80) {
    state.falls++;
    const checkpoint =
      state.checkpoints[state.checkpoints.length - 1] ?? "start";
    returnToMinangCheckpoint(state, checkpoint);
    events.push({
      type: "fall",
      message: "Yuk, coba lagi dari pos terakhir. Perlengkapanmu tetap dibawa.",
    });
  }
  for (const pickup of MINANG_PICKUPS) {
    const item = MINANG_ITEMS.find(
      (candidate) => candidate.id === pickup.type,
    )!;
    if (
      !state.collectedPickups.includes(pickup.id) &&
      Math.abs(state.x - pickup.x) < 33 &&
      state.y + 48 > pickup.y - 15 &&
      state.y < pickup.y + 15
    ) {
      const first = !state.items.includes(item.id);
      if (first) state.items.push(item.id);
      state.collectedPickups.push(pickup.id);
      events.push({
        type: "item",
        message: first
          ? `${item.name} sudah dibawa. ${item.lesson}`
          : `${item.name} tambahan sudah dibawa. ${state.collectedPickups.length} dari ${MINANG_TARGET} perlengkapan terkumpul.`,
        x: pickup.x,
        y: pickup.y,
      });
    }
  }
  const nextPos = MINANG_CHECKPOINTS[state.checkpoints.length];
  if (nextPos && state.onGround && state.x >= nextPos.x) {
    state.checkpoints.push(nextPos.id);
    events.push({
      type: "checkpoint",
      message: `${nextPos.name} tercapai! Jika jatuh, kamu kembali ke sini dengan perlengkapanmu.`,
    });
  }
  if (state.x < MINANG_GOAL_X - 120) state.goalNotified = false;
  if (state.x >= MINANG_GOAL_X && state.onGround) {
    const snapshot = getMinangSnapshot(state);
    if (snapshot.completed) {
      state.won = true;
      events.push({
        type: "win",
        message: "Perlengkapan lengkap dan semua pos sudah dilewati!",
      });
    } else if (!state.goalNotified) {
      state.goalNotified = true;
      const missing = MINANG_TARGET - state.collectedPickups.length;
      events.push({
        type: "missing",
        message: `Masih perlu ${missing ? `${missing} perlengkapan (termasuk yang di atas papan kayu)` : "melewati semua pos"}. Buka Jeda untuk kembali ke pos sebelumnya dan melanjutkan pencarian.`,
      });
    }
  }
  return events;
}
