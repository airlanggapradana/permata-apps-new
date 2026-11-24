import {
  ROLEPLAY_MOODS,
  type RoleplayMood,
} from "@/lib/games/roleplayPresentation";
import {
  ROLEPLAY_CHARACTERS,
  type RoleplayCharacterId,
} from "@/lib/games/roleplay";

export const ROLEPLAY_CHARACTER_ATLAS = "/images/roleplay/characters-v2.webp";

const expressionColumns: Record<RoleplayMood, number> = {
  worried: 0,
  hesitant: 0,
  sad: 1,
  listening: 2,
  thoughtful: 2,
  supported: 3,
};

export default function RoleplayPortrait({
  character,
  mood,
  className = "h-16 w-16",
}: {
  character: RoleplayCharacterId;
  mood: RoleplayMood;
  className?: string;
}) {
  const person = ROLEPLAY_CHARACTERS[character];
  return (
    <div
      role="img"
      aria-label={`${person.name}: ${ROLEPLAY_MOODS[mood]}`}
      data-roleplay-character={character}
      data-roleplay-mood={mood}
      className={`shrink-0 overflow-hidden rounded-2xl bg-[#f0f6fa] ${className}`}
      style={{
        backgroundImage: `url('${ROLEPLAY_CHARACTER_ATLAS}')`,
        backgroundSize: "400% 700%",
        backgroundPosition: `${(expressionColumns[mood] / 3) * 100}% ${(person.row / 6) * 100}%`,
        backgroundRepeat: "no-repeat",
        // Fade the cell's lower edge so neighboring artwork cannot bleed in.
        maskImage: "linear-gradient(to bottom, #000 94%, transparent 97%)",
      }}
    />
  );
}
