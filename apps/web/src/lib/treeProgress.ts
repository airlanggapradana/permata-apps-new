export interface TreeLevelInfo {
  level: number;
  levelName: string;
  stageName: string;
  stageDescription: string;
  minXp: number;
  targetXp: number;
  icon: string;
  nextLevelName: string;
}

export interface TreeStats extends TreeLevelInfo {
  totalXp: number;
  progressPercent: number;
  journalCount: number;
  waterCount: number;
  breatheCount: number;
  screeningCount?: number;
  moodFoodCount?: number;
  wateredToday: boolean;
}

const TREE_LEVELS: TreeLevelInfo[] = [
  {
    level: 1,
    levelName: "Lv 1: Benih Asa",
    stageName: "Benih Tertanam",
    stageDescription: "Langkah awalan menanam harapan di tanah ketangguhan.",
    minXp: 0,
    targetXp: 250,
    icon: "🌱",
    nextLevelName: "Lv 2: Tunas Muda",
  },
  {
    level: 2,
    levelName: "Lv 2: Tunas Muda",
    stageName: "Ketangguhan Bertunas",
    stageDescription: "Setiap kata refleksi adalah tetesan air bagi jiwamu.",
    minXp: 250,
    targetXp: 500,
    icon: "🌿",
    nextLevelName: "Lv 3: Tunas Mekar",
  },
  {
    level: 3,
    levelName: "Lv 3: Tunas Mekar",
    stageName: "Kuncup Kebaikan",
    stageDescription: "Pohon jiwamu mulai bercabang dan menaungi kecemasan.",
    minXp: 500,
    targetXp: 850,
    icon: "🌸",
    nextLevelName: "Lv 4: Pohon Rindang",
  },
  {
    level: 4,
    levelName: "Lv 4: Pohon Rindang",
    stageName: "Dahan Ketabahan",
    stageDescription: "Akar ketabahanmu semakin dalam menembus rasa takut.",
    minXp: 850,
    targetXp: 1300,
    icon: "🌲",
    nextLevelName: "Lv 5: Rimba Mandiri",
  },
  {
    level: 5,
    levelName: "Lv 5: Rimba Mandiri",
    stageName: "Rimba Resiliensi Mandiri",
    stageDescription: "Ketangguhan jiwamu telah menjadi tempat berteduh bagi teman-teman di posko.",
    minXp: 1300,
    targetXp: 2000,
    icon: "🌳",
    nextLevelName: "Tingkat Tertinggi",
  },
];

export function calculateTreeStats(params: {
  journalCount: number;
  waterCount: number;
  breatheCount: number;
  screeningCount?: number;
  moodFoodCount?: number;
  wateredToday: boolean;
}): TreeStats {
  const { journalCount, waterCount, breatheCount, screeningCount = 0, moodFoodCount = 0, wateredToday } = params;

  // Base XP: 150 (initial sprout starter)
  const baseXp = 150;
  const journalXp = journalCount * 50;
  const waterXp = waterCount * 20;
  const breatheXp = breatheCount * 15;
  const screeningXp = screeningCount * 100;
  const moodFoodXp = moodFoodCount * 40;

  const totalXp = baseXp + journalXp + waterXp + breatheXp + screeningXp + moodFoodXp;

  // Find level tier
  let levelInfo = TREE_LEVELS[0];
  for (let i = TREE_LEVELS.length - 1; i >= 0; i--) {
    if (totalXp >= TREE_LEVELS[i].minXp) {
      levelInfo = TREE_LEVELS[i];
      break;
    }
  }

  // Calculate percentage within the current level
  const range = levelInfo.targetXp - levelInfo.minXp;
  const currentInLevel = Math.max(0, totalXp - levelInfo.minXp);
  const rawPercent = Math.round((currentInLevel / range) * 100);
  const progressPercent = Math.min(100, Math.max(5, rawPercent));

  return {
    ...levelInfo,
    totalXp,
    progressPercent,
    journalCount,
    waterCount,
    breatheCount,
    screeningCount,
    moodFoodCount,
    wateredToday,
  };
}
