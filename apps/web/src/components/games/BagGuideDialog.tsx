"use client";

import {
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { MessageCircle, Play } from "lucide-react";
import { usePageReady } from "@/components/PageMotion";
import styles from "@/components/pages/GameHealing.module.css";

const motionQuery = "(prefers-reduced-motion: reduce)";
const subscribeMotion = (callback: () => void) => {
  const media = window.matchMedia(motionQuery);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
};

export default function BagGuideDialog({
  text,
  narration,
  step,
  instant = false,
  busy = false,
  onNext,
  onSkip,
  onUnavailable,
  portrait,
  startLabel = "Mulai Bermain",
}: {
  text: string;
  narration: boolean;
  step?: number;
  instant?: boolean;
  busy?: boolean;
  onNext?: () => void;
  onSkip?: () => void;
  onUnavailable: () => void;
  portrait?: ReactNode;
  startLabel?: string;
}) {
  const reducedMotion = useSyncExternalStore(
    subscribeMotion,
    () => window.matchMedia(motionQuery).matches,
    () => false,
  );
  const pageReady = usePageReady();
  const letters = useMemo(() => Array.from(text), [text]);
  const [count, setCount] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const complete = instant || Boolean(reducedMotion) || count >= letters.length;
  useEffect(() => {
    if (!pageReady || instant || reducedMotion) return;
    const interval = window.setInterval(() => {
      setCount((current) => {
        if (current + 1 >= letters.length) window.clearInterval(interval);
        return Math.min(letters.length, current + 1);
      });
    }, 28);
    return () => window.clearInterval(interval);
  }, [letters.length, instant, reducedMotion, pageReady]);

  useEffect(() => {
    setSpeaking(false);
    if (
      !pageReady ||
      !narration ||
      !("speechSynthesis" in window) ||
      document.hidden
    )
      return;
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = "id-ID";
    speech.rate = 0.92;
    const voice = window.speechSynthesis
      .getVoices()
      .find((item) => item.lang.startsWith("id"));
    if (voice) speech.voice = voice;
    speech.onstart = () => setSpeaking(true);
    speech.onend = () => setSpeaking(false);
    speech.onerror = (event) => {
      setSpeaking(false);
      if (!["canceled", "interrupted"].includes(event.error)) onUnavailable();
    };
    window.speechSynthesis.speak(speech);
    const hide = () => {
      if (document.hidden) window.speechSynthesis.cancel();
    };
    document.addEventListener("visibilitychange", hide);
    return () => {
      speech.onstart = null;
      speech.onend = null;
      speech.onerror = null;
      window.speechSynthesis.cancel();
      document.removeEventListener("visibilitychange", hide);
    };
  }, [text, narration, onUnavailable, pageReady]);

  return (
    <div className={styles.guideArea}>
      {portrait ?? (
        <div
          className={styles.guideCharacter}
          role="img"
          aria-label="Aira menjelaskan cara bermain"
          data-bag-speaking={
            pageReady && !reducedMotion && (!complete || speaking)
          }
        />
      )}
      <section
        className={styles.dialogue}
        aria-label="Pesan Aira"
        data-bag-typing={!complete}
      >
        <div className={styles.dialogueLabel}>
          <MessageCircle size={16} aria-hidden="true" /> Aira · Teman Siaga
          {step !== undefined && <span>Kenalan dulu · {step + 1} / 4</span>}
          {!onNext && !complete && (
            <button
              type="button"
              className={styles.reveal}
              onClick={() => setCount(letters.length)}
            >
              Tampilkan semua
            </button>
          )}
        </div>
        <p className={styles.dialogueText} aria-hidden="true">
          {complete ? text : letters.slice(0, count).join("")}
          {!complete && <span className={styles.caret} />}
        </p>
        <p
          className="sr-only"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {text}
        </p>
        {onNext ? (
          <div className={styles.dialogueActions}>
            {onSkip && step !== 3 && (
              <button type="button" onClick={onSkip} className={styles.skip}>
                Lewati penjelasan
              </button>
            )}
            <button
              type="button"
              className={styles.primary}
              disabled={busy}
              onClick={() => {
                if (!complete) setCount(letters.length);
                else onNext();
              }}
            >
              {complete && step === 3 && <Play size={17} aria-hidden="true" />}
              {busy
                ? "Menyiapkan permainan…"
                : !complete
                  ? "Tampilkan semua"
                  : step === 3
                    ? startLabel
                    : "Lanjut"}
            </button>
          </div>
        ) : null}
      </section>
    </div>
  );
}
