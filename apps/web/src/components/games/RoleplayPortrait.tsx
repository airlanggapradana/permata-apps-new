import {
  ROLEPLAY_MOODS,
  type RoleplayMood,
} from "@/lib/games/roleplayPresentation";
import type { RoleplayCulture } from "@/lib/games/roleplay";

const expressions: Record<
  RoleplayMood,
  { eyebrows: string; eyes: string; mouth: string }
> = {
  worried: {
    eyebrows: "M50 59l15-6m27 0 15 6",
    eyes: "M57 66v6m43-6v6",
    mouth: "M68 91q10-8 20 0",
  },
  hesitant: {
    eyebrows: "M49 56h16m27-2 15 6",
    eyes: "M57 66v5m43-5v5",
    mouth: "M70 89h17",
  },
  sad: {
    eyebrows: "M49 59l16-5m27 0 16 5",
    eyes: "M52 70q5-4 10 0m33 0q5-4 10 0",
    mouth: "M69 93q9-8 18 0",
  },
  listening: {
    eyebrows: "M49 55q8-4 16-1m27 0q8-3 16 1",
    eyes: "M57 66v5m43-5v5",
    mouth: "M69 87q9 4 18 0",
  },
  thoughtful: {
    eyebrows: "M49 56h16m27-3 16 3",
    eyes: "M58 65v5m43-5v5",
    mouth: "M71 88h13",
  },
  supported: {
    eyebrows: "M49 55q8-3 16 0m27 0q8-3 16 0",
    eyes: "M52 70q5-5 10 0m33 0q5-5 10 0",
    mouth: "M68 86q10 11 20 0",
  },
};

export default function RoleplayPortrait({
  culture,
  mood,
  className = "h-16 w-16",
}: {
  culture: RoleplayCulture;
  mood: RoleplayMood;
  className?: string;
}) {
  const face = expressions[mood];
  const skin = culture === "aceh" ? "#dca47d" : "#c58966";
  return (
    <div
      className={`shrink-0 overflow-hidden rounded-2xl bg-tint ${className}`}
      data-roleplay-mood={mood}
    >
      <svg
        viewBox="0 0 160 160"
        className="h-full w-full"
        role="img"
        aria-label={`${culture === "aceh" ? "Rafi" : "Lala"}: ${ROLEPLAY_MOODS[mood]}`}
      >
        <circle cx="80" cy="80" r="73" fill="var(--brand-50)" />
        {culture === "kalimantan" && (
          <path d="M34 59c-3-63 95-65 92 0l8 52H26Z" fill="var(--brand-900)" />
        )}
        <path d="M32 161v-33c0-45 96-45 96 0v33" fill="var(--brand-600)" />
        <path d="M68 97v14q12 12 24 0V97" fill={skin} />
        <ellipse cx="79" cy="66" rx="43" ry="46" fill={skin} />
        <path
          d={
            culture === "aceh"
              ? "M35 61C25 8 117 0 123 59L99 37 64 47Z"
              : "M35 61C24 5 123-1 123 61L94 35 77 47 61 37Z"
          }
          fill="var(--brand-900)"
        />
        <path
          d={face.eyebrows}
          fill="none"
          stroke="var(--brand-900)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d={face.eyes}
          fill="none"
          stroke="var(--brand-900)"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M78 73l-3 8h6"
          fill="none"
          stroke="#946044"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={face.mouth}
          fill="none"
          stroke="#71472f"
          strokeWidth="3"
          strokeLinecap="round"
        />
        {(mood === "worried" || mood === "sad") && (
          <path
            d="m45 140 26-14m43 14-27-14"
            fill="none"
            stroke={skin}
            strokeWidth="13"
            strokeLinecap="round"
          />
        )}
        {mood === "hesitant" && (
          <>
            <path
              d="m46 146-9-26m75 26 8-31"
              fill="none"
              stroke={skin}
              strokeWidth="12"
              strokeLinecap="round"
            />
            <path
              d="M117 119v-15m6 15v-18m6 20v-14"
              stroke={skin}
              strokeWidth="5"
              strokeLinecap="round"
            />
          </>
        )}
        {mood === "thoughtful" && (
          <path
            d="m112 145-22-19-4-26m-40 42 34-11"
            fill="none"
            stroke={skin}
            strokeWidth="12"
            strokeLinecap="round"
          />
        )}
        {mood === "listening" && (
          <path
            d="m45 142 28 4m41-4-26 4"
            fill="none"
            stroke={skin}
            strokeWidth="12"
            strokeLinecap="round"
          />
        )}
        {mood === "supported" && (
          <path
            d="m46 143-19-16m86 16 20-16"
            fill="none"
            stroke={skin}
            strokeWidth="12"
            strokeLinecap="round"
          />
        )}
        <path
          d="M67 127h24"
          stroke="var(--brand-200)"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
