export const QUAKE_GAME_ID = "sigap-bencana";
export const QUAKE_XP = 20;
export const QUAKE_WIDTH = 2850;
export const QUAKE_HEIGHT = 620;
export const QUAKE_FLOOR = 500;
export const QUAKE_EXIT = 2730;
export const QUAKE_SPEED = 255;
export const QUAKE_MIN_MS = 9000;
export const QUAKE_SOURCE =
  "https://www.bmkg.go.id/gempabumi/mitigasi/antisipasi-gempabumi";

export const QUAKE_LESSONS = [
  {
    id: "berlindung",
    room: "Ruang tamu",
    x: 390,
    title: "Saat guncangan terasa",
    prompt:
      "Dalam skenario ini, kamu berada dekat meja kokoh ketika guncangan terasa. Apa pilihanmu?",
    options: [
      { id: "jendela", text: "Berdiri di dekat jendela untuk melihat keluar." },
      {
        id: "lindungi",
        text: "Merunduk, berlindung di bawah meja kokoh, lindungi kepala dan leher, lalu berpegangan.",
      },
      { id: "berlari", text: "Berlari melintasi rumah saat masih berguncang." },
    ],
    correct: "lindungi",
    explanation:
      "Merunduk, berlindung, dan berpegangan membantu melindungi diri. Tetap berlindung hingga guncangan berhenti; jauhi kaca dan benda yang dapat jatuh.",
  },
  {
    id: "keluar",
    room: "Koridor",
    x: 1240,
    title: "Guncangan sudah berhenti",
    prompt:
      "Guncangan telah berhenti. Pendamping mengajak keluar melalui jalur yang aman. Apa yang kamu lakukan?",
    options: [
      { id: "barang", text: "Kembali mengambil semua barang di kamar." },
      { id: "bergegas", text: "Berlari dan saling mendahului di pintu." },
      {
        id: "tenang",
        text: "Ikuti pendamping dengan tenang, perhatikan jalur, dan jauhi pecahan kaca.",
      },
    ],
    correct: "tenang",
    explanation:
      "Setelah guncangan berhenti, keluar dengan tertib melalui jalur aman bersama pendamping. Perhatikan benda yang jatuh dan hindari menggunakan lift.",
  },
  {
    id: "berkumpul",
    room: "Dekat pintu keluar",
    x: 2110,
    title: "Menuju titik kumpul",
    prompt: "Kamu sudah keluar bersama pendamping. Di mana sebaiknya menunggu?",
    options: [
      {
        id: "terbuka",
        text: "Di titik kumpul terbuka, menjauh dari bangunan, pohon, dan tiang listrik.",
      },
      { id: "dinding", text: "Menempel pada dinding luar rumah yang retak." },
      {
        id: "kembali",
        text: "Masuk lagi sebelum ada arahan bahwa bangunan aman.",
      },
    ],
    correct: "terbuka",
    explanation:
      "Tunggu bersama pendamping di titik kumpul yang aman dari benda yang dapat roboh. Perhatikan arahan petugas dan jangan masuk kembali ke bangunan yang rusak.",
  },
] as const;

export const QUAKE_OBSTACLES = [
  { x: 790, width: 58, height: 38 },
  { x: 1630, width: 60, height: 44 },
  { x: 2390, width: 58, height: 38 },
] as const;
export type QuakeInput = {
  left: boolean;
  right: boolean;
  jump: boolean;
  jumpQueued?: boolean;
  enabled: boolean;
};
export type QuakeAnswer = { questionId: string; optionId: string };
export type QuakeSnapshot = {
  answers: QuakeAnswer[];
  rooms: string[];
  mistakes: number;
  activeMs: number;
  reachedExit: boolean;
  completed: boolean;
};
export type QuakeState = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  grounded: boolean;
  facing: number;
  jumpHeld: boolean;
  jumpBuffer: number;
  coyote: number;
  elapsed: number;
  question: string | null;
  answers: QuakeAnswer[];
  rooms: string[];
  mistakes: number;
  won: boolean;
};
export type QuakeEvent = { type: "question" | "jump" | "exit"; id?: string };

