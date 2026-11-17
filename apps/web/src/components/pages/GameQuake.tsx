"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatedSection } from "@/components/PageMotion";
import { useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ShieldCheck,
  Play,
  Pause,
  Volume2,
  VolumeX,
  RotateCcw,
  Flag,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { TreeStats } from "@/lib/treeProgress";
import type { QuakeBridge } from "@/game/quakeBridge";
import QuakeScene from "@/components/games/QuakeScene";
import { useQuakeControls } from "@/components/games/useQuakeControls";
import {
  createQuakeState,
  quakeSnapshot,
  answerQuake,
  revisitQuakeRoom,
  QUAKE_LESSONS,
  QUAKE_XP,
  QUAKE_SOURCE,
  type QuakeSnapshot,
  type QuakeInput,
  type QuakeState,
} from "@/lib/games/sigapBencana";
import styles from "./GameSiagaMinang.module.css";
import skin from "./GameQuake.module.css";

type Phase = "intro" | "loading" | "playing" | "question" | "paused" | "result";
const button =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f2d28f] disabled:opacity-50";
type Handlers = {
  ready: () => void;
  question: (id: string) => void;
  finish: (snapshot: QuakeSnapshot) => void;
  escape: () => void;
  blur: () => void;
};

export default function GameQuake() {
  const { user, isLoading, setTreeStats } = useAuth();
  const reducedMotion = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("intro");
  const phaseRef = useRef<Phase>("intro");
  const [snapshot, setSnapshot] = useState(() =>
    quakeSnapshot(createQuakeState()),
  );
  const [result, setResult] = useState<QuakeSnapshot | null>(null);
  const [questionId, setQuestionId] = useState<string | null>(null);
  const [answer, setAnswer] = useState<{
    correct: boolean;
    explanation: string;
  } | null>(null);
  const [notice, setNotice] = useState("");
  const [feedback, setFeedback] = useState(
    "Dekati penanda pertama di ruang tamu. Barang kayu bisa dilewati dengan tombol Lompat.",
  );
  const [starting, setStarting] = useState(false);
  const startingRef = useRef(false);
  const attemptRef = useRef<string | null>(null);
  const [saveState, setSaveState] = useState("idle");
  const [saveMessage, setSaveMessage] = useState("");
  const [sound, setSound] = useState(false);
  const soundRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const root = useRef<HTMLElement>(null);
  const modalHeading = useRef<HTMLHeadingElement>(null);
  const resumeButton = useRef<HTMLButtonElement>(null);
  const resultHeading = useRef<HTMLHeadingElement>(null);
  const callbacks = useRef<Handlers | null>(null);
  const inputRef = useRef<QuakeInput>({
    left: false,
    right: false,
    jump: false,
    enabled: false,
  });
  const gameRef = useRef<QuakeState | null>(null);
  const reducedRef = useRef(false);
  const [bridge] = useState<QuakeBridge>(() => ({
    inputRef,
    stateRef: gameRef,
    reducedMotionRef: reducedRef,
    onReady: () => callbacks.current?.ready(),
    onUpdate: setSnapshot,
    onQuestion: (id) => callbacks.current?.question(id),
    onFinish: (end) => callbacks.current?.finish(end),
  }));
  const escape = useCallback(() => callbacks.current?.escape(), []);
  const blurred = useCallback(() => callbacks.current?.blur(), []);
  const {
    clear: clearControls,
    pressed,
    handlers: controlHandlers,
  } = useQuakeControls(inputRef, escape, blurred);
  const changePhase = useCallback((next: Phase) => {
    phaseRef.current = next;
    inputRef.current.enabled = next === "playing";
    setPhase(next);
  }, []);
  const playMusic = useCallback(() => {
    if (!soundRef.current || phaseRef.current !== "playing") return;
    audioRef.current ??= new Audio("/audio/bgm.mp3");
    audioRef.current.loop = true;
    audioRef.current.volume = 0.12;
    void audioRef.current.play().catch(() => {
      soundRef.current = false;
      setSound(false);
      setFeedback("Suara belum tersedia. Panduan visual tetap bisa diikuti.");
    });
  }, []);
  const pause = useCallback(() => {
    if (phaseRef.current !== "playing") return;
    if (gameRef.current) setSnapshot(quakeSnapshot(gameRef.current));
    clearControls();
    audioRef.current?.pause();
    changePhase("paused");
  }, [clearControls, changePhase]);
  const resume = useCallback(() => {
    if (phaseRef.current !== "paused" || document.hidden) return;
    clearControls();
    changePhase("playing");
    playMusic();
    root.current?.querySelector("canvas")?.focus({ preventScroll: true });
  }, [clearControls, changePhase, playMusic]);
  const save = useCallback(
    async (end: QuakeSnapshot) => {
      const attemptId = attemptRef.current;
      if (!attemptId) {
        setSaveState("guest");
        setSaveMessage(
          "Latihan selesai. Masuk sebelum sesi berikutnya agar hasil dan XP tersimpan.",
        );
        return;
      }
      setSaveState("saving");
      setSaveMessage("Menyimpan latihanmu…");
      try {
        const response = await fetch("/api/games/sigap-bencana", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "finish", attemptId, ...end }),
          signal: AbortSignal.timeout(15000),
        });
        const data = (await response.json()) as {
          error?: string;
          completed: boolean;
          alreadySaved: boolean;
          awardedXp: number;
          treeStats: TreeStats;
        };
        if (!response.ok)
          throw new Error(data.error || "Hasil belum tersimpan.");
        setTreeStats(data.treeStats);
        setResult({ ...end, completed: data.completed });
        setSaveState("saved");
        setSaveMessage(
          data.alreadySaved
            ? "Sesi ini sudah tersimpan. Progres Pohon Harapan sudah diperbarui."
            : data.awardedXp > 0
              ? "Hasil tersimpan. +" +
                data.awardedXp +
                " XP untuk Pohon Harapanmu!"
              : data.completed
                ? "Hasil tersimpan. Hadiah Sigap Bencana hari ini sudah diperoleh; kamu tetap boleh bermain lagi."
                : "Latihan tersimpan. Kamu bisa melanjutkan belajar di sesi berikutnya.",
        );
      } catch (error) {
        setSaveState("error");
        setSaveMessage(
          error instanceof Error && error.name !== "TimeoutError"
            ? error.message
            : "Koneksi terputus. Coba simpan lagi, ya.",
        );
      }
    },
    [setTreeStats],
  );
  const finish = useCallback(
    (end?: QuakeSnapshot) => {
      if (!["playing", "paused", "question"].includes(phaseRef.current)) return;
      const final =
        end ?? (gameRef.current ? quakeSnapshot(gameRef.current) : snapshot);
      clearControls();
      audioRef.current?.pause();
      setResult(final);
      setSnapshot(final);
      changePhase("result");
      void save(final);
    },
    [snapshot, clearControls, changePhase, save],
  );
  useEffect(() => {
    callbacks.current = {
      ready: () => {
        clearControls();
        changePhase(document.hidden ? "paused" : "playing");
        playMusic();
        requestAnimationFrame(() => {
          if (phaseRef.current === "playing")
            root.current
              ?.querySelector("canvas")
              ?.focus({ preventScroll: true });
        });
      },
      question: (id) => {
        clearControls();
        audioRef.current?.pause();
        setQuestionId(id);
        setAnswer(null);
        if (gameRef.current) setSnapshot(quakeSnapshot(gameRef.current));
        changePhase("question");
      },
      finish,
      escape: () => {
        if (phaseRef.current === "playing") pause();
        else if (phaseRef.current === "paused") resume();
      },
      blur: pause,
    };
  }, [bridge, clearControls, changePhase, finish, pause, resume, playMusic]);
  useEffect(() => {
    reducedRef.current = Boolean(reducedMotion);
  }, [bridge, reducedMotion]);
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
      audioRef.current?.pause();
      audioRef.current?.removeAttribute("src");
      audioRef.current?.load();
    };
  }, []);
  useEffect(() => {
    root.current?.scrollTo({ top: 0, behavior: "instant" });
    if (phase === "paused")
      resumeButton.current?.focus({ preventScroll: true });
    if (phase === "question")
      modalHeading.current?.focus({ preventScroll: true });
    if (phase === "result")
      resultHeading.current?.focus({ preventScroll: true });
  }, [phase]);
  useEffect(() => {
    const tab = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const area =
        root.current?.querySelector('[role="dialog"]') ?? root.current;
      const targets = area
        ? [
            ...area.querySelectorAll<HTMLElement>(
              'a[href],button:not(:disabled),canvas[tabindex="0"]',
            ),
          ].filter((el) => el.getClientRects().length > 0)
        : [];
      const first = targets[0],
        last = targets[targets.length - 1];
      if (
        first &&
        last &&
        (!area?.contains(document.activeElement) ||
          (event.shiftKey && document.activeElement === first) ||
          (!event.shiftKey && document.activeElement === last))
      ) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      }
    };
    window.addEventListener("keydown", tab);
    return () => window.removeEventListener("keydown", tab);
  }, []);
  async function start() {
    if (startingRef.current) return;
    startingRef.current = true;
    setStarting(true);
    setNotice("");
    try {
      let attemptId = null;
      if (user) {
        const response = await fetch("/api/games/sigap-bencana", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "start", mode: "practice" }),
          signal: AbortSignal.timeout(15000),
        });
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error || "Sesi belum bisa dimulai.");
        attemptId = data.attemptId;
      }
      attemptRef.current = attemptId;
      clearControls();
      setSnapshot(quakeSnapshot(createQuakeState()));
      setResult(null);
      setQuestionId(null);
      setAnswer(null);
      setSaveState("idle");
      setFeedback(
        "Dekati penanda pertama di ruang tamu. Barang kayu bisa dilewati dengan tombol Lompat.",
      );
      changePhase("loading");
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Koneksi belum tersedia. Coba lagi, ya.",
      );
    } finally {
      startingRef.current = false;
      setStarting(false);
    }
  }
  const loadError = useCallback(
    (message: string) => {
      setNotice(message);
      changePhase("intro");
    },
    [changePhase],
  );
  const lesson = QUAKE_LESSONS.find((item) => item.id === questionId);
  const stage = ["loading", "playing", "paused", "question"].includes(phase);
  function choose(optionId: string) {
    if (!gameRef.current || answer?.correct) return;
    const response = answerQuake(gameRef.current, optionId);
    if (response) {
      setAnswer(response);
      setSnapshot(quakeSnapshot(gameRef.current));
    }
  }
  function continueLesson() {
    if (!answer?.correct || document.hidden) return;
    clearControls();
    changePhase("playing");
    setFeedback(lesson ? lesson.explanation : "Lanjutkan mengikuti jalur.");
    playMusic();
    root.current?.querySelector("canvas")?.focus({ preventScroll: true });
  }
  return (
    <main
      ref={root}
      className={styles.classic + " " + skin.quake}
      data-stage={stage}
      data-phase={phase}
    >
      <div className={styles.content}>
        <Link
          href="/dashboard"
          aria-label="Kembali ke Dashboard"
          onPointerDown={() => audioRef.current?.pause()}
          onKeyDown={(event) => {
            if (event.key === "Enter") audioRef.current?.pause();
          }}
          onClick={() => audioRef.current?.pause()}
          className={stage ? styles.exit : button + " " + styles.back}
        >
          <ArrowLeft size={18} />
          <span className={stage ? styles.exitLabel : undefined}>
            Kembali ke Dashboard
          </span>
        </Link>
        <header className={styles.heading + " flex items-start gap-4"}>
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-tint text-fg-brand">
            <ShieldCheck size={30} />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-fg-brand">
              Game Center Resiliensi
            </p>
            <h1 className="mt-1 text-2xl sm:text-3xl">Sigap Bencana</h1>
            <p className="mt-2 text-sm text-fg-muted">
              Kenali langkahnya, susuri rumah, dan belajar bersama.
            </p>
          </div>
        </header>
        {notice && (
          <p
            role="alert"
            className="mb-4 rounded-xl bg-amber-100 p-4 text-sm text-amber-950"
          >
            {notice}
          </p>
        )}
        {phase === "intro" && (
          <AnimatedSection index={0}>
            <section className={styles.menus + " grid gap-6 md:grid-cols-2"}>
              <div className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
                <div className={skin.illustration} aria-hidden="true">
                  <span className={skin.houseRoof} />
                  <span className={skin.houseBody}>
                    <span className={skin.window} />
                    <span className={skin.door} />
                    <span className={skin.window} />
                  </span>
                  <span className={skin.illustrationTag}>LATIHAN DI RUMAH</span>
                </div>
                <h2 className="text-xl font-semibold">
                  Tiga ruang, tiga langkah siaga
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-fg-muted">
                  Jelajahi rumah simulasi, singgah di tiga penanda, dan pilih
                  respons pada setiap cerita. Setelah selesai belajar, temukan
                  pintu keluar.
                </p>
                <button
                  type="button"
                  disabled={starting || isLoading}
                  onClick={() => void start()}
                  className={
                    button +
                    " mt-5 w-full bg-action text-white hover:bg-action-hover"
                  }
                >
                  <Play size={18} />
                  {starting ? "Menyiapkan latihan…" : "Mulai Latihan"}
                </button>
                <p className="mt-3 text-center text-xs text-fg-muted">
                  Tanpa batas waktu · Bisa mencoba jawaban lagi
                </p>
                <ol className="mt-6 space-y-4 text-sm text-fg-muted">
                  {QUAKE_LESSONS.map((item, i) => (
                    <li key={item.id}>
                      <strong className="text-fg">
                        {i + 1}. {item.title}.
                      </strong>{" "}
                      {item.room}: baca situasi dan tentukan pilihanmu.
                    </li>
                  ))}
                </ol>
              </div>
              <div className="space-y-5 rounded-2xl border border-line bg-surface p-6">
                <h2 className="font-semibold">Cara bermain</h2>
                <div className="rounded-xl bg-canvas p-4 text-sm">
                  <strong>Laptop / PC</strong>
                  <p className="mt-2 text-fg-muted">
                    A/D atau ←/→: bergerak
                    <br />
                    Spasi / ↑ / W: lompat
                    <br />
                    Esc: jeda atau lanjut
                  </p>
                </div>
                <div className="rounded-xl bg-canvas p-4 text-sm">
                  <strong>HP / tablet</strong>
                  <p className="mt-2 text-fg-muted">
                    Tahan arah di kiri bawah dan ketuk Lompat di kanan bawah.
                    Bisa memakai dua jari. Ketuk pilihan saat pertanyaan muncul.
                  </p>
                </div>
                <p className="rounded-xl bg-tint p-4 text-sm text-fg-brand">
                  Penyelesaian pertama setiap hari memberi {QUAKE_XP} XP.
                  Jawaban yang keliru mendapat petunjuk dan kesempatan mencoba
                  lagi.
                </p>
                <p className="text-xs leading-relaxed text-fg-muted">
                  Ini latihan virtual. Di dunia nyata, ikuti arahan pendamping
                  dan petugas.{" "}
                  <a
                    href={QUAKE_SOURCE}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-fg-brand"
                  >
                    Materi mengacu pada BMKG.
                  </a>
                </p>
                {!user && !isLoading && (
                  <p className="text-sm text-fg-muted">
                    Bisa dimainkan sebagai tamu.{" "}
                    <Link
                      href="/login?next=/game-quake"
                      className="underline text-fg-brand"
                    >
                      Masuk
                    </Link>{" "}
                    agar hasil tersimpan.
                  </p>
                )}
              </div>
            </section>
          </AnimatedSection>
        )}
        {stage && (
          <section
            className={styles.stage}
            aria-label="Permainan Sigap Bencana"
          >
            <QuakeScene bridge={bridge} onError={loadError} />
            <div className={styles.hud}>
              <div className={styles.stats}>
                <p>{snapshot.answers.length} / 3 langkah dipelajari</p>
                <p>
                  {Math.floor(snapshot.activeMs / 1000)} detik aktif · tanpa
                  batas waktu
                </p>
                <div className={styles.progressTrack} aria-hidden="true">
                  <span
                    style={{ width: (snapshot.answers.length / 3) * 100 + "%" }}
                  />
                </div>
              </div>
              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.hudButton}
                  disabled={phase !== "playing"}
                  aria-label={sound ? "Matikan Suara" : "Nyalakan Suara"}
                  aria-pressed={sound}
                  onClick={() => {
                    soundRef.current = !soundRef.current;
                    setSound(soundRef.current);
                    if (soundRef.current) playMusic();
                    else audioRef.current?.pause();
                    root.current
                      ?.querySelector("canvas")
                      ?.focus({ preventScroll: true });
                  }}
                >
                  {sound ? <Volume2 size={20} /> : <VolumeX size={20} />}
                  <span className={styles.actionLabel}>
                    {sound ? "Matikan Suara" : "Nyalakan Suara"}
                  </span>
                </button>
                <button
                  type="button"
                  className={styles.hudButton}
                  aria-label="Jeda"
                  disabled={phase !== "playing"}
                  onClick={pause}
                >
                  <Pause size={18} />
                  <span className={styles.actionLabel}>Jeda</span>
                </button>
              </div>
            </div>
            <p role="status" aria-live="polite" className={styles.feedback}>
              {phase === "loading"
                ? "Menyiapkan rumah dan karakter…"
                : feedback}
            </p>
            <div
              className={styles.controls}
              aria-label="Tombol kendali karakter"
            >
              <div className={styles.directions}>
                {(["left", "right"] as const).map((action) => (
                  <button
                    key={action}
                    type="button"
                    className={styles.control}
                    disabled={phase !== "playing"}
                    aria-label={
                      action === "left" ? "Bergerak kiri" : "Bergerak kanan"
                    }
                    aria-pressed={pressed[action]}
                    {...controlHandlers(action)}
                  >
                    {action === "left" ? (
                      <ArrowLeft size={28} />
                    ) : (
                      <ArrowRight size={28} />
                    )}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className={styles.control + " " + styles.jump}
                aria-label="Lompat"
                aria-pressed={pressed.jump}
                disabled={phase !== "playing"}
                {...controlHandlers("jump")}
              >
                <ArrowUp size={26} />
                Lompat
              </button>
            </div>
            {phase === "loading" && (
              <div className={styles.pauseBackdrop}>
                <div className={styles.pausePanel}>
                  <p role="status">Menyiapkan arena…</p>
                  <button
                    type="button"
                    className={button + " mt-4 bg-tint text-fg-brand"}
                    onClick={() => changePhase("intro")}
                  >
                    Kembali ke Petunjuk
                  </button>
                </div>
              </div>
            )}
            {phase === "paused" && (
              <div className={styles.pauseBackdrop}>
                <div
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="quake-pause-title"
                  className={styles.pausePanel + " space-y-4"}
                >
                  <h2 id="quake-pause-title" className="text-2xl font-bold">
                    Latihan dijeda
                  </h2>
                  <p className="text-sm text-fg-muted">
                    Kamu boleh beristirahat. Langkah yang sudah dipelajari tetap
                    tercatat selama sesi ini.
                  </p>
                  <button
                    ref={resumeButton}
                    type="button"
                    className={button + " bg-action text-white"}
                    onClick={resume}
                  >
                    <Play size={18} />
                    Lanjutkan
                  </button>
                  <button
                    type="button"
                    className={button + " bg-tint text-fg-brand"}
                    onClick={() => {
                      if (gameRef.current) {
                        revisitQuakeRoom(gameRef.current);
                        setSnapshot(quakeSnapshot(gameRef.current));
                      }
                      clearControls();
                      resume();
                    }}
                  >
                    <RotateCcw size={17} />
                    Kembali ke Ruang Terakhir
                  </button>
                  <button
                    type="button"
                    className={button + " bg-canvas text-fg-muted"}
                    onClick={() => finish()}
                  >
                    <Flag size={17} />
                    Akhiri Latihan
                  </button>
                </div>
              </div>
            )}
            {phase === "question" && lesson && (
              <div className={styles.pauseBackdrop}>
                <div
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="quake-question-title"
                  className={styles.pausePanel + " space-y-4"}
                >
                  <p className="text-xs font-semibold uppercase tracking-widest text-fg-brand">
                    Langkah{" "}
                    {QUAKE_LESSONS.findIndex((item) => item.id === lesson.id) +
                      1}{" "}
                    / 3 · {lesson.room}
                  </p>
                  <h2
                    ref={modalHeading}
                    tabIndex={-1}
                    id="quake-question-title"
                    className="text-2xl font-bold outline-none"
                  >
                    {lesson.title}
                  </h2>
                  <p className="text-sm leading-relaxed text-fg-muted">
                    {lesson.prompt}
                  </p>
                  <div className="space-y-3">
                    {lesson.options.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        disabled={answer?.correct}
                        className={skin.option}
                        onClick={() => choose(option.id)}
                      >
                        {option.text}
                      </button>
                    ))}
                  </div>
                  {answer && (
                    <p
                      role="status"
                      className={skin.answer + " text-sm leading-relaxed"}
                    >
                      {answer.correct ? "Pilihan tepat. " : "Yuk, coba lagi. "}
                      {answer.explanation}
                    </p>
                  )}
                  {answer?.correct && (
                    <button
                      autoFocus
                      type="button"
                      className={button + " w-full bg-action text-white"}
                      onClick={continueLesson}
                    >
                      <Play size={18} />
                      Lanjutkan Perjalanan
                    </button>
                  )}
                  <button
                    type="button"
                    className={button + " bg-canvas text-fg-muted"}
                    onClick={() => finish()}
                  >
                    Akhiri Latihan
                  </button>
                </div>
              </div>
            )}
          </section>
        )}
        {phase === "result" && result && (
          <AnimatedSection index={0}>
            <section
              className={
                styles.result + " space-y-6 rounded-2xl bg-surface p-6 sm:p-8"
              }
            >
              <div>
                <p className="text-sm text-fg-brand">Ringkasan Sigap Bencana</p>
                <h2
                  ref={resultHeading}
                  tabIndex={-1}
                  className="mt-2 text-2xl font-bold outline-none"
                >
                  {result.completed
                    ? "Latihan siagamu selesai!"
                    : "Terima kasih sudah berlatih"}
                </h2>
                <p className="mt-3 text-sm text-fg-muted">
                  {result.completed
                    ? "Kamu sudah mempelajari tiga langkah dan mencapai pintu keluar."
                    : "Kamu boleh mencoba lagi kapan pun siap. Setiap langkah belajar tetap berarti."}
                </p>
              </div>
              <p className="rounded-xl bg-canvas p-4 text-sm">
                {result.answers.length} / 3 langkah dipelajari ·{" "}
                {Math.floor(result.activeMs / 1000)} detik aktif
              </p>
              <div className="grid gap-4 md:grid-cols-3">
                {QUAKE_LESSONS.map((item) => (
                  <article key={item.id} className="rounded-xl bg-canvas p-4">
                    <p className="text-xs text-fg-brand">
                      {result.answers.some((a) => a.questionId === item.id)
                        ? "Sudah dipelajari"
                        : "Bisa dipelajari berikutnya"}
                    </p>
                    <h3 className="mt-2 font-semibold">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-fg-muted">
                      {item.explanation}
                    </p>
                  </article>
                ))}
              </div>
              <p role="status" className="text-sm text-fg-muted">
                {saveMessage}
              </p>
              {saveState === "error" && (
                <button
                  type="button"
                  className={button + " bg-tint text-fg-brand"}
                  onClick={() => void save(result)}
                >
                  Coba Simpan Lagi
                </button>
              )}
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className={button + " bg-action text-white"}
                  disabled={saveState === "saving"}
                  onClick={() => changePhase("intro")}
                >
                  <RotateCcw size={18} />
                  Main Lagi
                </button>
                <Link
                  href="/dashboard"
                  onPointerDown={() => audioRef.current?.pause()}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") audioRef.current?.pause();
                  }}
                  onClick={() => audioRef.current?.pause()}
                  className={button + " bg-tint text-fg-brand"}
                >
                  Lihat Pohon Harapan
                </Link>
              </div>
              <a
                href={QUAKE_SOURCE}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-xs text-fg-brand underline"
              >
                Baca panduan gempa bumi BMKG
              </a>
            </section>
          </AnimatedSection>
        )}
      </div>
    </main>
  );
}
