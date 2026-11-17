export const BAG_GAME_ID = "emergency-bag";
export const BAG_GAME_XP = 20;
export const BAG_CHALLENGE_SECONDS = 60;
export type BagMode = "practice" | "challenge";

export const BAG_ITEMS = [
  {
    id: "water",
    name: "Air minum",
    emoji: "💧",
    essential: true,
    lesson:
      "Air minum membantu memenuhi kebutuhan cairan saat persediaan air bersih terbatas.",
  },
  {
    id: "toy",
    name: "Boneka kesayangan",
    emoji: "🧸",
    essential: false,
    lesson:
      "Boneka boleh menjadi barang tambahan jika masih ada ruang. Lengkapi kebutuhan utama terlebih dahulu, ya.",
  },
  {
    id: "flashlight",
    name: "Senter",
    emoji: "🔦",
    essential: true,
    lesson:
      "Senter membantu menerangi jalan ketika listrik padam. Siapkan juga baterai cadangan.",
  },
  {
    id: "food",
    name: "Makanan siap santap",
    emoji: "🥫",
    essential: true,
    lesson:
      "Pilih makanan tahan lama yang bisa dimakan tanpa memasak. Periksa tanggal kedaluwarsanya bersama orang dewasa.",
  },
  {
    id: "game",
    name: "Konsol permainan",
    emoji: "🎮",
    essential: false,
    lesson:
      "Untuk tas ini, dahulukan perlengkapan keselamatan. Konsol permainan bisa ditinggalkan dulu.",
  },
  {
    id: "first-aid",
    name: "Kotak P3K",
    emoji: "🩹",
    essential: true,
    lesson:
      "Kotak P3K berisi perlengkapan pertolongan pertama. Minta bantuan orang dewasa saat menggunakannya.",
  },
  {
    id: "raincoat",
    name: "Jas hujan",
    emoji: "🧥",
    essential: true,
    lesson:
      "Jas hujan membantu melindungi tubuh dari hujan saat menuju tempat aman.",
  },
  {
    id: "mask",
    name: "Masker",
    emoji: "😷",
    essential: true,
    lesson:
      "Masker membantu mengurangi debu yang terhirup. Gunakan ukuran yang sesuai dan ikuti arahan pendamping.",
  },
] as const;

export const BAG_ESSENTIAL_IDS: string[] = BAG_ITEMS.filter(
  (item) => item.essential,
).map((item) => item.id);

export function isBagComplete(ids: string[]): boolean {
  return BAG_ESSENTIAL_IDS.every((id) => ids.includes(id));
}
