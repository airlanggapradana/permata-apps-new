"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useCulture } from "@/context/CultureContext";
import Particles from "@/components/ui-kit/Particle/Particles"; // React Bits: Backgrounds/Particles
import acehBackground from "@/assets/localization/aceh/background.png";
// Ilustrasi modul. Modul tanpa gambar otomatis memakai ikon sebagai placeholder.
import jurnalIllustration from "@/assets/localization/aceh/JurnalHikmah.png";
import screeningIllustration from "@/assets/localization/aceh/ScreeningTriase.png"; // ganti ekstensi dari .jfif, lihat catatan
import hutanPinus from "@/assets/image/HutanPinus.avif";
import { useTiltSurface } from "@/components/ui-kit/TiltSurfaces/TiltSurfaces";
import type { TransitionPhase } from "@/components/PageTransitionOverlay";

type IconName =
  | "book"
  | "shield"
  | "heart"
  | "play"
  | "gamepad"
  | "arrow"
  | "check"
  | "signal"
  | "sprout"
  | "leaf"
  | "pine"
  | "trees"
  | "landmark"
  | "backpack"
  | "pin"
  | "wind"
  | "users"
  | "bowl"
  | "star"
  | "chevron"
  | "seed"
  | "seedling"
  | "sapling";

const ICONS: Record<IconName, React.ReactNode> = {
  book: (
    <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  ),
  shield: (
    <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  ),
  heart: (
    <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  ),
  play: (
    <>
      <path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
      <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </>
  ),
  gamepad: (
    <>
      <path d="M6.5 6.5C8.5 6.8 15.5 6.8 17.5 6.5C19.5 6.2 21.2 10.5 21.5 15.2C21.7 17.8 20.1 19.2 18.4 18.6C17.1 18.1 16.1 16.2 15.2 15.4C13.5 14.8 10.5 14.8 8.8 15.4C7.9 16.2 6.9 18.1 5.6 18.6C3.9 19.2 2.3 17.8 2.5 15.2C2.8 10.5 4.5 6.2 6.5 6.5Z" />
      <circle cx="7.5" cy="9.8" r="1.3" />
      <circle cx="12" cy="9.5" r="1.1" />
      <path d="M9.5 12.2v2M8.5 13.2h2" />
      <circle cx="14.5" cy="13.2" r="1.3" />
      <path d="M16.8 8.3h.01M18.3 9.8h.01M16.8 11.3h.01M15.3 9.8h.01" />
    </>
  ),
  arrow: <path d="M14 5l7 7m0 0l-7 7m7-7H3" />,
  chevron: <path d="M6 9l6 6 6-6" />,
  // Tahap pertumbuhan Hope Tree: benih â†’ tunas â†’ pohon kecil â†’ pohon besar tunggal
  seed: (
    <>
      <ellipse cx="12" cy="13" rx="3.2" ry="4.6" transform="rotate(35 12 13)" />
      <path d="M4 19.5h16" />
    </>
  ),
  seedling: (
    <>
      <path d="M12 20.5V11" />
      <path d="M12 13c-3.6 0-5.5-1.8-5.5-4.5 3.4 0 5.5 1.6 5.5 4.5z" />
      <path d="M12 11c0-3 1.8-5 5.5-5 0 3.2-1.9 5-5.5 5z" />
      <path d="M7.5 20.5h9" />
    </>
  ),
  sapling: (
    <>
      <path d="M8.5 14A2.8 2.8 0 0 1 7.5 9 3.2 3.2 0 0 1 12 6 3.2 3.2 0 0 1 16.5 9 2.8 2.8 0 0 1 15.5 14Q12 15.6 8.5 14z" />
      <path d="M12 15v5.5M12 17.2l-1.8-1.5M8.5 20.5h7" />
    </>
  ),
  check: <path d="M5 13l4 4L19 7" />,
  signal: <path d="M4 20v-3m5 3v-6m5 6V9m5 11V4" />,
  sprout: (
    <>
      <path d="M7 20h10" />
      <path d="M10 20c5.5-2.5.8-6.4 3-10" />
      <path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z" />
      <path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z" />
    </>
  ),
  leaf: (
    <>
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </>
  ),
  pine: (
    <>
      <path d="m17 14 3 3.3a1 1 0 0 1-.7 1.7H4.7a1 1 0 0 1-.7-1.7L7 14h-.3a1 1 0 0 1-.7-1.7L9 9h-.2A1 1 0 0 1 8 7.3L12 3l4 4.3a1 1 0 0 1-.8 1.7H15l3 3.3a1 1 0 0 1-.7 1.7H17Z" />
      <path d="M12 22v-3" />
    </>
  ),
  trees: (
    <>
      <path d="M10 10v.2A3 3 0 0 1 8.9 16H5a3 3 0 0 1-1-5.8V10a3 3 0 0 1 6 0Z" />
      <path d="M7 16v6" />
      <path d="M13 19v3" />
      <path d="M12 19h8.3a1 1 0 0 0 .7-1.7L18 14h.3a1 1 0 0 0 .7-1.7L16 9h.2a1 1 0 0 0 .8-1.7L13 3l-1.4 1.5" />
    </>
  ),
  landmark: <path d="M3 22h18M6 18v-7m4 7v-7m4 7v-7m4 7v-7M12 2l8 5H4l8-5z" />,
  backpack: (
    <>
      <path d="M4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
      <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
      <path d="M8 21v-5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v5" />
      <path d="M8 10h8" />
    </>
  ),
  pin: (
    <>
      <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z" />
      <circle cx="12" cy="10" r="3" />
    </>
  ),
  wind: (
    <>
      <path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2" />
      <path d="M9.6 4.6A2 2 0 1 1 11 8H2" />
      <path d="M12.6 19.4A2 2 0 1 0 14 16H2" />
    </>
  ),
  users: (
    <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  ),
  star: (
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  ),
  bowl: (
    <>
      <path d="M12 21a9 9 0 0 0 9-9H3a9 9 0 0 0 9 9Z" />
      <path d="M7 21h10" />
      <path d="M8 3c.5 1 .5 2 0 3M12 3c.5 1 .5 2 0 3M16 3c.5 1 .5 2 0 3" />
    </>
  ),
};

function Icon({
  name,
  className = "w-5 h-5",
  strokeWidth = 2,
}: {
  name: IconName;
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
      {ICONS[name]}
    </svg>
  );
}

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600";

/* Tombol dengan lingkaran panah yang melebar saat hover (gaya CSS: .pm-ab di SPLASH_CSS) */
function ArrowLink({
  href,
  children,
  variant = "dark",
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "dark" | "light";
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`pm-ab ${variant === "light" ? "pm-ab-light" : ""} font-semibold ${className} ${focusRing}`}
    >
      <span className="pm-ab-in">
        <span className="pm-ab-fill" aria-hidden="true">
          <span className="pm-ab-arrow" />
        </span>
        <span className="pm-ab-text">{children}</span>
      </span>
    </Link>
  );
}

/* Tombol pil biasa dengan glow tipis berputar (gaya CSS: .pm-gl di SPLASH_CSS) */
function GlowLink({
  href,
  children,
  variant = "dark",
  size = "md",
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "dark" | "light";
  size?: "md" | "lg";
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`pm-gl ${variant === "light" ? "pm-gl-light" : ""} font-semibold ${className} ${focusRing}`}
    >
      <span className="pm-gl-in">
        <span className={`pm-gl-face ${size === "lg" ? "pm-gl-lg" : ""}`}>
          {children}
          <Icon name="arrow" className="pm-gl-ico w-4 h-4" />
        </span>
      </span>
    </Link>
  );
}

/* Tautan footer: garis bawah menyapu + panah muncul saat hover */
function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`group inline-flex items-center gap-1.5 py-1 rounded-sm text-slate-600 hover:text-brand-800 transition-colors duration-200 ${focusRing}`}
    >
      <span className="relative">
        {children}
        <span className="absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 bg-brand-700 transition-transform duration-300 group-hover:scale-x-100 motion-reduce:transition-none" />
      </span>
      <Icon
        name="arrow"
        strokeWidth={2.5}
        className="w-3.5 h-3.5 -translate-x-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 motion-reduce:transition-none"
      />
    </Link>
  );
}

/* Ambang XP: 0â€“999 L2, 1.000â€“2.499 L3, 2.500â€“4.999 L4, 5.000+ L5 */
type Level = {
  min: number;
  next: number | null;
  name: string;
  icon: IconName;
  status: string;
  readiness: string;
};

const LEVELS: Level[] = [
  {
    min: 0,
    next: 1000,
    name: "Level 2 â€¢ Tunas Muda",
    icon: "seed",
    status: "Mulai Menstabilkan Emosi",
    readiness: "74 / 100 (Cukup Siap)",
  },
  {
    min: 1000,
    next: 2500,
    name: "Level 3 â€¢ Tunas Mekar",
    icon: "seedling",
    status: "Bertumbuh Positif Pascabencana",
    readiness: "84 / 100 (Sigap)",
  },
  {
    min: 2500,
    next: 5000,
    name: "Level 4 â€¢ Pohon Rindang Bertunas",
    icon: "sapling",
    status: "Adaptif & Resiliensi Tinggi",
    readiness: "92 / 100 (Sangat Sigap)",
  },
  {
    min: 5000,
    next: null,
    name: "Level 5 â€¢ Rimba Resiliensi Mandiri",
    icon: "pine",
    status: "Sangat Tangguh & Agen PFA Cilik",
    readiness: "98 / 100 (Paling Sigap)",
  },
];

const MODULES: {
  icon: IconName;
  iconBoxClass: string;
  image?: { src: string; alt: string };
  tag: string;
  title: string;
  desc: string;
  href: string;
  cta: string;
}[] = [
  {
    icon: "book",
    iconBoxClass: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/70",
    image: {
      src: jurnalIllustration.src,
      alt: "Anak menulis jurnal ditemani maskot AI pendamping",
    },
    tag: "Refleksi harian",
    title: "AI Jurnal Hikmah",
    desc: "Ruang aman bagi anak untuk menuliskan perasaan harian dan menemukan makna dari pengalaman sulit, berlandaskan kearifan Meuseuraya dan Mambangkik Batang Tarandam.",
    href: "/jurnal",
    cta: "Buka jurnal",
  },
  {
    icon: "shield",
    iconBoxClass: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/70",
    image: {
      src: screeningIllustration.src,
      alt: "Ilustrasi skrining kesehatan mental dan triase anak",
    },
    tag: "Deteksi dini",
    title: "Skrining & triase",
    desc: "Mendeteksi dini depresi, kecemasan, dan stres pada anak, lengkap dengan rekomendasi rujukan.",
    href: "/tele-screening",
    cta: "Mulai skrining",
  },
  {
    icon: "heart",
    iconBoxClass: "bg-teal-50 text-teal-700 ring-1 ring-teal-200/70",
    tag: "Teman bicara",
    title: "Pendamping AI",
    desc: "Teman bicara yang empatik, dengan pengaman bawaan untuk melindungi anak.",
    href: "/ai-companion",
    cta: "Buka pendamping",
  },
  {
    icon: "gamepad",
    iconBoxClass: "bg-amber-50 text-amber-600 ring-1 ring-amber-200/70",
    tag: "Latihan siaga",
    title: "Game resiliensi",
    desc: "Belajar siaga gempa dan tsunami lewat permainan, sambil melatih napas untuk menenangkan diri.",
    href: "#game-showcase",
    cta: "Lihat permainan",
  },
];

const STEPS = [
  {
    title: "Kenali kondisi emosi",
    desc: "Anak mengisi kuesioner DASS-21 dan mencatat suasana hati harian di Jurnal Hikmah.",
  },
  {
    title: "Tenangkan diri",
    desc: "Latihan napas terpandu, permainan simulasi gempa, dan afirmasi dari tradisi lokal.",
  },
  {
    title: "Tumbuh bersama",
    desc: "Perkembangan anak terpantau lewat Hope Tree, dengan dukungan berkala orang tua dan guru serta jalur darurat bila dibutuhkan.",
  },
];

const STEP_ICONS: IconName[] = ["book", "wind", "sprout"];

const DURATIONS = [
  { v: 4, label: "4 minggu", sub: "1 bulan awal" },
  { v: 12, label: "12 minggu", sub: "3 bulan" },
  { v: 24, label: "24 minggu", sub: "6 bulan" },
];

const GAMES: { icon: IconName; title: string; desc: string; href: string }[] = [
  {
    icon: "backpack",
    title: "Simulasi tas siaga bencana",
    desc: "Memilah kebutuhan penting untuk 72 jam pertama evakuasi dengan drag-and-drop.",
    href: "/game-healing",
  },
  {
    icon: "pin",
    title: "Evakuasi cepat Minang",
    desc: "Mengenali sirine tsunami di pesisir Sumatera Barat dan titik perbukitan yang aman.",
    href: "/game-siagaminang",
  },
  {
    icon: "wind",
    title: "Breathing Calm",
    desc: "Latihan napas untuk menurunkan ritme panik, dengan metafora mekarnya bunga Jeumpa.",
    href: "/game-breath",
  },
  {
    icon: "users",
    title: "Meuseuraya puzzle siaga",
    desc: "Membersihkan puing sekolah bersama-sama secara gotong royong, berhadiah Hope XP.",
    href: "/game-quake",
  },
];

