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
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { TreeStats } from "@/lib/treeProgress";
import MinangScene from "@/components/games/MinangScene";
import MinangCover from "@/components/games/MinangCover";
import styles from "./GameSiagaMinang.module.css";
import {
  MINANG_ITEMS,
  MINANG_PICKUPS,
  MINANG_TARGET,
  MINANG_CHECKPOINTS,
  MINANG_XP,
  createMinangState,
  getMinangSnapshot,
  returnToMinangCheckpoint,
  type MinangState,
  type MinangInput,
  type MinangSnapshot,
  type MinangEvent,
} from "@/lib/games/siagaMinang";

type Phase = "intro" | "playing" | "paused" | "result";
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
  const audioRef = useRef<AudioContext | null>(null);
  const soundRef = useRef(true);
  const notesRef = useRef(new Set<OscillatorNode>());
  const musicTimerRef = useRef<number | null>(null);

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
          phaseRef.current === "paused"
            ? rootRef.current?.querySelector('[aria-label="Menu jeda"]')
            : rootRef.current;
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
      if (phaseRef.current !== "playing" && phaseRef.current !== "paused")
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
      playSound(event.type);
    },
    [playSound],
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
          body: JSON.stringify({ action: "start", mode: "practice" }),
          signal: AbortSignal.timeout(15000),
        });
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error || "Sesi belum bisa dimulai.");
        id = data.attemptId;
      }
      setAttemptId(id);
      setResult(null);
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

  return (
    <main
      ref={rootRef}
      data-stage={phase === "playing" || phase === "paused"}
      data-phase={phase}
      className={styles.classic}
    >
      <div className={styles.content}>
        <Link
          href="/dashboard"
          aria-label="Kembali ke Dashboard"
          className={
            phase === "playing" || phase === "paused"
              ? styles.exit
              : button + " " + styles.back
          }
        >
          <ArrowLeft size={18} />
          <span
            className={
              phase === "playing" || phase === "paused"
                ? styles.exitLabel
                : undefined
            }
          >
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
            <section className={styles.menus + " grid gap-6 md:grid-cols-2"}>
              <div className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
                <div className={styles.cover}>
                  <MinangCover />
                  <span className={styles.coverTag}>JELAJAH RANAH MINANG</span>
                </div>
                <h2 className="text-xl font-semibold">Petualangan tiga pos</h2>
                <p className="mt-3 text-sm leading-relaxed text-fg-muted">
                  Susuri perbukitan, singgah di pos, dan siapkan bekal bersama.
                  Kumpulkan 10 perlengkapan dari empat jenis, lalu capai Rumah
                  Gadang di titik akhir.
                </p>
                <button
                  type="button"
                  onClick={() => void start()}
                  disabled={starting || isLoading}
                  className={`${button} mt-5 w-full bg-action text-white hover:bg-action-hover`}
                >
                  <Play size={18} />
                  {starting ? "Menyiapkan perjalanan…" : "Mulai Petualangan"}
                </button>
                <p className="mt-3 text-center text-xs text-fg-muted">
                  <span className="hidden sm:inline">
                    A/D atau ←/→ untuk bergerak · Spasi untuk melompat
                  </span>
                  <span className="sm:hidden">
                    Main dengan tombol arah dan Lompat di layar
                  </span>
                </p>
                <ol className="mt-6 space-y-4 text-sm text-fg-muted">
                  <li>
                    <strong className="text-fg">1. Coba kontrolnya.</strong>{" "}
                    Berjalan dan melompat di area awal.
                  </li>
                  <li>
                    <strong className="text-fg">2. Singgah di tiga pos.</strong>{" "}
                    Setiap pos menjadi tempat melanjutkan jika jatuh.
                    Perlengkapan tetap dibawa.
                  </li>
                  <li>
                    <strong className="text-fg">3. Lengkapi bekalmu.</strong>{" "}
                    Barang otomatis diambil saat disentuh karakter. Lompat ke
                    papan kayu untuk menemukan perlengkapan di atasnya.
                  </li>
                </ol>
                <div className="mt-6 flex flex-wrap gap-3">
                  {MINANG_ITEMS.map((item) => (
                    <span
                      key={item.id}
                      className="rounded-xl bg-canvas p-3 text-sm"
                    >
                      {item.emoji} {item.name}
                    </span>
                  ))}
                </div>
                <p className="mt-5 text-xs leading-relaxed text-fg-muted">
                  Latar terinspirasi Minangkabau. Titik akhir adalah tujuan
                  dalam permainan.
                </p>
              </div>
              <div className="space-y-5 rounded-2xl border border-line bg-surface p-6">
                <h2 className="font-semibold">Cara mengendalikan karakter</h2>
                <dl className="space-y-3 text-sm">
                  <div className="rounded-xl bg-canvas p-4">
                    <dt className="font-semibold">Laptop / PC</dt>
                    <dd className="mt-2 leading-relaxed text-fg-muted">
                      ← / A: kiri · → / D: kanan
                      <br />
                      Spasi / ↑ / W: lompat
                      <br />
                      Esc: jeda atau lanjutkan
                    </dd>
                  </div>
                  <div className="rounded-xl bg-canvas p-4">
                    <dt className="font-semibold">HP / tablet</dt>
                    <dd className="mt-2 leading-relaxed text-fg-muted">
                      Tahan tombol kiri/kanan di kiri bawah. Ketuk Lompat di
                      kanan bawah. Bisa memakai dua jari sekaligus.
                    </dd>
                  </div>
                </dl>
                <p className="rounded-xl bg-tint p-4 text-sm text-fg-brand">
                  Penyelesaian pertama setiap hari mendapat {MINANG_XP} XP.
                  Tidak ada pengurangan poin saat jatuh.
                </p>
                <p className="text-xs text-fg-muted">
                  Musik klasik dimulai setelah kamu menekan Mulai Petualangan
                  dan bisa dimatikan kapan saja. Kamera tidak diperlukan.
                </p>
                {!user && !isLoading && (
                  <p className="text-sm text-fg-muted">
                    Bisa dimainkan tanpa login.{" "}
                    <Link
                      href="/login?next=/game-siagaminang"
                      className="font-semibold text-fg-brand underline"
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

        {(phase === "playing" || phase === "paused") && (
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
            <div className={styles.hud}>
              <div className={styles.stats}>
                <p>
                  {snapshot.collectedPickups.length} / {MINANG_TARGET}{" "}
                  perlengkapan · {snapshot.checkpoints.length} / 3 pos
                </p>
                <p>
                  {Math.floor(snapshot.activeMs / 1000)} detik aktif · tanpa
                  batas waktu
                </p>
                <div className={styles.progressTrack} aria-hidden="true">
                  <span
                    style={{
                      width: `${(snapshot.collectedPickups.length / MINANG_TARGET) * 100}%`,
                    }}
                  />
                </div>
              </div>
              <div className={styles.actions}>
                <button
                  type="button"
                  aria-label={sound ? "Matikan Suara" : "Nyalakan Suara"}
                  aria-pressed={sound}
                  disabled={soundBusy}
                  onClick={() => {
                    void toggleSound();
                    regionRef.current
                      ?.querySelector("canvas")
                      ?.focus({ preventScroll: true });
                  }}
                  className={styles.hudButton}
                >
                  {sound ? <Volume2 size={20} /> : <VolumeX size={20} />}
                  <span className={styles.actionLabel}>
                    {sound ? "Matikan Suara" : "Nyalakan Suara"}
                  </span>
                </button>
                <button
                  type="button"
                  aria-label="Jeda"
                  disabled={phase === "paused"}
                  onClick={() =>
                    pause(
                      "Permainan dijeda. Kamu boleh beristirahat atau kembali ke pos yang sudah dilewati.",
                    )
                  }
                  className={styles.hudButton}
                >
                  <Pause size={18} />
                  <span className={styles.actionLabel}>Jeda</span>
                </button>
              </div>
            </div>
            <p role="status" aria-live="polite" className={styles.feedback}>
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
                      <ArrowLeft size={28} />
                    ) : (
                      <ArrowRight size={28} />
                    )}
                  </button>
                ))}
              </div>
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
                <ArrowUp size={26} />
                Lompat
              </button>
            </div>
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
                  <div className="flex flex-wrap gap-2">
                    <button
                      ref={resumeRef}
                      type="button"
                      onClick={resume}
                      className={button + " bg-action text-white"}
                    >
                      <Play size={17} />
                      Lanjutkan
                    </button>
                    <button
                      type="button"
                      onClick={() => finish()}
                      className={button + " border border-line text-fg-muted"}
                    >
                      Akhiri Perjalanan
                    </button>
                  </div>
                  <div
                    className={styles.inventory}
                    aria-label="Perlengkapan perjalanan"
                  >
                    {MINANG_ITEMS.map((item) => (
                      <span key={item.id}>
                        {item.emoji} {item.name} ·{" "}
                        {
                          MINANG_PICKUPS.filter(
                            (p) =>
                              p.type === item.id &&
                              snapshot.collectedPickups.includes(p.id),
                          ).length
                        }
                      </span>
                    ))}
                  </div>
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
                    ? "Kamu sudah mengumpulkan 10 perlengkapan dari empat jenis dan melewati tiga pos. Ajak keluarga mengenali perlengkapan siaga bersama."
                    : "Setiap langkah adalah kesempatan belajar. Kamu boleh mencoba perjalanan baru kapan saja."}
                </p>
                <p className="mt-3 text-sm text-fg-muted">
                  {result.collectedPickups.length} / {MINANG_TARGET}{" "}
                  perlengkapan · {result.checkpoints.length} / 3 pos ·{" "}
                  {Math.floor(result.activeMs / 1000)} detik aktif
                </p>
              </div>
              <ul className="my-6 grid gap-3 sm:grid-cols-2">
                {MINANG_ITEMS.map((item) => (
                  <li
                    key={item.id}
                    className="flex gap-3 rounded-xl bg-canvas p-4"
                  >
                    <span aria-hidden="true" className="text-2xl">
                      {item.emoji}
                    </span>
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
                    className={`${button} mt-3 bg-action text-white`}
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
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  disabled={saveState === "saving" || saveState === "error"}
                  onClick={() => {
                    setNotice("");
                    changePhase("intro");
                  }}
                  className={`${button} bg-action text-white`}
                >
                  <RotateCcw size={17} />
                  Main Lagi
                </button>
                <Link
                  href="/dashboard"
                  className={`${button} border border-line text-fg-brand`}
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
