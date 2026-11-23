"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatedSection } from "@/components/PageMotion";
import { useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  Camera,
  Check,
  Leaf,
  Pause,
  Play,
  RotateCcw,
  Wind,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { TreeStats } from "@/lib/treeProgress";
import {
  BREATHING_RHYTHMS,
  BREATHING_ROUNDS,
  BREATHING_XP,
  getBreathingFrame,
  getBreathingPlan,
  type BreathingRhythm,
} from "@/lib/games/breathing";
import BreathingCamera from "@/components/games/BreathingCamera";
import type { CameraPatternSummary } from "@/lib/games/breathingMotion";

type Result = {
  activeMs: number;
  completed: boolean;
  completedRounds: number;
  detection?: CameraPatternSummary;
};
const button =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-action disabled:opacity-60";

export default function GameBreathing() {
  const { user, isLoading, setTreeStats } = useAuth();
  const reducedMotion = useReducedMotion();
  const [phase, setPhase] = useState<
    "intro" | "preparing" | "running" | "paused" | "result"
  >("intro");
  const [rhythm, setRhythm] = useState<BreathingRhythm>("steady");
  const [rounds, setRounds] = useState<number>(5);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [starting, setStarting] = useState(false);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [camera, setCamera] = useState(false);
  const [detectionEnabled, setDetectionEnabled] = useState(false);
  const [notice, setNotice] = useState("");
  const [pauseMessage, setPauseMessage] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [saveState, setSaveState] = useState<
    "idle" | "saving" | "saved" | "error" | "guest"
  >("idle");
  const [saveMessage, setSaveMessage] = useState("");
  const circleRef = useRef<HTMLDivElement>(null);
  const resultHeadingRef = useRef<HTMLHeadingElement>(null);
  const accumulatedRef = useRef(0);
  const startedRef = useRef<number | null>(null);
  const finishedRef = useRef(false);
  const startingRef = useRef(false);
  const calibratingRef = useRef(false);
  const detectionSegmentsRef = useRef<Record<string, CameraPatternSummary>>({});
  const plan = getBreathingPlan(`${rhythm}:${rounds}`)!;
  const { durationMs, seconds } = plan;
  const frame = getBreathingFrame(elapsedMs, seconds, rounds);

  const saveResult = useCallback(
    async (snapshot: Result) => {
      if (!attemptId) {
        setSaveState("guest");
        setSaveMessage(
          "Terima kasih sudah meluangkan waktu. Masuk sebelum sesi berikutnya agar hasil dan XP tersimpan.",
        );
        return;
      }
      setSaveState("saving");
      setSaveMessage("Menyimpan latihanmu…");
      try {
        const response = await fetch("/api/games/breathing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "finish",
            attemptId,
            activeMs: snapshot.activeMs,
          }),
          signal: AbortSignal.timeout(15000),
        });
        const data = (await response.json()) as {
          error?: string;
          completed: boolean;
          awardedXp: number;
          alreadySaved: boolean;
          treeStats: TreeStats;
        };
        if (!response.ok)
          throw new Error(
            data.error || "Hasil belum tersimpan. Coba lagi, ya.",
          );
        setTreeStats(data.treeStats);
        setSaveState("saved");
        setSaveMessage(
          data.alreadySaved
            ? "Sesi ini sudah tersimpan. Progres Pohon Harapan sudah diperbarui."
            : data.awardedXp > 0
              ? `Hasil tersimpan. +${data.awardedXp} XP untuk Pohon Harapanmu!`
              : data.completed
                ? "Hasil tersimpan. Hadiah latihan napas hari ini sudah diperoleh; berlatih lagi selalu boleh."
                : "Waktu latihanmu sudah tersimpan. Kamu bisa kembali berlatih kapan saja.",
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

  const activeTime = useCallback(
    () =>
      Math.min(
        durationMs,
        accumulatedRef.current +
          (startedRef.current === null
            ? 0
            : performance.now() - startedRef.current),
      ),
    [durationMs],
  );

  const finish = useCallback(
    (time?: number) => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      calibratingRef.current = false;
      const activeMs = Math.floor(time ?? activeTime());
      accumulatedRef.current = activeMs;
      startedRef.current = null;
      const snapshot = {
        activeMs,
        completed: activeMs >= durationMs,
        completedRounds: getBreathingFrame(activeMs, seconds, rounds)
          .completedRounds,
        detection: Object.keys(detectionSegmentsRef.current).length
          ? Object.values(detectionSegmentsRef.current).reduce(
              (total, segment) => ({
                cycles: total.cycles + segment.cycles,
                matchedCycles: total.matchedCycles + segment.matchedCycles,
              }),
              { cycles: 0, matchedCycles: 0 },
            )
          : undefined,
      };
      setElapsedMs(activeMs);
      setResult(snapshot);
      setCamera(false);
      setPhase("result");
      void saveResult(snapshot);
    },
    [activeTime, durationMs, seconds, rounds, saveResult],
  );

  const pause = useCallback(
    (message: string) => {
      if (
        finishedRef.current ||
        (startedRef.current === null && !calibratingRef.current)
      )
        return;
      calibratingRef.current = false;
      const activeMs = activeTime();
      if (activeMs >= durationMs) {
        finish(durationMs);
        return;
      }
      accumulatedRef.current = activeMs;
      startedRef.current = null;
      setElapsedMs(activeMs);
      setCamera(false);
      setPauseMessage(message);
      setPhase("paused");
    },
    [activeTime, durationMs, finish],
  );

  useEffect(() => {
    if (phase !== "running" && phase !== "preparing") return;
    let animation = 0;
    let lastUpdate = -Infinity;
    const tick = (now: number) => {
      const activeMs = activeTime();
      const next = getBreathingFrame(activeMs, seconds, rounds);
      if (circleRef.current)
        circleRef.current.style.transform = `scale(${reducedMotion ? 1 : next.scale})`;
      if (activeMs >= durationMs) {
        finish(durationMs);
        return;
      }
      if (now - lastUpdate >= 100) {
        setElapsedMs(activeMs);
        lastUpdate = now;
      }
      animation = requestAnimationFrame(tick);
    };
    const onVisibility = () => {
      if (document.hidden)
        pause(
          "Latihan dijeda karena kamu berpindah tab. Lanjutkan saat sudah siap.",
        );
    };
    const onPageHide = () =>
      pause("Latihan dijeda. Lanjutkan saat sudah siap.");
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);
    if (document.hidden) onVisibility();
    else if (phase === "running") animation = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(animation);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [
    phase,
    activeTime,
    seconds,
    rounds,
    durationMs,
    finish,
    pause,
    reducedMotion,
  ]);

  useEffect(() => {
    if (phase === "result") resultHeadingRef.current?.focus();
  }, [phase]);

  const cameraUnavailable = useCallback(() => {
    setCamera(false);
    setNotice(
      "Kamera belum bisa digunakan. Panduan napas tetap berjalan tanpa kamera.",
    );
    if (calibratingRef.current) {
      calibratingRef.current = false;
      startedRef.current = performance.now();
      setPhase("running");
    }
  }, []);

  const detectionCalibrated = useCallback(() => {
    if (!calibratingRef.current || finishedRef.current || document.hidden)
      return;
    calibratingRef.current = false;
    startedRef.current = performance.now();
    setPhase("running");
  }, []);

  const detectionSummary = useCallback(
    (id: string, summary: CameraPatternSummary) => {
      if (!finishedRef.current) detectionSegmentsRef.current[id] = summary;
    },
    [],
  );

  async function start() {
    if (startingRef.current) return;
    startingRef.current = true;
    setStarting(true);
    setNotice("");
    try {
      let id: string | null = null;
      if (user) {
        const response = await fetch("/api/games/breathing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "start",
            mode: `${rhythm}:${rounds}`,
          }),
          signal: AbortSignal.timeout(15000),
        });
        const data = await response.json();
        if (!response.ok)
          throw new Error(
            data.error || "Sesi belum bisa dimulai. Coba lagi, ya.",
          );
        id = data.attemptId;
      }
      setAttemptId(id);
      accumulatedRef.current = 0;
      startedRef.current = null;
      finishedRef.current = false;
      calibratingRef.current = false;
      detectionSegmentsRef.current = detectionEnabled
        ? { requested: { cycles: 0, matchedCycles: 0 } }
        : {};
      setElapsedMs(0);
      setResult(null);
      setCamera(false);
      setSaveState("idle");
      if (document.hidden) {
        setPauseMessage(
          "Latihan siap. Kembali ke halaman ini dan lanjutkan saat sudah siap.",
        );
        setPhase("paused");
      } else if (detectionEnabled) {
        calibratingRef.current = true;
        setCamera(true);
        setPhase("preparing");
      } else {
        startedRef.current = performance.now();
        setPhase("running");
      }
    } catch (error) {
      setNotice(
        error instanceof Error && error.name !== "TimeoutError"
          ? error.message
          : "Sesi belum bisa dimulai. Periksa koneksi dan coba lagi.",
      );
    } finally {
      startingRef.current = false;
      setStarting(false);
    }
  }

  return (
    <main className="min-h-screen-safe bg-canvas px-4 py-5 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <Link href="/dashboard" className={`${button} px-0 text-fg-brand`}>
          <ArrowLeft size={18} />
          Kembali ke Dashboard
        </Link>
        <header className="flex items-start gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-tint text-fg-brand">
            <Wind size={30} />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-fg-brand">
              Game Center Resiliensi
            </p>
            <h1 className="mt-1 text-2xl font-bold text-fg sm:text-3xl">
              Napas Tenang
            </h1>
            <p className="mt-2 text-sm text-fg-muted">
              Luangkan waktu sejenak. Ikuti napas dengan ritmemu sendiri.
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
            <section className="grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
                <h2 className="text-xl font-semibold">
                  Ruang kecil untuk bernapas
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-fg-muted">
                  Duduk senyamanmu. Lingkaran membesar saat menarik napas dan
                  mengecil saat menghembuskan. Tidak perlu menahan napas atau
                  memaksakan hitungan.
                </p>
                <ol className="mt-6 space-y-4 text-sm text-fg-muted">
                  <li>
                    <strong className="text-fg">
                      1. Pilih ritme yang nyaman.
                    </strong>{" "}
                    Kamu bisa mulai dengan hitungan pendek.
                  </li>
                  <li>
                    <strong className="text-fg">
                      2. Ikuti panduan lingkaran.
                    </strong>{" "}
                    Bernapas perlahan sesuai kenyamananmu.
                  </li>
                  <li>
                    <strong className="text-fg">3. Jeda kapan saja.</strong>{" "}
                    Jika kurang nyaman, bernapas biasa dan akhiri latihan.
                  </li>
                </ol>
                <p className="mt-6 rounded-xl bg-tint p-4 text-sm text-fg-brand">
                  <Leaf className="mr-2 inline" size={18} />
                  Penyelesaian pertama setiap hari mendapat {BREATHING_XP} XP.
                  Kamu tetap boleh berlatih lagi.
                </p>
                <p className="mt-4 text-xs leading-relaxed text-fg-muted">
                  Kamera tidak diperlukan. Saat latihan berjalan, kamu bisa
                  menyalakannya sebagai cermin. Mode deteksi percobaan bisa
                  memperkirakan pola gerakan dada/perut; hasilnya tidak
                  menentukan XP.
                </p>
                {!user && !isLoading && (
                  <p className="mt-4 text-sm text-fg-muted">
                    Bisa dimainkan tanpa login.{" "}
                    <Link
                      href="/login?next=/game-breath"
                      className="font-semibold text-fg-brand underline"
                    >
                      Masuk
                    </Link>{" "}
                    agar hasil dan XP tersimpan.
                  </p>
                )}
              </div>
              <div className="space-y-6 rounded-2xl border border-line bg-surface p-6">
                <fieldset disabled={starting}>
                  <legend className="mb-3 font-semibold">
                    Pilih ritme napas
                  </legend>
                  <div className="space-y-3">
                    {BREATHING_RHYTHMS.map((option) => (
                      <label
                        key={option.id}
                        className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 ${rhythm === option.id ? "border-action bg-tint" : "border-line"}`}
                      >
                        <input
                          type="radio"
                          name="breathing-rhythm"
                          value={option.id}
                          checked={rhythm === option.id}
                          onChange={() => setRhythm(option.id)}
                          className="mt-1 accent-action"
                        />
                        <span>
                          <span className="block text-sm font-semibold">
                            {option.name}
                          </span>
                          <span className="mt-1 block text-xs text-fg-muted">
                            Tarik {option.seconds} detik · hembuskan{" "}
                            {option.seconds} detik
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <fieldset disabled={starting}>
                  <legend className="mb-3 font-semibold">Jumlah putaran</legend>
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    {BREATHING_ROUNDS.map((count) => (
                      <label
                        key={count}
                        className={`flex min-h-11 flex-col sm:flex-row cursor-pointer items-center justify-center gap-1.5 sm:gap-2 rounded-xl border p-2.5 sm:p-3 text-center text-xs sm:text-sm ${rounds === count ? "border-action bg-tint" : "border-line"}`}
                      >
                        <input
                          type="radio"
                          name="breathing-rounds"
                          value={count}
                          checked={rounds === count}
                          onChange={() => setRounds(count)}
                          className="accent-action"
                        />
                        <span>{count} putaran</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line p-4 text-sm">
                  <input
                    type="checkbox"
                    checked={detectionEnabled}
                    disabled={starting}
                    onChange={(event) =>
                      setDetectionEnabled(event.target.checked)
                    }
                    className="mt-1 accent-action"
                  />
                  <span>
                    <span className="block font-semibold">
                      Deteksi kamera (percobaan)
                    </span>
                    <span className="mt-1 block text-xs leading-relaxed text-fg-muted">
                      Kamera diminta setelah Mulai Latihan. Kalibrasi dulu, lalu
                      lihat perkiraan pola gerakan. Memerlukan internet saat
                      menyiapkan; video tidak direkam.
                    </span>
                  </span>
                </label>
                <p className="text-sm text-fg-muted">
                  Sekitar {durationMs / 1000} detik · tanpa menahan napas
                </p>
                <button
                  type="button"
                  disabled={starting || isLoading}
                  onClick={() => void start()}
                  className={`${button} w-full bg-action text-white hover:bg-action-hover`}
                >
                  <Play size={18} />
                  {starting ? "Menyiapkan latihan…" : "Mulai Latihan"}
                </button>
              </div>
            </section>
          </AnimatedSection>
        )}

        {(phase === "preparing" ||
          phase === "running" ||
          phase === "paused") && (
          <section aria-label="Latihan napas" className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface p-4">
              <p className="text-sm font-semibold">
                Putaran {frame.round} dari {rounds}
              </p>
              <p className="text-sm text-fg-muted">
                {Math.floor(elapsedMs / 1000)} / {durationMs / 1000} detik aktif
              </p>
              <button
                type="button"
                disabled={phase === "paused" || phase === "preparing"}
                aria-pressed={camera}
                onClick={() => {
                  setCamera(!camera);
                  setNotice("");
                }}
                className={`${button} w-full sm:w-auto bg-sunken text-fg`}
              >
                <Camera size={17} />
                {camera ? "Matikan Kamera" : "Nyalakan Kamera"}
              </button>
            </div>
            {camera && (phase === "running" || phase === "preparing") && (
              <BreathingCamera
                onUnavailable={cameraUnavailable}
                detectBreathing={detectionEnabled}
                cycleMs={seconds * 2000}
                onCalibrated={detectionCalibrated}
                onSummary={detectionSummary}
                guidance={
                  phase === "preparing"
                    ? "Kalibrasi sebelum latihan"
                    : `${frame.inhale ? "Tarik napas" : "Hembuskan napas"} · ${frame.remaining}`
                }
              />
            )}
            {phase === "preparing" && (
              <div className="rounded-xl border border-line bg-surface p-4 text-sm">
                <p>
                  Kalibrasi kamera sebelum hitungan dimulai. Bahu hingga perut
                  perlu terlihat; kamu boleh bernapas biasa.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    calibratingRef.current = false;
                    setCamera(false);
                    setDetectionEnabled(false);
                    startedRef.current = performance.now();
                    setPhase("running");
                  }}
                  className={`${button} mt-3 bg-action text-white`}
                >
                  Mulai Tanpa Deteksi
                </button>
              </div>
            )}
            <div className="rounded-2xl border border-line bg-surface px-5 py-7 text-center sm:py-9">
              <p
                role="status"
                aria-live="polite"
                className="text-2xl font-bold text-fg-brand"
              >
                {phase === "preparing"
                  ? "Menyiapkan deteksi"
                  : phase === "paused"
                    ? "Latihan dijeda"
                    : frame.inhale
                      ? "Tarik napas"
                      : "Hembuskan napas"}
              </p>
              <div className="relative mx-auto my-5 flex h-52 w-52 sm:h-64 sm:w-64 max-w-full items-center justify-center">
                <span
                  aria-hidden="true"
                  className="absolute inset-0 rounded-full border border-line"
                />
                <div
                  ref={circleRef}
                  data-breath-circle="true"
                  aria-hidden="true"
                  className="absolute h-44 w-44 sm:h-56 sm:w-56 rounded-full border border-action/30 bg-tint will-change-transform"
                  style={{
                    transform: reducedMotion ? "scale(1)" : "scale(0.65)",
                  }}
                />
                <div className="relative text-fg-brand">
                  <Wind className="mx-auto mb-3" size={32} aria-hidden="true" />
                  <span
                    aria-hidden="true"
                    className="text-4xl font-bold tabular-nums"
                  >
                    {phase === "paused" || phase === "preparing"
                      ? "Ⅱ"
                      : frame.remaining}
                  </span>
                </div>
              </div>
              <p className="mx-auto min-h-12 max-w-md text-sm leading-relaxed text-fg-muted">
                {phase === "preparing"
                  ? "Hitungan dimulai setelah gambar stabil. Kamu juga bisa memilih Mulai Tanpa Deteksi."
                  : phase === "paused"
                    ? pauseMessage
                    : "Ikuti senyamanmu. Kamu boleh bernapas biasa dan berhenti kapan saja."}
              </p>
              <progress
                aria-label="Putaran napas selesai"
                max={rounds}
                value={frame.completedRounds}
                className="mt-5 h-2 w-full max-w-sm accent-action"
              />
              <div className="mt-6 flex flex-col sm:flex-row flex-wrap justify-center gap-3">
                {phase === "running" || phase === "preparing" ? (
                  <button
                    type="button"
                    onClick={() =>
                      pause(
                        "Ambil waktu sejenak. Kamera dimatikan; lanjutkan saat kamu siap.",
                      )
                    }
                    className={`${button} w-full sm:w-auto bg-action text-white`}
                  >
                    <Pause size={17} />
                    Jeda
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (document.hidden) return;
                      startedRef.current = performance.now();
                      setPhase("running");
                    }}
                    className={`${button} w-full sm:w-auto bg-action text-white`}
                  >
                    <Play size={17} />
                    Lanjutkan
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => finish()}
                  className={`${button} w-full sm:w-auto border border-line text-fg-muted`}
                >
                  Akhiri Latihan
                </button>
              </div>
              <p className="mt-5 text-xs text-fg-muted">
                Kamera mati otomatis saat jeda atau pindah tab. Nyalakan kembali
                jika ingin menggunakannya.
              </p>
            </div>
          </section>
        )}

        {phase === "result" && result && (
          <AnimatedSection index={0}>
            <section className="rounded-2xl border border-line bg-surface p-6 text-center sm:p-8">
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-tint text-fg-brand">
                <Check size={30} />
              </span>
              <h2
                ref={resultHeadingRef}
                tabIndex={-1}
                className="mt-4 text-2xl font-bold outline-none"
              >
                {result.completed
                  ? "Terima kasih sudah memberi ruang untuk dirimu"
                  : "Terima kasih sudah berlatih"}
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-fg-muted">
                {result.completed
                  ? "Kamu sudah mengikuti seluruh putaran. Perhatikan sejenak bagaimana perasaanmu sekarang, tanpa perlu menilainya."
                  : "Berhenti saat perlu juga bagian dari menjaga diri. Kamu bisa kembali kapan saja."}
              </p>
              <dl className="mx-auto my-6 grid max-w-md grid-cols-2 gap-3">
                <div className="rounded-xl bg-canvas p-4">
                  <dt className="text-xs text-fg-muted">Waktu latihan</dt>
                  <dd className="mt-1 text-xl font-semibold">
                    {Math.floor(result.activeMs / 1000)} detik
                  </dd>
                </div>
                <div className="rounded-xl bg-canvas p-4">
                  <dt className="text-xs text-fg-muted">Putaran diikuti</dt>
                  <dd className="mt-1 text-xl font-semibold">
                    {result.completedRounds} / {rounds}
                  </dd>
                </div>
              </dl>
              {result.detection && (
                <div className="mb-5 rounded-xl border border-line bg-canvas p-4 text-left text-sm">
                  <p className="font-semibold">
                    {result.detection.cycles >= 2
                      ? "Pola gerakan berulang terdeteksi"
                      : "Pola napas belum terbaca"}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-fg-muted">
                    {result.detection.cycles >= 2
                      ? `${result.detection.cycles} perkiraan siklus gerakan teramati; ${result.detection.matchedCycles} mendekati ritme panduan. Ini perkiraan kamera, bukan bukti pasti napas.`
                      : "Kamera belum mendapatkan cukup siklus yang konsisten. Hal ini tidak berarti kamu tidak mengikuti latihan."}{" "}
                    Hasil deteksi tidak mengubah XP. Video dan ringkasan deteksi
                    tidak diunggah.
                  </p>
                </div>
              )}
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
                    href="/login?next=/game-breath"
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
                    setPhase("intro");
                    setNotice("");
                  }}
                  className={`${button} w-full sm:w-auto bg-action text-white`}
                >
                  <RotateCcw size={17} />
                  Latihan Lagi
                </button>
                <Link
                  href="/dashboard"
                  className={`${button} w-full sm:w-auto border border-line text-fg-brand`}
                >
                  Lihat Pohon Harapan
                </Link>
              </div>
              <p className="mt-5 text-xs text-fg-muted">
                XP mencatat aktivitas belajar. Kamu tidak harus merasa tenang
                untuk menyelesaikan latihan.
              </p>
            </section>
          </AnimatedSection>
        )}
      </div>
    </main>
  );
}