const NUTRITION = [
  { title: "Omega-3 & seng", desc: "Meredam kecemasan akut pascagempa" },
  {
    title: "Karbohidrat kompleks",
    desc: "Stabilitas energi dan suasana hati anak di posko",
  },
  {
    title: "Rempah hangat lokal",
    desc: "Jahe dan kunyit untuk membantu tidur",
  },
];

const STORIES = [
  {
    quote:
      "â€œAnak-anak di tenda darurat menyambut latihan pernapasan dan AI Jurnal Hikmah dengan ceria. Konsep Meuseuraya membuat mereka saling menguatkan alih-alih larut dalam kesedihan.â€",
    initials: "RA",
    tag: "Relawan PFA",
    highlight: "saling menguatkan alih-alih larut dalam kesedihan",
    name: "Rahmatiah, S.Psi.",
    role: "Relawan PFA & Psikososial Posko Pidie Aceh",
  },
  {
    quote:
      "â€œFilosofi Mambangkik Batang Tarandam menumbuhkan harga diri anak-anak sekolah dasar pasca gempa Pasaman. Mereka belajar bahwa musibah adalah awal kebangkitan karakter.â€",
    initials: "BS",
    tag: "Pendidik",
    highlight: "musibah adalah awal kebangkitan karakter",
    name: "Bundo Salma",
    role: "Guru Pendamping SD Pasaman Barat, Sumbar",
  },
  {
    quote:
      "â€œKami bisa mengenali anak yang menunjukkan tanda depresi berat lebih cepat dan merujuknya tepat waktu, sebelum terlambat.â€",
    initials: "FW",
    tag: "Tenaga medis",
    highlight: "merujuknya tepat waktu, sebelum terlambat",
    name: "dr. Fadli Wijaya",
    role: "Koordinator Medis SafeConnect Hotline 119",
  },
];

const FOOTER_MODULES = [
  { label: "AI Jurnal Hikmah", href: "/jurnal" },
  { label: "Skrining DASS-21", href: "/tele-screening" },
  { label: "Game Center", href: "#game-showcase" },
  { label: "Hope Tree", href: "#calculator" },
  { label: "Mood + Food Analyzer", href: "/mood-food" },
];

const FOOTER_SERVICES = [
  { label: "Pendamping AI", href: "/ai-companion" },
  { label: "Offline Survival Mode", href: "/offline-survival" },
  { label: "Hotline 119", href: "#stories" },
  { label: "Dokumentasi API", href: "#programs" },
  { label: "Perlindungan data anak", href: "#privacy" },
  { label: "Persetujuan orang tua", href: "#privacy" },
];

// Gambar hero per tema daerah. Kunci harus sama dengan nilai `culture` di CultureContext.
// Daerah yang belum terdaftar otomatis memakai tema Aceh.
const HERO_THEMES: Record<string, { src: string; alt: string }> = {
  aceh: {
    src: acehBackground.src,
    alt: "Anak-anak Aceh merangkul di zona rekonstruksi pascabencana",
  },
};

const HERO_STATS: { icon: IconName; value: string; label: string }[] = [
  { icon: "book", value: "100%", label: "Kearifan Nusantara" },
  { icon: "star", value: "DASS-21", label: "Skrining Terstandar" },
  { icon: "shield", value: "AI Guard", label: "Sensor PII & Etis" },
  { icon: "signal", value: "Offline", label: "Ready di Pengungsian" },
];

// Partikel melayang (nilai tetap, bukan acak, agar SSR dan klien identik)
const PARTICLES = [
  {
    left: "6%",
    top: "78%",
    size: 4,
    dur: 13,
    del: 0,
    dx: 28,
    o: 0.6,
    tint: "bg-white",
  },
  {
    left: "17%",
    top: "62%",
    size: 3,
    dur: 15,
    del: 2200,
    dx: -20,
    o: 0.5,
    tint: "bg-brand-200",
  },
  {
    left: "28%",
    top: "85%",
    size: 5,
    dur: 12,
    del: 4100,
    dx: 18,
    o: 0.55,
    tint: "bg-white",
  },
  {
    left: "41%",
    top: "70%",
    size: 3,
    dur: 16,
    del: 900,
    dx: -26,
    o: 0.45,
    tint: "bg-brand-200",
  },
  {
    left: "55%",
    top: "88%",
    size: 4,
    dur: 14,
    del: 5200,
    dx: 22,
    o: 0.5,
    tint: "bg-white",
  },
  {
    left: "66%",
    top: "66%",
    size: 3,
    dur: 17,
    del: 3000,
    dx: -18,
    o: 0.5,
    tint: "bg-brand-200",
  },
  {
    left: "76%",
    top: "80%",
    size: 5,
    dur: 12.5,
    del: 6200,
    dx: 30,
    o: 0.6,
    tint: "bg-white",
  },
  {
    left: "88%",
    top: "60%",
    size: 4,
    dur: 15,
    del: 1500,
    dx: -24,
    o: 0.5,
    tint: "bg-brand-200",
  },
  {
    left: "94%",
    top: "84%",
    size: 3,
    dur: 13.5,
    del: 7400,
    dx: -16,
    o: 0.45,
    tint: "bg-white",
  },
];

const HERO_TITLE_WORDS = [
  "Pulihkan",
  "Senyum",
  "&",
  "Resiliensi",
  "Jiwa",
  "Anak",
  "Pascabencana",
];

// Delay animasi masuk per elemen, dibaca CSS lewat var(--d)
const idx = (n: number) => ({ "--i": n }) as React.CSSProperties;
const delay = (ms: number) => ({ "--d": `${ms}ms` }) as React.CSSProperties;

