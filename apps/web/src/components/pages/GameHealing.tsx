"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatedSection } from "@/components/PageMotion";
import {
  ArrowLeft,
  Camera,
  Check,
  Clock3,
  Hand,
  Leaf,
  RotateCcw,
  Trophy,
  Gamepad2,
  Lightbulb,
  Music2,
  Volume2,
  VolumeX,
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
import BagArtwork from "@/components/games/BagArtwork";
import BagGuideDialog from "@/components/games/BagGuideDialog";
import { BAG_INTRO_DIALOGUE } from "@/lib/games/bagPresentation";
import styles from "./GameHealing.module.css";

type Result = { items: string[]; wrongSelections: number; completed: boolean };
const button =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-action disabled:opacity-60";

export default function GameHealing() {
  const { user, isLoading, setTreeStats } = useAuth();
  const [phase, setPhase] = useState<"intro" | "playing" | "result">("intro");
  const [mode, setMode] = useState<BagMode>("practice");
  const [control, setControl] = useState<"touch" | "camera">("touch");
  const [introStep, setIntroStep] = useState(0);
  const [skipTyping, setSkipTyping] = useState(false);
  const [narration, setNarration] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [music, setMusic] = useState(false);
  const musicRef = useRef<HTMLAudioElement | null>(null);
  const startingRef = useRef(false);
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
  const rootRef = useRef<HTMLElement>(null);
  const bagRef = useRef<string[]>([]);
  const selectedRef = useRef<string | null>(null);
  const mistakesRef = useRef(0);
  const finishedRef = useRef(false);
  const resultHeadingRef = useRef<HTMLHeadingElement>(null);
  const narrationUnavailable = useCallback(() => {
    setNarration(false);
    setNotice(
      "Pembacaan suara belum tersedia di peramban ini. Dialog Aira tetap bisa dibaca.",
    );
  }, []);

  useEffect(() => {
    setSpeechSupported(
      "speechSynthesis" in window && "SpeechSynthesisUtterance" in window,
    );
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    if (!music || phase === "result") {
      musicRef.current?.pause();
      return;
    }
    const audio = (musicRef.current ??= new Audio("/audio/bgm.mp3"));
    audio.loop = true;
    audio.volume = 0.09;
    let cancelled = false;
    if (!document.hidden)
      void audio
        .play()
        .then(() => {
          if (cancelled) audio.pause();
        })
        .catch(() => setMusic(false));
    const hide = () => {
      if (document.hidden) {
        audio.pause();
        setMusic(false);
      }
    };
    document.addEventListener("visibilitychange", hide);
    return () => {
      cancelled = true;
      audio.pause();
      document.removeEventListener("visibilitychange", hide);
    };
  }, [music, phase]);

  useEffect(
    () => () => {
      musicRef.current?.pause();
      musicRef.current?.removeAttribute("src");
      musicRef.current?.load();
    },
    [],
  );

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

  useEffect(() => {
    const keepFocusInGame = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const root = rootRef.current;
      const targets = root
        ? [
            ...root.querySelectorAll<HTMLElement>(
              "a[href],button:not(:disabled),input:not(:disabled)",
            ),
          ].filter(
            (element) =>
              element.tabIndex >= 0 && element.getClientRects().length > 0,
          )
        : [];
      const first = targets[0],
        last = targets[targets.length - 1];
      if (
        first &&
        last &&
        (!root?.contains(document.activeElement) ||
          (event.shiftKey && document.activeElement === first) ||
          (!event.shiftKey && document.activeElement === last))
      ) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      }
    };
    window.addEventListener("keydown", keepFocusInGame);
    return () => window.removeEventListener("keydown", keepFocusInGame);
  }, []);

  async function start() {
    if (startingRef.current) return;
    startingRef.current = true;
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
      startingRef.current = false;
      setStarting(false);
    }
  }

  const selectItem = useCallback((id: string) => {
    if (finishedRef.current || bagRef.current.includes(id)) return;
    selectedRef.current = id;
    setSelected(id);
  }, []);

  function placeItem(id: string | null) {
    if (
      phase !== "playing" ||
      !id ||
      finishedRef.current ||
      bagRef.current.includes(id)
    )
      return;
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
    <main ref={rootRef} className={styles.game} data-bag-phase={phase}>
      <div className={styles.stage}>
        <Link
          href="/dashboard"
          className={styles.back}
          onClick={() => {
            musicRef.current?.pause();
            if ("speechSynthesis" in window) window.speechSynthesis.cancel();
          }}
        >
          <ArrowLeft size={22} aria-hidden="true" />
          <span>Kembali ke Dashboard</span>
        </Link>
        <div className={styles.audioControls} aria-label="Pengaturan suara">
          <button
            type="button"
            className={styles.audioButton}
            aria-pressed={narration}
            aria-label={narration ? "Matikan suara karakter" : "Bacakan dialog"}
            title={
              speechSupported
                ? "Bacakan dialog Aira"
                : "Pembacaan suara tidak tersedia di peramban ini"
            }
            disabled={!speechSupported}
            onClick={() => setNarration(!narration)}
          >
            {narration ? <Volume2 size={25} /> : <VolumeX size={25} />}
          </button>
          <button
            type="button"
            className={styles.audioButton}
            aria-pressed={music}
            aria-label={music ? "Matikan musik" : "Nyalakan musik"}
            onClick={() => setMusic(!music)}
          >
            <Music2 size={25} />
          </button>
        </div>
        <header className={styles.header}>
          <p className={styles.badge}>
            <Gamepad2 size={20} aria-hidden="true" /> Game Center Resiliensi
          </p>
          <div className={styles.titleRow}>
            <BagArtwork index={8} className={styles.titleBag} />
            <h1>
              <span>Tas</span> <span>Siaga</span> <span>Bencana</span>
            </h1>
          </div>
          <p className={styles.subtitle}>
            Langkah kecil hari ini, bekal untuk lebih siap bersama keluarga.
          </p>
        </header>
        {notice && (
          <p role="alert" className={styles.notice}>
            {notice}
          </p>
        )}
        {phase !== "result" && (
          <div className={styles.playArea}>
            <section
              className={styles.statusBar}
              aria-label="Progres tas siaga"
            >
              <div className={styles.progressCopy}>
                <BagArtwork index={8} className={styles.statusBag} />
                <div>
                  <p className={styles.progressLabel}>
                    {items.length} / {BAG_ESSENTIAL_IDS.length} perlengkapan
                    siap
                  </p>
                  <div
                    className={styles.slots}
                    role="progressbar"
                    aria-label="Perlengkapan utama di tas"
                    aria-valuemin={0}
                    aria-valuemax={BAG_ESSENTIAL_IDS.length}
                    aria-valuenow={items.length}
                  >
                    {BAG_ESSENTIAL_IDS.map((id, index) => (
                      <span key={id} data-filled={index < items.length} />
                    ))}
                  </div>
                </div>
              </div>
              <p className={styles.timer}>
                <Clock3 size={22} aria-hidden="true" />
                {mode === "practice"
                  ? "Latihan santai · tanpa timer"
                  : phase === "intro"
                    ? "Tantangan 60 detik"
                    : seconds + " detik tersisa"}
              </p>
              <button
                type="button"
                className={styles.cameraButton}
                disabled={phase !== "playing"}
                onClick={() => {
                  setControl(control === "camera" ? "touch" : "camera");
                  setNotice("");
                }}
              >
                <Camera size={20} aria-hidden="true" />{" "}
                {control === "camera" ? "Matikan kamera" : "Gunakan kamera"}
              </button>
            </section>
            {phase === "playing" && control === "camera" && (
              <div className={styles.cameraPanel}>
                <BagCamera
                  boardRef={boardRef}
                  onSelect={selectItem}
                  onDrop={cameraDrop}
                  onUnavailable={cameraUnavailable}
                />
              </div>
            )}
            <BagGuideDialog
              key={phase === "intro" ? "intro-" + introStep : feedback}
              text={
                phase === "intro" ? BAG_INTRO_DIALOGUE[introStep] : feedback
              }
              narration={narration}
              step={phase === "intro" ? introStep : undefined}
              instant={phase === "intro" && skipTyping}
              busy={starting || isLoading}
              onUnavailable={narrationUnavailable}
              onNext={
                phase === "intro"
                  ? () => {
                      if (introStep === 3) void start();
                      else setIntroStep(introStep + 1);
                    }
                  : undefined
              }
              onSkip={
                phase === "intro"
                  ? () => {
                      setIntroStep(3);
                      setSkipTyping(true);
                    }
                  : undefined
              }
            />
            {phase === "intro" ? (
              <section
                className={styles.introPanel}
                aria-label="Persiapan permainan"
              >
                <div className={styles.introWelcome}>
                  <BagArtwork index={8} className={styles.welcomeBag} />
                  <h2>Yuk, siapkan tas siagamu!</h2>
                  <p>
                    Kenali barangnya, pelajari kegunaannya, dan siapkan bekal
                    bersama keluarga.
                  </p>
                  <p className={styles.reward}>
                    <Leaf size={18} aria-hidden="true" /> Hingga {BAG_GAME_XP}{" "}
                    XP per hari
                  </p>
                  {!user && !isLoading && (
                    <p className={styles.guest}>
                      Bisa dimainkan tanpa login.{" "}
                      <Link href="/login?next=/game-healing">Masuk</Link> agar
                      hasil dan XP tersimpan.
                    </p>
                  )}
                </div>
                <div className={styles.settings}>
                  <fieldset>
                    <legend>Pilih cara berlatih</legend>
                    {[
                      {
                        id: "practice",
                        title: "Latihan santai",
                        text: "Tanpa batas waktu. Ikuti ritmemu.",
                      },
                      {
                        id: "challenge",
                        title: "Tantangan 60 detik",
                        text: "Timer dimulai setelah Mulai Bermain.",
                      },
                    ].map((choice) => (
                      <label
                        key={choice.id}
                        className={styles.modeChoice}
                        data-selected={mode === choice.id}
                      >
                        <input
                          type="radio"
                          name="bag-mode"
                          value={choice.id}
                          checked={mode === choice.id}
                          onChange={() => setMode(choice.id as BagMode)}
                        />
                        <span>
                          <strong>{choice.title}</strong>
                          <span>{choice.text}</span>
                        </span>
                      </label>
                    ))}
                  </fieldset>
                  <fieldset>
                    <legend>Kontrol permainan</legend>
                    <div className={styles.controlChoices}>
                      <button
                        type="button"
                        aria-pressed={control === "touch"}
                        onClick={() => setControl("touch")}
                      >
                        <Hand size={18} /> Sentuh / mouse
                      </button>
                      <button
                        type="button"
                        aria-pressed={control === "camera"}
                        onClick={() => setControl("camera")}
                      >
                        <Camera size={18} /> Kamera opsional
                      </button>
                    </div>
                    <p className={styles.cameraNote}>
                      Kamera hanya diminta setelah mulai dan bisa dimatikan
                      kapan saja.
                    </p>
                  </fieldset>
                </div>
              </section>
            ) : (
              <section aria-label="Permainan tas siaga">
                <div ref={boardRef} className={styles.board}>
                  <div className={styles.itemsGrid}>
                    {BAG_ITEMS.map((item, index) => {
                      const packed = items.includes(item.id);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          data-bag-item={item.id}
                          disabled={packed}
                          aria-pressed={selected === item.id}
                          aria-label={
                            item.name + (packed ? ", sudah di tas" : "")
                          }
                          draggable={!packed}
                          onDragStart={(event) => {
                            event.dataTransfer.setData("text/plain", item.id);
                            selectItem(item.id);
                          }}
                          onClick={() => selectItem(item.id)}
                          className={styles.itemCard}
                          data-packed={packed}
                        >
                          <BagArtwork
                            index={index}
                            className={styles.itemArt}
                          />
                          <span>{item.name}</span>
                          {packed && (
                            <Check
                              className={styles.packedCheck}
                              aria-hidden="true"
                              size={22}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    data-bag-target="true"
                    className={styles.bagTarget}
                    onClick={() => placeItem(selectedRef.current)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault();
                      placeItem(event.dataTransfer.getData("text/plain"));
                    }}
                  >
                    <BagArtwork index={8} className={styles.largeBag} />
                    <span className={styles.bagName}>Tas siagamu</span>
                    <span className={styles.dropHint}>
                      {selected
                        ? "Masukkan " +
                          BAG_ITEMS.find((item) => item.id === selected)?.name
                        : "Pilih barang, lalu ketuk di sini"}
                    </span>
                    <span
                      className={styles.packedItems}
                      aria-label="Barang di dalam tas"
                    >
                      {items.map((id) => (
                        <span
                          key={id}
                          aria-label={
                            BAG_ITEMS.find((item) => item.id === id)?.name
                          }
                        >
                          <BagArtwork
                            index={BAG_ITEMS.findIndex(
                              (item) => item.id === id,
                            )}
                          />
                        </span>
                      ))}
                    </span>
                  </button>
                </div>
                <footer className={styles.footer}>
                  <p>
                    <Lightbulb size={23} aria-hidden="true" /> Pilihan kurang
                    tepat tidak mengurangi poin. Coba lagi, ya.
                  </p>
                  <button
                    type="button"
                    className={styles.finish}
                    onClick={() => finish()}
                  >
                    Akhiri latihan
                  </button>
                </footer>
              </section>
            )}
          </div>
        )}

        {phase === "result" && result && (
          <AnimatedSection index={0}>
            <section className={styles.result}>
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
                    <BagArtwork
                      index={BAG_ITEMS.findIndex(
                        (candidate) => candidate.id === item.id,
                      )}
                    />
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
                    setIntroStep(0);
                    setSkipTyping(false);
                    setItems([]);
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
