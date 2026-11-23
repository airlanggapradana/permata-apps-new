"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type KeyboardEvent as ControlKeyEvent,
} from "react";
import Link from "next/link";
import { AnimatedSection } from "@/components/PageMotion";
import { useReducedMotion } from "framer-motion";
import {
  Shield,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Pause,
  Play,
  RotateCcw,
  Flag,
  Volume2,
  VolumeX,
  Star,
  Backpack,
  Hand,
  ClipboardList,
  Check,
  MapPin,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { TreeStats } from "@/lib/treeProgress";
import MinangScene from "@/components/games/MinangScene";
import MinangCover from "@/components/games/MinangCover";
import MinangIcon from "@/components/games/MinangIcon";
import BagGuideDialog from "@/components/games/BagGuideDialog";
import {
  MINANG_POS_TITLES,
  MINANG_TUTORIAL,
} from "@/lib/games/minangPresentation";
import styles from "./GameSiagaMinang.module.css";
import {
  MINANG_ITEMS,
  MINANG_PICKUPS,
  MINANG_TARGET,
  MINANG_CHECKPOINTS,
  MINANG_XP,
  MINANG_VERSION,
  MINANG_LESSONS,
  answerMinang,
  createMinangState,
  getMinangSnapshot,
  returnToMinangCheckpoint,
  type MinangState,
  type MinangInput,
  type MinangSnapshot,
  type MinangEvent,
} from "@/lib/games/siagaMinang";

type Phase = "intro" | "playing" | "paused" | "question" | "result";
type Control = "left" | "right" | "jump";
const button =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-action disabled:opacity-60";
const keyControl: Record<string, Control> = {
  ArrowLeft: "left",
  KeyA: "left",
  ArrowRight: "right",
  KeyD: "right",
  ArrowUp: "jump",
  KeyW: "jump",
  Space: "jump",
  ButtonLeft: "left",
  ButtonRight: "right",
  ButtonJump: "jump",
};
const buttonCode: Record<Control, string> = {
  left: "ButtonLeft",
  right: "ButtonRight",
  jump: "ButtonJump",
};

export default function GameSiagaMinang() {
  const { user, isLoading, setTreeStats } = useAuth();
  const reducedMotion = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("intro");
  const phaseRef = useRef<Phase>("intro");
  const [starting, setStarting] = useState(false);
  const [introStep, setIntroStep] = useState(0);
  const [skipTyping, setSkipTyping] = useState(false);
  const [questionId, setQuestionId] = useState<string | null>(null);
  const [answer, setAnswer] = useState<{
    correct: boolean;
    explanation: string;
  } | null>(null);
  const [inspectedItem, setInspectedItem] = useState<string | null>(null);
  const [missionExpanded, setMissionExpanded] = useState(false);
  const startingRef = useRef(false);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [feedback, setFeedback] = useState(
    "Coba berjalan dan melompat di area latihan. Barang otomatis diambil saat disentuh karakter.",
  );
  const [pauseMessage, setPauseMessage] = useState("");
  const [snapshot, setSnapshot] = useState(() =>
    getMinangSnapshot(createMinangState()),
  );
  const [result, setResult] = useState<MinangSnapshot | null>(null);
  const [saveState, setSaveState] = useState<
    "idle" | "saving" | "saved" | "error" | "guest"
  >("idle");
  const [saveMessage, setSaveMessage] = useState("");
  const [pressed, setPressed] = useState({
    left: false,
    right: false,
    jump: false,
  });
  const [sound, setSound] = useState(true);
  const [soundBusy, setSoundBusy] = useState(false);
  const inputRef = useRef<MinangInput>({
    left: false,
    right: false,
    jump: false,
    enabled: false,
  });
  const gameRef = useRef<MinangState | null>(null);
  const keysRef = useRef(new Set<string>());
  const pointersRef = useRef(new Map<number, Control>());
  const regionRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLElement>(null);
  const resultHeadingRef = useRef<HTMLHeadingElement>(null);
  const resumeRef = useRef<HTMLButtonElement>(null);
  const questionHeadingRef = useRef<HTMLHeadingElement>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const soundRef = useRef(true);
  const notesRef = useRef(new Set<OscillatorNode>());
  const musicTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1000px)");
    const update = () => setMissionExpanded(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);
  useEffect(() => {
    rootRef.current?.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [phase]);

  const changePhase = useCallback((next: Phase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);
  const syncInput = useCallback(() => {
    const controls = [...keysRef.current].map((code) => keyControl[code]);
    controls.push(...pointersRef.current.values());
    const next = {
      left: controls.includes("left"),
      right: controls.includes("right"),
      jump: controls.includes("jump"),
    };
    if (next.jump && !inputRef.current.jump) inputRef.current.jumpQueued = true;
    Object.assign(inputRef.current, next);
    setPressed(next);
  }, []);
  const clearControls = useCallback(() => {
    keysRef.current.clear();
    pointersRef.current.clear();
    Object.assign(inputRef.current, {
      left: false,
      right: false,
      jump: false,
      jumpQueued: false,
      interactQueued: false,
    });
    setPressed({ left: false, right: false, jump: false });
  }, []);
  const stopSounds = useCallback(() => {
    if (musicTimerRef.current !== null)
      window.clearTimeout(musicTimerRef.current);
    musicTimerRef.current = null;
    for (const note of notesRef.current) {
      try {
        note.stop();
      } catch {
        /* Already stopped. */
      }
    }
    notesRef.current.clear();
  }, []);
  const prepareAudio = useCallback(async () => {
    try {
      const Audio =
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Audio) return false;
      audioRef.current ??= new Audio();
      await audioRef.current.resume();
      return audioRef.current.state === "running";
    } catch {
      return false;
    }
  }, []);
  const playMusic = useCallback(() => {
    if (musicTimerRef.current !== null) return;
    const schedule = () => {
      const audio = audioRef.current;
      if (
        !soundRef.current ||
        phaseRef.current !== "playing" ||
        !audio ||
        audio.state !== "running"
      )
        return;
      const notes = [392, 440, 493.88, 587.33, 659.25, 587.33, 493.88, 440];
      const now = audio.currentTime;
      notes.forEach((frequency, index) => {
        const oscillator = audio.createOscillator(),
          gain = audio.createGain();
        const start = now + index * 0.25;
        oscillator.type = "triangle";
        oscillator.frequency.setValueAtTime(frequency, start);
        gain.gain.setValueAtTime(0.001, start);
        gain.gain.linearRampToValueAtTime(0.025, start + 0.035);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.2);
        oscillator.connect(gain);
        gain.connect(audio.destination);
        notesRef.current.add(oscillator);
        oscillator.onended = () => {
          notesRef.current.delete(oscillator);
          oscillator.disconnect();
          gain.disconnect();
        };
        oscillator.start(start);
        oscillator.stop(start + 0.21);
      });
      musicTimerRef.current = window.setTimeout(() => {
        musicTimerRef.current = null;
        schedule();
      }, 2000);
    };
    schedule();
  }, []);
  const playSound = useCallback((type: MinangEvent["type"]) => {
    const audio = audioRef.current;
    if (
      !soundRef.current ||
      !audio ||
      audio.state !== "running" ||
      !["jump", "item", "checkpoint"].includes(type)
    )
      return;
    const oscillator = audio.createOscillator(),
      gain = audio.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value =
      type === "item" ? 660 : type === "checkpoint" ? 520 : 330;
    gain.gain.setValueAtTime(0.035, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.12);
    oscillator.connect(gain);
    gain.connect(audio.destination);
    notesRef.current.add(oscillator);
    oscillator.onended = () => {
      notesRef.current.delete(oscillator);
      oscillator.disconnect();
      gain.disconnect();
    };
    oscillator.start();
    oscillator.stop(audio.currentTime + 0.13);
  }, []);
  async function toggleSound() {
    if (soundRef.current) {
      soundRef.current = false;
      setSound(false);
      stopSounds();
      return;
    }
    setSoundBusy(true);
    try {
      if (await prepareAudio()) {
        soundRef.current = true;
        setSound(true);
        playMusic();
      } else {
        throw new Error("Audio unavailable");
      }
    } catch {
      setFeedback(
        "Suara belum tersedia. Kamu tetap bisa mengikuti panduan visual.",
      );
    } finally {
      setSoundBusy(false);
    }
  }
  useEffect(
    () => () => {
      soundRef.current = false;
      stopSounds();
      if (audioRef.current && audioRef.current.state !== "closed")
        void audioRef.current.close().catch(() => {});
    },
    [stopSounds],
  );

  const pause = useCallback(
    (message: string) => {
      if (phaseRef.current !== "playing") return;
      inputRef.current.enabled = false;
      if (gameRef.current) setSnapshot(getMinangSnapshot(gameRef.current));
      clearControls();
      stopSounds();
      setPauseMessage(message);
      changePhase("paused");
    },
    [changePhase, clearControls, stopSounds],
  );
  const resume = useCallback(() => {
    if (phaseRef.current !== "paused" || document.hidden) return;
    clearControls();
    inputRef.current.enabled = true;
    changePhase("playing");
    if (soundRef.current)
      void prepareAudio().then((ready) => {
        if (ready) playMusic();
      });
    regionRef.current?.querySelector("canvas")?.focus({ preventScroll: true });
  }, [changePhase, clearControls, prepareAudio, playMusic]);
  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.code === "Tab") {
        const area =
          rootRef.current?.querySelector('[role="dialog"]') ?? rootRef.current;
        const targets = area
          ? Array.from(
              area.querySelectorAll<HTMLElement>(
                'a[href],button:not(:disabled),input:not(:disabled),canvas[tabindex="0"]',
              ),
            ).filter((element) => element.getClientRects().length > 0)
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
        return;
      }
      if (event.code === "Escape") {
        if (phaseRef.current === "playing") {
          event.preventDefault();
          pause("Permainan dijeda. Lanjutkan saat kamu siap.");
        } else if (phaseRef.current === "paused") {
          event.preventDefault();
          resume();
        }
        return;
      }
      if (
        event.code === "KeyE" &&
        phaseRef.current === "playing" &&
        !(event.target as HTMLElement | null)?.closest(
          "button,a,input,textarea,select",
        )
      ) {
        event.preventDefault();
        inputRef.current.interactQueued = true;
        return;
      }
      if (
        !keyControl[event.code] ||
        phaseRef.current !== "playing" ||
        (event.target as HTMLElement | null)?.closest(
          "button,a,input,textarea,select,[contenteditable='true']",
        )
      )
        return;
      event.preventDefault();
      keysRef.current.add(event.code);
      syncInput();
    };
    const up = (event: KeyboardEvent) => {
      if (!keyControl[event.code]) return;
      keysRef.current.delete(event.code);
      syncInput();
    };
    const hidden = () => {
      if (document.hidden)
        pause(
          "Permainan dijeda karena kamu berpindah tab. Kontrol sudah dilepas.",
        );
    };
    const blur = () =>
      pause(
        "Permainan dijeda karena jendela tidak aktif. Lanjutkan saat siap.",
      );
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    window.addEventListener("pagehide", blur);
    document.addEventListener("visibilitychange", hidden);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
      window.removeEventListener("pagehide", blur);
      document.removeEventListener("visibilitychange", hidden);
    };
  }, [pause, resume, syncInput]);
  useEffect(() => {
    if (phase === "paused") resumeRef.current?.focus({ preventScroll: true });
    if (phase === "result")
      resultHeadingRef.current?.focus({ preventScroll: true });
    if (phase === "question")
      questionHeadingRef.current?.focus({ preventScroll: true });
  }, [phase]);

  const saveResult = useCallback(
    async (next: MinangSnapshot) => {
      if (!attemptId) {
        setSaveState("guest");
        setSaveMessage(
          "Perjalananmu selesai. Masuk sebelum sesi berikutnya agar hasil dan XP tersimpan.",
        );
        return;
      }
      setSaveState("saving");
      setSaveMessage("Menyimpan perjalananmu…");
      try {
        const response = await fetch("/api/games/siaga-minang", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "finish", attemptId, ...next }),
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
          throw new Error(
            data.error || "Hasil belum tersimpan. Coba lagi, ya.",
          );
        setTreeStats(data.treeStats);
        setResult({ ...next, completed: data.completed });
        setSaveState("saved");
        setSaveMessage(
          data.alreadySaved
            ? "Sesi ini sudah tersimpan. Progres Pohon Harapan sudah diperbarui."
            : data.awardedXp > 0
              ? `Hasil tersimpan. +${data.awardedXp} XP untuk Pohon Harapanmu!`
              : data.completed
                ? "Hasil tersimpan. Hadiah Siaga Minang hari ini sudah diperoleh; kamu tetap boleh bermain lagi."
                : "Hasil perjalanan tersimpan. Kamu bisa mencoba lagi kapan saja.",
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
    [attemptId, setTreeStats],
  );
  const finish = useCallback(
    (next?: MinangSnapshot) => {
      if (
        phaseRef.current !== "playing" &&
        phaseRef.current !== "paused" &&
        phaseRef.current !== "question"
      )
        return;
      const end =
        next ??
        (gameRef.current ? getMinangSnapshot(gameRef.current) : snapshot);
      inputRef.current.enabled = false;
      clearControls();
      stopSounds();
      setResult(end);
      setSnapshot(end);
      changePhase("result");
      void saveResult(end);
    },
    [snapshot, clearControls, stopSounds, changePhase, saveResult],
  );
  const finishRef = useRef(finish);
  useEffect(() => {
    finishRef.current = finish;
  });
  const sceneFinished = useCallback(
    (next: MinangSnapshot) => finishRef.current(next),
    [],
  );
  const sceneUpdate = useCallback(
    (next: MinangSnapshot) => setSnapshot(next),
    [],
  );
  const sceneEvent = useCallback(
    (event: MinangEvent) => {
      if (event.message) setFeedback(event.message);
      if (event.type === "question" && event.id) {
        inputRef.current.enabled = false;
        clearControls();
        stopSounds();
        setQuestionId(event.id);
        setAnswer(null);
        if (gameRef.current) setSnapshot(getMinangSnapshot(gameRef.current));
        changePhase("question");
      }
      playSound(event.type);
    },
    [playSound, clearControls, stopSounds, changePhase],
  );

  async function start() {
    if (startingRef.current) return;
    startingRef.current = true;
    setStarting(true);
    setNotice("");
    const audioReady = soundRef.current
      ? prepareAudio()
      : Promise.resolve(false);
    try {
      let id: string | null = null;
      if (user) {
        const response = await fetch("/api/games/siaga-minang", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "start",
            mode: "practice",
            version: MINANG_VERSION,
          }),
          signal: AbortSignal.timeout(15000),
        });
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error || "Sesi belum bisa dimulai.");
        id = data.attemptId;
      }
      setAttemptId(id);
      setResult(null);
      setQuestionId(null);
      setAnswer(null);
      setInspectedItem(null);
      setSnapshot(getMinangSnapshot(createMinangState()));
      setSaveState("idle");
      clearControls();
      setFeedback(
        "Coba berjalan dan melompat di area latihan. Barang otomatis diambil saat disentuh karakter.",
      );
      inputRef.current.enabled = !document.hidden;
      if (document.hidden) {
        setPauseMessage(
          "Perjalanan siap. Lanjutkan setelah kembali ke halaman ini.",
        );
        changePhase("paused");
      } else changePhase("playing");
      void audioReady.then((ready) => {
        if (ready && soundRef.current && phaseRef.current === "playing")
          playMusic();
      });
      requestAnimationFrame(() =>
        regionRef.current?.scrollIntoView({
          block: "start",
          behavior: "instant",
        }),
      );
    } catch (error) {
      setNotice(
        error instanceof Error && error.name !== "TimeoutError"
          ? error.message
          : "Periksa koneksi dan coba mulai lagi.",
      );
    } finally {
      startingRef.current = false;
      setStarting(false);
    }
  }

  function pointerDown(
    event: PointerEvent<HTMLButtonElement>,
    action: Control,
  ) {
    if (phaseRef.current !== "playing") return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    pointersRef.current.set(event.pointerId, action);
    syncInput();
  }
  function pointerUp(event: PointerEvent<HTMLButtonElement>) {
    const action = pointersRef.current.get(event.pointerId);
    pointersRef.current.delete(event.pointerId);
    syncInput();
    if (
      action === "jump" &&
      event.type !== "pointerup" &&
      !inputRef.current.jump
    )
      inputRef.current.jumpQueued = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  }
  function controlKey(
    event: ControlKeyEvent<HTMLButtonElement>,
    action: Control,
    down: boolean,
  ) {
    if (!["Space", "Enter"].includes(event.code)) return;
    event.preventDefault();
    event.stopPropagation();
    if (down && phaseRef.current === "playing")
      keysRef.current.add(buttonCode[action]);
    else keysRef.current.delete(buttonCode[action]);
    syncInput();
  }
  function controlBlur(action: Control) {
    keysRef.current.delete(buttonCode[action]);
    syncInput();
  }
  function returnToPos(id: string) {
    if (
      phaseRef.current !== "paused" ||
      !gameRef.current ||
      !returnToMinangCheckpoint(gameRef.current, id)
    )
      return;
    clearControls();
    setSnapshot(getMinangSnapshot(gameRef.current));
    setFeedback(
      "Kamu kembali ke pos yang dipilih. Perlengkapan yang terkumpul tetap dibawa.",
    );
    resumeRef.current?.focus();
  }

  const stage = ["playing", "paused", "question"].includes(phase);
  const lesson = MINANG_LESSONS.find((item) => item.id === questionId);
  const posIndex =
    phase === "question"
      ? Math.max(
          0,
          MINANG_LESSONS.findIndex((item) => item.id === questionId),
        )
      : Math.min(2, snapshot.checkpoints.length);
  const learned = snapshot.answers?.length ?? 0;
  const missionTarget = [3, 6, 10][posIndex];
  const missions = [
    {
      label: `Kumpulkan ${missionTarget} perlengkapan (${Math.min(missionTarget, snapshot.collectedPickups.length)}/${missionTarget})`,
      done: snapshot.collectedPickups.length >= missionTarget,
    },
    {
      label:
        posIndex === 1
          ? "Aktifkan jembatan simulasi"
          : posIndex === 2
            ? "Capai titik kumpul"
            : "Temui Kak Naya di pos",
      done:
        posIndex === 1
          ? snapshot.bridgeActivated
          : snapshot.checkpoints.includes(MINANG_CHECKPOINTS[posIndex].id),
    },
    {
      label: "Belajar dari kuis bersama Kak Naya",
      done: Boolean(
        snapshot.answers?.some(
          (item) => item.questionId === MINANG_CHECKPOINTS[posIndex].id,
        ),
      ),
    },
  ];
  function interact() {
    if (phaseRef.current !== "playing") return;
    inputRef.current.interactQueued = true;
    regionRef.current?.querySelector("canvas")?.focus({ preventScroll: true });
  }
  function chooseAnswer(id: string) {
    if (!gameRef.current || answer?.correct) return;
    const response = answerMinang(gameRef.current, id);
    if (response) {
      setAnswer(response);
      setSnapshot(getMinangSnapshot(gameRef.current));
    }
  }
  function continueLesson() {
    if (!answer?.correct || document.hidden) return;
    setFeedback(lesson?.explanation ?? "Lanjutkan mengikuti penanda hijau.");
    clearControls();
    inputRef.current.enabled = true;
    changePhase("playing");
    if (soundRef.current) playMusic();
    regionRef.current?.querySelector("canvas")?.focus({ preventScroll: true });
  }

  return (
    <main
      ref={rootRef}
      data-stage={stage}
      data-phase={phase}
      className={styles.classic}
    >
      <div className={styles.content}>
        <Link
          href="/dashboard"
          aria-label="Kembali ke Dashboard"
          className={stage ? styles.exit : button + " " + styles.back}
        >
          <ArrowLeft size={18} />
          <span className={stage ? styles.exitLabel : undefined}>
            Kembali ke Dashboard
          </span>
        </Link>
        <header className={styles.heading + " flex items-start gap-4"}>
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-tint text-fg-brand">
            <Shield size={30} />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-fg-brand">
              Game Center Resiliensi
            </p>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
              Siaga Minang
            </h1>
            <p className="mt-2 text-sm text-fg-muted">
              Langkah kecil, bekal bersama. Jelajahi jalur dan kenali
              perlengkapan siaga.
            </p>
          </div>
        </header>
        {notice && (
          <p
            role="alert"
            className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"
          >
            {notice}
          </p>
        )}

        {phase === "intro" && (
          <AnimatedSection index={0}>
            <section className={styles.introLayout}>
              <div className={styles.introTutorial}>
                <BagGuideDialog
                  key={introStep}
                  text={MINANG_TUTORIAL[introStep]}
                  step={introStep}
                  narration={false}
                  instant={skipTyping}
                  busy={starting || isLoading}
                  startLabel="Mulai Petualangan"
                  onUnavailable={() => {}}
                  onNext={() => {
                    if (introStep === 3) void start();
                    else setIntroStep(introStep + 1);
                  }}
                  onSkip={() => {
                    setIntroStep(3);
                    setSkipTyping(true);
                  }}
                  portrait={
                    <div
                      className={styles.tutorialHero}
                      role="img"
                      aria-label="Aira dengan baju hijau dan tas kuning"
                    />
                  }
                />
              </div>
              <article className={styles.introCard}>
                <div className={styles.cover}>
                  <MinangCover />
                </div>
                <h2>Petualangan tiga pos bersama Aira</h2>
                <p>
                  Kumpulkan sepuluh perlengkapan berbeda, ikuti penanda jalur,
                  dan temui Kak Naya di titik kumpul.
                </p>
                <ol className={styles.posList}>
                  {MINANG_POS_TITLES.map((title, index) => (
                    <li key={title}>
                      <strong>Pos {index + 1}</strong>
                      <span>{title}</span>
                    </li>
                  ))}
                </ol>
              </article>
              <article className={styles.introCard}>
                <h2>Belajar sesuai ritmemu</h2>
                <p>
                  Tanpa batas waktu. Saat jatuh, kembali ke checkpoint dengan
                  semua barang dan pembelajaran tetap tersimpan selama sesi ini.
                </p>
                <p>
                  <strong>Keyboard:</strong> A/D atau panah untuk berjalan,
                  Spasi/W/panah atas untuk melompat, E untuk interaksi, Esc
                  untuk jeda.
                </p>
                <p>
                  <strong>HP:</strong> tahan arah, ketuk Lompat atau Interaksi.
                  Dua jari bisa dipakai bersama.
                </p>
                <p className={styles.learningNote}>
                  Tiga bintang menunjukkan tiga pembelajaran, tanpa penilaian
                  kecepatan. Hingga {MINANG_XP} XP per hari untuk akun login.
                </p>
                <p className={styles.small}>
                  Saklar dan lompatan adalah mekanik virtual. Saat bencana
                  nyata, tetap ikuti pendamping dan petugas.
                </p>
                {!user && !isLoading && (
                  <p className={styles.small}>
                    Bisa dimainkan tanpa login.{" "}
                    <Link href="/login?next=/game-siagaminang">Masuk</Link>{" "}
                    sebelum mulai agar hasil tersimpan.
                  </p>
                )}
              </article>
            </section>
          </AnimatedSection>
        )}

        {stage && (
          <section
            ref={regionRef}
            aria-label="Permainan Siaga Minang"
            className={styles.stage}
          >
            <div className={styles.scene}>
              <MinangScene
                inputRef={inputRef}
                gameRef={gameRef}
                reducedMotion={Boolean(reducedMotion)}
                onUpdate={sceneUpdate}
                onEvent={sceneEvent}
                onFinish={sceneFinished}
              />
            </div>
            <div className={styles.gameLogo} aria-label="Siaga Minang">
              <MinangIcon index={11} className={styles.logoHouse} />
              <div>
                <strong>
                  SIAGA <span>MINANG</span>
                </strong>
                <small>Petualangan Edukasi</small>
              </div>
            </div>
            <div className={styles.hud}>
              <div className={styles.stats}>
                <MapPin size={24} aria-hidden="true" />
                <h2>
                  Pos {posIndex + 1} – {MINANG_POS_TITLES[posIndex]}
                </h2>
              </div>
              <div className={styles.actions}>
                <span
                  className={styles.counter}
                  aria-label={learned + " dari 3 bintang belajar"}
                >
                  <Star fill="#ffcf32" color="#a77117" size={30} /> {learned} /
                  3
                </span>
                <span className={styles.counter}>
                  <MinangIcon index={10} className={styles.counterBag} />{" "}
                  {snapshot.collectedPickups.length} / 10
                </span>
                <button
                  type="button"
                  className={styles.hudButton}
                  aria-label="Buka inventori"
                  disabled={phase !== "playing"}
                  onClick={() => {
                    setInspectedItem(snapshot.items[0] ?? null);
                    pause(
                      "Lihat perlengkapan dan pelajari kegunaannya. Barang tetap dibawa saat kembali ke checkpoint.",
                    );
                  }}
                >
                  <Backpack size={23} />
                </button>
                <button
                  type="button"
                  aria-label={sound ? "Matikan Suara" : "Nyalakan Suara"}
                  aria-pressed={sound}
                  disabled={soundBusy || phase !== "playing"}
                  className={styles.hudButton}
                  onClick={() => {
                    void toggleSound();
                    regionRef.current
                      ?.querySelector("canvas")
                      ?.focus({ preventScroll: true });
                  }}
                >
                  {sound ? <Volume2 size={23} /> : <VolumeX size={23} />}
                </button>
                <button
                  type="button"
                  aria-label="Jeda"
                  className={styles.hudButton + " " + styles.pauseButton}
                  disabled={phase !== "playing"}
                  onClick={() =>
                    pause(
                      "Permainan dijeda. Perlengkapan dan bintang belajarmu tetap tersimpan selama sesi ini.",
                    )
                  }
                >
                  <Pause size={24} fill="currentColor" />
                </button>
              </div>
            </div>
            <div className={styles.playerCard}>
              <span className={styles.avatar} aria-hidden="true" />
              <div>
                <strong>Aira</strong>
                <span
                  className={styles.posDots}
                  aria-label={
                    snapshot.checkpoints.length + " dari 3 pos tercapai"
                  }
                >
                  {[0, 1, 2].map((index) => (
                    <i
                      key={index}
                      data-done={snapshot.checkpoints.length > index}
                    >
                      {snapshot.checkpoints.length > index ? "✓" : index + 1}
                    </i>
                  ))}
                </span>
              </div>
            </div>
            <aside className={styles.missionPanel} aria-label="Misi pos">
              <button
                type="button"
                className={styles.missionToggle}
                aria-expanded={missionExpanded}
                onClick={() => {
                  clearControls();
                  setMissionExpanded(!missionExpanded);
                }}
              >
                <ClipboardList size={23} /> Misi Pos {posIndex + 1}
              </button>
              <ul hidden={!missionExpanded}>
                {missions.map((mission) => (
                  <li key={mission.label}>
                    <span
                      className={styles.checkBox}
                      data-done={Boolean(mission.done)}
                    >
                      {mission.done && <Check size={20} />}
                    </span>
                    <span>{mission.label}</span>
                  </li>
                ))}
              </ul>
            </aside>
            <div
              className={styles.quickInventory}
              aria-label="Perlengkapan terkumpul"
            >
              {MINANG_ITEMS.map((item, index) => (
                <button
                  type="button"
                  key={item.id}
                  title={item.name}
                  aria-label={
                    item.name +
                    (snapshot.items.includes(item.id)
                      ? ", sudah dibawa"
                      : ", belum dibawa")
                  }
                  data-collected={snapshot.items.includes(item.id)}
                  disabled={phase !== "playing"}
                  onClick={() => {
                    setInspectedItem(item.id);
                    pause("Kenali kegunaan perlengkapan bersama Kak Naya.");
                  }}
                >
                  <MinangIcon index={index} />
                  {snapshot.items.includes(item.id) && <Check size={12} />}
                </button>
              ))}
            </div>
            <p role="status" aria-live="polite" className={styles.feedback}>
              <span aria-hidden="true">📣</span>
              {feedback}
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
                    aria-label={
                      action === "left" ? "Bergerak kiri" : "Bergerak kanan"
                    }
                    aria-pressed={pressed[action]}
                    disabled={phase !== "playing"}
                    onPointerDown={(event) => pointerDown(event, action)}
                    onPointerUp={pointerUp}
                    onPointerCancel={pointerUp}
                    onLostPointerCapture={pointerUp}
                    onContextMenu={(event) => event.preventDefault()}
                    onKeyDown={(event) => controlKey(event, action, true)}
                    onKeyUp={(event) => controlKey(event, action, false)}
                    onBlur={() => controlBlur(action)}
                    className={styles.control}
                  >
                    {action === "left" ? (
                      <ArrowLeft size={36} strokeWidth={3.5} />
                    ) : (
                      <ArrowRight size={36} strokeWidth={3.5} />
                    )}
                  </button>
                ))}
              </div>
              <div className={styles.actionControls}>
                <button
                  type="button"
                  className={styles.control + " " + styles.interact}
                  aria-label="Interaksi"
                  disabled={phase !== "playing"}
                  onPointerDown={(event) => {
                    event.preventDefault();
                    interact();
                  }}
                  onClick={(event) => {
                    if (event.detail === 0) interact();
                  }}
                >
                  <Hand size={30} /> <span>Interaksi</span>
                </button>
                <button
                  type="button"
                  aria-label="Lompat"
                  aria-pressed={pressed.jump}
                  disabled={phase !== "playing"}
                  onPointerDown={(event) => pointerDown(event, "jump")}
                  onPointerUp={pointerUp}
                  onPointerCancel={pointerUp}
                  onLostPointerCapture={pointerUp}
                  onContextMenu={(event) => event.preventDefault()}
                  onKeyDown={(event) => controlKey(event, "jump", true)}
                  onKeyUp={(event) => controlKey(event, "jump", false)}
                  onBlur={() => controlBlur("jump")}
                  className={styles.control + " " + styles.jump}
                >
                  <ArrowUp size={38} strokeWidth={3.5} />
                  Lompat
                </button>
              </div>
            </div>
            {phase === "question" && lesson && (
              <div className={styles.pauseBackdrop}>
                <section
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="minang-question-title"
                  className={styles.pausePanel}
                >
                  <header className={styles.guideHeading}>
                    <div
                      role="img"
                      aria-label="Kak Naya menyapa dengan rompi hijau dan papan catatan"
                      className={styles.nayaPortrait}
                    />
                    <div>
                      <p>Kak Naya · Pendamping</p>
                      <h2
                        ref={questionHeadingRef}
                        tabIndex={-1}
                        id="minang-question-title"
                      >
                        Pertanyaan Siaga · Pos {posIndex + 1}
                      </h2>
                    </div>
                  </header>
                  <p className={styles.educationTitle}>
                    Kartu Edukasi · {lesson.topic}
                  </p>
                  <h3 className={styles.questionPrompt}>{lesson.prompt}</h3>
                  <div className={styles.quizOptions}>
                    {lesson.options.map((option, index) => (
                      <button
                        type="button"
                        key={option.id}
                        disabled={Boolean(answer?.correct)}
                        data-correct={
                          answer?.correct && lesson.correct === option.id
                        }
                        onClick={() => chooseAnswer(option.id)}
                      >
                        <span>{String.fromCharCode(65 + index)}</span>
                        {option.text}
                      </button>
                    ))}
                  </div>
                  {answer && (
                    <p role="status" className={styles.educationCard}>
                      {answer.correct
                        ? "Langkah yang tepat. "
                        : "Kita coba lagi, ya. "}
                      {answer.explanation}
                    </p>
                  )}
                  {answer?.correct && (
                    <button
                      type="button"
                      className={button + " mt-4 w-full bg-action text-white"}
                      onClick={continueLesson}
                    >
                      Lanjutkan Perjalanan
                    </button>
                  )}
                  <button
                    type="button"
                    className={button + " mt-3 w-full text-fg-muted"}
                    onClick={() => finish()}
                  >
                    Akhiri Perjalanan
                  </button>
                </section>
              </div>
            )}
            {phase === "paused" && (
              <div className={styles.pauseBackdrop}>
                <div
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="minang-pause-title"
                  aria-label="Menu jeda"
                  className={styles.pausePanel + " space-y-4"}
                >
                  <h2 id="minang-pause-title" className="text-2xl font-bold">
                    Permainan dijeda
                  </h2>
                  <p className="text-sm text-fg-muted">{pauseMessage}</p>
                  <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                    <button
                      ref={resumeRef}
                      type="button"
                      onClick={resume}
                      className={
                        button + " w-full sm:w-auto bg-action text-white"
                      }
                    >
                      <Play size={17} />
                      Lanjutkan
                    </button>
                    <button
                      type="button"
                      onClick={() => finish()}
                      className={
                        button +
                        " w-full sm:w-auto border border-line text-fg-muted"
                      }
                    >
                      Akhiri Perjalanan
                    </button>
                  </div>
                  <div
                    className={styles.inventory}
                    aria-label="Perlengkapan perjalanan"
                  >
                    {MINANG_ITEMS.map((item, index) => (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => setInspectedItem(item.id)}
                        aria-pressed={inspectedItem === item.id}
                      >
                        <MinangIcon index={index} />
                        <strong>{item.name}</strong>
                        <span>
                          {snapshot.items.includes(item.id)
                            ? "Sudah dibawa ✓"
                            : "Belum dibawa"}
                        </span>
                      </button>
                    ))}
                  </div>
                  {inspectedItem && (
                    <div className={styles.educationCard} role="status">
                      <strong>
                        {
                          MINANG_ITEMS.find((item) => item.id === inspectedItem)
                            ?.name
                        }
                      </strong>
                      <p>
                        {
                          MINANG_ITEMS.find((item) => item.id === inspectedItem)
                            ?.lesson
                        }
                      </p>
                    </div>
                  )}
                  <p className="text-xs text-fg-muted">
                    Cari barang yang terlewat dari pos yang sudah dibuka.
                    Beberapa perlengkapan berada di atas papan kayu.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => returnToPos("start")}
                      className={button + " bg-sunken px-3 text-fg-brand"}
                    >
                      Kembali ke Awal
                    </button>
                    {MINANG_CHECKPOINTS.map((pos) => (
                      <button
                        key={pos.id}
                        type="button"
                        disabled={!snapshot.checkpoints.includes(pos.id)}
                        onClick={() => returnToPos(pos.id)}
                        className={button + " bg-sunken px-3 text-fg-brand"}
                      >
                        Kembali ke {pos.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {phase === "result" && result && (
          <AnimatedSection index={0}>
            <section
              className={styles.result + " rounded-2xl bg-surface p-6 sm:p-8"}
            >
              <div className="text-center">
                <Flag className="mx-auto text-fg-brand" size={42} />
                <h2
                  ref={resultHeadingRef}
                  tabIndex={-1}
                  className="mt-4 text-2xl font-bold outline-none"
                >
                  {result.completed
                    ? "Perjalanan siagamu selesai!"
                    : "Terima kasih sudah berpetualang!"}
                </h2>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-fg-muted">
                  {result.completed
                    ? "Kamu sudah mengenal sepuluh perlengkapan, mengikuti jalur yang diarahkan, dan belajar di tiga pos bersama Kak Naya. Ajak keluarga menyiapkan bekal bersama."
                    : "Setiap langkah adalah kesempatan belajar. Kamu boleh mencoba perjalanan baru kapan saja."}
                </p>
                <p className="mt-3 text-sm text-fg-muted">
                  {result.collectedPickups.length} / {MINANG_TARGET}{" "}
                  perlengkapan · {result.checkpoints.length} / 3 pos ·{" "}
                  {Math.floor(result.activeMs / 1000)} detik aktif
                </p>
              </div>
              <div
                className={styles.learningSummary}
                aria-label="Ringkasan pembelajaran"
              >
                {MINANG_LESSONS.map((item) => {
                  const done = result.answers?.some(
                    (answer) =>
                      answer.questionId === item.id &&
                      answer.optionId === item.correct,
                  );
                  return (
                    <article key={item.id} data-learned={Boolean(done)}>
                      <Star
                        fill={done ? "#ffcf32" : "none"}
                        color="#af7e2b"
                        size={32}
                      />
                      <h3>{item.topic}</h3>
                      <p>
                        {done
                          ? "Sudah dipelajari bersama Kak Naya"
                          : "Bisa dipelajari pada perjalanan berikutnya"}
                      </p>
                    </article>
                  );
                })}
              </div>
              <ul className="my-6 grid gap-3 sm:grid-cols-2">
                {MINANG_ITEMS.map((item, index) => (
                  <li
                    key={item.id}
                    className="flex gap-3 rounded-xl bg-canvas p-4"
                  >
                    <MinangIcon index={index} />
                    <div>
                      <p className="text-sm font-semibold">
                        {item.name}{" "}
                        <span className="text-xs font-normal text-fg-muted">
                          ·{" "}
                          {result.items.includes(item.id)
                            ? "Sudah dibawa"
                            : "Bisa dicari lagi"}
                        </span>
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-fg-muted">
                        {item.lesson}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
              <div
                role="status"
                className={`rounded-xl p-4 text-sm ${saveState === "error" ? "bg-amber-50 text-amber-900" : "bg-tint text-fg-brand"}`}
              >
                <p>{saveMessage}</p>
                {saveState === "error" && (
                  <button
                    type="button"
                    onClick={() => void saveResult(result)}
                    className={`${button} mt-3 w-full sm:w-auto bg-action text-white`}
                  >
                    Coba Simpan Lagi
                  </button>
                )}
                {saveState === "guest" && (
                  <Link
                    href="/login?next=/game-siagaminang"
                    className="mt-2 inline-block font-semibold underline"
                  >
                    Masuk untuk sesi berikutnya
                  </Link>
                )}
              </div>
              <div className="mt-6 flex flex-col sm:flex-row flex-wrap justify-center gap-3">
                <button
                  type="button"
                  disabled={saveState === "saving" || saveState === "error"}
                  onClick={() => {
                    setNotice("");
                    setIntroStep(0);
                    setSkipTyping(false);
                    changePhase("intro");
                  }}
                  className={`${button} w-full sm:w-auto bg-action text-white`}
                >
                  <RotateCcw size={17} />
                  Main Lagi
                </button>
                <Link
                  href="/dashboard"
                  className={`${button} w-full sm:w-auto border border-line text-fg-brand`}
                >
                  Lihat Pohon Harapan
                </Link>
              </div>
            </section>
          </AnimatedSection>
        )}
      </div>
    </main>
  );
}
