"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

type Landmark = { x: number; y: number };
type GripAnchor = { pointer: Landmark; palm: Landmark };
const GESTURE_SETTLE_MS = 80;
const TRACKING_GRACE_MS = 180;
interface HandTracker {
  setOptions(options: Record<string, number>): void;
  onResults(
    callback: (results: { multiHandLandmarks?: Landmark[][] }) => void,
  ): void;
  send(input: { image: HTMLVideoElement }): Promise<void>;
  close(): Promise<void>;
}
type HandsWindow = Window & {
  Hands?: new (options: {
    locateFile: (file: string) => string;
  }) => HandTracker;
};
const HANDS_CDN =
  "https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240";

async function loadHands() {
  if ((window as HandsWindow).Hands) return;
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `${HANDS_CDN}/hands.js`;
    script.crossOrigin = "anonymous";
    script.onload = () => {
      script.remove();
      resolve();
    };
    script.onerror = () => {
      script.remove();
      reject(new Error("Pelacak tangan belum dapat dimuat."));
    };
    document.head.appendChild(script);
  });
}

export default function BagCamera({
  boardRef,
  onSelect,
  onDrop,
  onUnavailable,
}: {
  boardRef: RefObject<HTMLDivElement | null>;
  onSelect: (id: string) => void;
  onDrop: () => void;
  onUnavailable: (message: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const cursorRef = useRef<HTMLSpanElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let stream: MediaStream | undefined;
    let tracker: HandTracker | undefined;
    let frame = 0;
    let cursorFrame = 0;
    let pinched = false;
    let candidatePinch = false;
    let candidateSince = 0;
    let grip: GripAnchor | null = null;
    let position: Landmark | null = null;
    let targetPosition: Landmark | null = null;
    let lastSeen = 0;
    let lastPaint = 0;
    let releaseUntil = 0;
    let loadingTimer = 0;
    const resetPointer = () => {
      position = null;
      targetPosition = null;
      grip = null;
      pinched = false;
      candidatePinch = false;
      releaseUntil = 0;
      if (cursorRef.current) cursorRef.current.hidden = true;
    };
    // Paint independently of inference so lower camera frame rates stay smooth.
    const paintPointer = (now: number) => {
      if (cancelled) return;
      const elapsed = Math.min(50, Math.max(1, now - (lastPaint || now - 16)));
      lastPaint = now;
      if (now - lastSeen > TRACKING_GRACE_MS) resetPointer();
      const cursor = cursorRef.current;
      if (position && targetPosition && cursor) {
        const dx = targetPosition.x - position.x;
        const dy = targetPosition.y - position.y;
        const distance = Math.hypot(dx, dy);
        // Suppress tiny tremors, but follow deliberate movements more quickly.
        if (distance > 1.5) {
          const smoothingMs = distance > 90 ? 30 : pinched ? 75 : 55;
          const alpha = 1 - Math.exp(-elapsed / smoothingMs);
          const travel = (distance - 1.5) / distance;
          position.x += dx * alpha * travel;
          position.y += dy * alpha * travel;
        }
        cursor.hidden = false;
        cursor.style.transform = `translate3d(${position.x - 20}px, ${position.y - 20}px, 0)`;
        const symbol = pinched ? "✊" : "☝";
        if (cursor.textContent !== symbol) cursor.textContent = symbol;
      }
      cursorFrame = requestAnimationFrame(paintPointer);
    };
    cursorFrame = requestAnimationFrame(paintPointer);
    const stop = () => {
      cancelled = true;
      window.clearTimeout(loadingTimer);
      cancelAnimationFrame(frame);
      cancelAnimationFrame(cursorFrame);
      resetPointer();
      stream?.getTracks().forEach((track) => track.stop());
      if (tracker) void tracker.close().catch(() => {});
    };
    const fail = () => {
      if (cancelled) return;
      stop();
      onUnavailable(
        "Kamera belum bisa digunakan. Kamu tetap bisa bermain dengan sentuhan atau mouse.",
      );
    };
    async function start() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          fail();
          return;
        }
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: 640, height: 480 },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        loadingTimer = window.setTimeout(fail, 20000);
        const video = videoRef.current;
        if (!video) {
          fail();
          return;
        }
        video.srcObject = stream;
        await video.play();
        await loadHands();
        if (cancelled) return;
        const Hands = (window as HandsWindow).Hands;
        if (!Hands) {
          fail();
          return;
        }
        tracker = new Hands({ locateFile: (file) => `${HANDS_CDN}/${file}` });
        tracker.setOptions({
          maxNumHands: 1,
          modelComplexity: 0,
          minDetectionConfidence: 0.6,
          minTrackingConfidence: 0.6,
        });
        tracker.onResults((results) => {
          if (cancelled) return;
          const hand = results.multiHandLandmarks?.[0];
          const board = boardRef.current;
          if (!hand || !board) {
            // A briefly missed frame must not release a held item or flicker.
            return;
          }
          const now = performance.now();
          if (now - lastSeen > TRACKING_GRACE_MS) resetPointer();
          lastSeen = now;
          const bounds = board.getBoundingClientRect();
          const toBoard = (point: Landmark): Landmark => ({
            x: bounds.left + (1 - point.x) * bounds.width,
            y: bounds.top + point.y * bounds.height,
          });
          const finger = toBoard(hand[8]);
          // The palm stays steady when the fingertips move together to pinch.
          const palm = toBoard({
            x: (hand[0].x + hand[5].x + hand[17].x) / 3,
            y: (hand[0].y + hand[5].y + hand[17].y) / 3,
          });
          position ??= { ...finger };
          const distance = Math.hypot(
            hand[4].x - hand[8].x,
            hand[4].y - hand[8].y,
          );
          // Hysteresis plus a short stable interval rejects noisy grip changes.
          const pinch = distance < (pinched ? 0.085 : 0.055);
          if (pinch !== candidatePinch) {
            candidatePinch = pinch;
            candidateSince = now;
            if (pinch && !pinched) {
              grip = { pointer: { ...position }, palm };
            } else if (!pinched) {
              grip = null;
            }
          }
          if (pinch !== pinched && now - candidateSince >= GESTURE_SETTLE_MS) {
            pinched = pinch;
            // Hit-test the visible, smoothed pointer rather than the noisy tip.
            const target = document.elementFromPoint(position.x, position.y);
            if (pinched) {
              const item =
                target?.closest<HTMLButtonElement>("[data-bag-item]");
              if (item?.dataset.bagItem && !item.disabled)
                onSelect(item.dataset.bagItem);
            } else {
              releaseUntil = now + 120;
              if (target?.closest("[data-bag-target]")) onDrop();
            }
          }
          const trackingGrip =
            grip && (candidatePinch || pinched || now < releaseUntil);
          const next =
            trackingGrip && grip
              ? {
                  x: grip.pointer.x + palm.x - grip.palm.x,
                  y: grip.pointer.y + palm.y - grip.palm.y,
                }
              : finger;
          targetPosition = {
            x: Math.max(bounds.left, Math.min(bounds.right - 1, next.x)),
            y: Math.max(bounds.top, Math.min(bounds.bottom - 1, next.y)),
          };
          if (!trackingGrip) grip = null;
        });
        async function detect() {
          if (cancelled || !tracker) return;
          try {
            if (video && video.readyState >= 2)
              await tracker.send({ image: video });
            if (!cancelled) {
              window.clearTimeout(loadingTimer);
              setReady(true);
              frame = requestAnimationFrame(detect);
            }
          } catch {
            fail();
          }
        }
        void detect();
      } catch {
        fail();
      }
    }
    void start();
    window.addEventListener("pagehide", stop);
    return () => {
      stop();
      window.removeEventListener("pagehide", stop);
    };
  }, [boardRef, onDrop, onSelect, onUnavailable]);

  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <div className="flex items-start gap-4">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-28 rounded-lg bg-sunken -scale-x-100"
          aria-label="Pratinjau kamera untuk gerakan tangan"
        />
        <div className="text-sm text-fg-muted">
          <p className="font-semibold text-fg">
            {ready ? "Kamera siap" : "Menyiapkan kamera…"}
          </p>
          <p className="mt-1">
            Arahkan penunjuk ke barang. Jepit ibu jari dan telunjuk untuk
            mengambil, lalu buka di atas tas.
          </p>
          <p className="mt-1 text-xs">
            Sentuhan dan mouse tetap tersedia. Matikan kamera kapan saja melalui
            tombol kontrol.
          </p>
        </div>
      </div>
      <span
        ref={cursorRef}
        hidden
        aria-hidden="true"
        data-bag-pointer="true"
        className="pointer-events-none fixed left-0 top-0 z-50 h-10 w-10 rounded-full border-2 border-white bg-action text-center text-xl leading-9 text-white shadow-lg will-change-transform"
      >
        ☝
      </span>
    </div>
  );
}
