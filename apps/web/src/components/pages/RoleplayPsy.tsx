"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import Link from "next/link";
import {
  BookOpen,
  Check,
  CloudCheck,
  HeartHandshake,
  Home,
  Leaf,
  MessageCircle,
  Pause,
  Play,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Users,
  Wind,
} from "lucide-react";
import RoleplayTools, {
  RoleplayDialog,
  type RoleplayTool,
} from "@/components/games/RoleplayTools";
import RoleplayPortrait from "@/components/games/RoleplayPortrait";
import {
  getRoleplayReflections,
  getRoleplayScene,
  ROLEPLAY_MOODS,
} from "@/lib/games/roleplayPresentation";
import { useAuth } from "@/context/AuthContext";
import { useCulture } from "@/context/CultureContext";
import {
  ROLEPLAY_SCENARIOS,
  ROLEPLAY_VERSION,
  ROLEPLAY_XP,
  replayRoleplay,
  roleplayText,
  type RoleplayOption,
  type RoleplayRun,
  type RoleplayScenario,
} from "@/lib/games/roleplay";
import {
  clearRoleplayRun,
  readOfflineRoleplayRun,
  readRoleplayRun,
  writeRoleplayRun,
} from "@/lib/games/roleplayStorage";
import { syncOfflineSurvivalBundle } from "@/lib/offlineCache";
import type { TreeStats } from "@/lib/treeProgress";

const button =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 py-3 text-base font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-action disabled:opacity-60";
const primary = `${button} bg-action text-white hover:bg-action-hover`;
const secondary = `${button} border border-line-strong bg-surface text-fg-brand hover:bg-tint`;
const icons = {
  heart: HeartHandshake,
  home: Home,
  shield: ShieldCheck,
  chat: MessageCircle,
};
const subscribeOnline = (callback: () => void) => {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
};

function SceneArtwork({ culture }: { culture: "aceh" | "kalimantan" }) {
  return (
    <svg
      viewBox="0 0 520 350"
      aria-hidden="true"
      className="mx-auto w-full max-w-lg"
    >
      <ellipse cx="262" cy="307" rx="196" ry="19" fill="var(--brand-100)" />
      <circle cx="272" cy="156" r="132" fill="var(--brand-50)" />
      <circle cx="429" cy="72" r="20" fill="var(--accent-200)" />
      <path
        d="M46 269V150l95-54 95 54v119"
        fill="var(--surface)"
        stroke="var(--brand-200)"
        strokeWidth="4"
      />
      <path
        d={
          culture === "aceh"
            ? "M36 153l105-74 105 74-105-36Z"
            : "M34 153l42-8 65-67 65 67 42 8-107-36Z"
        }
        fill="var(--brand-700)"
      />
      <path
        d="M118 269v-76h46v76M72 173h25v31H72m113-31h25v31h-25"
        fill="var(--brand-100)"
      />
      <path
        d="M395 280v-88m0 30c-39-4-45-30-40-40 23-2 40 14 40 40m0-16c27-6 41-25 37-40-25 1-37 18-37 40"
        fill="var(--brand-400)"
        stroke="var(--brand-600)"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <rect
        x="159"
        y="266"
        width="197"
        height="12"
        rx="6"
        fill="var(--brand-700)"
      />
      <path
        d="M174 277v28m166-28v28"
        stroke="var(--brand-700)"
        strokeWidth="9"
        strokeLinecap="round"
      />
      <path
        d="M218 253l-4 44m27-44 10 44m50-44 5 44m20-44 14 44"
        stroke="var(--brand-800)"
        strokeWidth="13"
        strokeLinecap="round"
      />
      <path d="M197 261v-52c0-37 56-37 56 0v52" fill="var(--brand-600)" />
      <path d="M281 261v-52c0-37 56-37 56 0v52" fill="var(--accent-500)" />
      <path
        d="M203 209l-12 31m57-31 24 20 15-15m44-5 14 33"
        stroke="#c58966"
        strokeWidth="12"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="224" cy="161" r="28" fill="#dca47d" />
      <circle cx="309" cy="161" r="28" fill="#c58966" />
      <path
        d="M195 158c-5-48 63-47 59 0l-14-19-29 8-16 11m85 0c-5-46 62-47 58 1l-18-18-24 6-16 11"
        fill="var(--brand-900)"
      />
      <path
        d="M216 164v3m17-3v3m68-3v3m17-3v3"
        stroke="var(--brand-900)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M219 176q6 5 12 0m72 0q6 5 12 0"
        fill="none"
        stroke="#71472f"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M267 73h67a13 13 0 0 1 13 13v30a13 13 0 0 1-13 13h-42l-18 15v-15h-7a13 13 0 0 1-13-13V86a13 13 0 0 1 13-13"
        fill="var(--surface)"
        stroke="var(--brand-200)"
        strokeWidth="3"
      />
      <path
        d="M284 98c-12-13-25 6 17 22 42-16 29-35 17-22-7-11-27-11-34 0"
        fill="var(--brand-400)"
        transform="translate(15 8) scale(.9)"
      />
    </svg>
  );
}