const SPLASH_CSS = `
/* Scrollbar "Pohon Harapan" (komponen HopeScrollbar).
   >= 1024px : batang vertikal di tepi kanan; scrollbar native disembunyikan.
   <  1024px : batang horizontal di bawah layar (HP & tablet); scrollbar bawaan perangkat tetap ada.
   JS hanya mengisi --p (kemajuan 0-1); posisi tiap daun memakai --f (0-1). */
html { scrollbar-gutter: stable; }

.pm-tree { --p: 0; --pm-track: rgba(110,135,122,.42); --pm-track-ring: rgba(255,255,255,.28);
  --pm-leaf-off: rgba(110,135,122,.9); --pm-leaf-on: #2f9e6f;
  position: fixed; z-index: 60; right: .5rem; top: 50%; width: 3.25rem; height: min(56svh, 34rem); min-height: 16rem;
  transform: translateY(-50%); opacity: 0; pointer-events: none; transition: opacity 700ms ease 200ms; }
.pm-tree[data-show="true"] { opacity: 1; }
.pm-tree::before { display: none; }

.pm-stem { position: absolute; left: 50%; top: 0; bottom: 0; width: 4px; margin-left: -2px; border-radius: 999px;
  background: var(--pm-track); box-shadow: 0 0 0 1px var(--pm-track-ring); }
.pm-fill { position: absolute; left: 50%; top: 0; width: 4px; height: calc(var(--p) * 100%); margin-left: -2px; border-radius: 999px;
  background: linear-gradient(180deg, #2f7a5a, #6fd0a0); box-shadow: 0 0 10px rgba(111,208,160,.65); }
.pm-hit  { position: absolute; top: -12px; bottom: -12px; left: 50%; width: 1.75rem; margin-left: -.875rem;
  pointer-events: auto; cursor: grab; touch-action: none; }
.pm-hit:active { cursor: grabbing; }

.pm-tip { position: absolute; left: 50%; top: calc(var(--p) * 100%); width: 1.625rem; height: 1.625rem; margin: -.8125rem 0 0 -.8125rem;
  display: flex; align-items: center; justify-content: center; border-radius: 999px; pointer-events: none;
  background: #fff; color: #2f7a5a; border: 2px solid #2f7a5a; box-shadow: 0 2px 10px rgba(0,0,0,.25);
  transition: transform 450ms cubic-bezier(.34,1.56,.64,1), background-color 300ms; }
.pm-tip[data-bloom="true"] { transform: scale(1.45); background: #6fd0a0; color: #0f3d2b; }

.pm-node { position: absolute; left: 0; right: 0; top: calc(var(--f) * 100%); height: 0; pointer-events: none; }
.pm-leafbtn { position: absolute; top: 0; width: 1.5rem; height: 1.5rem; margin-top: -.75rem; padding: 0; border: 0; background: none;
  color: var(--pm-leaf-off); pointer-events: auto; cursor: pointer; }
.pm-r { left: 50%; margin-left: 2px; }
.pm-l { right: 50%; margin-right: 2px; }
.pm-leaf { display: flex; align-items: center; width: 100%; height: 100%; opacity: .7; transform: scale(.5); transform-origin: 12% 88%;
  transition: transform 600ms cubic-bezier(.34,1.56,.64,1), opacity 300ms; }
.pm-leaf svg { width: 1.375rem; height: 1.375rem; }
.pm-l .pm-leaf { justify-content: flex-end; transform-origin: 88% 88%; }
.pm-l .pm-leaf svg { transform: scaleX(-1); }
.pm-leafbtn[data-on="true"] { color: var(--pm-leaf-on); }
.pm-leafbtn[data-on="true"] .pm-leaf { opacity: 1; transform: scale(1); }
.pm-leafbtn[data-on="true"] svg { fill: rgba(95,200,150,.35); filter: drop-shadow(0 0 4px rgba(95,200,150,.55)); }
.pm-leafbtn:hover .pm-leaf { transform: scale(1.18); }
.pm-leafbtn:focus-visible { outline: 2px solid #2f7a5a; outline-offset: 2px; border-radius: 6px; }

.pm-label { position: absolute; top: 0; right: calc(100% + .625rem); transform: translate(6px, -50%); opacity: 0; white-space: nowrap;
  font-size: .875rem; font-weight: 500; line-height: 1; color: #fff; background: rgba(15,45,33,.92);
  padding: .45rem .75rem; border-radius: 999px; box-shadow: 0 4px 14px rgba(0,0,0,.25); pointer-events: none;
  transition: opacity 200ms, transform 200ms; }
.pm-node:hover .pm-label, .pm-node:focus-within .pm-label { opacity: 1; transform: translate(0, -50%); }

@media (min-width: 1024px) {
  html { scrollbar-width: none; }
  html::-webkit-scrollbar { display: none; }
}

/* HP & tablet: batang horizontal di bawah layar, di dalam kapsul gelap agar terbaca di atas konten apa pun */
@media (max-width: 1023px) {
  .pm-tree { --pm-track: rgba(255,255,255,.28); --pm-track-ring: transparent; --pm-leaf-off: rgba(255,255,255,.55); --pm-leaf-on: #7ee2b0;
    left: 50%; right: auto; top: auto; bottom: calc(env(safe-area-inset-bottom, 0px) + .75rem);
    width: min(78vw, 24rem); height: 3.25rem; min-height: 0; transform: translateX(-50%); }
  .pm-tree::before { display: block; content: ""; position: absolute; inset: 0 -1.25rem; z-index: -1; border-radius: 999px; pointer-events: none;
    background: rgba(15,45,33,.8); -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px);
    box-shadow: 0 6px 20px rgba(0,0,0,.28), 0 0 0 1px rgba(255,255,255,.12); }

  .pm-stem { left: 0; right: 0; top: 50%; bottom: auto; width: auto; height: 4px; margin: -2px 0 0; }
  .pm-fill { left: 0; top: 50%; width: calc(var(--p) * 100%); height: 4px; margin: -2px 0 0; background: linear-gradient(90deg, #2f7a5a, #6fd0a0); }
  .pm-hit  { left: -12px; right: -12px; top: 50%; bottom: auto; width: auto; height: 2.5rem; margin: -1.25rem 0 0; }
  .pm-tip  { top: 50%; left: calc(var(--p) * 100%); }

  .pm-node { top: 0; bottom: 0; left: calc(var(--f) * 100%); right: auto; width: 0; height: auto; }
  .pm-leafbtn { margin-top: 0; }
  .pm-r { left: 0; right: auto; top: auto; bottom: 50%; margin: 0 0 2px -2px; }
  .pm-l { left: 0; right: auto; top: 50%; bottom: auto; margin: 2px 0 0 -2px; }
  .pm-r .pm-leaf { justify-content: flex-start; align-items: flex-end; transform-origin: 12% 88%; }
  .pm-l .pm-leaf { justify-content: flex-start; align-items: flex-start; transform-origin: 12% 12%; }
  .pm-l .pm-leaf svg { transform: scaleY(-1); }
  .pm-label { display: none; }
}

@keyframes pm-rise   { from { opacity: 0; transform: translateY(28px); } to { opacity: 1; transform: translateY(0); } }
@keyframes pm-zoom   { from { transform: scale(1.12); } to { transform: scale(1); } }
@keyframes pm-fade   { from { opacity: 0; } to { opacity: 1; } }

.pm-enter   { opacity: 0; }
.pm-enter[data-play="true"] { animation: pm-rise 900ms cubic-bezier(.22,1,.36,1) forwards; animation-delay: var(--d, 0ms); }

.pm-hero-bg { transform: scale(1.12); }
.pm-hero-bg[data-play="true"] {
  animation: pm-zoom 2000ms cubic-bezier(.22,1,.36,1) forwards;
}

.pm-fade  { opacity: 0; }
.pm-fade[data-play="true"] { animation: pm-fade 1200ms ease-out forwards; animation-delay: var(--d, 0ms); }

.pm-breathe, .pm-bob { animation: none !important; }
.pm-particle { opacity: .35; box-shadow: 0 0 10px 2px rgba(255,255,255,.2); }
.pm-particle[data-play="true"] { animation: none !important; }

/* Konten hero mengecil mengikuti tinggi layar agar selalu muat dalam satu layar.
   Kelas Tailwind di elemen tetap jadi nilai cadangan bila svh tidak didukung. */
.pm-hero-content { --pm-logo: clamp(3rem, 8svh, 5rem); padding-top: calc(clamp(1rem, 5svh, 6rem) + 5rem); padding-bottom: clamp(4.5rem, 11svh, 7rem); }
.pm-hero-logobox { margin-bottom: clamp(.75rem, 2.4svh, 1.5rem); }
.pm-hero-logo    { width: var(--pm-logo); height: var(--pm-logo); }
.pm-hero-ring    { width: calc(var(--pm-logo) * 2); height: calc(var(--pm-logo) * 2); }
.pm-hero-title   { font-size: clamp(1.75rem, min(7vw, 7.5svh), 3.75rem); }
.pm-hero-text    { font-size: clamp(.9rem, 2.2svh, 1.125rem); margin-top: clamp(.5rem, 1.6svh, 1rem); }
.pm-hero-actions { margin-top: clamp(1rem, 3.5svh, 2rem); }
.pm-hero-stats   { margin-top: clamp(1.25rem, 4.5svh, 3rem); padding-top: clamp(.75rem, 3svh, 2rem); }
@media (max-height: 700px) {
  .pm-hero-actions a { padding-top: .5rem; padding-bottom: .5rem; }
}

/* â”€â”€ Alur 3 langkah: masuk/keluar (dua arah, mengikuti viewport) + idle (hanya saat terlihat) â”€â”€ */
.pm-flow-head > * { opacity: 0; transform: translateY(18px);
  transition: opacity 450ms ease, transform 450ms ease, background-color 300ms, color 300ms; }
.pm-flow[data-show="true"] .pm-flow-head > * { opacity: 1; transform: none;
  transition: opacity 400ms cubic-bezier(.22,1,.36,1), transform 400ms cubic-bezier(.22,1,.36,1), background-color 300ms, color 300ms; }
.pm-flow[data-show="true"] .pm-flow-head > :nth-child(2) { transition-delay: 50ms; }
.pm-flow[data-show="true"] .pm-flow-head > :nth-child(3) { transition-delay: 100ms; }

.pm-step { opacity: 0; transform: translateY(28px) scale(.96); filter: blur(6px);
  transition: opacity 450ms ease, transform 450ms ease, filter 450ms ease; }
.pm-flow[data-show="true"] .pm-step { opacity: 1; transform: none; filter: none;
  transition: opacity 450ms cubic-bezier(.22,1,.36,1) calc(var(--d,0ms) * .5), transform 450ms cubic-bezier(.22,1,.36,1) calc(var(--d,0ms) * .5), filter 450ms cubic-bezier(.22,1,.36,1) calc(var(--d,0ms) * .5); }

.pm-badge { transform: scale(0); transition: transform 450ms ease; }
.pm-flow[data-show="true"] .pm-badge { transform: scale(1); transition: transform 350ms cubic-bezier(.34,1.56,.64,1) calc(var(--d,0ms) * .5 + 100ms); }

.pm-seg { position: absolute; overflow: hidden; border-radius: 999px; background: #e2e8f0; pointer-events: none; left: 15px; width: 2px; top: 2.25rem; bottom: -1.75rem; }
.pm-seg-fill { position: absolute; inset: 0; background: linear-gradient(180deg, #2f7a5a, #6fd0a0); transform: scaleY(0); transform-origin: top; transition: transform 170ms ease; }
.pm-flow[data-show="true"] .pm-seg-fill { transform: scaleY(1); transition: transform 450ms cubic-bezier(.65,0,.35,1) calc(var(--d,0ms) * .5 + 250ms); }

@media (min-width: 768px) {
  .pm-seg { left: 2.25rem; right: -1.25rem; top: -1px; bottom: auto; width: auto; height: 2px; }
  .pm-seg-fill { background: linear-gradient(90deg, #2f7a5a, #6fd0a0); transform: scaleX(0); transform-origin: left; }
  .pm-flow[data-show="true"] .pm-seg-fill { transform: scaleX(1); }
  .pm-seg-dot { background: linear-gradient(90deg, transparent, rgba(255,255,255,.95), transparent) -50% 0 / 30% 100% no-repeat; }
  .pm-flow[data-show="true"] .pm-seg-dot { animation-name: pm-travel-x; }
}





/* Seluruh animasi idle berulang dinonaktifkan; animasi transisi satu kali tetap aktif. */
.pm-badge::after, .pm-seg-dot, .pm-tile, .pm-ico, .pm-ghost, .pm-arrow,
.pm-sim-tile::after, .pm-sim-blob, .pm-bar::after, .pm-gico, .pm-mod-float {
  animation: none !important;
}

/* Hero: keluar saat scroll naik dan masuk saat scroll turun. */
@keyframes pm-out      { from { opacity: 1; transform: none; filter: none; } to { opacity: 0; transform: translateY(-26px); filter: blur(4px); } }
@keyframes pm-fade-out { from { opacity: 1; } to { opacity: 0; } }
@keyframes pm-bg-in    { from { transform: scale(1.14); opacity: .35; } to { transform: scale(1); opacity: 1; } }
@keyframes pm-bg-out   { from { transform: scale(1.03); opacity: 1; } to { transform: scale(1.14); opacity: .35; } }
#home[data-hero="out"] .pm-enter[data-play="true"] { animation: pm-out 700ms cubic-bezier(.4,0,1,1) calc(var(--d,0ms) * .04) forwards; }
#home[data-hero="out"] .pm-fade[data-play="true"]  { animation: pm-fade-out 600ms ease-in forwards; }
#home[data-hero="out"] .pm-hero-bg[data-play="true"] { animation: pm-bg-out 900ms ease-in forwards; }
#home[data-hero="back"] .pm-enter[data-play="true"] { animation: pm-rise 900ms cubic-bezier(.22,1,.36,1) forwards; animation-delay: calc(var(--d,0ms) * .25); }
#home[data-hero="back"] .pm-fade[data-play="true"] { animation: pm-fade 1200ms ease-out forwards; animation-delay: calc(var(--d,0ms) * .25); }
#home[data-hero="back"] .pm-hero-bg[data-play="true"] {
  animation: pm-bg-in 1200ms cubic-bezier(.22,1,.36,1) forwards; }

/* Simulator Hope Tree: masuk/keluar, hitung naik, idle (hanya saat terlihat) */
.pm-sim-in { opacity: 0; transform: translateY(20px); transition: opacity 450ms ease, transform 450ms ease; }
.pm-flow[data-show="true"] .pm-sim-in { opacity: 1; transform: none;
  transition: opacity 450ms cubic-bezier(.22,1,.36,1) calc(var(--i,0) * 70ms), transform 450ms cubic-bezier(.22,1,.36,1) calc(var(--i,0) * 70ms); }
.pm-sim-card { opacity: 0; transform: translateX(28px) scale(.97); transition: opacity 450ms ease, transform 450ms ease; }
.pm-flow[data-show="true"] .pm-sim-card { opacity: 1; transform: none;
  transition: opacity 500ms cubic-bezier(.22,1,.36,1) 120ms, transform 500ms cubic-bezier(.34,1.2,.64,1) 120ms; }



.pm-swap { animation: pm-swap 500ms cubic-bezier(.34,1.56,.64,1) both; }
.pm-swap-text { animation: pm-swap-text 350ms ease-out both; }
@keyframes pm-swap { from { opacity: 0; transform: scale(.6) rotate(-18deg); } to { opacity: 1; transform: none; } }
@keyframes pm-swap-text { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
@keyframes pm-shimmer { 0%, 40% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }

.pm-lvl { position: relative; display: flex; width: 2.25rem; height: 2.25rem; flex: none; align-items: center; justify-content: center;
  border-radius: 999px; border: 1px solid #e2e8f0; background: #fff; color: #cbd5e1;
  transform: translateZ(var(--lz, 0px)) scale(var(--ls, 1));
  transition: background-color 400ms, color 400ms, border-color 400ms, box-shadow 400ms, transform 500ms cubic-bezier(.34,1.56,.64,1); transition-delay: calc(var(--i,0) * 120ms); }
.pm-lvl[data-state="done"] { background: rgba(47,122,90,.12); border-color: rgba(47,122,90,.35); color: #2f7a5a; }
.pm-lvl[data-state="now"] { background: #2f7a5a; border-color: #2f7a5a; color: #fff; --ls: 1.12; }
.pm-lvl-line { position: absolute; inset: 0; background: #2f7a5a; transform: scaleX(0); transform-origin: left;
  transition: transform 600ms cubic-bezier(.65,0,.35,1); transition-delay: calc(var(--i,0) * 120ms); }
.pm-lvl-line[data-on="true"] { transform: scaleX(1); }

.pm-bar { position: relative; overflow: hidden; }
.pm-bar::after { content: ""; position: absolute; inset: 0; background: linear-gradient(90deg, transparent, rgba(255,255,255,.5), transparent); transform: translateX(-100%); }


.pm-range { -webkit-appearance: none; appearance: none; background: transparent; width: 100%; height: 22px; cursor: pointer; }
.pm-range::-webkit-slider-runnable-track { height: 6px; border-radius: 999px; background: linear-gradient(90deg, #7fdcae var(--v,0%), rgba(255,255,255,.35) var(--v,0%)); }
.pm-range::-moz-range-track { height: 6px; border-radius: 999px; background: rgba(255,255,255,.35); }
.pm-range::-moz-range-progress { height: 6px; border-radius: 999px; background: #7fdcae; }
.pm-range::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 22px; height: 22px; margin-top: -8px; border-radius: 50%;
  background: #fff; border: 3px solid #2f7a5a; box-shadow: 0 2px 8px rgba(15,45,33,.3); transition: transform 150ms; }
.pm-range::-moz-range-thumb { width: 16px; height: 16px; border-radius: 50%; background: #fff; border: 3px solid #2f7a5a; box-shadow: 0 2px 8px rgba(15,45,33,.3); transition: transform 150ms; }
.pm-range:hover::-webkit-slider-thumb { transform: scale(1.15); }
.pm-range:active::-webkit-slider-thumb { transform: scale(1.25); }
.pm-range:hover::-moz-range-thumb { transform: scale(1.15); }
.pm-range:focus-visible { outline: 2px solid #fff; outline-offset: 4px; border-radius: 999px; }

/* Game siaga bencana: masuk/keluar bertahap + idle bertema per ikon */
.pm-game-in { opacity: 0; transform: translateY(26px) scale(.96); transition: opacity 450ms ease, transform 450ms ease; }
.pm-flow[data-show="true"] .pm-game-in { opacity: 1; transform: none;
  transition: opacity 450ms cubic-bezier(.22,1,.36,1) calc(var(--i,0) * 80ms + 100ms), transform 450ms cubic-bezier(.34,1.3,.64,1) calc(var(--i,0) * 80ms + 100ms); }



/* Modul pendampingan: tiap kartu dipantau sendiri (penting di HP yang menumpuk vertikal) */
.pm-mod { opacity: 0; transform: translateY(32px) scale(.95); transition: opacity 450ms ease, transform 450ms ease; }
.pm-flow[data-show="true"] .pm-mod { opacity: 1; transform: none;
  transition: opacity 420ms cubic-bezier(.22,1,.36,1) calc(var(--d,0ms) * .5), transform 420ms cubic-bezier(.34,1.3,.64,1) calc(var(--d,0ms) * .5); }


/* Kartu Hope Tree 3D: kartu miring + lingkaran ikon level "muncul" ke depan (Z) saat hover.
   Hover dipasang di .pm-3d (induk tidak ikut miring) supaya tidak berkedip di tepi kartu.
   Semua perantara harus preserve-3d, dan tanpa backdrop-filter agar lapisan tidak diratakan. */
/* Perspektif dipasang lewat JS (useTiltSurface) pada kartu; semua perantara wajib preserve-3d */
.pm-3d-card, .pm-3d-lift, .pm-3d-flat { transform-style: preserve-3d; }
.pm-3d-card { transition: transform 500ms cubic-bezier(.22,1,.36,1), box-shadow 500ms ease; }
.pm-3d-pop, .pm-3d-z1 { transition: transform 500ms cubic-bezier(.22,1,.36,1); }
.pm-3d-z2 { transition: transform 500ms cubic-bezier(.22,1,.36,1), box-shadow 500ms ease; }
@media (hover: hover) and (pointer: fine) {
  .pm-3d:hover .pm-3d-card { box-shadow: 24px 34px 40px -26px rgba(15,45,33,.4); }
  .pm-3d:hover .pm-3d-z1 { transform: translateZ(14px); }
  .pm-3d:hover .pm-3d-z2 { transform: translateZ(28px); box-shadow: 0 12px 18px -8px rgba(15,45,33,.4); }
  .pm-3d:hover .pm-lvl { --lz: 38px; box-shadow: 0 12px 16px -6px rgba(15,45,33,.4); }
  .pm-3d:hover .pm-3d-pop { transform: translateZ(14px); }
}

/* Tombol landing: tampilan biasa + glow tipis yang berputar di tepi.
   Glow ada di .pm-gl-in (bukan di <a>) supaya link meregang kartu (after:absolute) tetap memakai kartu sebagai acuan.
   Sudut berputar lewat @property --pm-ang; browser lama tanpa @property hanya menampilkan glow diam. */
@property --pm-ang { syntax: "<angle>"; inherits: false; initial-value: 0deg; }
@keyframes pm-spin { to { --pm-ang: 360deg; } }
.pm-gl { --gl-c: #2f9e6f; --gl-bg: var(--color-brand-900, #0f2d21); --gl-bg-h: var(--color-brand-950, #0a1f16); --gl-fg: #fff;
  display: inline-flex; vertical-align: middle; border-radius: 999px; text-decoration: none; }
.pm-gl-light { --gl-c: #9be7c4; --gl-bg: #fff; --gl-bg-h: var(--color-brand-50, #ecf7f1); --gl-fg: var(--color-brand-900, #0f2d21); }
.pm-gl-in { position: relative; isolation: isolate; display: flex; flex: 1; border-radius: 999px; }
.pm-gl-in::before, .pm-gl-in::after { content: ""; position: absolute; z-index: -1; border-radius: inherit; pointer-events: none;
  background: conic-gradient(from var(--pm-ang), transparent 0 55%, var(--gl-c) 86%, transparent 100%);
  animation: pm-spin 3.8s linear infinite; }
.pm-gl-in::before { inset: -3px; filter: blur(7px); opacity: .45; }
.pm-gl-in::after  { inset: -1.5px; opacity: .9; }
.pm-gl-face { display: flex; flex: 1; align-items: center; justify-content: center; gap: .5rem; border-radius: 999px; padding: .75rem 1.5rem;
  background: var(--gl-bg); color: var(--gl-fg); transition: background-color 250ms ease; }
.pm-gl-lg { padding: 1rem 2rem; }
.pm-gl:hover .pm-gl-face, .pm-gl:focus-visible .pm-gl-face { background: var(--gl-bg-h); }
.pm-gl-ico { transition: transform 250ms ease; }
.pm-gl:hover .pm-gl-ico { transform: translateX(2px); }

/* Tombol panah (gaya Uiverse "Learn More"): lingkaran berisi panah melebar memenuhi tombol saat hover.
   Posisi relatif ada di .pm-ab-in (bukan .pm-ab) agar link meregang kartu (after:absolute) tetap memakai kartu sebagai acuan. */
.pm-ab { --ab-fill: var(--color-brand-900, #0f2d21); --ab-text: var(--color-brand-900, #0f2d21); --ab-text-hover: #fff; --ab-arrow: #fff;
  display: inline-flex; vertical-align: middle; border-radius: 999px; text-decoration: none; }
.pm-ab-light { --ab-fill: #fff; --ab-text: #fff; --ab-text-hover: var(--color-brand-900, #0f2d21); --ab-arrow: var(--color-brand-900, #0f2d21); }
.pm-ab-in { position: relative; display: flex; flex: 1; align-items: center; justify-content: center; min-height: 3rem; padding: 0 1.25rem 0 3.5rem;
  color: var(--ab-text); white-space: nowrap; transition: color 450ms cubic-bezier(.65,0,.076,1); }
.pm-ab-fill { position: absolute; left: 0; top: 0; bottom: 0; width: 3rem; border-radius: 999px; background: var(--ab-fill);
  transition: width 450ms cubic-bezier(.65,0,.076,1); }
.pm-ab-arrow { position: absolute; top: 0; bottom: 0; left: .625rem; margin: auto 0; width: 1.125rem; height: .125rem; background: none;
  transition: transform 450ms cubic-bezier(.65,0,.076,1), background-color 450ms cubic-bezier(.65,0,.076,1); }
.pm-ab-arrow::before { content: ""; position: absolute; top: -.29rem; right: .0625rem; width: .625rem; height: .625rem;
  border-top: .125rem solid var(--ab-arrow); border-right: .125rem solid var(--ab-arrow); transform: rotate(45deg); }
.pm-ab-text { position: relative; z-index: 1; }
.pm-ab:hover .pm-ab-fill, .pm-ab:focus-visible .pm-ab-fill { width: 100%; }
.pm-ab:hover .pm-ab-arrow, .pm-ab:focus-visible .pm-ab-arrow { background: var(--ab-arrow); transform: translateX(1rem); }
.pm-ab:hover .pm-ab-in, .pm-ab:focus-visible .pm-ab-in { color: var(--ab-text-hover); }

/* Kartu Mood + Food: latar aura "Smokeveil" (3 lapis blend-mode + grain).
   Warna dasar #100e0b dipasang di kartu (bukan body) dan kartu dibuat isolate, karena kartu ini gelap di atas halaman putih:
   blend-mode screen/soft-light harus berpadu dengan dasar gelap kartu, bukan dengan halaman putih.
   Glow hijau statis dan sudah terlihat tanpa hover. Blur sengaja kecil (48-64px) dan alpha gradient cukup tinggi:
   sebelumnya blur 175-252px dengan alpha 0.07-0.25 melunturkan glow sampai hampir sama dengan dasar gelap.
   --mx/--my (0-1) dari JS hanya menggeser lapisan sedikit (paralaks halus). */
.pm-aura { background-color: #100e0b; }
.pm-aura-stage { position: absolute; inset: 0; pointer-events: none; }
.pm-aura-l { position: absolute; inset: -12%; pointer-events: none; will-change: transform; }
.pm-aura-1 { background: radial-gradient(62% 58% at 50% 46%, rgba(50,125,106,0.26) 0%, rgba(34,92,79,0.17) 42%, rgba(20,58,50,0.07) 68%, transparent 88%);
  mix-blend-mode: screen; filter: blur(48px);
  transform: translate3d(calc((var(--mx, .5) - .5) * -60px), calc((var(--my, .5) - .5) * -60px), 0); }
.pm-aura-2 { background: linear-gradient(155deg, transparent 12%, rgba(40,112,96,0.14) 40%, rgba(46,120,104,0.20) 50%, rgba(28,80,70,0.11) 62%, transparent 86%);
  mix-blend-mode: screen; filter: blur(56px);
  transform: translate3d(calc((var(--mx, .5) - .5) * 90px), calc((var(--my, .5) - .5) * 90px), 0); }
.pm-aura-3 { background: linear-gradient(25deg, transparent 25%, rgba(110,175,155,0.14) 50%, transparent 75%);
  mix-blend-mode: soft-light; filter: blur(64px); opacity: .8;
  transform: translate3d(calc((var(--mx, .5) - .5) * -40px), calc((var(--my, .5) - .5) * -40px), 0); }
.pm-aura-spot { position: absolute; inset: 0; pointer-events: none; mix-blend-mode: screen; opacity: 0; transition: opacity 400ms ease;
  background: radial-gradient(circle 300px at calc(var(--mx, .5) * 100%) calc(var(--my, .5) * 100%), rgba(111,208,160,.16), transparent 70%); }
.pm-aura:hover .pm-aura-spot { opacity: 1; }
.pm-aura-grain { position: absolute; inset: 0; pointer-events: none; mix-blend-mode: overlay; opacity: .85; }

/* Kartu CTA: latar aura "Horizon" (pola beda dari Smokeveil). Statis, tanpa JS.
   Dua cahaya elips di sudut berlawanan (kiri-bawah dan kanan-atas) + kipas cahaya konik dari kanan-bawah, lalu grain.
   Dasar tetap bg-brand-900 dan kartu isolate, supaya screen berpadu dengan dasar hijau gelap, bukan dengan halaman putih. */
.pm-hz-stage { position: absolute; inset: 0; pointer-events: none; }
.pm-hz-l { position: absolute; inset: -10%; pointer-events: none; will-change: transform; }
.pm-hz-1 { background: radial-gradient(55% 90% at 12% 105%, rgba(70,160,130,0.40) 0%, rgba(40,110,90,0.22) 45%, transparent 80%);
  mix-blend-mode: screen; filter: blur(40px);
  transform: translate3d(calc((var(--mx, .5) - .5) * 120px), calc((var(--my, .5) - .5) * 30px), 0); }
.pm-hz-2 { background: radial-gradient(38% 70% at 94% -8%, rgba(60,150,125,0.34) 0%, rgba(30,95,80,0.16) 50%, transparent 82%);
  mix-blend-mode: screen; filter: blur(44px);
  transform: translate3d(calc((var(--mx, .5) - .5) * -90px), calc((var(--my, .5) - .5) * -36px), 0); }
.pm-hz-3 { background: conic-gradient(from 215deg at 80% 125%, transparent 0deg, rgba(120,200,170,0.28) 22deg, transparent 48deg);
  mix-blend-mode: screen; filter: blur(50px);
  transform: translate3d(calc((var(--mx, .5) - .5) * -60px), calc((var(--my, .5) - .5) * 24px), 0); }
.pm-hz-spot { position: absolute; inset: 0; pointer-events: none; mix-blend-mode: screen; opacity: 0; transition: opacity 400ms ease;
  background: radial-gradient(circle 260px at calc(var(--mx, .5) * 100%) calc(var(--my, .5) * 100%), rgba(120,210,175,.14), transparent 70%); }
.pm-hz:hover .pm-hz-spot { opacity: 1; }
.pm-hz-grain { position: absolute; inset: 0; pointer-events: none; mix-blend-mode: overlay; opacity: .85; }

/* Animasi section Mood + Food ke bawah. In/out: data-show dari useInView (pm-flow) + pm-sim-in / pm-pop.
   Idle: loop pelan lewat properti translate/scale/rotate terpisah (tidak bentrok dengan transform paralaks mouse),
   dan hanya jalan saat section tampil (play-state di bawah). */
.pm-pop { opacity: 0; transform: translateY(28px) scale(.965); transition: opacity 450ms ease, transform 450ms ease; }
.pm-flow[data-show="true"] .pm-pop { opacity: 1; transform: none;
  transition: opacity 700ms cubic-bezier(.22,1,.36,1), transform 800ms cubic-bezier(.22,1,.36,1); }

@keyframes pm-drift-a { 0%, 100% { translate: 0 0; scale: 1; } 50% { translate: 4% -5%; scale: 1.08; } }
@keyframes pm-drift-b { 0%, 100% { translate: 0 0; scale: 1; } 50% { translate: -5% 4%; scale: 1.1; } }
@keyframes pm-drift-c { 0%, 100% { translate: 0 0; } 50% { translate: 5% 3%; } }
@keyframes pm-drift-h1 { 0%, 100% { translate: 0 0; scale: 1; } 50% { translate: 5% -3%; scale: 1.1; } }
@keyframes pm-drift-h2 { 0%, 100% { translate: 0 0; scale: 1; } 50% { translate: -4% 3%; scale: 1.12; } }
@keyframes pm-fan { 0%, 100% { rotate: -3deg; } 50% { rotate: 4deg; } }
@keyframes pm-idle-bob { 0%, 100% { translate: 0 0; } 50% { translate: 0 -4px; } }
@keyframes pm-sweep { 0% { background-position: -60% 0; } 55%, 100% { background-position: 160% 0; } }

.pm-aura-1 { animation: pm-drift-a 19s ease-in-out infinite; }
.pm-aura-2 { animation: pm-drift-b 23s ease-in-out infinite; }
.pm-aura-3 { animation: pm-drift-c 29s ease-in-out infinite; }
.pm-hz-1 { animation: pm-drift-h1 17s ease-in-out infinite; }
.pm-hz-2 { animation: pm-drift-h2 21s ease-in-out infinite; }
.pm-hz-3 { transform-origin: 80% 125%; animation: pm-fan 13s ease-in-out infinite; }

.pm-bowl { animation: pm-idle-bob 4.4s ease-in-out infinite; }
.pm-float { animation: pm-idle-bob 5s ease-in-out infinite; animation-delay: calc(var(--i, 0) * -1.3s); }

.pm-nut { position: relative; }
.pm-nut::after { content: ""; position: absolute; left: 0; right: 0; top: -1px; height: 1px; pointer-events: none;
  background: linear-gradient(90deg, transparent, rgba(160,240,200,.95), transparent) no-repeat;
  background-size: 38% 100%; background-position: -60% 0;
  animation: pm-sweep 5.5s ease-in-out infinite; animation-delay: calc(var(--i, 0) * -1.7s); }

/* Stabilo frasa kunci "digambar" dari kiri saat kartu tampil, ditarik balik saat keluar */
/* background-color transparent: <mark> punya kuning bawaan browser yang tadinya kelihatan saat gradient masih 0% */
.pm-mark { background-color: transparent; background-size: 0% 100%; background-position: left center; transition: background-size 280ms ease; }
.pm-flow[data-show="true"] .pm-mark { background-size: 100% 100%;
  transition: background-size 850ms cubic-bezier(.65,0,.35,1) calc(var(--i, 0) * 70ms + 550ms); }

/* Idle hanya jalan saat section tampil */
.pm-flow :is(.pm-aura-l, .pm-hz-l, .pm-bowl, .pm-float), .pm-flow .pm-nut::after { animation-play-state: paused; }
.pm-flow[data-show="true"] :is(.pm-aura-l, .pm-hz-l, .pm-bowl, .pm-float), .pm-flow[data-show="true"] .pm-nut::after { animation-play-state: running; }

@media (prefers-reduced-motion: reduce) {
  .pm-logo-in, .pm-letter { animation: none !important; opacity: 1; }
  .pm-ring    { animation: none !important; opacity: 0; }
  .pm-enter   { animation: none !important; opacity: 1; }
  #home[data-hero] .pm-enter, #home[data-hero] .pm-fade, #home[data-hero] .pm-hero-bg { animation: none !important; opacity: 1; }
  .pm-hero-bg { animation: none !important; transform: none; }
  .pm-fade { animation: none !important; opacity: 1; }
  .pm-breathe { animation: none; opacity: .25; transform: none; }
  .pm-bob { animation: none; }
  .pm-tip::after { animation: none; opacity: 0; }
  .pm-tip, .pm-leaf, .pm-label { transition: none; }
  .pm-particle { animation: none !important; opacity: 0; }
  .pm-step, .pm-flow-head > * { opacity: 1 !important; transform: none !important; filter: none !important; transition: none !important; }
  .pm-badge, .pm-seg-fill { transform: none !important; transition: none !important; }
  .pm-badge::after, .pm-seg-dot, .pm-tile, .pm-ico, .pm-ghost, .pm-arrow { animation: none !important; }
  .pm-mod { opacity: 1 !important; transform: none !important; transition: none !important; }
  .pm-mod-float { animation: none !important; }
  .pm-game-in { opacity: 1 !important; transform: none !important; transition: none !important; }
  .pm-gico { animation: none !important; }
  .pm-sim-in, .pm-sim-card { opacity: 1 !important; transform: none !important; transition: none !important; }
  .pm-lvl, .pm-lvl-line, .pm-range::-webkit-slider-thumb { transition: none !important; }
  .pm-sim-tile::after, .pm-sim-blob, .pm-swap, .pm-swap-text, .pm-lvl::after, .pm-bar::after { animation: none !important; }
  .pm-sim-blob { opacity: .25; }
  .pm-3d-card, .pm-3d-pop, .pm-3d-z1, .pm-3d-z2 { transition: none !important; transform: none !important; }
  .pm-aura-l { transform: none !important; }
  .pm-aura-spot { display: none; }
  .pm-hz-l { transform: none !important; }
  .pm-hz-spot { display: none; }
  .pm-pop { opacity: 1 !important; transform: none !important; transition: none !important; }
  .pm-aura-l, .pm-hz-l, .pm-bowl, .pm-float, .pm-nut::after { animation: none !important; }
  .pm-nut::after { display: none; }
  .pm-mark { background-size: 100% 100% !important; transition: none !important; }
  .pm-ab-in, .pm-ab-fill, .pm-ab-arrow { transition: none !important; }
  .pm-gl-in::before, .pm-gl-in::after { animation: none !important; opacity: 0; }
  .pm-gl-face, .pm-gl-ico { transition: none !important; }
  .pm-gl:hover .pm-gl-ico { transform: none; }
}
`;

