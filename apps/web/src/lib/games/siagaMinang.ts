export const MINANG_GAME_ID = "siaga-minang";
export const MINANG_XP = 20;
export const MINANG_VERSION = 2;
export const MINANG_WORLD_WIDTH = 5000;
export const MINANG_HEIGHT = 600;
export const MINANG_GROUND_Y = 520;
export const MINANG_HERO_HEIGHT = 96;
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
  {
    id: "power-bank",
    name: "Pengisi daya portabel",
    emoji: "🔋",
    x: 1715,
    y: 395,
    lesson:
      "Pengisi daya portabel membantu menjaga alat komunikasi tetap menyala. Siapkan dayanya bersama keluarga.",
  },
  {
    id: "raincoat",
    name: "Jas hujan",
    emoji: "🧥",
    x: 2150,
    y: 492,
    lesson:
      "Jas hujan membantu melindungi tubuh dari hujan saat mengikuti pendamping menuju tempat aman.",
  },
  {
    id: "mask",
    name: "Masker",
    emoji: "😷",
    x: 2945,
    y: 400,
    lesson:
      "Masker membantu mengurangi debu yang terhirup. Pilih ukuran yang sesuai bersama pendamping.",
  },
  {
    id: "blanket",
    name: "Selimut",
    emoji: "🛏️",
    x: 3400,
    y: 492,
    lesson:
      "Selimut membantu menjaga tubuh tetap hangat saat beristirahat di tempat pengungsian.",
  },
  {
    id: "whistle",
    name: "Peluit",
    emoji: "📣",
    x: 4330,
    y: 395,
    lesson:
      "Peluit bisa membantu memberi tanda saat membutuhkan bantuan. Gunakan sesuai arahan pendamping.",
  },
  {
    id: "radio",
    name: "Radio portabel",
    emoji: "📻",
    x: 4650,
    y: 492,
    lesson:
      "Radio membantu keluarga mendengarkan informasi petugas saat jaringan komunikasi terbatas.",
  },
] as const;
export const MINANG_CHECKPOINTS = [
  { id: "pos-1", name: "Pos 1", x: 1270 },
  { id: "pos-2", name: "Pos 2", x: 2580 },
  { id: "pos-3", name: "Pos 3", x: 4760 },
] as const;
export const MINANG_PICKUPS = [
  { id: "water-1", type: "water", x: 260, y: 492 },
  { id: "food-1", type: "food", x: 505, y: 400 },
  { id: "first-aid-1", type: "first-aid", x: 900, y: 492 },
  { id: "flashlight-1", type: "flashlight", x: 1500, y: 492 },
  { id: "water-2", type: "power-bank", x: 1715, y: 395 },
  { id: "food-2", type: "raincoat", x: 2150, y: 492 },
  { id: "first-aid-2", type: "mask", x: 2945, y: 400 },
  { id: "flashlight-2", type: "blanket", x: 3400, y: 492 },
  { id: "water-3", type: "whistle", x: 4330, y: 395 },
  { id: "food-3", type: "radio", x: 4650, y: 492 },
] as const;

