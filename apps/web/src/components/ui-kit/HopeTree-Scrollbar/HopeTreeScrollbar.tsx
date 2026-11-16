"use client";

import React, { useEffect, useRef, useState } from "react";
import "./HopeTreeScrollbar.css";

export type TreeSection = {
  id: string;
  label: string;
};

export const DEFAULT_TREE_SECTIONS: TreeSection[] = [
  { id: "home", label: "Beranda" },
  { id: "programs", label: "Modul" },
  { id: "how-it-works", label: "Alur pemulihan" },
  { id: "calculator", label: "Simulasi Hope Tree" },
  { id: "game-showcase", label: "Game & Mood" },
  { id: "stories", label: "Suara lapangan" },
];

function LeafIcon({
  className = "w-6 h-6",
  strokeWidth = 1.8,
}: {
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </svg>
  );
}

function SproutIcon({
  className = "w-3.5 h-3.5",
  strokeWidth = 2.2,
}: {
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7 20h10" />
      <path d="M10 20c5.5-2.5.8-6.4 3-10" />
      <path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z" />
      <path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z" />
    </svg>
  );
}

export interface HopeTreeScrollbarProps {
  visible?: boolean;
  sections?: TreeSection[];
  className?: string;
}

export default function HopeTreeScrollbar({
  visible = true,
  sections = DEFAULT_TREE_SECTIONS,
  className = "",
}: HopeTreeScrollbarProps) {
  const n = sections.length;
  const trackRef = useRef<HTMLElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const anchors = useRef<number[]>([]);
  const dragging = useRef(false);
  const reachedRef = useRef(1);
  const [reached, setReached] = useState(1);

  useEffect(() => {
    let raf = 0;

    const measure = () => {
      const maxScroll = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight,
      );
      const A: number[] = [];
      sections.forEach((sec, i) => {
        const el = document.getElementById(sec.id);
        const top = el ? el.getBoundingClientRect().top + window.scrollY : 0;
        const clamped = Math.min(Math.max(top, 0), maxScroll);
        A.push(i === 0 ? 0 : Math.max(clamped, A[i - 1] + 1));
      });
      A.push(Math.max(maxScroll, A[n - 1] + 1));
      anchors.current = A;
    };

    const update = () => {
      raf = 0;
      const A = anchors.current;
      if (A.length < n + 1) return;
      const y = window.scrollY;
      let k = 0;
      while (k < n - 1 && y >= A[k + 1]) k++;
      const local = Math.min(1, Math.max(0, (y - A[k]) / (A[k + 1] - A[k])));
      const p = Math.min(1, (k + local) / n);

      trackRef.current?.style.setProperty("--p", String(p));
      if (tipRef.current) tipRef.current.dataset.bloom = String(p > 0.995);
      const r = Math.min(n, Math.floor(p * n + 1e-6) + 1);
      if (r !== reachedRef.current) {
        reachedRef.current = r;
        setReached(r);
      }
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    const remeasure = () => {
      measure();
      update();
    };

    remeasure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", remeasure);
    const ro = new ResizeObserver(remeasure);
    ro.observe(document.body);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", remeasure);
      ro.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [sections, n]);

  const scrollToPointer = (clientX: number, clientY: number) => {
    const track = trackRef.current;
    const A = anchors.current;
    if (!track || A.length < n + 1) return;
    const rect = track.getBoundingClientRect();
    const vertical = window.matchMedia("(min-width: 1024px)").matches;
    const raw = vertical
      ? (clientY - rect.top) / rect.height
      : (clientX - rect.left) / rect.width;
    const p = Math.min(1, Math.max(0, raw));
    const pos = p * n;
    const k = Math.min(n - 1, Math.floor(pos));
    const y = A[k] + (pos - k) * (A[k + 1] - A[k]);
    window.scrollTo({ top: y, behavior: "instant" as ScrollBehavior });
  };

  return (
    <nav
      ref={trackRef}
      className={`pm-tree ${className}`}
      data-show={visible}
      aria-label="Navigasi bagian halaman"
    >
      <div className="pm-stem" aria-hidden="true" />
      <div className="pm-fill" aria-hidden="true" />
      <div
        className="pm-hit"
        aria-hidden="true"
        onPointerDown={(e) => {
          dragging.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          scrollToPointer(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
          if (dragging.current) scrollToPointer(e.clientX, e.clientY);
        }}
        onPointerUp={() => {
          dragging.current = false;
        }}
        onPointerCancel={() => {
          dragging.current = false;
        }}
      />

      {sections.map((sec, i) => (
        <div
          key={sec.id}
          className="pm-node"
          style={{ "--f": i / n } as React.CSSProperties}
        >
          <button
            type="button"
            className={`pm-leafbtn ${i % 2 ? "pm-l" : "pm-r"}`}
            data-on={i < reached}
            aria-label={`Ke bagian ${sec.label}`}
            onClick={() =>
              window.scrollTo({
                top: anchors.current[i] ?? 0,
                behavior: "smooth",
              })
            }
          >
            <span className="pm-leaf">
              <LeafIcon className="w-6 h-6" strokeWidth={1.8} />
            </span>
          </button>
          <span className="pm-label" aria-hidden="true">
            {sec.label}
          </span>
        </div>
      ))}

      <div ref={tipRef} className="pm-tip" aria-hidden="true">
        <SproutIcon className="w-3.5 h-3.5" strokeWidth={2.2} />
      </div>
    </nav>
  );
}

