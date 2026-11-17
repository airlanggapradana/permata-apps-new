"use client";

import { useEffect, useRef, useState } from "react";
import BreathingDetector from "./BreathingDetector";
import type { CameraPatternSummary } from "@/lib/games/breathingMotion";

export default function BreathingCamera({
  onUnavailable,
  detectBreathing = false,
  cycleMs = 8000,
  onCalibrated,
  onSummary,
  guidance,
}: {
  onUnavailable: () => void;
  detectBreathing?: boolean;
  cycleMs?: number;
  onCalibrated: () => void;
  onSummary: (id: string, summary: CameraPatternSummary) => void;
  guidance?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    let stream: MediaStream | undefined;
    const stop = () => {
      cancelled = true;
      stream?.getTracks().forEach((track) => track.stop());
    };
    const timeout = window.setTimeout(() => {
      if (!cancelled) {
        stop();
        onUnavailable();
      }
    }, 15000);
    async function start() {
      try {
        if (!navigator.mediaDevices?.getUserMedia)
          throw new Error("Camera unavailable");
        const incoming = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: 640, height: 480 },
          audio: false,
        });
        if (cancelled) {
          incoming.getTracks().forEach((track) => track.stop());
          return;
        }
        stream = incoming;
        const video = videoRef.current;
        if (!video) throw new Error("Video unavailable");
        video.srcObject = stream;
        await video.play();
        if (!cancelled) {
          window.clearTimeout(timeout);
          setReady(true);
        }
      } catch {
        if (!cancelled) {
          stop();
          onUnavailable();
        }
      }
    }
    void start();
    window.addEventListener("pagehide", stop);
    return () => {
      window.clearTimeout(timeout);
      stop();
      window.removeEventListener("pagehide", stop);
    };
  }, [onUnavailable]);
  return (
    <aside className="rounded-2xl border border-line bg-surface p-4">
      {detectBreathing && guidance && (
        <p
          aria-hidden="true"
          className="mb-4 rounded-xl bg-tint px-4 py-3 text-center font-semibold text-fg-brand"
        >
          {guidance}
        </p>
      )}
      <div
        className={`flex gap-4 ${detectBreathing ? "flex-col sm:flex-row sm:items-center" : "items-center"}`}
      >
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          aria-label="Cermin kamera latihan napas"
          className={`aspect-[4/3] shrink-0 -scale-x-100 rounded-xl bg-sunken object-cover ${detectBreathing ? "w-full sm:w-64" : "w-28"}`}
        />
        <div className="text-sm">
          <p role="status" className="font-semibold">
            {ready ? "Cermin siap" : "Menyiapkan kamera…"}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-fg-muted">
            {detectBreathing
              ? "Posisikan kamera agar bahu hingga perut terlihat. Gunakan cahaya merata dan biarkan kamera tetap diam."
              : "Duduk senyamanmu. Video hanya tampil di perangkatmu, tanpa direkam atau diunggah."}
          </p>
        </div>
      </div>
      {ready && detectBreathing && (
        <BreathingDetector
          videoRef={videoRef}
          cycleMs={cycleMs}
          onCalibrated={onCalibrated}
          onSummary={onSummary}
        />
      )}
    </aside>
  );
}
