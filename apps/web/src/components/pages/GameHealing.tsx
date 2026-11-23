"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatedSection } from "@/components/PageMotion";
import {
  ArrowLeft,
  Backpack,
  Camera,
  Check,
  Clock3,
  Hand,
  Leaf,
  RotateCcw,
  Trophy,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { TreeStats } from "@/lib/treeProgress";
import {
  BAG_ITEMS,
  BAG_ESSENTIAL_IDS,
  BAG_CHALLENGE_SECONDS,
  BAG_GAME_XP,
  isBagComplete,
  type BagMode,
} from "@/lib/games/emergencyBag";
import BagCamera from "@/components/games/BagCamera";

type Result = { items: string[]; wrongSelections: number; completed: boolean };
const button =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-action disabled:opacity-60";

export default function GameHealing() {
  const { user, isLoading, setTreeStats } = useAuth();
  const [phase, setPhase] = useState<"intro" | "playing" | "result">("intro");
  const [mode, setMode] = useState<BagMode>("practice");
  const [control, setControl] = useState<"touch" | "camera">("touch");
  const [items, setItems] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState(
    "Pilih barang, lalu ketuk tas untuk memasukkannya. Kamu juga bisa menyeret barang ke tas.",
  );
  const [notice, setNotice] = useState("");
  const [seconds, setSeconds] = useState(BAG_CHALLENGE_SECONDS);
  const [deadline, setDeadline] = useState(0);
  const [starting, setStarting] = useState(false);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [saveState, setSaveState] = useState<
    "idle" | "saving" | "saved" | "error" | "guest"
  >("idle");
  const [saveMessage, setSaveMessage] = useState("");
  const [awardedXp, setAwardedXp] = useState(0);
  const boardRef = useRef<HTMLDivElement>(null);
  const bagRef = useRef<string[]>([]);
  const selectedRef = useRef<string | null>(null);
  const mistakesRef = useRef(0);
  const finishedRef = useRef(false);
  const resultHeadingRef = useRef<HTMLHeadingElement>(null);

  const saveResult = useCallback(
    async (snapshot: Result) => {
      if (!attemptId) {
        setSaveState("guest");
        setSaveMessage(
          "Latihanmu selesai. Masuk sebelum memulai sesi berikutnya agar hasil dan XP tersimpan.",
        );
        return;
      }
      setSaveState("saving");
      setSaveMessage("Menyimpan hasil latihanmu…");
      try {
        const response = await fetch("/api/games/emergency-bag", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "finish",
            attemptId,
            collectedItems: snapshot.items,
            wrongSelections: snapshot.wrongSelections,
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
        setResult({ ...snapshot, completed: data.completed });
        setAwardedXp(data.awardedXp);
        setSaveState("saved");
        setSaveMessage(
          data.alreadySaved
            ? "Hasil sesi ini sudah tersimpan. Progres Pohon Harapan sudah diperbarui."
            : data.awardedXp > 0
              ? `Hasil tersimpan. +${data.awardedXp} XP untuk Pohon Harapanmu!`
              : data.completed
                ? "Hasil tersimpan. Hadiah XP hari ini sudah diperoleh; kamu tetap boleh berlatih lagi."
                : "Hasil latihan tersimpan. Kamu bisa mencoba lagi untuk melengkapi tasmu.",
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
    (collected = bagRef.current) => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      const snapshot = {
        items: [...collected],
        wrongSelections: mistakesRef.current,
        completed: isBagComplete(collected),
      };
      setResult(snapshot);
      setPhase("result");
      setSelected(null);
      selectedRef.current = null;
      void saveResult(snapshot);
    },
    [saveResult],
  );

  useEffect(() => {
    if (phase !== "playing" || mode !== "challenge") return;
    const update = () => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setSeconds(remaining);
      if (!remaining) finish();
    };
    const timer = window.setInterval(update, 200);
    return () => window.clearInterval(timer);
  }, [phase, mode, deadline, finish]);

  useEffect(() => {
    if (phase === "result") resultHeadingRef.current?.focus();
  }, [phase]);

  async function start() {
    setStarting(true);
    setNotice("");
    let newAttemptId: string | null = null;
    try {
      if (user) {
        const response = await fetch("/api/games/emergency-bag", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "start", mode }),
          signal: AbortSignal.timeout(15000),
        });
        const data = await response.json();
        if (!response.ok)
          throw new Error(
            data.error || "Sesi belum bisa dimulai. Coba lagi, ya.",
          );
        newAttemptId = data.attemptId;
      }
      setAttemptId(newAttemptId);
      bagRef.current = [];
      selectedRef.current = null;
      mistakesRef.current = 0;
      finishedRef.current = false;
      setItems([]);
      setSelected(null);
      setResult(null);
      setAwardedXp(0);
      setSaveState("idle");
      setSeconds(BAG_CHALLENGE_SECONDS);
      setDeadline(Date.now() + BAG_CHALLENGE_SECONDS * 1000);
      setFeedback(
        "Pilih barang, lalu ketuk tas untuk memasukkannya. Kamu juga bisa menyeret barang ke tas.",
      );
      setPhase("playing");
    } catch (error) {
      setNotice(
        error instanceof Error && error.name !== "TimeoutError"
          ? error.message
          : "Sesi belum bisa dimulai. Periksa koneksi dan coba lagi.",
      );
    } finally {
      setStarting(false);
    }
  }

  const selectItem = useCallback((id: string) => {
    if (finishedRef.current || bagRef.current.includes(id)) return;
    selectedRef.current = id;
    setSelected(id);
  }, []);

  function placeItem(id: string | null) {
    if (!id || finishedRef.current || bagRef.current.includes(id)) return;
    const item = BAG_ITEMS.find((candidate) => candidate.id === id);
    if (!item) return;
    selectedRef.current = null;
    setSelected(null);
    if (!item.essential) {
      mistakesRef.current += 1;
      setFeedback(item.lesson);
      return;
    }
    const next = [...bagRef.current, id];
    bagRef.current = next;
    setItems(next);
    setFeedback(`${item.name} masuk ke tas! ${item.lesson}`);
    if (isBagComplete(next)) finish(next);
  }
  const placeItemRef = useRef(placeItem);
  useEffect(() => {
    placeItemRef.current = placeItem;
  });
  const cameraDrop = useCallback(
    () => placeItemRef.current(selectedRef.current),
    [],
  );
  const cameraUnavailable = useCallback((message: string) => {
    setNotice(message);
    setControl("touch");
  }, []);

  return (
    <main className="min-h-screen-safe bg-canvas px-4 py-5 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <Link href="/dashboard" className={`${button} px-0 text-fg-brand`}>
          <ArrowLeft size={18} />
          Kembali ke Dashboard
        </Link>
        <header className="flex items-start gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-tint text-fg-brand">
            <Backpack size={30} />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-fg-brand">
              Game Center Resiliensi
            </p>
            <h1 className="mt-1 text-2xl font-bold text-fg sm:text-3xl">
              Tas Siaga Bencana
            </h1>
            <p className="mt-2 text-sm text-fg-muted">
              Langkah kecil hari ini, bekal untuk lebih siap bersama keluarga.
            </p>
          </div>
        </header>

        {notice && (
          <div
            role="alert"
            className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"
          >
            {notice}
          </div>
        )}

        {phase === "intro" && (
          <AnimatedSection index={0}>
            <section className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
              <div className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
                <h2 className="text-xl font-semibold">
                  Yuk, siapkan tas siagamu!
                </h2>
                <p className="mt-3 leading-relaxed text-fg-muted">
                  Temukan enam perlengkapan utama untuk tas darurat. Kamu boleh
                  mencoba, keliru, dan memperbaiki pilihanmu.
                </p>
                <ol className="mt-6 space-y-4 text-sm text-fg-muted">
                  <li>
                    <strong className="text-fg">1. Pilih barang.</strong> Ketuk
                    atau klik barang yang ingin dibawa.
                  </li>
                  <li>
                    <strong className="text-fg">2. Masukkan ke tas.</strong>{" "}
                    Ketuk tas atau seret barang langsung ke dalamnya.
                  </li>
                  <li>
                    <strong className="text-fg">
                      3. Pelajari kegunaannya.
                    </strong>{" "}
                    Setiap pilihan punya cerita. Lengkapi keenam perlengkapan
                    utamanya.
                  </li>
                </ol>
                <div className="mt-6 rounded-xl bg-tint p-4 text-sm text-fg-brand">
                  <Leaf className="mr-2 inline" size={18} />
                  Penyelesaian pertama setiap hari mendapat {BAG_GAME_XP} XP.
                  Berlatih lagi selalu boleh.
                </div>
                {!user && !isLoading && (
                  <p className="mt-4 text-sm text-fg-muted">
                    Bisa dimainkan tanpa login.{" "}
                    <Link
                      href="/login?next=/game-healing"
                      className="font-semibold text-fg-brand underline"
                    >
                      Masuk
                    </Link>{" "}
                    agar hasil dan XP tersimpan.
                  </p>
                )}
              </div>
              <div className="space-y-5 rounded-2xl border border-line bg-surface p-6">
                <fieldset>
                  <legend className="mb-3 font-semibold">
                    Pilih cara berlatih
                  </legend>
                  <div className="space-y-3">
                    {(
                      [
                        {
                          id: "practice",
                          title: "Latihan santai",
                          text: "Tanpa batas waktu. Belajar sesuai ritmemu.",
                        },
                        {
                          id: "challenge",
                          title: "Tantangan 60 detik",
                          text: "Coba melengkapi tas sebelum waktu berakhir.",
                        },
                      ] as const
                    ).map((choice) => (
                      <label
                        key={choice.id}
                        className={`flex min-h-20 cursor-pointer items-start gap-3 rounded-xl border p-4 ${mode === choice.id ? "border-action bg-tint" : "border-line"}`}
                      >
                        <input
                          className="mt-1 accent-[var(--action)]"
                          type="radio"
                          name="bag-mode"
                          value={choice.id}
                          checked={mode === choice.id}
                          onChange={() => setMode(choice.id)}
                        />
                        <span>
                          <span className="block text-sm font-semibold">
                            {choice.title}
                          </span>
                          <span className="mt-1 block text-xs leading-relaxed text-fg-muted">
                            {choice.text}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <fieldset>
                  <legend className="mb-3 font-semibold">
                    Kontrol permainan
                  </legend>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      aria-pressed={control === "touch"}
                      onClick={() => setControl("touch")}
                      className={`${button} flex-1 sm:flex-none ${control === "touch" ? "bg-action text-white" : "bg-sunken text-fg"}`}
                    >
                      <Hand size={18} />
                      Sentuh / mouse
                    </button>
                    <button
                      type="button"
                      aria-pressed={control === "camera"}
                      onClick={() => setControl("camera")}
                      className={`${button} flex-1 sm:flex-none ${control === "camera" ? "bg-action text-white" : "bg-sunken text-fg"}`}
                    >
                      <Camera size={18} />
                      Kamera opsional
                    </button>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-fg-muted">
                    Kamera hanya diminta setelah kamu mulai dengan kontrol
                    kamera. Bisa dimatikan kapan saja.
                  </p>
                </fieldset>
                <button
                  type="button"
                  disabled={starting || isLoading}
                  onClick={() => void start()}
                  className={`${button} w-full bg-action text-white hover:bg-action-hover`}
                >
                  {starting ? "Menyiapkan permainan…" : "Mulai Bermain"}
                </button>
              </div>
            </section>
          </AnimatedSection>
        )}

        {phase === "playing" && (
          <section className="space-y-4" aria-label="Permainan tas siaga">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface p-4">
              <p className="text-sm font-semibold">
                {items.length} / {BAG_ESSENTIAL_IDS.length} perlengkapan siap
              </p>
              <p className="inline-flex items-center gap-2 text-sm text-fg-muted">
                <Clock3 size={17} />
                {mode === "practice"
                  ? "Latihan santai · tanpa timer"
                  : `${seconds} detik tersisa`}
              </p>
              <button
                type="button"
                onClick={() => {
                  setControl(control === "camera" ? "touch" : "camera");
                  setNotice("");
                }}
                className={`${button} w-full sm:w-auto bg-sunken text-fg`}
              >
                {control === "camera" ? "Matikan kamera" : "Gunakan kamera"}
              </button>
            </div>
            {control === "camera" && (
              <BagCamera
                boardRef={boardRef}
                onSelect={selectItem}
                onDrop={cameraDrop}
                onUnavailable={cameraUnavailable}
              />
            )}
            <p
              role="status"
              aria-live="polite"
              aria-atomic="true"
              className="min-h-16 sm:min-h-20 rounded-xl bg-tint p-3.5 sm:p-4 text-sm leading-relaxed text-fg-brand"
            >
              {feedback}
            </p>
            <div
              ref={boardRef}
              className="grid gap-4 sm:gap-5 md:grid-cols-[1.35fr_1fr]"
            >
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3 rounded-2xl border border-line bg-surface p-3 sm:p-4 sm:grid-cols-4 md:grid-cols-2 lg:grid-cols-4">
                {BAG_ITEMS.map((item) => {
                  const packed = items.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      data-bag-item={item.id}
                      disabled={packed}
                      aria-pressed={selected === item.id}
                      aria-label={`${item.name}${packed ? ", sudah di tas" : ""}`}
                      draggable={!packed}
                      onDragStart={(event) => {
                        event.dataTransfer.setData("text/plain", item.id);
                        selectItem(item.id);
                      }}
                      onClick={() => selectItem(item.id)}
                      className={`relative flex min-h-24 sm:min-h-32 flex-col items-center justify-center gap-2 sm:gap-3 rounded-xl border-2 p-2.5 sm:p-3 text-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action ${packed ? "border-line bg-sunken opacity-60" : selected === item.id ? "border-action bg-tint" : "border-transparent bg-canvas hover:border-line-strong"}`}
                    >
                      <span aria-hidden="true" className="text-3xl sm:text-4xl">
                        {item.emoji}
                      </span>
                      <span className="text-xs font-semibold leading-snug">
                        {item.name}
                      </span>
                      {packed && (
                        <Check
                          aria-hidden="true"
                          className="absolute right-2 top-2 text-fg-brand"
                          size={18}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                data-bag-target="true"
                onClick={() => placeItem(selectedRef.current)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  placeItem(event.dataTransfer.getData("text/plain"));
                }}
                className="flex min-h-40 sm:min-h-64 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-action bg-tint p-4 sm:p-6 text-center text-fg-brand focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-action"
              >
                <Backpack className="w-12 h-12 sm:w-[76px] sm:h-[76px]" strokeWidth={1.25} aria-hidden="true" />
                <span className="mt-3 sm:mt-4 text-base sm:text-lg font-bold">Tas siagamu</span>
                <span className="mt-1.5 sm:mt-2 text-sm">
                  {selected
                    ? `Masukkan ${BAG_ITEMS.find((item) => item.id === selected)?.name}`
                    : "Pilih barang, lalu ketuk di sini"}
                </span>
                <span
                  className="mt-4 sm:mt-5 flex flex-wrap justify-center gap-2"
                  aria-label="Barang di dalam tas"
                >
                  {items.map((id) => (
                    <span
                      key={id}
                      className="rounded-lg bg-surface p-1.5 sm:p-2 text-xl sm:text-2xl"
                      aria-label={
                        BAG_ITEMS.find((item) => item.id === id)?.name
                      }
                    >
                      {BAG_ITEMS.find((item) => item.id === id)?.emoji}
                    </span>
                  ))}
                </span>
              </button>
            </div>
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-between gap-3">
              <p className="text-xs text-fg-muted">
                Pilihan kurang tepat tidak mengurangi poin. Coba lagi, ya.
              </p>
              <button
                type="button"
                onClick={() => finish()}
                className={`${button} w-full sm:w-auto bg-surface text-fg-muted border border-line`}
              >
                Akhiri latihan
              </button>
            </div>
          </section>
        )}

        {phase === "result" && result && (
          <AnimatedSection index={0}>
            <section className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
              <div className="text-center">
                <Trophy className="mx-auto text-fg-brand" size={44} />
                <h2
                  ref={resultHeadingRef}
                  tabIndex={-1}
                  className="mt-4 text-2xl font-bold outline-none"
                >
                  {result.completed
                    ? "Tas siagamu sudah lengkap!"
                    : "Terima kasih sudah berlatih!"}
                </h2>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-fg-muted">
                  {result.completed
                    ? "Kamu sudah mengenal enam perlengkapan utama. Ajak keluarga menyiapkan tas sungguhan bersama, ya."
                    : `${result.items.length} dari ${BAG_ESSENTIAL_IDS.length} perlengkapan sudah kamu temukan. Yuk, lihat bekal yang bisa ditambahkan saat mencoba lagi.`}
                </p>
              </div>
              <ul className="my-6 grid gap-3 sm:grid-cols-2">
                {BAG_ITEMS.filter((item) => item.essential).map((item) => (
                  <li
                    key={item.id}
                    className="flex gap-3 rounded-xl bg-canvas p-4"
                  >
                    <span className="text-2xl" aria-hidden="true">
                      {item.emoji}
                    </span>
                    <div>
                      <p className="text-sm font-semibold">
                        {item.name}{" "}
                        <span className="text-xs font-normal text-fg-muted">
                          ·{" "}
                          {result.items.includes(item.id)
                            ? "Sudah dipilih"
                            : "Bisa ditambahkan"}
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
                {awardedXp > 0 && (
                  <p className="mt-1 font-semibold">
                    Progres permainan sudah terhubung ke Pohon Harapan.
                  </p>
                )}
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
                    href="/login?next=/game-healing"
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
                    setControl("touch");
                    setNotice("");
                  }}
                  className={`${button} w-full sm:w-auto bg-action text-white hover:bg-action-hover`}
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
              <p className="mt-5 text-center text-xs text-fg-muted">
                XP adalah catatan aktivitas belajar. Kamu boleh berlatih sesuai
                kemampuanmu.
              </p>
            </section>
          </AnimatedSection>
        )}
      </div>
    </main>
  );
}