export default function RoleplayPsy() {
  const { culture } = useCulture();
  const { user, isLoading, isAuthUnavailable, setTreeStats, refreshAuth } =
    useAuth();
  const online = useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => true,
  );
  const [run, setRun] = useState<RoleplayRun | null>(null);
  const [resume, setResume] = useState<RoleplayRun | null>(null);
  const [selectedStory, setSelectedStory] = useState<RoleplayScenario | null>(
    null,
  );
  const [feedback, setFeedback] = useState<RoleplayOption | null>(null);
  const [tool, setTool] = useState<RoleplayTool | null>(null);
  const [saveState, setSaveState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [saveMessage, setSaveMessage] = useState("");
  const [storageWarning, setStorageWarning] = useState(false);
  const [downloadState, setDownloadState] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");
  const [downloadMessage, setDownloadMessage] = useState("");
  const [reconnecting, setReconnecting] = useState(false);
  const runRef = useRef(run);
  const userIdRef = useRef(user?.userId);
  const savingRef = useRef(new Set<string>());
  const activeMsRef = useRef(0);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const replay = run ? replayRoleplay(run.scenarioId, run.answers) : null;
  const completed = replay?.completed ?? false;
  const scene = replay
    ? getRoleplayScene(replay.scenario.id, replay.node.id)
    : null;
  const reactionMood =
    replay && feedback
      ? getRoleplayScene(replay.scenario.id, feedback.next).mood
      : null;
  const reflections =
    run && completed ? getRoleplayReflections(run.scenarioId, run.answers) : [];
  const activeCulture = run?.culture ?? culture;
  const text = (value: string) => roleplayText(value, activeCulture);

  useEffect(() => {
    runRef.current = run;
    userIdRef.current = user?.userId;
  }, [run, user?.userId]);

  useEffect(() => {
    if (isLoading) return;
    const task = window.setTimeout(() => {
      const current = runRef.current;
      if (current && (!user || current.ownerId === user.userId)) return;
      const saved =
        (!navigator.onLine || isAuthUnavailable) && !user
          ? readOfflineRoleplayRun()
          : readRoleplayRun(user?.userId ?? null);
      setResume(saved);
      if (current) {
        setRun(null);
        setFeedback(null);
        setSaveState("idle");
        setSaveMessage("");
      }
    }, 0);
    return () => window.clearTimeout(task);
  }, [isLoading, isAuthUnavailable, user, online]);

  useEffect(() => {
    const reconnect = () => {
      void refreshAuth();
    };
    window.addEventListener("online", reconnect);
    return () => window.removeEventListener("online", reconnect);
  }, [refreshAuth]);

  useEffect(() => {
    if (!run || completed || tool) return;
    let last = performance.now();
    const tick = () => {
      const now = performance.now();
      if (!document.hidden)
        activeMsRef.current = Math.min(
          86400000,
          activeMsRef.current + Math.min(now - last, 2000),
        );
      last = now;
    };
    const timer = window.setInterval(tick, 1000);
    const visibility = () => {
      last = performance.now();
    };
    document.addEventListener("visibilitychange", visibility);
    return () => {
      tick();
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [run?.id, completed, tool]);

  useEffect(() => {
    if (feedback) feedbackRef.current?.focus();
    else if (run) {
      headingRef.current?.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [run?.id, replay?.node.id, feedback]);

  const saveResult = useCallback(
    async (snapshot: RoleplayRun) => {
      if (
        savingRef.current.has(snapshot.id) ||
        !navigator.onLine ||
        !snapshot.ownerId ||
        snapshot.ownerId !== user?.userId
      )
        return;
      savingRef.current.add(snapshot.id);
      setSaveState("saving");
      setSaveMessage("Menyimpan hasil ke akunmu…");
      try {
        let result: {
          error?: string;
          treeStats?: TreeStats;
          awardedXp?: number;
          alreadySaved?: boolean;
        } = {};
        for (const action of ["start", "finish"]) {
          const response = await fetch("/api/games/roleplay", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action, run: snapshot }),
            signal: AbortSignal.timeout(15000),
          });
          result = await response.json();
          if (!response.ok)
            throw new Error(
              result.error ||
                "Hasil belum tersimpan. Coba lagi saat terhubung.",
            );
        }
        if (userIdRef.current !== snapshot.ownerId) return;
        if (result.treeStats) setTreeStats(result.treeStats);
        if (runRef.current?.id !== snapshot.id) return;
        clearRoleplayRun(snapshot.ownerId);
        setResume(null);
        setSaveState("saved");
        setSaveMessage(
          result.alreadySaved
            ? "Sesi ini sudah tersimpan. Progres Pohon Harapan sudah diperbarui."
            : (result.awardedXp ?? 0) > 0
              ? `Hasil tersimpan. +${result.awardedXp} XP untuk Pohon Harapanmu.`
              : "Hasil tersimpan. XP roleplay hari ini sudah diperoleh; kamu tetap boleh berlatih lagi.",
        );
      } catch (error) {
        if (
          runRef.current?.id !== snapshot.id ||
          userIdRef.current !== snapshot.ownerId
        )
          return;
        setSaveState("error");
        setSaveMessage(
          error instanceof Error && error.name === "Error"
            ? error.message
            : "Koneksi terputus. Hasil tetap tersedia di perangkat jika penyimpanan diizinkan.",
        );
      } finally {
        savingRef.current.delete(snapshot.id);
      }
    },
    [user?.userId, setTreeStats],
  );

  useEffect(() => {
    if (run && completed && online && run.ownerId === user?.userId)
      void saveResult(run);
  }, [run, completed, online, user?.userId, saveResult]);

  function persist(next: RoleplayRun) {
    runRef.current = next;
    setRun(next);
    setStorageWarning(!writeRoleplayRun(next));
  }
  function begin(scenario: RoleplayScenario) {
    const next: RoleplayRun = {
      id: crypto.randomUUID(),
      scenarioId: scenario.id,
      version: ROLEPLAY_VERSION,
      culture,
      ownerId: user?.userId ?? null,
      answers: [],
      activeMs: 0,
      updatedAt: Date.now(),
    };
    activeMsRef.current = 0;
    setSaveState("idle");
    setSaveMessage("");
    setFeedback(null);
    setSelectedStory(null);
    setResume(null);
    persist(next);
  }
  function continueStory() {
    if (!run || !replay || !feedback) return;
    persist({
      ...run,
      answers: [
        ...run.answers,
        { nodeId: replay.node.id, optionId: feedback.id },
      ],
      activeMs: Math.floor(activeMsRef.current),
      updatedAt: Date.now(),
    });
    setFeedback(null);
  }
  function leave() {
    if (run && saveState !== "saved") {
      const next = {
        ...run,
        activeMs: Math.floor(activeMsRef.current),
        updatedAt: Date.now(),
      };
      setStorageWarning(!writeRoleplayRun(next));
      setResume(next);
    }
    setRun(null);
    runRef.current = null;
    setFeedback(null);
    setTool(null);
  }
  async function download() {
    setDownloadState("loading");
    setDownloadMessage("Menyiapkan cerita dan aset untuk perangkat ini…");
    try {
      await syncOfflineSurvivalBundle(["/roleplay"]);
      setDownloadState("ready");
      setDownloadMessage(
        "Paket tersimpan. Cerita dapat dibuka kembali di perangkat dan peramban ini saat offline.",
      );
    } catch {
      setDownloadState("error");
      setDownloadMessage(
        "Paket belum lengkap. Periksa koneksi dan ruang penyimpanan, lalu unduh lagi.",
      );
    }
  }

  return (
    <main
      className={`min-h-screen bg-canvas px-4 sm:px-6 ${run && !completed ? "py-3 sm:py-7" : "py-6 sm:py-10"}`}
    >
      <div
        className={`mx-auto max-w-6xl ${run && !completed ? "space-y-4" : "space-y-7"}`}
      >
        {(!run || completed) && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link href="/dashboard" className={`${button} px-0 text-fg-muted`}>
              Dashboard
            </Link>
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium text-fg-brand">
              <Leaf size={16} aria-hidden="true" />
              {activeCulture === "aceh"
                ? "Aceh · Meuseuraya"
                : "Kalimantan · Handep"}
            </span>
          </div>
        )}
        {!run && (
          <>
            <section className="animate-fade-in overflow-hidden rounded-3xl border border-line bg-surface motion-reduce:animate-none">
              <div className="grid items-center lg:grid-cols-[1.05fr_1fr]">
                <div className="px-6 py-8 sm:p-10 lg:pr-0">
                  <p className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-[.14em] text-fg-brand">
                    <HeartHandshake size={18} aria-hidden="true" /> Ruang
                    latihan empati
                  </p>
                  <h1 className="max-w-xl text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
                    Kadang, hadir saja
                    <br />
                    <span className="text-fg-brand">sudah berarti.</span>
                  </h1>
                  <p className="mt-5 max-w-lg text-base leading-relaxed text-fg-muted sm:text-lg">
                    Belajar mendengarkan dan saling menemani lewat cerita. Pilih
                    kata-katamu, lihat respons teman, dan temukan langkah kecil
                    untuk membantu.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-x-5 gap-y-3 text-sm text-fg-muted">
                    <span className="flex items-center gap-2">
                      <BookOpen size={17} aria-hidden="true" />4 cerita pendek
                    </span>
                    <span className="flex items-center gap-2">
                      <Users size={17} aria-hidden="true" />
                      Sendiri atau bersama pendamping
                    </span>
                  </div>
                </div>
                <div className="bg-tint/40 px-4 py-3 lg:py-10">
                  <SceneArtwork culture={culture} />
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line bg-sunken/50 px-6 py-4 sm:px-10">
                <p className="text-sm leading-relaxed text-fg-muted">
                  Cerita fiktif. Tidak perlu menceritakan pengalamanmu sendiri.
                  Jeda kapan saja.
                </p>
                <span className="flex shrink-0 items-center gap-2 text-sm font-semibold text-fg-brand">
                  <Leaf size={17} aria-hidden="true" />
                  Hingga {ROLEPLAY_XP} XP/hari
                </span>
              </div>
            </section>
            {resume && (
              <section
                className="flex flex-col justify-between gap-4 rounded-2xl border border-line-strong bg-surface p-5 sm:flex-row sm:items-center"
                aria-label="Cerita tersimpan"
              >
                <div>
                  <p className="font-semibold">Ada cerita yang menunggumu</p>
                  <p className="mt-1 text-sm text-fg-muted">
                    {
                      ROLEPLAY_SCENARIOS.find(
                        (story) => story.id === resume.scenarioId,
                      )?.title
                    }{" "}
                    ·{" "}
                    {replayRoleplay(resume.scenarioId, resume.answers)
                      ?.completed
                      ? "Ringkasan tersedia"
                      : "Lanjutkan dari adegan terakhir"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    className={primary}
                    onClick={() => {
                      activeMsRef.current = resume.activeMs;
                      setRun(resume);
                      runRef.current = resume;
                      setFeedback(null);
                      setSaveState("idle");
                    }}
                  >
                    <Play size={18} aria-hidden="true" />
                    Lanjutkan
                  </button>
                  <button
                    type="button"
                    className={`${button} text-fg-muted`}
                    onClick={() => {
                      clearRoleplayRun(resume.ownerId);
                      setResume(null);
                    }}
                  >
                    Hapus progres lokal
                  </button>
                </div>
              </section>
            )}
            <section aria-labelledby="roleplay-stories-heading">
              <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2
                    id="roleplay-stories-heading"
                    className="text-2xl font-semibold"
                  >
                    Mulai dari satu percakapan
                  </h2>
                  <p className="mt-2 text-base text-fg-muted">
                    Pilih cerita yang ingin kamu jelajahi hari ini.
                  </p>
                </div>
                <span className="text-sm text-fg-muted">
                  4–6 adegan utama per cerita
                </span>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                {ROLEPLAY_SCENARIOS.map((scenario) => {
                  const Icon = icons[scenario.icon];
                  return (
                    <div
                      key={scenario.id}
                      className="animate-fade-in h-full motion-reduce:animate-none"
                    >
                      <article className="flex h-full flex-col rounded-2xl border border-line bg-surface p-6 transition-shadow hover:shadow-md sm:p-7">
                        <div className="mb-5 flex items-center justify-between gap-3">
                          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-tint text-fg-brand">
                            <Icon size={26} aria-hidden="true" />
                          </span>
                          <span className="rounded-full bg-sunken px-3 py-1.5 text-sm text-fg-muted">
                            {scenario.topic}
                          </span>
                        </div>
                        <h3 className="text-xl font-semibold">
                          {scenario.title}
                        </h3>
                        <p className="mb-6 mt-3 flex-1 text-base leading-relaxed text-fg-muted">
                          {scenario.description}
                        </p>
                        <button
                          type="button"
                          disabled={isLoading}
                          onClick={() => setSelectedStory(scenario)}
                          className={`${secondary} w-full`}
                          aria-label={`Buka cerita ${scenario.title}`}
                        >
                          Jelajahi cerita
                        </button>
                      </article>
                    </div>
                  );
                })}
              </div>
            </section>
            <section className="grid gap-5 lg:grid-cols-2">
              <div className="rounded-2xl bg-emphasis p-6 text-white sm:p-7">
                <h2 className="text-xl font-semibold text-white">
                  Bawa cerita saat tanpa sinyal
                </h2>
                <p className="mt-3 text-base leading-relaxed text-white/85">
                  Unduh saat terhubung. Cerita dan latihan pendamping dapat
                  dimainkan tanpa login setelah paket tersedia.
                </p>
                <button
                  type="button"
                  onClick={download}
                  disabled={!online || downloadState === "loading"}
                  className={`${button} mt-5 bg-surface text-fg-brand hover:bg-sunken`}
                >
                  <CloudCheck size={19} aria-hidden="true" />
                  {downloadState === "loading"
                    ? "Menyiapkan paket…"
                    : downloadState === "ready"
                      ? "Perbarui paket offline"
                      : "Simpan untuk offline"}
                </button>
                <p role="status" className="mt-3 text-sm text-white/85">
                  {downloadMessage ||
                    (!online
                      ? "Kamu sedang offline. Gunakan paket yang sudah tersimpan."
                      : "Gunakan perangkat ini untuk membuka paket yang telah diunduh.")}
                </p>
              </div>
              <div className="rounded-2xl border border-line bg-surface p-6 sm:p-7">
                <h2 className="text-xl font-semibold">
                  Kamu juga boleh ditemani
                </h2>
                <p className="mt-3 text-base leading-relaxed text-fg-muted">
                  Baca bersama orang tua, guru, atau relawan. Setiap pilihan
                  adalah kesempatan belajar. Tidak ada pengurangan XP dan kamu
                  boleh berhenti kapan saja.
                </p>
                <button
                  type="button"
                  className={`${button} mt-5 px-0 text-fg-brand`}
                  onClick={() => setTool("help")}
                >
                  <HeartHandshake size={19} aria-hidden="true" />
                  Cari orang dewasa tepercaya
                </button>
              </div>
            </section>
          </>
        )}
        {run && replay && !completed && (
          <>
            <header
              id="roleplay-play-header"
              className="scroll-mt-24 flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <p className="mb-1 text-sm font-medium text-fg-brand">
                  Latihan empati ·{" "}
                  {activeCulture === "aceh" ? "Aceh" : "Kalimantan"}
                </p>
                <h1 className="text-lg font-semibold leading-snug sm:text-2xl">
                  {replay.scenario.title}
                </h1>
              </div>
              <button
                type="button"
                onClick={() => setTool("pause")}
                className={`${secondary} shrink-0 px-3 sm:px-5`}
              >
                <Pause size={18} aria-hidden="true" />
                Jeda
              </button>
            </header>
            <div
              className="flex items-center gap-3"
              aria-label={`Bagian ${replay.node.stage} dari 5`}
            >
              <div className="flex flex-1 gap-2" aria-hidden="true">
                {[1, 2, 3, 4, 5].map((stage) => (
                  <span
                    key={stage}
                    className={`h-1.5 flex-1 rounded-full ${stage <= replay.node.stage ? "bg-action" : "bg-line"}`}
                  />
                ))}
              </div>
              <span className="text-sm text-fg-muted">
                Bagian {replay.node.stage} / 5
              </span>
            </div>
            <section
              className="overflow-hidden rounded-2xl border border-line bg-surface sm:rounded-3xl"
              aria-labelledby="roleplay-node-title"
            >
              <div className="grid items-start lg:grid-cols-[.85fr_1.15fr]">
                <div className="border-b border-line bg-tint/30 p-4 sm:p-6 lg:self-stretch lg:border-b-0 lg:border-r lg:p-8">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <RoleplayPortrait
                      culture={run.culture}
                      mood={scene?.mood ?? "listening"}
                      className="h-16 w-16 sm:h-24 sm:w-24"
                    />
                    <div>
                      <p className="text-lg font-semibold">
                        {text("{friend}")}
                      </p>
                      <p className="mt-1 text-sm text-fg-muted">
                        {ROLEPLAY_MOODS[scene?.mood ?? "listening"]}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-base leading-6 text-fg-muted lg:hidden">
                    {text(scene?.intro ?? replay.node.situation)}
                  </p>
                  <p className="mt-5 hidden text-base leading-relaxed text-fg-muted lg:block">
                    {text(replay.node.situation)}
                  </p>
                  <details className="text-sm text-fg-muted lg:hidden">
                    <summary className="min-h-11 cursor-pointer content-center rounded-md py-2 font-medium text-fg-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action">
                      Baca konteks lengkap
                    </summary>
                    <p className="pb-3 text-base leading-relaxed">
                      {text(replay.node.situation)}
                    </p>
                  </details>
                  <blockquote className="mt-2 rounded-xl bg-surface p-3 text-base leading-6 sm:mt-4 sm:p-4 sm:text-lg sm:leading-relaxed">
                    “{text(replay.node.dialogue)}”
                  </blockquote>
                </div>
                <div className="p-4 sm:p-6 lg:p-8">
                  <h2
                    ref={headingRef}
                    tabIndex={-1}
                    id="roleplay-node-title"
                    className="text-lg font-semibold outline-none sm:text-2xl"
                  >
                    {replay.node.title}
                  </h2>
                  {!feedback ? (
                    <>
                      <p className="mb-4 mt-2 text-base text-fg-muted">
                        Apa yang ingin kamu katakan atau lakukan?
                      </p>
                      <div className="space-y-3">
                        {replay.node.options.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setFeedback(item)}
                            className={`${secondary} w-full justify-start px-4 py-3 text-left font-medium leading-6 sm:px-5 sm:py-4`}
                          >
                            {text(item.text)}
                          </button>
                        ))}
                      </div>
                      <p className="mt-5 hidden text-sm leading-relaxed text-fg-muted sm:block">
                        Pilih perlahan. Kamu akan melihat respons teman sebelum
                        melanjutkan.
                      </p>
                    </>
                  ) : (
                    <div
                      ref={feedbackRef}
                      tabIndex={-1}
                      className="mt-4 space-y-4 outline-none sm:mt-6 sm:space-y-5"
                      aria-label="Respons dan pembelajaran"
                    >
                      <div className="rounded-2xl bg-tint p-4 sm:p-5">
                        <div className="mb-3 flex items-center gap-3">
                          <RoleplayPortrait
                            culture={run.culture}
                            mood={reactionMood ?? "listening"}
                            className="h-14 w-14"
                          />
                          <div>
                            <p className="text-sm font-semibold text-fg-brand">
                              Respons dalam cerita
                            </p>
                            <p className="mt-1 text-sm text-fg-muted">
                              {ROLEPLAY_MOODS[reactionMood ?? "listening"]}
                            </p>
                          </div>
                        </div>
                        <p className="text-base leading-relaxed sm:text-lg">
                          {text(feedback.reaction)}
                        </p>
                      </div>
                      <p className="text-base leading-relaxed text-fg-muted">
                        {text(feedback.explanation)}
                      </p>
                      <button
                        type="button"
                        onClick={continueStory}
                        className={`${primary} w-full`}
                      >
                        {feedback.next === "selesai"
                          ? "Lihat penutup cerita"
                          : "Lanjutkan percakapan"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </section>
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-line bg-surface p-2 sm:px-5 sm:py-3">
              <p className="hidden text-sm text-fg-muted sm:block">
                Butuh ruang sebentar? Cerita boleh menunggu.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={`${button} px-3 text-fg-brand`}
                  onClick={() => setTool("breath")}
                >
                  <Wind size={18} aria-hidden="true" />
                  Napas pelan
                </button>
                <button
                  type="button"
                  className={`${button} px-3 text-fg-brand`}
                  onClick={() => setTool("grounding")}
                >
                  Kenali sekitar
                </button>
                <button
                  type="button"
                  className={`${button} px-3 text-fg-brand`}
                  onClick={() => setTool("help")}
                >
                  Cari pendamping
                </button>
              </div>
            </div>
          </>
        )}
        {run && replay && completed && (
          <section
            className="mx-auto max-w-3xl overflow-hidden rounded-3xl border border-line bg-surface"
            aria-labelledby="roleplay-result-title"
          >
            <div className="bg-tint px-6 pb-7 pt-8 text-center sm:px-10">
              <RoleplayPortrait
                culture={run.culture}
                mood="supported"
                className="mx-auto mb-5 h-24 w-24"
              />
              <p className="text-sm font-semibold text-fg-brand">
                {replay.scenario.title}
              </p>
              <h1
                ref={headingRef}
                tabIndex={-1}
                id="roleplay-result-title"
                className="mt-3 text-3xl font-semibold outline-none"
              >
                Terima kasih sudah hadir.
              </h1>
              <p className="mt-4 text-lg leading-relaxed">
                “{text(replay.node.dialogue)}”
              </p>
            </div>
            <div className="space-y-6 p-6 sm:p-10">
              <div>
                <h2 className="text-xl font-semibold">
                  Yang kamu latih hari ini
                </h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {replay.skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-2 rounded-full bg-tint px-4 py-2 text-sm font-medium text-fg-brand"
                    >
                      <Check size={16} aria-hidden="true" />
                      {skill}
                    </span>
                  ))}
                </div>
                <p className="mt-5 text-base leading-relaxed text-fg-muted">
                  {replay.scenario.takeaway}
                </p>
              </div>
              {reflections.length > 0 && (
                <section aria-labelledby="roleplay-reflections-title">
                  <h2
                    id="roleplay-reflections-title"
                    className="text-xl font-semibold"
                  >
                    Jejak pilihanmu
                  </h2>
                  <p className="mt-2 text-base leading-relaxed text-fg-muted">
                    Beberapa langkah yang kamu coba dalam percakapan tadi.
                  </p>
                  <div className="mt-4 space-y-4">
                    {reflections.map((reflection) => (
                      <article
                        key={reflection.id}
                        data-roleplay-reflection={reflection.id}
                        className="rounded-2xl border border-line p-5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h3 className="text-base font-semibold text-fg-brand">
                            {reflection.title}
                          </h3>
                          {reflection.adjusted && (
                            <span className="rounded-full bg-tint px-3 py-1 text-sm text-fg-brand">
                              Mencoba cara lain
                            </span>
                          )}
                        </div>
                        <p className="mt-3 text-sm text-fg-muted">
                          {reflection.adjusted
                            ? "Setelah melihat reaksi teman, kamu mencoba:"
                            : "Kamu memilih:"}
                        </p>
                        <blockquote className="mt-2 border-l-2 border-line-strong pl-3 text-base leading-relaxed">
                          “{text(reflection.choice)}”
                        </blockquote>
                        <p className="mt-3 text-base leading-relaxed text-fg-muted">
                          {text(reflection.explanation)}
                        </p>
                      </article>
                    ))}
                  </div>
                </section>
              )}
              <div className="rounded-2xl border border-line bg-sunken p-5">
                <p className="flex items-center gap-2 font-semibold text-fg-brand">
                  <Leaf size={19} aria-hidden="true" />
                  Langkah kecil untuk Pohon Harapan
                </p>
                <p
                  role="status"
                  className="mt-3 text-base leading-relaxed text-fg-muted"
                >
                  {saveMessage ||
                    (run.ownerId
                      ? !online || isAuthUnavailable
                        ? "Hasil tersedia di perangkat jika penyimpanan diizinkan. Saat terhubung, buka ringkasan ini dengan akun yang sama untuk menyimpan progres."
                        : !user
                          ? "Masuk dengan akun yang memulai cerita untuk menyimpan progres."
                          : "Hasil siap disimpan ke akunmu."
                      : "Latihanmu selesai. Masuk sebelum memulai cerita berikutnya untuk menyimpan hasil dan XP.")}
                </p>
                {run.ownerId &&
                  online &&
                  user?.userId === run.ownerId &&
                  saveState === "error" && (
                    <button
                      type="button"
                      onClick={() => void saveResult(run)}
                      className={`${secondary} mt-4`}
                    >
                      Coba simpan lagi
                    </button>
                  )}
                {run.ownerId && !user && isAuthUnavailable && (
                  <button
                    type="button"
                    disabled={reconnecting}
                    onClick={async () => {
                      setReconnecting(true);
                      try {
                        await refreshAuth();
                      } finally {
                        setReconnecting(false);
                      }
                    }}
                    className={`${secondary} mt-4`}
                  >
                    {reconnecting
                      ? "Memeriksa koneksi akun…"
                      : "Coba hubungkan akun"}
                  </button>
                )}
                {!user && !(run.ownerId && isAuthUnavailable) && (
                  <Link
                    href="/login?next=/roleplay"
                    className={`${secondary} mt-4`}
                  >
                    Masuk akun
                  </Link>
                )}
                <p className="mt-3 text-sm leading-relaxed text-fg-muted">
                  Maksimal +{ROLEPLAY_XP} XP roleplay per hari untuk seluruh
                  cerita. Hari berganti pukul 00.00 WITA. Hasil offline dihitung
                  pada hari penyimpanan ke akun.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Link href="/jurnal" className={secondary}>
                  <BookOpen size={18} aria-hidden="true" />
                  Tulis di Jurnal Hikmah
                </Link>
                <Link href="/game-breath" className={secondary}>
                  <Wind size={18} aria-hidden="true" />
                  Latihan Napas Tenang
                </Link>
                <Link href="/dashboard" className={secondary}>
                  <Leaf size={18} aria-hidden="true" />
                  Lihat Pohon Harapan
                </Link>
                <button type="button" onClick={leave} className={primary}>
                  <RotateCcw size={18} aria-hidden="true" />
                  Pilih cerita lain
                </button>
              </div>
              <p className="text-center text-sm text-fg-muted">
                Tidak perlu terburu-buru. Kamu boleh beristirahat sekarang.
              </p>
            </div>
          </section>
        )}
        {storageWarning && (
          <p
            role="status"
            className="rounded-xl border border-line-strong bg-surface p-4 text-sm text-fg-muted"
          >
            Penyimpanan perangkat tidak tersedia. Kamu tetap bisa bermain,
            tetapi progres dapat hilang jika halaman ditutup.
          </p>
        )}
        <p className="flex items-center justify-center gap-2 pb-4 text-center text-sm text-fg-muted">
          <Sparkles size={15} className="shrink-0" aria-hidden="true" />
          Roleplay Psikoedukasi · Belajar saling menemani
        </p>
      </div>
      {selectedStory && (
        <RoleplayDialog
          title={selectedStory.title}
          onClose={() => setSelectedStory(null)}
        >
          <div className="space-y-5">
            <p className="text-base leading-relaxed text-fg-muted">
              {selectedStory.description}
            </p>
            <div className="rounded-2xl bg-tint p-5 text-base leading-relaxed">
              <p className="font-semibold text-fg-brand">Sebelum mulai</p>
              <p className="mt-2">
                Kamu menemani tokoh fiktif. Tidak perlu mengingat atau
                menceritakan kejadianmu sendiri. Cerita boleh dijeda atau
                ditutup kapan saja.
              </p>
            </div>
            {resume && (
              <p className="text-sm text-fg-muted">
                Memulai cerita baru akan mengganti progres lokal yang tersimpan
                untuk akun atau mode tamu ini.
              </p>
            )}
            <button
              type="button"
              onClick={() => begin(selectedStory)}
              className={`${primary} w-full`}
            >
              <Play size={18} aria-hidden="true" />
              Mulai cerita
            </button>
            <button
              type="button"
              onClick={() => setSelectedStory(null)}
              className={`${button} w-full text-fg-muted`}
            >
              Belum sekarang
            </button>
          </div>
        </RoleplayDialog>
      )}
      {tool && (
        <RoleplayTools
          tool={tool}
          onClose={() => setTool(null)}
          onLeave={leave}
        />
      )}
    </main>
  );
}