/* â”€â”€ Scrollbar "Pohon Harapan" â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   Batang (vertikal di desktop, horizontal di bawah layar pada HP & tablet) tumbuh mengikuti scroll; tiap bagian halaman punya daun yang
   mekar saat dilewati. Bisa diseret, dan daunnya bisa diklik untuk loncat ke bagian itu.
   Posisi daun dibagi rata; kemajuan di antara dua daun mengikuti jarak scroll nyata. */
const TREE_SECTIONS = [
  { id: "home", label: "Beranda" },
  { id: "programs", label: "Modul" },
  { id: "how-it-works", label: "Alur pemulihan" },
  { id: "calculator", label: "Simulasi Hope Tree" },
  { id: "game-showcase", label: "Game & Mood" },
  { id: "stories", label: "Suara lapangan" },
];

function HopeScrollbar({ visible }: { visible: boolean }) {
  const n = TREE_SECTIONS.length;
  const trackRef = useRef<HTMLElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const anchors = useRef<number[]>([]); // posisi scroll tiap bagian + akhir halaman (n + 1 nilai)
  const dragging = useRef(false);
  const reachedRef = useRef(1);
  const [reached, setReached] = useState(1); // jumlah daun yang sudah mekar

  useEffect(() => {
    let raf = 0;

    const measure = () => {
      const maxScroll = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight,
      );
      const A: number[] = [];
      TREE_SECTIONS.forEach((sec, i) => {
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
    const ro = new ResizeObserver(remeasure); // tinggi halaman berubah (font, gambar, hero pas layar)
    ro.observe(document.body);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", remeasure);
      ro.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [n]);

  const scrollToPointer = (clientX: number, clientY: number) => {
    const track = trackRef.current;
    const A = anchors.current;
    if (!track || A.length < n + 1) return;
    const rect = track.getBoundingClientRect();
    // >= 1024px batang vertikal, di bawahnya horizontal
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
      className="pm-tree"
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

      {TREE_SECTIONS.map((sec, i) => (
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
              <Icon name="leaf" className="w-6 h-6" strokeWidth={1.8} />
            </span>
          </button>
          <span className="pm-label" aria-hidden="true">
            {sec.label}
          </span>
        </div>
      ))}

      <div ref={tipRef} className="pm-tip" aria-hidden="true">
        <Icon name="sprout" className="w-3.5 h-3.5" strokeWidth={2.2} />
      </div>
    </nav>
  );
}

/* Angka naik/turun halus menuju target; kembali ke 0 saat tidak aktif */
function useCountUp(target: number, active: boolean, ms = 800) {
  const [v, setV] = useState(0);
  const cur = useRef(0);
  useEffect(() => {
    const to = active ? target : 0;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      cur.current = to;
      const id = requestAnimationFrame(() => setV(to));
      return () => cancelAnimationFrame(id);
    }
    const from = cur.current;
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / ms);
      cur.current = Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3)));
      setV(cur.current);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, active, ms]);
  return v;
}

