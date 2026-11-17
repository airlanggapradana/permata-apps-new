"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import {
  BreathingPatternTracker,
  estimateTorsoMotion,
  grayscale,
  type TorsoRegion,
  type CameraPatternSummary,
} from "@/lib/games/breathingMotion";

type Landmark = { x: number; y: number; visibility?: number };
interface PoseTracker {
  setOptions(options: Record<string, number | boolean>): void;
  onResults(callback: (results: { poseLandmarks?: Landmark[] }) => void): void;
  send(input: { image: HTMLVideoElement }): Promise<void>;
  close(): Promise<void>;
}
type PoseConstructor = new (options: {
  locateFile: (file: string) => string;
}) => PoseTracker;
type PoseWindow = Window & { Pose?: PoseConstructor };
const POSE_CDN = "https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404";
let poseLoading: Promise<PoseConstructor> | null = null;

function loadPose(): Promise<PoseConstructor> {
  const existing = (window as PoseWindow).Pose;
  if (existing) return Promise.resolve(existing);
  if (poseLoading) return poseLoading;
  poseLoading = new Promise<PoseConstructor>((resolve, reject) => {
    const script = document.createElement("script");
    const timeout = window.setTimeout(() => {
      script.remove();
      reject(new Error("Pose loading timed out"));
    }, 15000);
    script.src = `${POSE_CDN}/pose.js`;
    script.crossOrigin = "anonymous";
    script.onload = () => {
      window.clearTimeout(timeout);
      script.remove();
      const Pose = (window as PoseWindow).Pose;
      if (Pose) resolve(Pose);
      else reject(new Error("Pose unavailable"));
    };
    script.onerror = () => {
      window.clearTimeout(timeout);
      script.remove();
      reject(new Error("Pose loading failed"));
    };
    document.head.appendChild(script);
  }).catch((error: unknown) => {
    poseLoading = null;
    throw error;
  });
  return poseLoading;
}

type DetectionView = {
  title: string;
  detail: string;
  values: number[];
  region?: TorsoRegion;
  cycles: number;
  calibrated: boolean;
};
const initialView: DetectionView = {
  title: "Menyiapkan deteksi…",
  detail:
    "Posisikan bahu hingga perut dalam bingkai. Bernapas biasa dan duduk senyamanmu.",
  values: [],
  cycles: 0,
  calibrated: false,
};

function torsoRegion(landmarks?: Landmark[]): TorsoRegion | null {
  if (!landmarks) return null;
  const points = [landmarks[11], landmarks[12], landmarks[23], landmarks[24]];
  if (
    points.some(
      (point) =>
        !point ||
        (point.visibility ?? 0) < 0.65 ||
        point.x < 0.03 ||
        point.x > 0.97 ||
        point.y < 0.03 ||
        point.y > 0.97,
    )
  )
    return null;
  const [leftShoulder, rightShoulder, leftHip, rightHip] = points;
  const top = (leftShoulder.y + rightShoulder.y) / 2;
  const bottom = (leftHip.y + rightHip.y) / 2;
  const x = Math.min(leftShoulder.x, rightShoulder.x, leftHip.x, rightHip.x);
  const right = Math.max(
    leftShoulder.x,
    rightShoulder.x,
    leftHip.x,
    rightHip.x,
  );
  if (bottom - top < 0.25 || right - x < 0.18) return null;
  return {
    x: x + (right - x) * 0.08,
    y: top + (bottom - top) * 0.18,
    width: (right - x) * 0.84,
    height: (bottom - top) * 0.72,
  };
}