export const MINANG_BRIDGE = {
  x: 2400,
  y: 520,
  width: 110,
  height: 20,
  switchX: 2310,
};
export const MINANG_LESSONS = [
  {
    id: "pos-1",
    title: "Bekal untuk bersama",
    topic: "Mengenal perlengkapan",
    prompt: "Mengapa kita menyiapkan tas siaga bersama keluarga?",
    options: [
      {
        id: "bekal",
        text: "Agar kebutuhan penting siap dibawa saat mengikuti arahan evakuasi.",
      },
      { id: "mainan", text: "Agar semua mainan bisa dibawa sekaligus." },
      { id: "sendiri", text: "Agar anak bisa pergi sendiri tanpa pendamping." },
    ],
    correct: "bekal",
    explanation:
      "Siapkan kebutuhan penting bersama keluarga. Saat darurat, tetap bersama pendamping dan ikuti arahan petugas.",
  },
  {
    id: "pos-2",
    title: "Pilih jalur yang diarahkan",
    topic: "Mengenali jalur aman",
    prompt:
      "Guncangan sudah berhenti. Pendamping menunjukkan jalur yang aman. Apa pilihanmu?",
    options: [
      {
        id: "retak",
        text: "Mendekati bangunan retak untuk melihat keadaannya.",
      },
      {
        id: "arahan",
        text: "Ikuti pendamping dan jalur yang sudah dinyatakan aman.",
      },
      { id: "lari", text: "Berlari sendiri mencari jalan pintas." },
    ],
    correct: "arahan",
    explanation:
      "Ikuti jalur yang ditentukan pendamping dan petugas. Saklar dan lompatan di sini adalah mekanik permainan, bukan tindakan yang perlu ditiru saat bencana.",
  },
  {
    id: "pos-3",
    title: "Titik kumpul bersama",
    topic: "Mengetahui tempat berkumpul",
    prompt: "Setelah keluar bersama pendamping, di mana sebaiknya menunggu?",
    options: [
      { id: "rumah", text: "Kembali ke rumah untuk mengambil barang." },
      { id: "dinding", text: "Di dekat dinding bangunan yang retak." },
      {
        id: "kumpul",
        text: "Di titik kumpul terbuka yang diarahkan petugas, jauh dari benda yang dapat roboh.",
      },
    ],
    correct: "kumpul",
    explanation:
      "Tunggu bersama pendamping di titik kumpul yang diarahkan petugas. Jangan masuk kembali ke bangunan sebelum dinyatakan aman.",
  },
] as const;
export type MinangAnswer = { questionId: string; optionId: string };

export function answerMinang(state: MinangState, optionId: string) {
  const lesson = MINANG_LESSONS.find((item) => item.id === state.question);
  if (!lesson || !lesson.options.some((option) => option.id === optionId))
    return null;
  const correct = lesson.correct === optionId;
  if (correct) {
    state.answers.push({ questionId: lesson.id, optionId });
    state.question = null;
  }
  return { correct, explanation: lesson.explanation };
}
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
  interactQueued?: boolean;
};
export type MinangSnapshot = {
  version?: number;
  answers?: MinangAnswer[];
  bridgeActivated?: boolean;
  items: string[];
  collectedPickups: string[];
  checkpoints: string[];
  reachedGoal: boolean;
  falls: number;
  activeMs: number;
  completed: boolean;
};
export type MinangState = {
  answers: MinangAnswer[];
  question: string | null;
  bridgeActivated: boolean;
  bridgeNotified: boolean;
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
  type:
    | "jump"
    | "item"
    | "checkpoint"
    | "fall"
    | "missing"
    | "win"
    | "question"
    | "bridge"
    | "guide";
  message: string;
  x?: number;
  y?: number;
  id?: string;
};

