"use client";

import React from "react";

export type TransitionPhase = "entering" | "covered" | "exiting" | "idle";
export type TransitionKind = "initial" | "route";

interface PageTransitionOverlayProps {
  phase: TransitionPhase;
  kind: TransitionKind;
  transitionId: number;
}

const BRAND_LETTERS = "PERMATA".split("");

/**
 * Full-screen PERMATA splash/transition curtain shared between initial app load
 * and client-side page switches.
 */
export default function PageTransitionOverlay({
  phase,
  kind,
  transitionId,
}: PageTransitionOverlayProps) {
  if (phase === "idle") return null;

  const entering = phase === "entering";
  const exiting = phase === "exiting";
  const isRoute = kind === "route";

  const letterBaseDelay = isRoute ? 220 : 700;
  const letterStepDelay = isRoute ? 55 : 80;

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-brand-950 transition-opacity duration-700 ease-out ${
        entering ? "pm-transition-enter" : ""
      } ${isRoute ? "pm-transition-route" : ""} ${
        exiting ? "pointer-events-none" : "pointer-events-auto"
      }`}
      role="status"
      aria-label="Memuat PERMATA Nusantara"
      style={{ opacity: exiting ? 0 : 1 }}
    >
      <div
        key={transitionId}
        className="flex flex-col items-center justify-center"
      >
        <div className="pm-logo-in relative">
          <span
            className="pm-ring absolute inset-0 rounded-full border border-white/40"
            aria-hidden="true"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/permata-logo.webp"
            alt=""
            width={128}
            height={128}
            className="relative w-28 h-28 sm:w-32 sm:h-32 brightness-0 invert object-contain drop-shadow-[0_2px_12px_rgba(255,255,255,0.2)]"
          />
        </div>

        <p
          aria-hidden="true"
          className="mt-7 flex pl-[0.35em] text-2xl sm:text-3xl font-semibold text-white tracking-[0.35em]"
          style={{
            opacity: exiting ? 0 : 1,
            transform: exiting ? "translateY(12px)" : "none",
            transition: "opacity 400ms ease, transform 400ms ease",
          }}
        >
          {BRAND_LETTERS.map((ch, i) => (
            <span
              key={i}
              className="pm-letter"
              style={
                {
                  "--d": `${letterBaseDelay + i * letterStepDelay}ms`,
                } as React.CSSProperties
              }
            >
              {ch}
            </span>
          ))}
        </p>
      </div>
    </div>
  );
}
