import {
  getRoleplayScenario,
  replayRoleplay,
  type RoleplayAnswer,
} from "./roleplay";

export const ROLEPLAY_MOODS = {
  worried: "Masih khawatir",
  hesitant: "Butuh sedikit ruang",
  sad: "Sedang rindu",
  listening: "Sedang mendengarkan",
  thoughtful: "Memikirkan pilihan",
  supported: "Bersama pendamping",
} as const;
export type RoleplayMood = keyof typeof ROLEPLAY_MOODS;
type ScenePresentation = { mood: RoleplayMood; intro: string };

// Presentation metadata only: existing versioned node/option IDs remain unchanged.
const SCENES: Record<string, Record<string, ScenePresentation>> = {
  "teman-di-posko": {
    sapa: {
      mood: "worried",
      intro: "Di balai, {friend} duduk sendiri setelah mendengar suara hujan.",
    },
    ruang: {
      mood: "hesitant",
      intro: "{friend} belum ingin bercerita. Kamu bisa memberi sedikit ruang.",
    },
    dengar: {
      mood: "worried",
      intro: "{friend} mulai menyampaikan apa yang ia rasakan.",
    },
    jujur: {
      mood: "thoughtful",
      intro:
        "Tawarkan hal yang bisa kamu lakukan sekarang, bersama pendamping.",
    },
    pilihan: {
      mood: "listening",
      intro:
        "Pendamping ada di dekat kalian. {friend} ingin memilih langkah berikutnya.",
    },
    hubungkan: {
      mood: "supported",
      intro:
        "Pendamping mendekat. Kamu bisa membantu teman menyampaikan kebutuhannya.",
    },
    selesai: {
      mood: "supported",
      intro:
        "Kalian sudah menemukan pendamping untuk menemani langkah berikutnya.",
    },
  },
  "rindu-rumah": {
    sapa: {
      mood: "sad",
      intro: "{friend} memegang gambar rumah di meja kegiatan balai.",
    },
    ruang: {
      mood: "hesitant",
      intro:
        "{friend} masih ingin menyimpan gambarnya. Percakapan bisa dimulai perlahan.",
    },
    kenangan: {
      mood: "sad",
      intro:
        "{friend} menceritakan tempat ia biasa menggambar sepulang sekolah.",
    },
    pilihan: {
      mood: "thoughtful",
      intro:
        "Ada kertas, pensil, dan tempat beristirahat. Biarkan teman memilih.",
    },
    hubungkan: {
      mood: "supported",
      intro: "Pendamping mendekat dan ingin mendengarkan kebutuhan kalian.",
    },
    selesai: {
      mood: "supported",
      intro:
        "Rasa rindu masih boleh ada. Sekarang {friend} tahu siapa yang bisa menemani.",
    },
  },
  "tenang-bersama": {
    sapa: {
      mood: "worried",
      intro:
        "Guncangan sudah berhenti. Ikuti pendamping menuju titik kumpul bersama {friend}.",
    },
    ruang: {
      mood: "hesitant",
      intro:
        "Pendamping menunggu di jalur yang ditentukan. Ikuti arahan bersama.",
    },
    dengar: {
      mood: "worried",
      intro: "Kalian sudah di titik kumpul. {friend} masih merasa kaget.",
    },
    jeda: {
      mood: "hesitant",
      intro: "{friend} ingin duduk sebentar di dekat orang dewasa.",
    },
    pilihan: {
      mood: "thoughtful",
      intro:
        "Pendamping sudah mengetahui keadaan kalian. Tawarkan kegiatan yang boleh ditolak.",
    },
    hubungkan: {
      mood: "supported",
      intro: "Pendamping menanyakan apa yang {friend} perlukan.",
    },
    selesai: {
      mood: "supported",
      intro: "{friend} memilih tetap dekat dengan pendamping.",
    },
  },
  "kabar-di-posko": {
    sapa: {
      mood: "worried",
      intro:
        "{friend} mendengar kabar yang membuatnya takut. Sumbernya belum jelas.",
    },
    ruang: {
      mood: "thoughtful",
      intro:
        "Belum ada arahan baru. Kalian bisa memeriksa kabarnya lebih dulu.",
    },
    periksa: {
      mood: "hesitant",
      intro:
        "Petugas informasi dan pendamping bisa membantu kalian memeriksa kabar.",
    },
    "dengar-arahan": {
      mood: "listening",
      intro:
        "Dalam cerita ini, petugas menjelaskan arahan terbaru kepada kalian.",
    },
    bagikan: {
      mood: "thoughtful",
      intro:
        "Teman lain menanyakan kabarnya. Bagikan sumber yang bisa diperiksa.",
    },
    selesai: {
      mood: "supported",
      intro:
        "Sekarang kalian mengenali tempat bertanya saat mendengar kabar yang belum jelas.",
    },
  },
};