/* Masuk hanya saat scroll turun; keluar hanya saat scroll naik. */
function useInView<T extends HTMLElement>(threshold = 0.2) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      const id = requestAnimationFrame(() => setInView(true));
      return () => cancelAnimationFrame(id);
    }

    let lastY = window.scrollY;
    let initialized = false;

    const io = new IntersectionObserver(
      ([entry]) => {
        const currentY = window.scrollY;
        const direction =
          currentY > lastY ? "down" : currentY < lastY ? "up" : "still";
        lastY = currentY;

        if (!initialized) {
          initialized = true;
          if (entry.isIntersecting) setInView(true);
          return;
        }

        if (direction === "down" && entry.isIntersecting) setInView(true);
        if (direction === "up" && !entry.isIntersecting) setInView(false);
      },
      {
        threshold,
        rootMargin: "-8% 0px -8% 0px",
      },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  return [ref, inView] as const;
}

function StoryQuote({
  quote,
  highlight,
}: {
  quote: string;
  highlight: string;
}) {
  // Tanda kutip dilepas dari teks (diganti ikon kutip di kartu); frasa kunci diberi stabilo hijau tipis
  const text = quote.replace(/^[â€œ"]|[â€"]$/g, "");
  const at = text.indexOf(highlight);
  if (at === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <mark className="pm-mark rounded bg-gradient-to-r from-brand-100/60 to-brand-100/60 bg-no-repeat px-1 font-medium text-slate-900 box-decoration-clone">
        {highlight}
      </mark>
      {text.slice(at + highlight.length)}
    </>
  );
}

function ModuleItem({ d, children }: { d: number; children: React.ReactNode }) {
  const [ref, show] = useInView<HTMLLIElement>(0.15);
  return (
    <li ref={ref} data-show={show} className="pm-flow" style={delay(d)}>
      <div className="pm-mod h-full">{children}</div>
    </li>
  );
}

/* Mouse-track untuk kartu beraura: mengisi --mx/--my (0-1) pada elemen stage dengan easing,
   langsung ke style (tanpa re-render React). Nonaktif di layar sentuh dan saat prefers-reduced-motion. */
