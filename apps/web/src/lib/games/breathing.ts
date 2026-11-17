export const BREATHING_GAME_ID = "breathing-calm";
export const BREATHING_XP = 15;
export const BREATHING_ROUNDS = [5, 8] as const;
export const BREATHING_RHYTHMS = [
  { id: "gentle", name: "Ringan", seconds: 3 },
  { id: "steady", name: "Santai", seconds: 4 },
] as const;
export type BreathingRhythm = (typeof BREATHING_RHYTHMS)[number]["id"];

export function getBreathingPlan(mode: string) {
  const [rhythmId, roundsText] = mode.split(":");
  const rhythm = BREATHING_RHYTHMS.find((item) => item.id === rhythmId);
  const rounds = Number(roundsText);
  if (
    !rhythm ||
    !BREATHING_ROUNDS.some((count) => count === rounds) ||
    mode !== `${rhythm.id}:${rounds}`
  )
    return null;
  return { ...rhythm, rounds, durationMs: rhythm.seconds * 2 * rounds * 1000 };
}

export function getBreathingFrame(
  elapsedMs: number,
  seconds: number,
  rounds: number,
) {
  const phaseMs = seconds * 1000;
  const cycleMs = phaseMs * 2;
  const activeMs = Math.max(0, Math.min(elapsedMs, cycleMs * rounds));
  const phaseIndex = Math.floor(activeMs / phaseMs);
  const progress = (activeMs % phaseMs) / phaseMs;
  const inhale = phaseIndex % 2 === 0;
  return {
    inhale,
    remaining: Math.max(1, Math.ceil((phaseMs - (activeMs % phaseMs)) / 1000)),
    completedRounds: Math.min(rounds, Math.floor(activeMs / cycleMs)),
    round: Math.min(rounds, Math.floor(activeMs / cycleMs) + 1),
    scale: 0.65 + 0.35 * (inhale ? progress : 1 - progress),
  };
}