export function createQuakeState(): QuakeState {
  return {
    x: 100,
    y: QUAKE_FLOOR - 48,
    vx: 0,
    vy: 0,
    grounded: true,
    facing: 1,
    jumpHeld: false,
    jumpBuffer: 0,
    coyote: 0.1,
    elapsed: 0,
    question: null,
    answers: [],
    rooms: [],
    mistakes: 0,
    won: false,
  };
}
export function isQuakeComplete(
  result: Pick<QuakeSnapshot, "answers" | "rooms" | "reachedExit">,
) {
  return (
    result.reachedExit &&
    QUAKE_LESSONS.every(
      (lesson, index) =>
        result.rooms[index] === lesson.id &&
        result.answers[index]?.questionId === lesson.id &&
        result.answers[index]?.optionId === lesson.correct,
    )
  );
}
export function quakeSnapshot(state: QuakeState): QuakeSnapshot {
  const snapshot = {
    answers: state.answers.map((answer) => ({ ...answer })),
    rooms: [...state.rooms],
    mistakes: state.mistakes,
    activeMs: Math.floor(state.elapsed),
    reachedExit: state.x >= QUAKE_EXIT && state.grounded,
  };
  return { ...snapshot, completed: isQuakeComplete(snapshot) };
}
export function answerQuake(state: QuakeState, optionId: string) {
  const lesson = QUAKE_LESSONS.find((item) => item.id === state.question);
  if (!lesson || !lesson.options.some((option) => option.id === optionId))
    return null;
  const correct = optionId === lesson.correct;
  if (correct) {
    state.answers.push({ questionId: lesson.id, optionId });
    state.question = null;
  } else state.mistakes++;
  return { correct, explanation: lesson.explanation };
}
export function revisitQuakeRoom(state: QuakeState) {
  const lesson = QUAKE_LESSONS[state.answers.length - 1];
  state.x = lesson ? lesson.x + 85 : 100;
  state.y = QUAKE_FLOOR - 48;
  state.vx = state.vy = state.jumpBuffer = 0;
  state.grounded = true;
  state.jumpHeld = false;
  state.coyote = 0.1;
}
export function stepQuake(
  state: QuakeState,
  input: QuakeInput,
  dt = 1 / 60,
): QuakeEvent[] {
  const events: QuakeEvent[] = [];
  if (!input.enabled || state.question || state.won) return events;
  state.elapsed += dt * 1000;
  state.coyote = state.grounded ? 0.1 : Math.max(0, state.coyote - dt);
  if ((input.jump && !state.jumpHeld) || input.jumpQueued)
    state.jumpBuffer = 0.14;
  else state.jumpBuffer = Math.max(0, state.jumpBuffer - dt);
  state.jumpHeld = input.jump;
  input.jumpQueued = false;
  const direction = Number(input.right) - Number(input.left);
  const target = direction * QUAKE_SPEED;
  state.vx +=
    Math.sign(target - state.vx) *
    Math.min(Math.abs(target - state.vx), (direction ? 1900 : 2700) * dt);
  if (direction) state.facing = direction;
  if (state.jumpBuffer > 0 && state.coyote > 0) {
    state.vy = -530;
    state.jumpBuffer = state.coyote = 0;
    state.grounded = false;
    events.push({ type: "jump" });
  }
  const previousX = state.x,
    previousBottom = state.y + 48;
  state.x = Math.min(QUAKE_WIDTH - 18, Math.max(18, state.x + state.vx * dt));
  for (const obstacle of QUAKE_OBSTACLES) {
    if (state.y + 48 <= QUAKE_FLOOR - obstacle.height + 1) continue;
    if (
      state.x + 14 > obstacle.x &&
      state.x - 14 < obstacle.x + obstacle.width
    ) {
      state.x =
        previousX < obstacle.x
          ? obstacle.x - 14
          : obstacle.x + obstacle.width + 14;
      state.vx = 0;
    }
  }
  state.vy += 1450 * dt;
  state.y += state.vy * dt;
  state.grounded = false;
  const surfaces = [
    { x: 0, width: QUAKE_WIDTH, height: 0 },
    ...QUAKE_OBSTACLES,
  ];
  for (const surface of surfaces) {
    const top = QUAKE_FLOOR - surface.height;
    if (
      state.vy >= 0 &&
      previousBottom <= top + 1 &&
      state.y + 48 >= top &&
      state.x + 13 > surface.x &&
      state.x - 13 < surface.x + surface.width
    ) {
      state.y = top - 48;
      state.vy = 0;
      state.grounded = true;
    }
  }
  const nextLesson = QUAKE_LESSONS[state.answers.length];
  if (nextLesson && state.x >= nextLesson.x - 40) {
    state.x = nextLesson.x - 40;
    state.vx = 0;
    if (state.grounded) {
      state.question = nextLesson.id;
      state.rooms.push(nextLesson.id);
      events.push({ type: "question", id: nextLesson.id });
    }
  }
  if (
    state.x >= QUAKE_EXIT &&
    state.grounded &&
    state.answers.length === QUAKE_LESSONS.length
  ) {
    state.won = true;
    events.push({ type: "exit" });
  }
  return events;
}