function useAuraPointer(
  ref: React.RefObject<HTMLElement | null>,
  stageSelector: string,
) {
  useEffect(() => {
    const el = ref.current;
    const stage = el?.querySelector<HTMLElement>(stageSelector);
    if (!el || !stage) return;
    if (
      !window.matchMedia("(hover: hover) and (pointer: fine)").matches ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;

    let raf = 0;
    let tx = 0.5,
      ty = 0.5; // target
    let cx = 0.5,
      cy = 0.5; // posisi tampil (dihaluskan)

    const loop = () => {
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      stage.style.setProperty("--mx", cx.toFixed(4));
      stage.style.setProperty("--my", cy.toFixed(4));
      raf =
        Math.abs(tx - cx) > 0.001 || Math.abs(ty - cy) > 0.001
          ? requestAnimationFrame(loop)
          : 0;
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(loop);
    };
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      tx = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
      ty = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
      kick();
    };
    const onLeave = () => {
      tx = 0.5;
      ty = 0.5;
      kick();
    };

    el.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [ref, stageSelector]);
}

export default function LandingPage({
  transitionPhase = "idle",
  onHeroReady,
}: {
  transitionPhase?: TransitionPhase;
  onHeroReady?: () => void;
}) {
  const { culture } = useCulture();
  const heroTheme = HERO_THEMES[String(culture)] ?? HERO_THEMES.aceh;
  const [flowRef, flowShow] = useInView<HTMLDivElement>();
  const [modHeadRef, modHeadShow] = useInView<HTMLDivElement>();
  const [storyRef, storyShow] = useInView<HTMLDivElement>(0.15);
  const [moodInRef, moodShow] = useInView<HTMLDivElement>(0.15);
  const [ctaInRef, ctaShow] = useInView<HTMLDivElement>(0.15);
  const [footRef, footShow] = useInView<HTMLElement>(0.15);

  const heroLogoRef = useRef<HTMLImageElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const [heroPhase, setHeroPhase] = useState<"init" | "out" | "back">("init");
  const play = transitionPhase === "exiting" || transitionPhase === "idle";

  // Preload gambar hero agar siap sebelum curtain transisi terbuka
  useEffect(() => {
    if (!onHeroReady) return;
    const img = new Image();
    img.onload = img.onerror = () => onHeroReady();
    img.src = heroTheme.src;
  }, [heroTheme.src, onHeroReady]);

  // Hero keluar saat hampir tidak terlihat (di-reset di luar layar), lalu masuk lagi
  // dari awal setiap kali kembali terlihat, baik dari scroll naik maupun turun/anchor.
  // Dua ambang (hysteresis) mencegah status bolak-balik di sekitar batas.
  useEffect(() => {
    const el = heroRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    let initialized = false;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!initialized) {
          initialized = true; // callback pertama hanya melaporkan kondisi awal
          return;
        }
        const ratio = entry.intersectionRatio;
        if (ratio < 0.15) {
          setHeroPhase("out");
        } else if (ratio >= 0.35) {
          setHeroPhase((current) => (current === "out" ? "back" : current));
        }
      },
      { threshold: [0, 0.15, 0.35] },
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Hero setinggi tepat satu layar: tinggi viewport dikurangi apa pun yang ada di atas hero (mis. navbar)
  useEffect(() => {
    const fit = () => {
      const el = heroRef.current;
      if (!el) return;
      const offsetTop = el.getBoundingClientRect().top + window.scrollY;
      const top = Math.round(offsetTop);
      el.style.height = `calc(100vh - ${top}px)`; // fallback browser lama
      el.style.height = `calc(100svh - ${top}px)`; // diabaikan jika svh tidak didukung
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  // Simulator Hope Tree (nilai awal sengaja di tengah rentang: 40 Ã— 3 Ã— 12 = 1.440 XP)
  const [cause, setCause] = useState<number>(40);
  const [frequencyInput, setFrequencyInput] = useState<string>("3");
  const [duration, setDuration] = useState<number>(12);

  const [emailSubscribed, setEmailSubscribed] = useState(false);
  const [emailInput, setEmailInput] = useState("");

  const frequency = Math.min(14, Math.max(1, Number(frequencyInput) || 1));
  const totalXP = cause * frequency * duration;
  const levelIdx = LEVELS.reduce(
    (acc, l, i) => (totalXP >= l.min ? i : acc),
    0,
  );
  const level = LEVELS[levelIdx];
  const [simRef, simShow] = useInView<HTMLDivElement>(0.15);
  const xpShown = useCountUp(totalXP, simShow);
  const [gameRef, gameShow] = useInView<HTMLDivElement>(0.15);

  // Mouse-track 3D kartu Hope Tree: pembungkus memicu, kartu yang miring
  const tiltRef = useRef<HTMLDivElement>(null);
  const tilt = useTiltSurface(tiltRef, {
    perspective: 1100,
    rotate: 6,
    scale: 1.015,
  });
  const canTilt = () =>
    window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Mouse-track kartu aura (Mood + Food dan CTA): isi --mx/--my (0-1) di stage, lihat useAuraPointer
  const moodRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  useAuraPointer(moodRef, ".pm-aura-stage");
  useAuraPointer(ctaRef, ".pm-hz-stage");
  const durIdx = Math.max(
    0,
    DURATIONS.findIndex((d) => d.v === duration),
  );
  const nextLevel = LEVELS[levelIdx + 1];
  const progress =
    level.next === null
      ? 100
      : Math.round(((totalXP - level.min) / (level.next - level.min)) * 100);
  const progressText = nextLevel
    ? `${progress}% menuju ${nextLevel.name.split(" â€¢ ")[0]}`
    : "Level maksimal tercapai";

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInput.trim()) {
      setEmailSubscribed(true);
    }
  };

  return (
    <div className="w-full bg-white text-slate-800 selection:bg-brand-500 selection:text-white">
      <style>{SPLASH_CSS}</style>
      <HopeScrollbar visible={transitionPhase === "idle"} />

      {/* BEGIN: Hero */}
      <section
        id="home"
        ref={heroRef}
        data-hero={heroPhase}
        className="relative min-h-[28rem] flex items-center justify-center overflow-hidden bg-slate-900"
      >
        {/* Background Image */}
        <div
          className="pm-hero-bg absolute inset-0 bg-cover bg-center bg-no-outset"
          data-play={play}
          style={{ backgroundImage: `url(${heroTheme.src})` }}
          role="img"
          aria-label={heroTheme.alt}
        />
        {/* Scrim / Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/60 to-slate-900/75" />

        {/* Partikel melayang pelan (kunang-kunang) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[1]"
        >
          {PARTICLES.map((pt, i) => (
            <span
              key={i}
              className={`pm-particle absolute rounded-full ${pt.tint}`}
              data-play={play}
              style={
                {
                  left: pt.left,
                  top: pt.top,
                  width: pt.size,
                  height: pt.size,
                  "--dur": `${pt.dur}s`,
                  "--d": `${1800 + pt.del}ms`,
                  "--dx": `${pt.dx}px`,
                  "--o": pt.o,
                } as React.CSSProperties
              }
            />
          ))}
        </div>

        <div className="pm-hero-content relative z-10 max-w-4xl mx-auto px-6 py-20 sm:py-24 text-center text-white">
          <div className="pm-hero-logobox relative flex justify-center mb-6">
            {/* Cincin napas: mengembang & mengempis pelan, merujuk ke modul Breathing Calm */}
            <div
              aria-hidden="true"
              className="pm-fade pointer-events-none absolute inset-0 flex items-center justify-center"
              data-play={play}
              style={delay(500)}
            >
              <span className="pm-breathe pm-hero-ring block w-32 h-32 sm:w-40 sm:h-40 rounded-full border border-white/40 bg-white/[0.04]" />
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={heroLogoRef}
              src="/permata-logo.webp"
              alt="Logo PERMATA"
              width={64}
              height={64}
              className="pm-hero-logo relative w-16 h-16 sm:w-20 sm:h-20 brightness-0 invert object-contain drop-shadow-[0_2px_12px_rgba(255,255,255,0.2)] transition-opacity duration-700"
              style={{ opacity: play ? 1 : 0 }}
            />
          </div>
          <h1 className="pm-hero-title mt-14 text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15] text-balance">
            {HERO_TITLE_WORDS.map((w, i) => (
              <React.Fragment key={`${w}-${i}`}>
                <span
                  className="pm-enter inline-block"
                  data-play={play}
                  style={delay(550 + i * 70)}
                >
                  {w}
                </span>{" "}
              </React.Fragment>
            ))}
          </h1>

          <p
            className="pm-enter pm-hero-text mt-4 max-w-2xl mx-auto text-base sm:text-lg text-white/80 leading-relaxed"
            data-play={play}
            style={delay(1000)}
          >
            Platform pendampingan psikososial berbasis kearifan budaya lokal
            untuk mengembalikan harapan dan keceriaan anak.
          </p>

          <div
            className="pm-enter pm-hero-actions mt-8 flex flex-wrap justify-center gap-3"
            data-play={play}
            style={delay(1150)}
          >
            <GlowLink
              href="#programs"
              variant="light"
              className="text-sm sm:text-base"
            >
              Mulai Pemulihan
            </GlowLink>
            <a
              href="#calculator"
              className={`inline-flex items-center gap-2 border border-white/50 hover:bg-white/10 text-white font-semibold text-sm sm:text-base px-6 py-3 rounded-full transition-colors ${focusRing}`}
            >
              Simulasi Hope Tree
            </a>
          </div>

          <ul
            className="pm-fade pm-hero-stats mt-12 pt-8 border-t border-white/20 grid grid-cols-2 sm:grid-cols-4 gap-6"
            data-play={play}
            style={delay(1250)}
          >
            {HERO_STATS.map((st, i) => (
              <li
                key={st.label}
                className="pm-enter"
                data-play={play}
                style={delay(1300 + i * 90)}
              >
                <p className="flex items-center justify-center gap-1.5 text-base sm:text-lg font-semibold">
                  <Icon name={st.icon} className="w-4 h-4" />
                  {st.value}
                </p>
                <p className="text-sm text-white/75">{st.label}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* Petunjuk gulir */}
        <a
          href="#programs"
          className={`pm-fade absolute bottom-6 left-1/2 z-10 -translate-x-1/2 hidden lg:flex flex-col items-center text-sm text-white/70 hover:text-white transition-colors ${focusRing}`}
          data-play={play}
          style={delay(1900)}
        >
          Gulir
          <span className="pm-bob block">
            <Icon name="chevron" className="w-6 h-6" />
          </span>
        </a>
      </section>
      {/* END: Hero */}

      {/* BEGIN: Modul */}
      <section
        className="py-20 bg-white border-y border-slate-100"
        id="programs"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div
            ref={modHeadRef}
            data-show={modHeadShow}
            className="pm-flow max-w-2xl mb-12"
          >
            <div className="pm-flow-head">
              <h2 className="text-3xl sm:text-4xl font-semibold text-slate-900 tracking-tight">
                Empat modul pendampingan resiliensi anak
              </h2>
              <p className="mt-3 text-base text-slate-600 leading-relaxed">
                Gabungan psikologi klinis, permainan kesiapsiagaan bencana, dan
                kearifan lokal yang ramah anak.
              </p>
            </div>
          </div>

          <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {MODULES.map((m, i) => (
              <ModuleItem key={m.title} d={i * 120}>
                <div className="group relative flex h-full flex-col rounded-[1.75rem] bg-white p-3 shadow-[0_10px_30px_-14px_rgba(15,45,33,0.28)] ring-1 ring-slate-900/5 transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_44px_-16px_rgba(15,45,33,0.35)] focus-within:ring-2 focus-within:ring-brand-500 motion-reduce:transition-none motion-reduce:hover:translate-y-0">
                  {/* Ilustrasi masuk ke dalam bingkai putih kartu */}
                  <div className="relative flex aspect-square items-end justify-center overflow-hidden rounded-[1.25rem] bg-white">
                    {m.image ? (
                      <span className="pm-mod-float flex h-full w-full items-end justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={m.image.src}
                          alt={m.image.alt}
                          loading="lazy"
                          decoding="async"
                          className="relative h-[92%] w-auto origin-bottom object-contain transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                        />
                      </span>
                    ) : (
                      <span className="pm-mod-float relative flex h-full w-full items-center justify-center">
                        <span
                          className={`flex h-20 w-20 items-center justify-center rounded-full ${m.iconBoxClass}`}
                        >
                          <Icon
                            name={m.icon}
                            className="w-9 h-9"
                            strokeWidth={1.5}
                          />
                        </span>
                      </span>
                    )}

                    {/* Ikon kotak membulat pengganti nomor */}
                    <span
                      className={`pm-ico absolute left-3 top-3 flex h-11 w-11 items-center justify-center rounded-2xl shadow-xs ${m.iconBoxClass}`}
                      aria-hidden="true"
                    >
                      <Icon
                        name={m.icon}
                        className="w-5 h-5"
                        strokeWidth={1.9}
                      />
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col px-2 pb-1 pt-4">
                    <h3 className="text-xl font-semibold tracking-tight text-slate-900">
                      {m.title}
                    </h3>
                    <p className="mt-0.5 text-sm text-slate-500">{m.tag}</p>
                    <p className="mt-3 mb-5 text-sm text-slate-600 leading-relaxed">
                      {m.desc}
                    </p>

                    {/* Link meregang: seluruh kartu bisa diklik, fokus keyboard tetap di satu link */}
                    <ArrowLink
                      href={m.href}
                      className="mt-auto w-full text-sm after:absolute after:inset-0 after:rounded-[1.75rem]"
                    >
                      {m.cta}
                    </ArrowLink>
                  </div>
                </div>
              </ModuleItem>
            ))}
          </ul>
        </div>
      </section>
      {/* END: Modul */}

      {/* BEGIN: Alur */}
      <section className="py-20 bg-white" id="how-it-works">
        <div
          ref={flowRef}
          data-show={flowShow}
          className="pm-flow max-w-7xl mx-auto px-6"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="pm-flow-head lg:col-span-4 space-y-4">
              <h2 className="text-3xl sm:text-4xl font-semibold text-slate-900 tracking-tight leading-tight">
                Tiga langkah pemulihan dan resiliensi
              </h2>
              <p className="text-base text-slate-600 leading-relaxed">
                Dari mengenali tanda trauma awal, menenangkan emosi, hingga
                membentuk karakter anak yang tangguh dan berakar pada budaya.
              </p>
              <ArrowLink href="#calculator" className="text-sm">
                Coba simulasi Hope Tree
              </ArrowLink>
            </div>

            <ol className="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 md:pt-4">
              {STEPS.map((s, i) => (
                <li
                  key={s.title}
                  className="pm-step relative pl-12 md:pl-0 md:pt-8"
                  style={delay(200 + i * 350)}
                >
                  {i < STEPS.length - 1 && (
                    <span className="pm-seg" aria-hidden="true">
                      <span className="pm-seg-fill" />
                      <span className="pm-seg-dot" />
                    </span>
                  )}
                  <span className="pm-badge absolute left-0 top-0 md:-top-4 inline-flex w-8 h-8 items-center justify-center rounded-full bg-brand-700 text-white text-sm font-semibold ring-4 ring-white">
                    {i + 1}
                  </span>
                  <div className="group relative h-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 transition duration-300 hover:-translate-y-1 hover:border-brand-300 hover:shadow-[0_18px_36px_-16px_rgba(15,45,33,0.3)] motion-reduce:transition-none motion-reduce:hover:translate-y-0">
                    <span
                      aria-hidden="true"
                      className="pm-ghost pointer-events-none absolute right-4 top-2 select-none text-6xl font-bold leading-none text-brand-100/70"
                    >
                      0{i + 1}
                    </span>
                    <span className="pm-tile relative mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-brand-100 bg-brand-50 text-brand-700 transition-colors duration-300 group-hover:border-brand-700 group-hover:bg-brand-700 group-hover:text-white">
                      <Icon name={STEP_ICONS[i]} className="pm-ico w-5 h-5" />
                    </span>
                    <h3 className="relative text-lg font-semibold text-slate-900">
                      {s.title}
                    </h3>
                    <p className="relative mt-2 text-sm text-slate-600 leading-relaxed">
                      {s.desc}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>
      {/* END: Alur */}

      {/* BEGIN: Simulator Hope Tree */}
      <section
        className="py-20 bg-white border-t border-slate-100"
        id="calculator"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div
            ref={simRef}
            data-show={simShow}
            className="pm-flow relative overflow-hidden rounded-2xl border border-brand-100 bg-cover bg-center p-8 sm:p-12"
            style={{ backgroundImage: `url(${hutanPinus.src})` }}
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-gradient-to-r from-brand-950/70 via-brand-950/45 to-brand-950/25"
            />
            {/* Partikel WebGL (React Bits) di atas hutan; muncul perlahan saat section terlihat */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                opacity: simShow ? 1 : 0,
                transition: "opacity 900ms ease",
              }}
            >
              <Particles
                particleCount={140}
                particleSpread={10}
                speed={0.08}
                particleColors={["#ffffff", "#bfe9d2"]}
                particleBaseSize={90}
                sizeRandomness={1}
                glow={0.6}
                twinkle={0.4}
                hoverEffect="repel"
                particleHoverFactor={1}
                clickBurst={false}
                intro={false}
                opacity={0.9}
              />
            </div>
            <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-6 space-y-6">
                <div className="pm-sim-in" style={idx(0)}>
                  <h2 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight">
                    Simulasi pertumbuhan Hope Tree
                  </h2>
                  <p className="mt-3 text-base text-white/80 leading-relaxed">
                    Hitung perkiraan XP resiliensi anak dari konsistensi
                    aktivitas harian, latihan napas, dan refleksi.
                  </p>
                </div>

                <form
                  className="space-y-5"
                  onSubmit={(e) => e.preventDefault()}
                >
                  <div className="pm-sim-in" style={idx(1)}>
                    <label
                      className="block text-sm font-medium text-white mb-1.5"
                      htmlFor="cause-select"
                    >
                      Fokus modul harian
                    </label>
                    <select
                      className="w-full [color-scheme:dark] bg-white/10 border border-white/30 rounded-xl text-base py-3 px-4 text-white backdrop-blur-sm transition-shadow hover:border-white/60 focus:ring-2 focus:ring-white/70 focus:border-white"
                      id="cause-select"
                      value={cause}
                      onChange={(e) => setCause(Number(e.target.value))}
                    >
                      <option value="50">
                        Jurnal Hikmah Harian (+50 XP / sesi)
                      </option>
                      <option value="30">
                        Latihan Napas Tenang 4-7-8 (+30 XP / sesi)
                      </option>
                      <option value="40">
                        Refleksi Budaya &amp; Cerita (+40 XP / sesi)
                      </option>
                      <option value="60">
                        Simulasi Game Tas Siaga Bencana (+60 XP / sesi)
                      </option>
                    </select>
                  </div>

                  <div className="pm-sim-in" style={idx(2)}>
                    <div className="mb-1.5 flex items-center justify-between gap-3">
                      <label
                        className="text-sm font-medium text-white"
                        htmlFor="frequency-input"
                      >
                        Frekuensi mingguan (1â€“14 sesi)
                      </label>
                      <output
                        htmlFor="frequency-input"
                        className="rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold tabular-nums text-brand-900"
                      >
                        {frequency}Ã— / minggu
                      </output>
                    </div>
                    <input
                      className="pm-range"
                      id="frequency-input"
                      type="range"
                      min={1}
                      max={14}
                      step={1}
                      value={frequency}
                      onChange={(e) => setFrequencyInput(e.target.value)}
                      style={
                        {
                          "--v": `${((frequency - 1) / 13) * 100}%`,
                        } as React.CSSProperties
                      }
                    />
                    <div
                      className="mt-1 flex justify-between text-xs text-white/70"
                      aria-hidden="true"
                    >
                      <span>1</span>
                      <span>14</span>
                    </div>
                  </div>

                  <fieldset className="pm-sim-in" style={idx(3)}>
                    <legend className="mb-1.5 block text-sm font-medium text-white">
                      Durasi program
                    </legend>
                    <div className="relative grid grid-cols-3 rounded-xl border border-white/30 bg-white/10 p-1 backdrop-blur-sm">
                      <span
                        aria-hidden="true"
                        className="absolute inset-y-1 left-1 w-[calc((100%-0.5rem)/3)] rounded-lg bg-white shadow-sm transition-transform duration-300 ease-[cubic-bezier(.34,1.3,.64,1)] motion-reduce:transition-none"
                        style={{ transform: `translateX(${durIdx * 100}%)` }}
                      />
                      {DURATIONS.map((d) => (
                        <label
                          key={d.v}
                          className="relative z-10 cursor-pointer"
                        >
                          <input
                            type="radio"
                            name="duration"
                            value={d.v}
                            checked={duration === d.v}
                            onChange={() => setDuration(d.v)}
                            className="peer sr-only"
                          />
                          <span
                            className={`block rounded-lg px-2 py-2 text-center transition-colors duration-300 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-white ${
                              duration === d.v
                                ? "text-brand-900"
                                : "text-white/85 hover:text-white"
                            }`}
                          >
                            <span className="block text-sm font-semibold">
                              {d.label}
                            </span>
                            <span
                              className={`block text-xs ${duration === d.v ? "text-brand-700" : "text-white/65"}`}
                            >
                              {d.sub}
                            </span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                </form>
              </div>

              <div className="pm-sim-card lg:col-span-6">
                <div
                  className="pm-3d"
                  onMouseMove={(e) => {
                    if (canTilt()) tilt.onMouseMove(e);
                  }}
                  onMouseLeave={tilt.onMouseLeave}
                >
                  <div
                    ref={tiltRef}
                    className="pm-3d-card rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_-24px_rgba(15,45,33,0.35)] sm:p-8"
                  >
                    <p className="sr-only" aria-live="polite">
                      Estimasi {totalXP.toLocaleString("id-ID")} XP,{" "}
                      {level.name}
                    </p>

                    <div className="pm-3d-lift flex items-center justify-between gap-4 border-b border-slate-100 pb-5">
                      <div className="pm-3d-pop">
                        <p className="text-sm text-slate-500">
                          Estimasi akumulasi resiliensi
                        </p>
                        <p
                          aria-hidden="true"
                          className="mt-1 text-4xl font-semibold tabular-nums text-brand-900 sm:text-5xl"
                          id="xp-result"
                        >
                          {xpShown.toLocaleString("id-ID")} XP
                        </p>
                        <p className="mt-2 inline-flex rounded-full bg-brand-50 px-3 py-1 text-xs font-medium tabular-nums text-brand-800">
                          {cause} XP Ã— {frequency} sesi Ã— {duration} minggu
                        </p>
                      </div>
                      <div className="pm-sim-tile relative flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-brand-100 bg-brand-50 text-brand-700">
                        <span key={level.icon} className="pm-swap flex">
                          <Icon
                            name={level.icon}
                            className={`pm-ico ${["h-8 w-8", "h-9 w-9", "h-10 w-10", "h-11 w-11"][levelIdx]}`}
                            strokeWidth={1.8}
                          />
                        </span>
                      </div>
                    </div>

                    <ol
                      className="pm-3d-flat mt-5 flex items-center"
                      aria-label="Tahap evolusi pohon"
                    >
                      {LEVELS.map((l, i) => {
                        const st = !simShow
                          ? "todo"
                          : i < levelIdx
                            ? "done"
                            : i === levelIdx
                              ? "now"
                              : "todo";
                        return (
                          <React.Fragment key={l.name}>
                            {i > 0 && (
                              <li
                                aria-hidden="true"
                                role="presentation"
                                className="relative h-0.5 flex-1 overflow-hidden rounded-full bg-slate-200"
                              >
                                <span
                                  className="pm-lvl-line"
                                  data-on={simShow && i <= levelIdx}
                                  style={idx(i)}
                                />
                              </li>
                            )}
                            <li
                              className="pm-lvl"
                              data-state={st}
                              aria-current={i === levelIdx ? "step" : undefined}
                              style={idx(i)}
                            >
                              <Icon name={l.icon} className="h-4 w-4" />
                              <span className="sr-only">{l.name}</span>
                            </li>
                          </React.Fragment>
                        );
                      })}
                    </ol>

                    <dl className="mt-5 space-y-3 text-sm">
                      <div className="flex justify-between items-center gap-4">
                        <dt className="text-slate-600">Tingkat resiliensi</dt>
                        <dd
                          key={level.name}
                          className="pm-swap-text font-semibold text-brand-900 text-right"
                          id="stat-tree-level"
                        >
                          {level.name}
                        </dd>
                      </div>
                      <div className="flex justify-between items-center gap-4">
                        <dt className="text-slate-600">
                          Indeks ketahanan psikologis
                        </dt>
                        <dd
                          key={level.status}
                          className="pm-swap-text font-semibold text-slate-900 text-right"
                          id="stat-mental-health"
                        >
                          {level.status}
                        </dd>
                      </div>
                      <div className="flex justify-between items-center gap-4">
                        <dt className="text-slate-600">
                          Kesiapsiagaan tanggap bencana
                        </dt>
                        <dd
                          key={level.readiness}
                          className="pm-swap-text font-semibold text-brand-700 text-right"
                          id="stat-readiness"
                        >
                          {level.readiness}
                        </dd>
                      </div>
                    </dl>

                    <div className="mt-6 pt-5 border-t border-slate-100">
                      <div className="flex justify-between gap-4 text-sm text-slate-600 mb-2">
                        <span>Evolusi pohon harapan</span>
                        <span
                          key={progressText}
                          className="pm-swap-text font-medium text-brand-700"
                          id="progress-percent"
                        >
                          {progressText}
                        </span>
                      </div>
                      <div
                        className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden"
                        role="progressbar"
                        aria-valuenow={progress}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      >
                        <div
                          className="pm-bar bg-brand-600 h-full rounded-full transition-[width] duration-700 ease-out motion-reduce:transition-none"
                          id="xp-bar"
                          style={{ width: `${simShow ? progress : 0}%` }}
                        />
                      </div>
                      {level.next !== null && (
                        <p className="mt-2 text-sm tabular-nums text-slate-500">
                          {xpShown.toLocaleString("id-ID")} /{" "}
                          {level.next.toLocaleString("id-ID")} XP
                        </p>
                      )}
                    </div>

                    <p className="mt-5 text-sm text-slate-500">
                      Berdasarkan prinsip PFA: tanpa sistem penalti, pemulihan
                      bertahap tanpa paksaan emosional.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* END: Simulator Hope Tree */}

      {/* BEGIN: Game & Mood + Food */}
      <section className="py-20 bg-white" id="game-showcase">
        <div className="max-w-7xl mx-auto px-6 space-y-20">
          <div
            ref={gameRef}
            data-show={gameShow}
            className="pm-flow grid grid-cols-1 lg:grid-cols-12 gap-10"
          >
            <div className="lg:col-span-5 space-y-4 lg:pt-2">
              <div className="pm-sim-in" style={idx(0)}>
                <h2 className="text-3xl sm:text-4xl font-semibold text-slate-900 tracking-tight">
                  Belajar siaga bencana lewat permainan
                </h2>
                <p className="mt-4 text-base text-slate-600 leading-relaxed">
                  Dengan pendekatan <em>serious gaming</em>, anak dilatih
                  mengenali jalur evakuasi, menyusun tas siaga, dan menenangkan
                  denyut nadi sendiri, sehingga lebih siap dan tidak panik saat
                  gempa terjadi.
                </p>
              </div>
              <p
                className="pm-sim-in inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-3.5 py-1.5 text-sm font-medium text-brand-800"
                style={idx(1)}
              >
                <span className="pm-gico-pill inline-flex">
                  <Icon name="gamepad" className="pm-ico h-4 w-4" />
                </span>
                {GAMES.length} permainan siaga
              </p>
            </div>

            <ul className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {GAMES.map((g, i) => (
                <li
                  key={g.href}
                  data-g={g.icon}
                  className="pm-game-in"
                  style={
                    { "--i": i, "--d": `${i * 450}ms` } as React.CSSProperties
                  }
                >
                  <Link
                    href={g.href}
                    className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 transition duration-300 hover:-translate-y-1 hover:border-brand-300 hover:shadow-[0_18px_36px_-16px_rgba(15,45,33,0.3)] motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${focusRing}`}
                  >
                    <span
                      aria-hidden="true"
                      className="pm-ghost pointer-events-none absolute right-4 top-2 select-none text-5xl font-bold leading-none text-brand-100/70"
                    >
                      0{i + 1}
                    </span>
                    <span className="relative mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-brand-100 bg-brand-50 text-brand-700 transition-colors duration-300 group-hover:border-brand-700 group-hover:bg-brand-700 group-hover:text-white">
                      <Icon name={g.icon} className="pm-gico h-6 w-6" />
                    </span>
                    <span className="relative block text-base font-semibold text-slate-900">
                      {g.title}
                    </span>
                    <span className="relative mt-1.5 block text-sm text-slate-600 leading-relaxed">
                      {g.desc}
                    </span>
                    <span className="relative mt-auto flex items-center gap-1.5 pt-5 text-sm font-semibold text-brand-700">
                      Mainkan
                      <Icon
                        name="arrow"
                        className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none"
                      />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div ref={moodInRef} data-show={moodShow} className="pm-flow">
            <div
              ref={moodRef}
              className="pm-aura pm-pop relative isolate overflow-hidden rounded-2xl p-8 sm:p-12 text-white"
              id="mood-food"
            >
              {/* Latar aura Smokeveil: dekoratif, di bawah konten */}
              <div className="pm-aura-stage" aria-hidden="true">
                <div className="pm-aura-l pm-aura-1" />
                <div className="pm-aura-l pm-aura-2" />
                <div className="pm-aura-l pm-aura-3" />
                <div className="pm-aura-spot" />
                <div className="pm-aura-grain">
                  <svg
                    width="100%"
                    height="100%"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <filter id="pm-grain">
                      <feTurbulence
                        type="fractalNoise"
                        baseFrequency="0.7"
                        numOctaves="4"
                        stitchTiles="stitch"
                      />
                      <feColorMatrix
                        type="matrix"
                        values="0.181 0.608 0.061 0 0.075 0.181 0.608 0.061 0 0.075 0.181 0.608 0.061 0 0.075 0 0 0 1 0"
                      />
                    </filter>
                    <rect width="100%" height="100%" filter="url(#pm-grain)" />
                  </svg>
                </div>
              </div>
              <div className="relative z-[1] grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                <div className="lg:col-span-8 space-y-6">
                  <div className="space-y-3">
                    <span className="pm-sim-in block h-7 w-7" style={idx(2)}>
                      <Icon
                        name="bowl"
                        className="pm-bowl w-7 h-7 text-brand-300"
                      />
                    </span>
                    <h2
                      className="pm-sim-in text-3xl sm:text-4xl font-semibold tracking-tight"
                      style={idx(3)}
                    >
                      Mood + Food Analyzer: gizi untuk memulihkan emosi anak
                    </h2>
                    <p
                      className="pm-sim-in text-base text-brand-100 leading-relaxed max-w-2xl"
                      style={idx(4)}
                    >
                      Menghubungkan menu dapur umum darurat dengan kestabilan
                      emosi anak, sebagai panduan praktis bagi relawan dapur dan
                      logistik pengungsian.
                    </p>
                  </div>
                  <dl className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {NUTRITION.map((n, i) => (
                      <div
                        key={n.title}
                        className="pm-sim-in pm-nut border-t border-white/25 pt-3"
                        style={idx(5 + i)}
                      >
                        <dt className="text-base font-semibold">{n.title}</dt>
                        <dd className="mt-1 text-sm text-brand-100">
                          {n.desc}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>

                <div className="lg:col-span-4 lg:self-end">
                  <p
                    className="pm-sim-in text-sm text-brand-100 leading-relaxed mb-4"
                    style={idx(6)}
                  >
                    Analisis bahan makanan darurat yang tersedia untuk memenuhi
                    kebutuhan mikronutrien anak.
                  </p>
                  <div className="pm-sim-in" style={idx(8)}>
                    <ArrowLink
                      href="/mood-food"
                      variant="light"
                      className="text-sm"
                    >
                      Buka katalog Mood + Food
                    </ArrowLink>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* END: Game & Mood + Food */}

      {/* BEGIN: Testimoni */}
      <section className="py-20 bg-white" id="stories">
        <div
          ref={storyRef}
          data-show={storyShow}
          className="pm-flow max-w-7xl mx-auto px-6"
        >
          <div className="pm-sim-in max-w-2xl mb-10" style={idx(0)}>
            <h2 className="text-3xl sm:text-4xl font-semibold text-slate-900 tracking-tight">
              Suara dari lapangan
            </h2>
            <p className="mt-3 text-base text-slate-600 leading-relaxed">
              Cerita relawan PFA, pendidik, dan koordinator pengungsian yang
              mendampingi anak di garis depan bencana.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STORIES.map((s, i) => (
              <div key={s.name} className="pm-sim-in" style={idx(i + 1)}>
                <figure className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-brand-300 hover:shadow-lg">
                  <div className="flex items-center justify-between">
                    <svg
                      viewBox="0 0 32 32"
                      className="pm-float h-8 w-8 text-brand-300"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M13.2 6C8.1 8.3 5 12.2 5 17.6V26h8.6v-8.6H9.9c.1-2.6 1.6-4.6 4.5-6.3L13.2 6zm13.6 0c-5.1 2.3-8.2 6.2-8.2 11.6V26h8.6v-8.6h-3.7c.1-2.6 1.6-4.6 4.5-6.3L26.8 6z" />
                    </svg>
                    <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-800">
                      {s.tag}
                    </span>
                  </div>
                  <blockquote className="mt-5 flex-1 text-base leading-relaxed text-slate-700">
                    <StoryQuote quote={s.quote} highlight={s.highlight} />
                  </blockquote>
                  <figcaption className="mt-6 flex min-h-[3.75rem] items-center gap-3 border-t border-slate-100 pt-5 box-content">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-800 ring-4 ring-brand-50">
                      {s.initials}
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-slate-900">
                        {s.name}
                      </span>
                      <span className="block text-sm text-slate-600">
                        {s.role}
                      </span>
                    </span>
                  </figcaption>
                </figure>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* END: Testimoni */}

      {/* BEGIN: CTA */}
      <section className="py-12 bg-white">
        <div
          ref={ctaInRef}
          data-show={ctaShow}
          className="pm-flow max-w-7xl mx-auto px-6"
        >
          <div
            ref={ctaRef}
            className="pm-hz pm-pop bg-brand-900 relative isolate overflow-hidden rounded-2xl p-8 sm:p-14 text-white"
          >
            {/* Latar aura Horizon: dekoratif, di bawah konten */}
            <div className="pm-hz-stage" aria-hidden="true">
              <div className="pm-hz-l pm-hz-1" />
              <div className="pm-hz-l pm-hz-2" />
              <div className="pm-hz-l pm-hz-3" />
              <div className="pm-hz-spot" />
              <div className="pm-hz-grain">
                <svg
                  width="100%"
                  height="100%"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <filter id="pm-grain-2">
                    <feTurbulence
                      type="fractalNoise"
                      baseFrequency="0.7"
                      numOctaves="4"
                      stitchTiles="stitch"
                    />
                    <feColorMatrix
                      type="matrix"
                      values="0.181 0.608 0.061 0 0.075 0.181 0.608 0.061 0 0.075 0.181 0.608 0.061 0 0.075 0 0 0 1 0"
                    />
                  </filter>
                  <rect width="100%" height="100%" filter="url(#pm-grain-2)" />
                </svg>
              </div>
            </div>
            <div className="relative z-[1] grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-8 space-y-3">
                <h2
                  className="pm-sim-in text-3xl sm:text-4xl font-semibold tracking-tight leading-tight"
                  style={idx(2)}
                >
                  Wujudkan generasi anak tangguh bencana di Nusantara
                </h2>
                <p
                  className="pm-sim-in text-base text-brand-100 max-w-xl leading-relaxed"
                  style={idx(3)}
                >
                  Bergabunglah bersama relawan PFA, posko darurat, dan
                  fasilitator sekolah dalam ekosistem PERMATA Nusantara.
                </p>
              </div>

              <div className="lg:col-span-4 flex flex-col items-start lg:items-end gap-3">
                <div className="pm-sim-in" style={idx(4)}>
                  <ArrowLink
                    href="/dashboard"
                    variant="light"
                    className="text-base"
                  >
                    Masuk ke dashboard
                  </ArrowLink>
                </div>
                <span
                  className="pm-sim-in text-sm text-brand-100"
                  style={idx(5)}
                >
                  Gratis untuk relawan, guru, dan orang tua
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* END: CTA */}

      {/* BEGIN: Footer */}
      <footer
        ref={footRef}
        data-show={footShow}
        className="pm-flow relative bg-gradient-to-b from-white to-slate-50 pt-16 pb-8 text-slate-600 text-sm"
      >
        <div
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-300 to-transparent"
          aria-hidden="true"
        />
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 pb-12">
            <div className="pm-sim-in lg:col-span-4 space-y-5" style={idx(0)}>
              <Link
                href="/"
                className={`inline-flex items-center gap-3 rounded-sm ${focusRing}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/permata-logo.webp"
                  alt="Logo PERMATA"
                  width={40}
                  height={40}
                  className="w-10 h-10 object-contain shrink-0"
                />
                <span className="text-xl font-extrabold tracking-tight text-slate-900">
                  PERMATA <span className="text-brand-700">Nusantara</span>
                </span>
              </Link>
              <p className="text-sm text-slate-600 max-w-sm leading-relaxed">
                Platform pendidikan resiliensi mental dan pendampingan anak
                dalam konteks kebencanaan. Memadukan Psychological First Aid
                (PFA), skrining DASS-21, serta kearifan budaya Aceh (Meuseuraya)
                dan Minangkabau (Mambangkik Batang Tarandam).
              </p>
              <a
                href="tel:119"
                className={`inline-flex items-center gap-2.5 min-h-11 px-4 rounded-full border border-brand-200 bg-brand-50 text-sm font-medium text-brand-900 hover:bg-brand-100 transition-colors duration-200 ${focusRing}`}
              >
                <span className="relative flex w-2.5 h-2.5" aria-hidden="true">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-brand-500 opacity-60 motion-safe:animate-ping" />
                  <span className="relative inline-flex w-2.5 h-2.5 rounded-full bg-brand-500" />
                </span>
                Terhubung ke Hotline 119
              </a>
            </div>

            <nav
              aria-label="Modul"
              className="pm-sim-in lg:col-span-2 lg:col-start-6"
              style={idx(1)}
            >
              <h3 className="text-sm font-semibold text-slate-900 mb-3">
                Modul
              </h3>
              <ul className="flex flex-col">
                {FOOTER_MODULES.map((l) => (
                  <li key={l.label}>
                    <FooterLink href={l.href}>{l.label}</FooterLink>
                  </li>
                ))}
              </ul>
            </nav>

            <nav
              aria-label="Layanan"
              className="pm-sim-in lg:col-span-2"
              style={idx(2)}
            >
              <h3 className="text-sm font-semibold text-slate-900 mb-3">
                Layanan
              </h3>
              <ul className="flex flex-col">
                {FOOTER_SERVICES.map((l) => (
                  <li key={l.label}>
                    <FooterLink href={l.href}>{l.label}</FooterLink>
                  </li>
                ))}
              </ul>
            </nav>

            <div
              className="pm-sim-in md:col-span-2 lg:col-span-3 lg:col-start-10"
              style={idx(3)}
            >
              <h3 className="text-sm font-semibold text-slate-900 mb-3">
                Warta resiliensi bencana
              </h3>
              <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                Panduan PFA dan tips kesiapsiagaan sekolah langsung ke email
                Anda.
              </p>
              <div aria-live="polite">
                {emailSubscribed ? (
                  <p className="flex items-start gap-2 bg-brand-50 border border-brand-200 text-brand-800 text-sm p-3.5 rounded-2xl font-medium">
                    <Icon
                      name="check"
                      className="w-4 h-4 mt-0.5 shrink-0"
                      strokeWidth={2.5}
                    />
                    Terima kasih! Anda telah terdaftar di warta PERMATA.
                  </p>
                ) : (
                  <form
                    className="flex flex-col gap-2.5"
                    onSubmit={handleNewsletterSubmit}
                  >
                    <input
                      className="min-h-11 w-full rounded-full border border-slate-300 bg-white px-5 text-sm text-slate-800 placeholder:text-slate-500 transition-[border-color,box-shadow] duration-200 focus:outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
                      placeholder="Alamat email"
                      aria-label="Alamat email"
                      autoComplete="email"
                      required
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                    />
                    <button
                      type="submit"
                      className={`group inline-flex items-center justify-center gap-2 min-h-11 rounded-full bg-brand-900 px-5 text-sm font-semibold text-white hover:bg-brand-950 transition-colors duration-200 ${focusRing}`}
                    >
                      Daftar buletin
                      <Icon
                        name="arrow"
                        strokeWidth={2.5}
                        className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5 motion-reduce:transition-none"
                      />
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>

          <div
            className="pm-sim-in pt-6 border-t border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-sm text-slate-500"
            style={idx(4)}
          >
            <p>
              Â© {new Date().getFullYear()} PERMATA Nusantara Foundation.
              Seluruh hak cipta dilindungi undang-undang.
            </p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
              <Link
                className={`py-1 rounded-sm hover:text-brand-800 transition-colors duration-200 ${focusRing}`}
                href="#privacy"
              >
                Perlindungan data anak
              </Link>
              <Link
                className={`py-1 rounded-sm hover:text-brand-800 transition-colors duration-200 ${focusRing}`}
                href="#terms"
              >
                Ketentuan layanan
              </Link>
              <Link
                className={`py-1 rounded-sm hover:text-brand-800 transition-colors duration-200 ${focusRing}`}
                href="#security"
              >
                Protokol rujukan darurat 119
              </Link>
              <button
                type="button"
                aria-label="Kembali ke atas"
                onClick={() =>
                  window.scrollTo({
                    top: 0,
                    behavior: window.matchMedia(
                      "(prefers-reduced-motion: reduce)",
                    ).matches
                      ? "auto"
                      : "smooth",
                  })
                }
                className={`group inline-flex items-center justify-center w-11 h-11 rounded-full border border-slate-300 text-slate-700 hover:border-brand-700 hover:bg-brand-50 hover:text-brand-800 transition-colors duration-200 ${focusRing}`}
              >
                <Icon
                  name="arrow"
                  strokeWidth={2.5}
                  className="w-4 h-4 -rotate-90 transition-transform duration-300 group-hover:-translate-y-0.5 motion-reduce:transition-none"
                />
              </button>
            </div>
          </div>
        </div>
      </footer>
      {/* END: Footer */}
    </div>
  );
}