export function getRoleplayScene(
  scenarioId: string,
  nodeId: string,
): ScenePresentation {
  return (
    SCENES[scenarioId]?.[nodeId] ?? {
      mood: "listening",
      intro:
        getRoleplayScenario(scenarioId)?.nodes.find(
          (node) => node.id === nodeId,
        )?.situation ?? "Ambil waktu untuk mendengarkan temanmu.",
    }
  );
}

export type RoleplayReflection = {
  id: string;
  title: string;
  choice: string;
  explanation: string;
  adjusted: boolean;
};

const REFLECTION_TITLES: Record<string, string> = {
  "Meminta izin": "Memberi teman kesempatan memilih",
  "Menghargai batas": "Menghargai ruang yang dibutuhkan",
  Mendengarkan: "Memberi ruang untuk didengarkan",
  "Berbicara jujur": "Menawarkan langkah yang nyata",
  "Memberi pilihan": "Menanyakan apa yang nyaman",
  "Mencari bantuan": "Berbagi dukungan dengan pendamping",
  "Mengikuti arahan": "Mengutamakan arahan keselamatan",
  "Memeriksa informasi": "Memeriksa kabar sebelum bertindak",
  "Berbagi dengan hati-hati": "Menyampaikan kabar beserta sumbernya",
};

/** Derive examples from a validated completed path, including gentle retries.
 * We never praise a less supportive choice or infer the player's mental state. */
export function getRoleplayReflections(
  scenarioId: string,
  answers: RoleplayAnswer[],
): RoleplayReflection[] {
  const replay = replayRoleplay(scenarioId, answers);
  if (!replay?.completed) return [];
  const candidates: (RoleplayReflection & { order: number })[] = [];
  for (const [order, answer] of answers.entries()) {
    const node = replay.scenario.nodes.find(
      (item) => item.id === answer.nodeId,
    )!;
    const selected = node.options.find((item) => item.id === answer.optionId)!;
    const next = replay.scenario.nodes.find(
      (item) => item.id === selected.next,
    )!;
    // A same-stage transition opens a gentle-redirection scene. Reflect on the
    // subsequent repair rather than presenting that first choice as a success.
    if (next.stage === node.stage) continue;
    const previous = answers[order - 1];
    const previousNode = previous
      ? replay.scenario.nodes.find((item) => item.id === previous.nodeId)
      : undefined;
    candidates.push({
      id: `${node.id}:${selected.id}`,
      title: REFLECTION_TITLES[selected.skill] ?? selected.skill,
      choice: selected.text,
      explanation: selected.explanation,
      adjusted: previousNode?.stage === node.stage,
      order,
    });
  }
  if (!candidates.length) return [];
  // Highlight an adjustment, the opening and the closing support, capped at
  // three examples. Preserve chronological order when presenting them.
  const prioritized = [
    ...candidates.filter((item) => item.adjusted),
    candidates[0],
    candidates[candidates.length - 1],
    ...candidates,
  ];
  const chosen = new Map<string, (typeof candidates)[number]>();
  for (const item of prioritized) {
    if (!chosen.has(item.id)) chosen.set(item.id, item);
    if (chosen.size === 3) break;
  }
  return Array.from(chosen.values())
    .sort((left, right) => left.order - right.order)
    .map(({ id, title, choice, explanation, adjusted }) => ({
      id,
      title,
      choice,
      explanation,
      adjusted,
    }));
}