export function createMinangState(): MinangState {
  return {
    answers: [],
    question: null,
    bridgeActivated: false,
    bridgeNotified: false,
    x: 80,
    y: MINANG_GROUND_Y - MINANG_HERO_HEIGHT,
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
  result: Pick<
    MinangSnapshot,
    | "items"
    | "checkpoints"
    | "reachedGoal"
    | "version"
    | "answers"
    | "bridgeActivated"
  > & {
    collectedPickups?: string[];
  },
): boolean {
  return (
    result.reachedGoal &&
    MINANG_PICKUPS.every((pickup) =>
      result.collectedPickups?.includes(pickup.id),
    ) &&
    (result.version === MINANG_VERSION
      ? MINANG_ITEMS.map((item) => item.id)
      : ["water", "food", "first-aid", "flashlight"]
    ).every((id) => result.items.includes(id)) &&
    MINANG_CHECKPOINTS.every((pos) => result.checkpoints.includes(pos.id)) &&
    (result.version !== MINANG_VERSION ||
      (result.bridgeActivated === true &&
        result.answers?.length === MINANG_LESSONS.length &&
        MINANG_LESSONS.every(
          (lesson, index) =>
            result.answers?.[index]?.questionId === lesson.id &&
            result.answers?.[index]?.optionId === lesson.correct,
        )))
  );
}

export function getMinangSnapshot(state: MinangState): MinangSnapshot {
  const result = {
    version: MINANG_VERSION,
    answers: state.answers.map((answer) => ({ ...answer })),
    bridgeActivated: state.bridgeActivated,
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
  state.y = MINANG_GROUND_Y - MINANG_HERO_HEIGHT;
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
  if (!input.enabled || state.won || state.question) {
    input.jumpQueued = false;
    state.jumpHeld = false;
    state.jumpBuffer = 0;
    input.interactQueued = false;
    return [];
  }
  dt = Math.min(1 / 30, Math.max(0, dt));
  state.elapsedMs += dt * 1000;
  const events: MinangEvent[] = [];
  if (input.interactQueued) {
    input.interactQueued = false;
    if (
      Math.abs(state.x - MINANG_BRIDGE.switchX) < 180 &&
      !state.bridgeActivated
    ) {
      state.bridgeActivated = true;
      events.push({
        type: "bridge",
        message:
          "Jembatan simulasi sudah dibuka! Lanjutkan mengikuti penanda jalur aman menuju Kak Naya.",
      });
    } else
      events.push({
        type: "guide",
        message:
          "Kak Naya: Ikuti penanda hijau. Saklar simulasi ada sebelum jembatan di Pos 2; dekati lalu tekan Interaksi atau E.",
      });
  }
  const platforms = state.bridgeActivated
    ? [...MINANG_PLATFORMS, { ...MINANG_BRIDGE, kind: "wood" }]
    : MINANG_PLATFORMS;
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
  for (const p of platforms) {
    if (p.kind === "wood") continue;
    if (
      state.x + 15 > p.x &&
      state.x - 15 < p.x + p.width &&
      state.y + MINANG_HERO_HEIGHT > p.y &&
      state.y < p.y + p.height
    ) {
      if (state.vx > 0) state.x = p.x - 15;
      else if (state.vx < 0) state.x = p.x + p.width + 15;
      state.vx = 0;
    }
  }
  state.x = Math.max(20, Math.min(MINANG_WORLD_WIDTH - 20, state.x));
  if (!state.bridgeActivated && state.x > 2360) {
    state.x = 2360;
    state.vx = 0;
    if (!state.bridgeNotified) {
      state.bridgeNotified = true;
      events.push({
        type: "missing",
        message:
          "Dekati saklar, lalu tekan Interaksi atau E untuk membuka jembatan simulasi.",
      });
    }
  }
  const oldY = state.y;
  state.vy = Math.min(900, state.vy + 1450 * dt);
  state.y += state.vy * dt;
  state.onGround = false;
  for (const p of platforms) {
    if (state.x + 15 <= p.x || state.x - 15 >= p.x + p.width) continue;
    if (
      state.vy >= 0 &&
      oldY + MINANG_HERO_HEIGHT <= p.y + 0.1 &&
      state.y + MINANG_HERO_HEIGHT >= p.y
    ) {
      state.y = p.y - MINANG_HERO_HEIGHT;
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
      state.y + MINANG_HERO_HEIGHT > pickup.y - 15 &&
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
  const nextLesson = MINANG_LESSONS[state.answers.length];
  const lessonPos = MINANG_CHECKPOINTS.find((pos) => pos.id === nextLesson?.id);
  if (
    nextLesson &&
    lessonPos &&
    !state.question &&
    state.onGround &&
    state.x >= lessonPos.x &&
    state.checkpoints.includes(lessonPos.id)
  ) {
    state.question = lessonPos.id;
    state.vx = 0;
    events.push({
      type: "question",
      id: lessonPos.id,
      message: "Kak Naya: Kita berhenti sebentar untuk belajar bersama, ya.",
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
