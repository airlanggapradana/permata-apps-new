import RoleplayPortrait from "./RoleplayPortrait";
import { ROLEPLAY_CHARACTERS, getRoleplayCast } from "@/lib/games/roleplay";

export default function RoleplayCast({ scenarioId }: { scenarioId?: string }) {
  const cast = scenarioId ? getRoleplayCast(scenarioId) : null;
  const characters = cast
    ? [cast.player, cast.friend, cast.guide]
    : (Object.keys(
        ROLEPLAY_CHARACTERS,
      ) as (keyof typeof ROLEPLAY_CHARACTERS)[]);
  return (
    <div className="p-4 sm:p-6">
      <p className="mb-4 text-center text-sm font-semibold text-fg-brand">
        {cast ? "Teman dalam cerita ini" : "Kenalan dengan teman ceritamu"}
      </p>
      <div
        className={`grid gap-3 ${cast ? "grid-cols-3" : "grid-cols-3 sm:grid-cols-4"}`}
      >
        {characters.map((id) => {
          const person = ROLEPLAY_CHARACTERS[id];
          return (
            <div key={id} className="min-w-0 text-center">
              <RoleplayPortrait
                character={id}
                mood="supported"
                className="mx-auto aspect-square w-full max-w-28 ring-1 ring-line"
              />
              <p className="mt-2 text-sm font-semibold">{person.name}</p>
              <p className="mt-1 text-sm text-fg-muted">
                {id === "aira"
                  ? "Kamu bermain sebagai Aira"
                  : `${person.age} tahun · ${person.origin}`}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