export default function BreathingDetector({
  videoRef,
  cycleMs,
  onCalibrated,
  onSummary,
}: {
  videoRef: RefObject<HTMLVideoElement | null>;
  cycleMs: number;
  onCalibrated: () => void;
  onSummary: (id: string, summary: CameraPatternSummary) => void;
}) {
  const [view, setView] = useState<DetectionView>(initialView);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  const sessionRef = useRef(0);
  useEffect(() => {
    let cancelled = false;
    let tracker: PoseTracker | undefined;
    let timer = 0;
    let timeout = 0;
    let previous: Float32Array | null = null;
    let previousTime = 0;
    let previousVideoTime = -1;
    let anchor: TorsoRegion | null = null;
    let stableSince = 0;
    let lastUi = 0;
    let calibrated = false;
    let pattern = new BreathingPatternTracker(cycleMs);
    const sessionId = crypto.randomUUID();
    let segment = `${sessionId}-${++sessionRef.current}`;
    let packet: { data: Float32Array; time: number } | null = null;
    const canvas = document.createElement("canvas");
    canvas.width = 160;
    canvas.height = 120;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    onSummary(segment, { cycles: 0, matchedCycles: 0 });
    const reset = () => {
      previous = null;
      anchor = null;
      stableSince = 0;
      calibrated = false;
      pattern = new BreathingPatternTracker(cycleMs);
      segment = `${sessionId}-${++sessionRef.current}`;
    };
    const publish = (next: DetectionView, now: number) => {
      if (!cancelled && now - lastUi >= 250) {
        setView(next);
        lastUi = now;
      }
    };
    async function start() {
      try {
        if (!context) throw new Error("Canvas unavailable");
        const Pose = await loadPose();
        if (cancelled) return;
        tracker = new Pose({ locateFile: (file) => `${POSE_CDN}/${file}` });
        tracker.setOptions({
          modelComplexity: 0,
          smoothLandmarks: true,
          enableSegmentation: false,
          minDetectionConfidence: 0.65,
          minTrackingConfidence: 0.65,
        });
        tracker.onResults((results) => {
          if (cancelled || !packet) return;
          const { data, time } = packet;
          const region = torsoRegion(results.poseLandmarks);
          if (!region) {
            reset();
            publish(
              {
                ...initialView,
                title: "Bahu dan perut belum terlihat",
                detail:
                  "Mundurkan kamera sedikit agar bahu hingga perut masuk bingkai. Tidak perlu mengangkat bahu.",
              },
              time,
            );
            return;
          }
          if (
            anchor &&
            (Math.abs(region.x - anchor.x) > 0.035 ||
              Math.abs(region.y - anchor.y) > 0.035 ||
              Math.abs(region.width - anchor.width) > 0.04 ||
              Math.abs(region.height - anchor.height) > 0.04)
          ) {
            reset();
            publish(
              {
                ...initialView,
                title: "Gerakan tubuh terlalu besar",
                detail:
                  "Duduk senyamanmu dan biarkan kamera tetap diam. Kalibrasi akan diulang.",
              },
              time,
            );
            return;
          }
          anchor ??= region;
          if (!previous || time - previousTime > 500) {
            if (previous)
              publish(
                {
                  ...initialView,
                  title: "Gambar kamera belum stabil",
                  detail:
                    "Pemrosesan kamera masih lambat. Kamu boleh memulai tanpa deteksi.",
                  region,
                },
                time,
              );
            pattern = new BreathingPatternTracker(cycleMs);
            stableSince = time;
            calibrated = false;
            previous = data;
            previousTime = time;
            return;
          }
          const motion = estimateTorsoMotion(previous, data, 160, {
            x: anchor.x * 160,
            y: anchor.y * 120,
            width: anchor.width * 160,
            height: anchor.height * 120,
          });
          previous = data;
          previousTime = time;
          if (motion.quality !== "usable") {
            const feedback = {
              lighting: [
                "Pencahayaan belum cukup stabil",
                "Coba cahaya yang merata dari depan, lalu duduk nyaman.",
              ],
              texture: [
                "Detail gambar belum terbaca",
                "Pastikan pakaian tampak jelas dan kamera tidak buram. Latihan tetap boleh dilanjutkan.",
              ],
              movement: [
                "Gerakan tubuh terlalu besar",
                "Biarkan kamera tetap diam dan ikuti napas senyamanmu.",
              ],
            }[motion.quality];
            reset();
            publish(
              {
                ...initialView,
                title: feedback[0],
                detail: feedback[1],
                region,
              },
              time,
            );
            return;
          }
          const elapsed = time - stableSince;
          if (elapsed < 3000) {
            publish(
              {
                ...initialView,
                title: `Kalibrasi · ${Math.ceil((3000 - elapsed) / 1000)} detik`,
                detail:
                  "Bahu dan perut terlihat. Bernapas biasa; kamera menyesuaikan gambar.",
                region,
              },
              time,
            );
            return;
          }
          if (!calibrated) {
            calibrated = true;
            onCalibrated();
          }
          const reading = pattern.add(time, motion.expansion);
          onSummary(segment, {
            cycles: reading.cycles,
            matchedCycles: reading.matchedCycles,
          });
          publish(
            {
              title: reading.detected
                ? "Pola gerakan berulang terdeteksi"
                : "Pola napas belum terbaca",
              detail: reading.detected
                ? reading.followsGuide
                  ? "Keyakinan sedang · ritme gerakan mendekati panduan. Ini tetap perkiraan kamera."
                  : "Keyakinan sedang · ritme gerakan berbeda dari panduan. Ikuti kenyamananmu."
                : "Kamera sedang mencari beberapa siklus yang konsisten. Bernapas biasa; jangan membesarkan gerakan untuk kamera.",
              values: reading.values,
              region,
              cycles: reading.cycles,
              calibrated: true,
            },
            time,
          );
        });
        let first = true;
        const detect = async () => {
          if (cancelled || !tracker) return;
          const video = videoRef.current;
          if (
            video &&
            video.readyState >= 2 &&
            video.currentTime !== previousVideoTime
          ) {
            previousVideoTime = video.currentTime;
            context.drawImage(video, 0, 0, 160, 120);
            packet = {
              data: grayscale(context.getImageData(0, 0, 160, 120).data),
              time: performance.now(),
            };
            try {
              await Promise.race([
                tracker.send({ image: video }),
                new Promise<never>((_, reject) => {
                  timeout = window.setTimeout(
                    () => reject(new Error("Pose processing timed out")),
                    first ? 30000 : 3000,
                  );
                }),
              ]);
            } finally {
              window.clearTimeout(timeout);
            }
            first = false;
          }
          if (!cancelled)
            timer = window.setTimeout(() => {
              void detect().catch(fail);
            }, 100);
        };
        await detect();
      } catch {
        fail();
      }
    }
    const stop = () => {
      cancelled = true;
      window.clearTimeout(timer);
      window.clearTimeout(timeout);
      if (tracker) {
        try {
          void tracker.close().catch(() => {});
        } catch {
          /* Already closed. */
        }
      }
      previous = null;
      packet = null;
    };
    const fail = () => {
      if (cancelled) return;
      stop();
      setFailed(true);
      setView({
        ...initialView,
        title: "Deteksi belum tersedia",
        detail:
          "Kamera bisa tetap dipakai sebagai cermin. Coba deteksi lagi atau lanjutkan panduan tanpa deteksi.",
      });
    };
    void start();
    window.addEventListener("pagehide", stop);
    return () => {
      stop();
      window.removeEventListener("pagehide", stop);
    };
  }, [videoRef, cycleMs, onCalibrated, onSummary, retry]);

  const values = view.values;
  const range = Math.max(0.5, Math.max(...values) - Math.min(...values));
  const center = values.length
    ? (Math.max(...values) + Math.min(...values)) / 2
    : 0;
  const points = values
    .map(
      (value, index) =>
        `${(index * 300) / Math.max(1, values.length - 1)},${30 - ((value - center) / range) * 40}`,
    )
    .join(" ");
  return (
    <div className="mt-4 space-y-3" data-breath-detection="true">
      <div
        role="status"
        aria-live="polite"
        className="rounded-xl bg-tint p-4 text-sm text-fg-brand"
      >
        <p className="font-semibold">{view.title}</p>
        <p className="mt-1 text-xs leading-relaxed">{view.detail}</p>
        {view.cycles > 0 && (
          <p className="mt-2 text-xs">
            {view.cycles} perkiraan siklus gerakan teramati
          </p>
        )}
      </div>
      {view.calibrated && (
        <svg
          viewBox="0 0 300 60"
          role="img"
          aria-label="Pola gerakan kamera, bukan pengukuran medis"
          className="h-16 w-full rounded-lg bg-canvas text-fg-brand"
        >
          <line
            x1="0"
            y1="30"
            x2="300"
            y2="30"
            stroke="currentColor"
            opacity="0.15"
          />
          <polyline
            points={points}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
      )}
      {failed && (
        <button
          type="button"
          onClick={() => {
            setFailed(false);
            setView(initialView);
            setRetry((value) => value + 1);
          }}
          className="min-h-11 rounded-xl border border-line px-4 text-sm font-semibold text-fg-brand"
        >
          Coba Deteksi Lagi
        </button>
      )}
      <p className="text-xs leading-relaxed text-fg-muted">
        Deteksi percobaan memperkirakan gerakan dada/perut, bukan memastikan
        napas atau kondisi kesehatan. Gambar diproses di perangkat; tidak
        direkam atau diunggah.
      </p>
    </div>
  );
}
