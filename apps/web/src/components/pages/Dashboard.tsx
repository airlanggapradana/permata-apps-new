"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { TransitionPhase } from "@/components/PageTransitionOverlay";
import {
  Activity,
  ArrowRight,
  Award,
  Backpack,
  BadgeCheck,
  Camera,
  CheckCircle2,
  ChevronRight,
  CloudCheck,
  Compass,
  Droplets,
  Gamepad2,
  Headphones,
  HeartHandshake,
  Home,
  Lock,
  LogIn,
  MapPin,
  MessageCircle,
  Phone,
  ShieldAlert,
  ShieldCheck,
  TreePine,
  Users,
  WifiOff,
  Wind,
} from "lucide-react";
import { useCulture } from "@/context/CultureContext";
import { useAuth } from "@/context/AuthContext";
import { HopeTree } from "@/components/HopeTree";
import { readOfflineMeta, OfflineSyncMeta } from "@/lib/offlineCache";

interface DashboardSummary {
  passportSummary: {
    passportCode: string;
    status: string;
    completenessPercent: number;
    contactsCount: number;
    familyCount: number;
    meetingPointsCount: number;
    emergencyNeedsCount: number;
    primaryContact: {
      name: string;
      phone: string;
      relationship: string;
      isPrimary: boolean;
    } | null;
    primaryMeetingPoint: {
      name: string;
      address: string | null;
    } | null;
  };
  dailyStatus: {
    journaledToday: boolean;
    lastJournalAt: string | null;
    breathedToday: boolean;
  };
  screeningStatus: string;
}

const ROLE_LABELS: Record<string, string> = {
  CHILD: "Anak & Remaja Siaga Resiliensi",
  PARENT_GUARDIAN: "Orang Tua & Wali Keluarga",
  TEACHER_COUNSELOR: "Guru & Konselor Sekolah",
  VOLUNTEER: "Relawan Pendamping Lapangan",
  PROFESSIONAL: "Tenaga Profesional PFA",
};

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]";

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 18, scale: 0.98 },
  visible: (index: number = 0) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.48,
      delay: Math.min(index * 0.05, 0.85),
      ease: EASE_OUT,
    },
  }),
};

/**
 * Staggered first-render entrance wrapper for dashboard cards, synchronized with
 * the page transition curtain so animations play once the view becomes visible.
 */
function AnimatedCard({
  index,
  ready,
  reducedMotion,
  className = "",
  children,
}: {
  index: number;
  ready: boolean;
  reducedMotion: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }
  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate={ready ? "visible" : "hidden"}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function Dashboard({
  transitionPhase = "idle",
}: {
  transitionPhase?: TransitionPhase;
}) {
  const { culture } = useCulture();
  const { user, treeStats, isLoading: authLoading, setTreeStats } = useAuth();
  const prefersReducedMotion = Boolean(useReducedMotion());
  const ready = transitionPhase === "exiting" || transitionPhase === "idle";

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [offlineMeta, setOfflineMeta] = useState<OfflineSyncMeta | null>(null);

  const [watering, setWatering] = useState(false);
  const [waterMsg, setWaterMsg] = useState<string | null>(null);
  const [breathingDoneToday, setBreathingDoneToday] = useState(false);
  const [recordingBreath, setRecordingBreath] = useState(false);
  const [meditationChecked, setMeditationChecked] = useState(false);
  const [goalFeedback, setGoalFeedback] = useState<string | null>(null);

  const loadDashboardSummary = useCallback(async () => {
    if (!user) return;
    setLoadingSummary(true);
    try {
      const res = await fetch("/api/dashboard", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) {
        setSummary({
          passportSummary: data.passportSummary,
          dailyStatus: data.dailyStatus,
          screeningStatus: data.screeningStatus,
        });
        if (data.treeStats) {
          setTreeStats(data.treeStats);
        }
        if (data.dailyStatus?.breathedToday) {
          setBreathingDoneToday(true);
        }
      }
    } catch {
      // Keep UI resilient if transient fetch error occurs
    } finally {
      setLoadingSummary(false);
    }
  }, [user, setTreeStats]);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      setOfflineMeta(readOfflineMeta());
      if (user) {
        try {
          const todayKey = new Date().toISOString().slice(0, 10);
          const storedMed = localStorage.getItem(
            `permata_goal_meditation_${user.userId}_${todayKey}`,
          );
          setMeditationChecked(storedMed === "1");
        } catch {
          setMeditationChecked(false);
        }
        void loadDashboardSummary();
      } else {
        setSummary(null);
        setBreathingDoneToday(false);
        setMeditationChecked(false);
      }
    });
    return () => {
      active = false;
    };
  }, [user, loadDashboardSummary]);

  const handleWaterTree = async () => {
    if (!user || watering) return;
    setWatering(true);
    setWaterMsg(null);
    try {
      const res = await fetch("/api/journal/water", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.treeStats) {
          setTreeStats(data.treeStats);
        }
        setWaterMsg(data.message || "Pohon Harapan disiram.");
      } else {
        setWaterMsg(data.error || "Gagal menyiram Pohon Harapan.");
      }
    } catch {
      setWaterMsg("Gagal terhubung ke server.");
    } finally {
      setWatering(false);
    }
  };

  const handleToggleBreathingGoal = async (checked: boolean) => {
    if (!user || !checked || breathingDoneToday || recordingBreath) return;
    setRecordingBreath(true);
    setGoalFeedback(null);
    try {
      const res = await fetch("/api/journal/breathe", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        setBreathingDoneToday(true);
        if (data.treeStats) {
          setTreeStats(data.treeStats);
        }
        setGoalFeedback(data.message || "Latihan napas hari ini sudah tercatat.");
      } else {
        setGoalFeedback(data.error || "Latihan belum tercatat. Coba lagi, ya.");
      }
    } catch {
      setGoalFeedback("Gagal mencatat latihan napas. Coba lagi nanti.");
    } finally {
      setRecordingBreath(false);
    }
  };

  const handleToggleMeditationGoal = (checked: boolean) => {
    if (!user) return;
    setMeditationChecked(checked);
    try {
      const todayKey = new Date().toISOString().slice(0, 10);
      localStorage.setItem(
        `permata_goal_meditation_${user.userId}_${todayKey}`,
        checked ? "1" : "0",
      );
    } catch {
      // Ignore storage errors
    }
  };

  // Unauthenticated view (keeps existing calm overview + clear login CTA)
  if (!authLoading && !user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14 space-y-10">
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-8">
            <AnimatedCard index={0} ready={ready} reducedMotion={prefersReducedMotion}>
              <header className="bg-tint border border-[var(--brand-200)] rounded-xl p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-semibold text-fg">
                      Halo, Penyintas Tangguh!
                    </h1>
                    <p className="mt-2 text-base text-fg-muted">
                      {culture === "aceh"
                        ? '"Peugah hal nyang na, peubuet nyang baik" - Katakanlah yang ada, perbuatlah yang baik.'
                        : '"Mambangkik Batang Tarandam" - Semangat bangkit dari keterpurukan.'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2.5 shrink-0">
                    <Link
                      href="/login?next=/dashboard"
                      className={`inline-flex items-center justify-center gap-2 min-h-11 px-5 rounded-md bg-action hover:bg-action-hover text-white text-sm font-medium transition-colors ${focusRing}`}
                    >
                      <LogIn size={16} strokeWidth={1.75} aria-hidden="true" />
                      <span>Masuk Akun</span>
                    </Link>
                    <Link
                      href="/register?next=/dashboard"
                      className={`inline-flex items-center justify-center min-h-11 px-4 rounded-md bg-surface border border-line-strong hover:bg-sunken text-fg text-sm font-medium transition-colors ${focusRing}`}
                    >
                      Daftar
                    </Link>
                  </div>
                </div>
              </header>
            </AnimatedCard>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <AnimatedCard index={1} ready={ready} reducedMotion={prefersReducedMotion} className="h-full">
                <Link
                  href="/safety-passport"
                  prefetch={false}
                  className={`h-full block bg-surface border border-line rounded-lg p-5 shadow-xs hover:border-line-strong hover:shadow-md transition-all ${focusRing}`}
                >
                  <Lock
                    size={22}
                    strokeWidth={1.75}
                    className="text-fg-brand mb-3"
                  />
                  <h2 className="text-base font-semibold text-fg">
                    My Safety Passport
                  </h2>
                  <p className="text-xs text-fg-muted mt-1">
                    Dilindungi Akun (Masuk untuk Akses)
                  </p>
                </Link>
              </AnimatedCard>
              <AnimatedCard index={2} ready={ready} reducedMotion={prefersReducedMotion} className="h-full">
                <Link
                  href="/tele-screening"
                  prefetch={false}
                  className={`h-full block bg-surface border border-line rounded-lg p-5 shadow-xs hover:border-line-strong hover:shadow-md transition-all ${focusRing}`}
                >
                  <ShieldCheck
                    size={22}
                    strokeWidth={1.75}
                    className="text-fg-brand mb-3"
                  />
                  <h2 className="text-base font-semibold text-fg">
                    Tele-Screening &amp; Triage
                  </h2>
                  <p className="text-xs text-fg-muted mt-1">
                    Deteksi Risiko Berbasis DASS-21
                  </p>
                </Link>
              </AnimatedCard>
              <AnimatedCard index={3} ready={ready} reducedMotion={prefersReducedMotion} className="h-full">
                <Link
                  href="/offline-survival"
                  prefetch={false}
                  className={`h-full block bg-surface border border-line rounded-lg p-5 shadow-xs hover:border-line-strong hover:shadow-md transition-all ${focusRing}`}
                >
                  <WifiOff
                    size={22}
                    strokeWidth={1.75}
                    className="text-fg-brand mb-3"
                  />
                  <h2 className="text-base font-semibold text-fg">
                    Offline Survival Mode
                  </h2>
                  <p className="text-xs text-fg-muted mt-1">
                    Panduan Darurat Tanpa Login &amp; Internet
                  </p>
                </Link>
              </AnimatedCard>
            </div>
          </div>

          <AnimatedCard
            index={2}
            ready={ready}
            reducedMotion={prefersReducedMotion}
            className="lg:col-span-4"
          >
            <div className="bg-surface border border-line rounded-xl p-8 shadow-xs flex flex-col items-center text-center">
              <h2 className="text-xs font-semibold tracking-[0.06em] text-fg-subtle uppercase mb-2">
                Progress Resiliensi
              </h2>
              <p className="text-xs text-fg-muted mb-6">
                Masuk untuk menyimpan progres Pohon Harapan pribadi Anda
              </p>
              <HopeTree level={1} />
              <Link
                href="/login?next=/dashboard"
                className={`mt-6 w-full inline-flex items-center justify-center gap-2 min-h-11 px-4 rounded-md bg-action hover:bg-action-hover text-white text-sm font-medium transition-colors ${focusRing}`}
              >
                <LogIn size={16} strokeWidth={1.75} aria-hidden="true" />
                <span>Masuk untuk Buka Dashboard Penuh</span>
              </Link>
            </div>
          </AnimatedCard>
        </div>
      </div>
    );
  }

  // Authenticated Dashboard matching desain_dashboard_user.html
  const roleLabel =
    (user?.roles?.[0] && ROLE_LABELS[user.roles[0]]) ||
    "Pengguna Siaga Resiliensi";
  const passportCode = summary?.passportSummary.passportCode || "PRM-AKTIF";
  const passportCompleteness =
    summary?.passportSummary.completenessPercent ?? 0;

  const activeLevel = treeStats?.level ?? 1;
  const activeXp = treeStats?.totalXp ?? 150;
  const activePercent = treeStats?.progressPercent ?? 60;
  const remainingXp = treeStats
    ? Math.max(0, treeStats.targetXp - treeStats.totalXp)
    : 100;

  const journaledToday = summary?.dailyStatus.journaledToday ?? false;
  const breathedToday =
    breathingDoneToday || (summary?.dailyStatus.breathedToday ?? false);
  const completedDailyCount = [
    journaledToday,
    breathedToday,
    meditationChecked,
  ].filter(Boolean).length;

  const journalTimeLabel = summary?.dailyStatus.lastJournalAt
    ? new Date(summary.dailyStatus.lastJournalAt).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const treeSize = Math.min(96 + activeLevel * 10, 136);

  return (
    <div className="w-full bg-canvas min-h-screen-safe">
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-12 py-5 sm:py-8 space-y-6 sm:space-y-8">
        {/* ================= TOP GREETING & CULTURAL WISDOM BANNER ================= */}
        <AnimatedCard index={0} ready={ready} reducedMotion={prefersReducedMotion}>
          <section className="bg-surface border border-line rounded-xl p-4 sm:p-6 lg:p-8 shadow-xs relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-3 max-w-3xl">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="px-3 py-1 rounded-full bg-tint border border-[var(--brand-200)] text-fg-brand text-xs font-semibold inline-flex items-center gap-1.5">
                    <BadgeCheck size={15} strokeWidth={1.75} aria-hidden="true" />
                    <span>{roleLabel}</span>
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-sunken border border-line text-fg-muted text-xs font-medium">
                    ID: {passportCode}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-bold text-fg tracking-tight">
                  {authLoading
                    ? "Memuat ruang pribadi..."
                    : `Halo, ${user?.fullName}!`}
                </h1>

                <p className="text-sm sm:text-base text-fg-muted leading-relaxed">
                  <span className="font-serif italic text-fg-brand">
                    {culture === "aceh"
                      ? "“Peugah hal nyang na, peubuet nyang baik”"
                      : "“Mambangkik Batang Tarandam”"}
                  </span>{" "}
                  {culture === "aceh"
                    ? "Katakanlah apa adanya, perbuatlah kebaikan. (Filosofi Kejujuran & Meuseuraya Aceh)"
                    : "Membangkitkan marwah dan ketangguhan bersama. (Filosofi Kebangkitan Minangkabau)"}
                </p>
              </div>

              {/* Live Quick Status Chips */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:flex md:flex-col gap-2.5 shrink-0">
                <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg bg-sunken border border-line">
                  <span
                    aria-hidden="true"
                    className="w-2.5 h-2.5 rounded-full bg-[var(--brand-500)] shrink-0"
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold text-fg">
                      Mode Pemulihan Pribadi
                    </span>
                    <span className="text-xs text-fg-muted truncate">
                      {treeStats ? treeStats.levelName : "Lv 1: Benih Asa"}
                    </span>
                  </div>
                </div>

                <Link
                  href="/offline-survival"
                  className={`flex items-center gap-2.5 min-h-11 px-3.5 py-2.5 rounded-lg bg-sunken border border-line hover:border-line-strong transition-colors ${focusRing}`}
                >
                  <CloudCheck
                    size={18}
                    strokeWidth={1.75}
                    className="text-fg-brand shrink-0"
                    aria-hidden="true"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-fg">
                      {offlineMeta
                        ? "Sinkronisasi Offline: Siaga"
                        : "Paket Offline Tersedia"}
                    </span>
                    <span className="text-xs text-fg-muted">
                      {offlineMeta
                        ? `${offlineMeta.cachedUrlsCount} aset tersimpan`
                        : "Simpan panduan tanpa internet"}
                    </span>
                  </div>
                </Link>
              </div>
            </div>
          </section>
        </AnimatedCard>

        {/* ================= MAIN CONTENT GRID (8 COLS HUB + 4 COLS SIDEBAR) ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT / MAIN COLUMN (8 Columns) */}
          <div className="lg:col-span-8 space-y-10">
            {/* SECTION 1: 6 Core Feature Cards */}
            <section
              aria-labelledby="section-ruang-siaga"
              className="space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck
                    size={22}
                    strokeWidth={1.75}
                    className="text-fg-brand"
                    aria-hidden="true"
                  />
                  <h2
                    id="section-ruang-siaga"
                    className="text-xl font-semibold text-fg"
                  >
                    Ruang Siaga &amp; Pendampingan
                  </h2>
                </div>
                <span className="text-xs font-medium text-fg-subtle">
                  6 Modul Utama
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {/* Card 1: My Safety Passport */}
                <AnimatedCard index={1} ready={ready} reducedMotion={prefersReducedMotion} className="h-full">
                  <Link
                    href="/safety-passport"
                    prefetch={false}
                    className={`group h-full p-5 rounded-lg bg-surface border border-line shadow-xs hover:border-line-strong hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between min-h-[170px] ${focusRing}`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="w-10 h-10 rounded-md bg-tint flex items-center justify-center text-fg-brand">
                          <Lock size={20} strokeWidth={1.75} aria-hidden="true" />
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full bg-tint text-fg-brand text-xs font-semibold">
                          {loadingSummary
                            ? "Memuat..."
                            : `Terisi ${passportCompleteness}%`}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-fg group-hover:text-fg-brand transition-colors">
                          My Safety Passport
                        </h3>
                        <p className="text-xs text-fg-muted mt-1 leading-relaxed">
                          Data Keluarga, Titik Kumpul &amp; Kebutuhan Darurat
                          Pribadi
                        </p>
                      </div>
                    </div>
                    <div className="pt-3 flex items-center gap-1 text-fg-brand text-xs font-semibold">
                      <span>Buka Paspor</span>
                      <ArrowRight
                        size={14}
                        strokeWidth={1.75}
                        className="group-hover:translate-x-0.5 transition-transform"
                        aria-hidden="true"
                      />
                    </div>
                  </Link>
                </AnimatedCard>

                {/* Card 2: Saweu Syedara / Badunsanak (// TODO: Forum page not yet built) */}
                <AnimatedCard index={2} ready={ready} reducedMotion={prefersReducedMotion} className="h-full">
                  <div className="h-full p-5 rounded-lg bg-surface border border-line shadow-xs flex flex-col justify-between min-h-[170px]">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="w-10 h-10 rounded-md bg-tint flex items-center justify-center text-fg-brand">
                          <Users
                            size={20}
                            strokeWidth={1.75}
                            aria-hidden="true"
                          />
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full bg-sunken border border-line text-fg-muted text-xs font-medium">
                          Segera Hadir
                        </span>
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-fg">
                          {culture === "aceh" ? "Saweu Syedara" : "Badunsanak"}
                        </h3>
                        <p className="text-xs text-fg-muted mt-1 leading-relaxed">
                          Forum Terkurasi &amp; Anonim Dukungan Sebaya Nusantara
                        </p>
                      </div>
                    </div>
                    <div className="pt-3 text-xs text-fg-subtle font-medium">
                      Dalam pengembangan
                    </div>
                  </div>
                </AnimatedCard>

                {/* Card 3: Tele-Screening & Triage */}
                <AnimatedCard index={3} ready={ready} reducedMotion={prefersReducedMotion} className="h-full">
                  <Link
                    href="/tele-screening"
                    prefetch={false}
                    className={`group h-full p-5 rounded-lg bg-surface border border-line shadow-xs hover:border-line-strong hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between min-h-[170px] ${focusRing}`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="w-10 h-10 rounded-md bg-tint flex items-center justify-center text-fg-brand">
                          <Activity
                            size={20}
                            strokeWidth={1.75}
                            aria-hidden="true"
                          />
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full bg-tint text-fg-brand text-xs font-semibold">
                          {summary?.screeningStatus || "Siap Skrining"}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-fg group-hover:text-fg-brand transition-colors">
                          Tele-Screening &amp; Triage
                        </h3>
                        <p className="text-xs text-fg-muted mt-1 leading-relaxed">
                          Deteksi Risiko Berbasis DASS-21 &amp; Triase Cepat
                        </p>
                      </div>
                    </div>
                    <div className="pt-3 flex items-center gap-1 text-fg-brand text-xs font-semibold">
                      <span>Cek Evaluasi</span>
                      <ArrowRight
                        size={14}
                        strokeWidth={1.75}
                        className="group-hover:translate-x-0.5 transition-transform"
                        aria-hidden="true"
                      />
                    </div>
                  </Link>
                </AnimatedCard>

                {/* Card 4: AI Mental Support */}
                <AnimatedCard index={4} ready={ready} reducedMotion={prefersReducedMotion} className="h-full">
                  <Link
                    href="/ai-companion"
                    prefetch={false}
                    className={`group h-full p-5 rounded-lg bg-surface border border-line shadow-xs hover:border-line-strong hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between min-h-[170px] ${focusRing}`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="w-10 h-10 rounded-md bg-tint flex items-center justify-center text-fg-brand">
                          <MessageCircle
                            size={20}
                            strokeWidth={1.75}
                            aria-hidden="true"
                          />
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full bg-tint text-fg-brand text-xs font-semibold">
                          Siaga 24 Jam
                        </span>
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-fg group-hover:text-fg-brand transition-colors">
                          AI Mental Support
                        </h3>
                        <p className="text-xs text-fg-muted mt-1 leading-relaxed">
                          Pendamping Ramah Anak &amp; Deteksi Dini Krisis
                        </p>
                      </div>
                    </div>
                    <div className="pt-3 flex items-center gap-1 text-fg-brand text-xs font-semibold">
                      <span>Mulai Bicara</span>
                      <ArrowRight
                        size={14}
                        strokeWidth={1.75}
                        className="group-hover:translate-x-0.5 transition-transform"
                        aria-hidden="true"
                      />
                    </div>
                  </Link>
                </AnimatedCard>

                {/* Card 5: Mood & Food AI */}
                <AnimatedCard index={5} ready={ready} reducedMotion={prefersReducedMotion} className="h-full">
                  <Link
                    href="/mood-food"
                    prefetch={false}
                    className={`group h-full p-5 rounded-lg bg-surface border border-line shadow-xs hover:border-line-strong hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between min-h-[170px] ${focusRing}`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="w-10 h-10 rounded-md bg-tint flex items-center justify-center text-fg-brand">
                          <Camera
                            size={20}
                            strokeWidth={1.75}
                            aria-hidden="true"
                          />
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full bg-accent-50 border border-accent-200 text-fg-accent text-xs font-semibold">
                          +40 XP
                        </span>
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-fg group-hover:text-fg-brand transition-colors">
                          Mood &amp; Food AI
                        </h3>
                        <p className="text-xs text-fg-muted mt-1 leading-relaxed">
                          Analisis Emosi Harian &amp; Nutrisi Pangan Lokal
                        </p>
                      </div>
                    </div>
                    <div className="pt-3 flex items-center gap-1 text-fg-brand text-xs font-semibold">
                      <span>Unggah Foto</span>
                      <ArrowRight
                        size={14}
                        strokeWidth={1.75}
                        className="group-hover:translate-x-0.5 transition-transform"
                        aria-hidden="true"
                      />
                    </div>
                  </Link>
                </AnimatedCard>

                {/* Card 6: Offline Survival Mode */}
                <AnimatedCard index={6} ready={ready} reducedMotion={prefersReducedMotion} className="h-full">
                  <Link
                    href="/offline-survival"
                    prefetch={false}
                    className={`group h-full p-5 rounded-lg bg-surface border border-line shadow-xs hover:border-line-strong hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between min-h-[170px] ${focusRing}`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="w-10 h-10 rounded-md bg-tint flex items-center justify-center text-fg-brand">
                          <WifiOff
                            size={20}
                            strokeWidth={1.75}
                            aria-hidden="true"
                          />
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full bg-sunken border border-line text-fg text-xs font-semibold">
                          {offlineMeta ? "Tersinkronisasi" : "Akses Mandiri"}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-fg group-hover:text-fg-brand transition-colors">
                          Offline Survival Mode
                        </h3>
                        <p className="text-xs text-fg-muted mt-1 leading-relaxed">
                          Panduan Darurat Fisik &amp; PFA Tanpa Sinyal Internet
                        </p>
                      </div>
                    </div>
                    <div className="pt-3 flex items-center gap-1 text-fg-brand text-xs font-semibold">
                      <span>Buka Panduan</span>
                      <ArrowRight
                        size={14}
                        strokeWidth={1.75}
                        className="group-hover:translate-x-0.5 transition-transform"
                        aria-hidden="true"
                      />
                    </div>
                  </Link>
                </AnimatedCard>
              </div>
            </section>

            {/* SECTION 2: Target Harian Resiliensi */}
            <section
              aria-labelledby="section-target-harian"
              className="space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Award
                    size={22}
                    strokeWidth={1.75}
                    className="text-fg-accent shrink-0"
                    aria-hidden="true"
                  />
                  <div>
                    <h2
                      id="section-target-harian"
                      className="text-xl font-semibold text-fg"
                    >
                      Target Harian Resiliensi
                    </h2>
                    <p className="text-xs sm:text-sm text-fg-muted">
                      Selesaikan aktivitas untuk menumbuhkan Pohon Harapan hari
                      ini
                    </p>
                  </div>
                </div>
                <span className="text-xs px-3 py-1 bg-sunken border border-line rounded-full text-fg-muted font-medium">
                  {completedDailyCount} dari 3 Selesai
                </span>
              </div>

              {goalFeedback && (
                <p
                  role="status"
                  className="text-xs font-medium text-success bg-tint border border-[var(--brand-200)] rounded-md px-3.5 py-2"
                >
                  {goalFeedback}
                </p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Target 1: Jurnal Hikmah */}
                <AnimatedCard index={7} ready={ready} reducedMotion={prefersReducedMotion} className="h-full">
                  <div
                    className={`h-full p-5 rounded-lg bg-surface border border-line shadow-xs flex items-start justify-between gap-3 ${
                      journaledToday ? "border-l-4 border-l-action" : ""
                    }`}
                  >
                    <div className="space-y-2 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-base font-semibold text-fg">
                          Jurnal Hikmah
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-tint text-fg-brand text-xs font-semibold">
                          +50 XP
                        </span>
                      </div>
                      <p className="text-xs text-fg-muted leading-relaxed">
                        Catat 1 hal yang kamu rasakan atau syukuri hari ini.
                      </p>
                      {journaledToday ? (
                        <span className="inline-flex items-center gap-1 text-success text-xs font-semibold pt-1">
                          <CheckCircle2
                            size={15}
                            strokeWidth={1.75}
                            aria-hidden="true"
                          />
                          <span>
                            Selesai hari ini
                            {journalTimeLabel ? ` (${journalTimeLabel})` : ""}
                          </span>
                        </span>
                      ) : (
                        <Link
                          href="/jurnal"
                          className={`inline-flex items-center justify-center gap-1.5 min-h-11 px-3.5 rounded-md bg-sunken hover:bg-tint text-fg-brand text-xs font-semibold transition-colors ${focusRing}`}
                        >
                          <span>Tulis Jurnal</span>
                        </Link>
                      )}
                    </div>
                    <span className="inline-flex items-center justify-center min-w-11 min-h-11 -mr-2 -mt-1 rounded-lg shrink-0">
                      <input
                        type="checkbox"
                        checked={journaledToday}
                        disabled
                        aria-label="Status target Jurnal Hikmah hari ini"
                        className="w-5 h-5 accent-action rounded shrink-0"
                      />
                    </span>
                  </div>
                </AnimatedCard>

                {/* Target 2: Latihan Napas */}
                <AnimatedCard index={8} ready={ready} reducedMotion={prefersReducedMotion} className="h-full">
                  <div
                    className={`h-full p-5 rounded-lg bg-surface border border-line shadow-xs flex items-start justify-between gap-3 ${
                      breathedToday ? "border-l-4 border-l-action" : ""
                    }`}
                  >
                    <div className="space-y-2 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-base font-semibold text-fg">
                          Latihan Napas
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-sunken border border-line text-fg-muted text-xs font-semibold">
                          +15 XP
                        </span>
                      </div>
                      <p className="text-xs text-fg-muted leading-relaxed">
                        Ikuti panduan tarik dan hembuskan napas sesuai kenyamananmu.
                      </p>
                      <Link
                        href="/game-breath"
                        className={`inline-flex items-center justify-center gap-1.5 min-h-11 px-3.5 rounded-md bg-sunken hover:bg-tint text-fg-brand text-xs font-semibold transition-colors ${focusRing}`}
                      >
                        <Wind size={15} strokeWidth={1.75} aria-hidden="true" />
                        <span>Mulai Latihan</span>
                      </Link>
                    </div>
                    <label
                      htmlFor="task-napas"
                      className="inline-flex items-center justify-center min-w-11 min-h-11 -mr-2 -mt-1 rounded-lg hover:bg-sunken cursor-pointer shrink-0 transition-colors"
                    >
                      <input
                        id="task-napas"
                        type="checkbox"
                        checked={breathedToday}
                        disabled={breathedToday || recordingBreath}
                        onChange={(e) =>
                          handleToggleBreathingGoal(e.target.checked)
                        }
                        aria-label="Tandai Latihan Napas selesai hari ini"
                        className={`w-5 h-5 accent-action rounded shrink-0 cursor-pointer ${focusRing}`}
                      />
                    </label>
                  </div>
                </AnimatedCard>

                {/* Target 3: Meditasi Budaya */}
                <AnimatedCard index={9} ready={ready} reducedMotion={prefersReducedMotion} className="h-full">
                  <div
                    className={`h-full p-5 rounded-lg bg-surface border border-line shadow-xs flex items-start justify-between gap-3 ${
                      meditationChecked ? "border-l-4 border-l-action" : ""
                    }`}
                  >
                    <div className="space-y-2 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-base font-semibold text-fg">
                          Meditasi Budaya
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-sunken border border-line text-fg-muted text-xs font-semibold">
                          +40 XP
                        </span>
                      </div>
                      <p className="text-xs text-fg-muted leading-relaxed">
                        Simulasi tenang dan refleksi kearifan lokal Nusantara.
                      </p>
                      <Link
                        href="/game-healing"
                        className={`inline-flex items-center justify-center gap-1.5 min-h-11 px-3.5 rounded-md bg-sunken hover:bg-tint text-fg-brand text-xs font-semibold transition-colors ${focusRing}`}
                      >
                        <Headphones
                          size={15}
                          strokeWidth={1.75}
                          aria-hidden="true"
                        />
                        <span>Buka Aktivitas</span>
                      </Link>
                    </div>
                    <label
                      htmlFor="task-meditasi"
                      className="inline-flex items-center justify-center min-w-11 min-h-11 -mr-2 -mt-1 rounded-lg hover:bg-sunken cursor-pointer shrink-0 transition-colors"
                    >
                      <input
                        id="task-meditasi"
                        type="checkbox"
                        checked={meditationChecked}
                        onChange={(e) =>
                          handleToggleMeditationGoal(e.target.checked)
                        }
                        aria-label="Tandai Meditasi Budaya selesai hari ini"
                        className={`w-5 h-5 accent-action rounded shrink-0 cursor-pointer ${focusRing}`}
                      />
                    </label>
                  </div>
                </AnimatedCard>
              </div>
            </section>

            {/* SECTION 3: Game Center Resiliensi */}
            <section
              aria-labelledby="section-game-center"
              className="space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Gamepad2
                    size={22}
                    strokeWidth={1.75}
                    className="text-fg-brand shrink-0"
                    aria-hidden="true"
                  />
                  <div>
                    <h2
                      id="section-game-center"
                      className="text-xl font-semibold text-fg"
                    >
                      Game Center Resiliensi
                    </h2>
                    <p className="text-xs sm:text-sm text-fg-muted">
                      Simulasi interaktif kesiapsiagaan bencana &amp; relaksasi
                      motorik anak
                    </p>
                  </div>
                </div>
                <Link
                  href="/#game-showcase"
                  className={`text-sm font-semibold text-fg-brand hover:underline inline-flex items-center gap-1 min-h-11 px-2 ${focusRing}`}
                >
                  <span>Lihat Semua Game</span>
                  <ArrowRight size={15} strokeWidth={1.75} aria-hidden="true" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {/* Game 1: Sigap Bencana */}
                <AnimatedCard index={10} ready={ready} reducedMotion={prefersReducedMotion} className="h-full">
                  <div className="h-full rounded-lg bg-surface border border-line p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-tint text-fg-brand text-xs font-semibold">
                          Jelajah &amp; Belajar
                        </span>
                        <span className="text-xs text-fg-subtle">Mitigasi</span>
                      </div>
                      <div className="w-11 h-11 rounded-md bg-emphasis text-white flex items-center justify-center">
                        <ShieldAlert
                          size={22}
                          strokeWidth={1.75}
                          aria-hidden="true"
                        />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-fg">
                          Sigap Bencana
                        </h3>
                        <p className="text-xs text-fg-muted mt-1 leading-relaxed">
                          Jelajahi rumah, pelajari tiga langkah siaga, dan
                          temukan pintu keluar. Kontrol keyboard atau sentuhan.
                        </p>
                      </div>
                    </div>
                    <div className="pt-4 mt-3 border-t border-line flex items-center justify-between gap-2">
                      <span className="text-xs text-fg-subtle">
                        Tiga langkah · +20 XP/hari
                      </span>
                      <Link
                        href="/game-quake"
                        prefetch={false}
                        className={`inline-flex items-center justify-center min-h-11 px-4 rounded-md bg-action hover:bg-action-hover text-white text-xs font-semibold transition-colors ${focusRing}`}
                      >
                        Mainkan
                      </Link>
                    </div>
                  </div>
                </AnimatedCard>

                {/* Game 2: Tas Siaga Bencana */}
                <AnimatedCard index={11} ready={ready} reducedMotion={prefersReducedMotion} className="h-full">
                  <div className="h-full rounded-lg bg-surface border border-line p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-sunken border border-line text-fg-muted text-xs font-semibold">
                          Latihan &amp; Tantangan
                        </span>
                        <span className="text-xs text-fg-subtle">
                          Ketangkasan
                        </span>
                      </div>
                      <div className="w-11 h-11 rounded-md bg-tint text-fg-brand flex items-center justify-center">
                        <Backpack
                          size={22}
                          strokeWidth={1.75}
                          aria-hidden="true"
                        />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-fg">
                          Tas Siaga Bencana
                        </h3>
                        <p className="text-xs text-fg-muted mt-1 leading-relaxed">
                          Kenali enam perlengkapan utama. Mainkan dengan sentuhan
                          atau mouse; kamera tersedia sebagai pilihan.
                        </p>
                      </div>
                    </div>
                    <div className="pt-4 mt-3 border-t border-line flex items-center justify-between gap-2">
                      <span className="text-xs text-fg-subtle">
                        ±2 menit · +20 XP/hari
                      </span>
                      <Link
                        href="/game-healing"
                        prefetch={false}
                        className={`inline-flex items-center justify-center min-h-11 px-4 rounded-md bg-sunken hover:bg-tint text-fg-brand text-xs font-semibold transition-colors ${focusRing}`}
                      >
                        Mainkan
                      </Link>
                    </div>
                  </div>
                </AnimatedCard>

                {/* Game 3: Adventure Budaya */}
                <AnimatedCard index={12} ready={ready} reducedMotion={prefersReducedMotion} className="h-full">
                  <div className="h-full rounded-lg bg-surface border border-line p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-sunken border border-line text-fg-muted text-xs font-semibold">
                          Naratif
                        </span>
                        <span className="text-xs text-fg-subtle">Eksplorasi</span>
                      </div>
                      <div className="w-11 h-11 rounded-md bg-sunken text-fg flex items-center justify-center">
                        <Compass
                          size={22}
                          strokeWidth={1.75}
                          aria-hidden="true"
                        />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-fg">
                          Adventure Budaya
                        </h3>
                        <p className="text-xs text-fg-muted mt-1 leading-relaxed">
                          Jelajahi kisah Nusantara dan pelajari peringatan dini
                          kearifan lokal.
                        </p>
                      </div>
                    </div>
                    <div className="pt-4 mt-3 border-t border-line flex items-center justify-between gap-2">
                      <span className="text-xs text-fg-subtle">
                        Cerita Interaktif
                      </span>
                      <Link
                        href="/game-adventure"
                        prefetch={false}
                        className={`inline-flex items-center justify-center min-h-11 px-4 rounded-md bg-sunken hover:bg-tint text-fg-brand text-xs font-semibold transition-colors ${focusRing}`}
                      >
                        Lanjut
                      </Link>
                    </div>
                  </div>
                </AnimatedCard>

                {/* Game 4: Roleplay Psikoedukasi (Emphasis Card) */}
                <AnimatedCard index={13} ready={ready} reducedMotion={prefersReducedMotion} className="h-full">
                  <div className="h-full rounded-lg bg-emphasis text-white p-5 shadow-sm flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-surface text-fg text-xs font-semibold">
                          Latihan Empati
                        </span>
                        <span className="text-xs text-white/85">
                          Psikoedukasi
                        </span>
                      </div>
                      <div className="w-11 h-11 rounded-md bg-action text-white flex items-center justify-center">
                        <HeartHandshake
                          size={22}
                          strokeWidth={1.75}
                          aria-hidden="true"
                        />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-white">
                          Roleplay Psikoedukasi
                        </h3>
                        <p className="text-xs text-white/85 mt-1 leading-relaxed">
                          Simulasi percakapan emosi dan melatih empati kepada
                          teman yang takut.
                        </p>
                      </div>
                    </div>
                    <div className="pt-4 mt-3 border-t border-white/20 flex items-center justify-between gap-2">
                      <span className="text-xs text-white/85">
                        Jalur Pemulihan
                      </span>
                      <Link
                        href="/roleplay"
                        prefetch={false}
                        className={`inline-flex items-center justify-center min-h-11 px-4 rounded-md bg-surface hover:bg-sunken text-fg text-xs font-semibold transition-colors ${focusRing}`}
                      >
                        Buka Sesi
                      </Link>
                    </div>
                  </div>
                </AnimatedCard>

                {/* Game 5: Siaga Minang */}
                <AnimatedCard index={14} ready={ready} reducedMotion={prefersReducedMotion} className="h-full">
                  <div className="h-full rounded-lg bg-surface border border-line p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-sunken border border-line text-fg-muted text-xs font-semibold">
                          Taktikal
                        </span>
                        <span className="text-xs text-fg-subtle">Motorik</span>
                      </div>
                      <div className="w-11 h-11 rounded-md bg-tint text-fg-brand flex items-center justify-center">
                        <Home size={22} strokeWidth={1.75} aria-hidden="true" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-fg">
                          Siaga Minang
                        </h3>
                        <p className="text-xs text-fg-muted mt-1 leading-relaxed">
                          Jelajahi tiga pos, kumpulkan 10 perlengkapan, dan
                          berlatih melompat. Bisa dimainkan lewat keyboard atau sentuhan.
                        </p>
                      </div>
                    </div>
                    <div className="pt-4 mt-3 border-t border-line flex items-center justify-between gap-2">
                      <span className="text-xs text-fg-subtle">
                        Tiga pos · +20 XP/hari
                      </span>
                      <Link
                        href="/game-siagaminang"
                        prefetch={false}
                        className={`inline-flex items-center justify-center min-h-11 px-4 rounded-md bg-sunken hover:bg-tint text-fg-brand text-xs font-semibold transition-colors ${focusRing}`}
                      >
                        Masuk
                      </Link>
                    </div>
                  </div>
                </AnimatedCard>

                {/* Game 6: Breathing Calm */}
                <AnimatedCard index={15} ready={ready} reducedMotion={prefersReducedMotion} className="h-full">
                  <div className="h-full rounded-lg bg-surface border border-line p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-sunken border border-line text-fg-muted text-xs font-semibold">
                          Panduan Visual
                        </span>
                        <span className="text-xs text-fg-subtle">Relaksasi</span>
                      </div>
                      <div className="w-11 h-11 rounded-md bg-tint text-fg-brand flex items-center justify-center">
                        <Wind size={22} strokeWidth={1.75} aria-hidden="true" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-fg">
                          Napas Tenang
                        </h3>
                        <p className="text-xs text-fg-muted mt-1 leading-relaxed">
                          Ikuti lingkaran napas, jeda kapan saja. Kamera opsional
                          sebagai cermin latihan.
                        </p>
                      </div>
                    </div>
                    <div className="pt-4 mt-3 border-t border-line flex items-center justify-between gap-2">
                      <span className="text-xs text-fg-subtle">30–64 detik · +15 XP/hari</span>
                      <Link
                        href="/game-breath"
                        prefetch={false}
                        className={`inline-flex items-center justify-center min-h-11 px-4 rounded-md bg-sunken hover:bg-tint text-fg-brand text-xs font-semibold transition-colors ${focusRing}`}
                      >
                        Bernapas
                      </Link>
                    </div>
                  </div>
                </AnimatedCard>
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN (Sidebar Widgets - 4 Columns) */}
          <aside className="lg:col-span-4 space-y-6">
            {/* Widget 1: Hope Tree Progress Widget */}
            <AnimatedCard index={2} ready={ready} reducedMotion={prefersReducedMotion}>
              <div className="bg-surface border border-line rounded-xl p-6 lg:p-7 shadow-sm text-center space-y-5">
              <div className="space-y-1">
                <span className="text-xs text-fg-subtle uppercase tracking-[0.06em] block font-semibold">
                  Progress Resiliensi
                </span>
                <h2 className="text-lg font-semibold text-fg">
                  Pohon Harapan milik {user?.childName || "Anda"}
                </h2>
              </div>

              {/* Stylized Tree Emblem */}
              <div className="py-2 flex items-center justify-center">
                <div
                  className="w-44 h-44 rounded-full bg-tint border border-[var(--brand-200)] flex items-center justify-center"
                  aria-label={`Pohon Harapan Level ${activeLevel} dari 5`}
                >
                  <TreePine
                    size={treeSize}
                    strokeWidth={1.5}
                    className="text-fg-brand transition-all duration-300"
                    aria-hidden="true"
                  />
                </div>
              </div>

              {/* Stepper Dots Level */}
              <div className="space-y-2">
                <div
                  className="flex items-center justify-center gap-2.5"
                  role="presentation"
                >
                  {[...Array(5)].map((_, i) => (
                    <span
                      key={i}
                      className={`rounded-full transition-colors ${
                        i < activeLevel
                          ? "w-3 h-3 bg-[var(--brand-500)]"
                          : "w-2.5 h-2.5 bg-neutral-200"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm font-semibold text-fg">
                  Level {activeLevel} dari 5:{" "}
                  {treeStats?.stageName || "Benih Tertanam"}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5 text-left">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-fg font-semibold">
                    {treeStats?.levelName || "Lv 1: Benih Asa"}
                  </span>
                  <span className="text-fg-brand font-semibold">
                    {activeXp} XP ({activePercent}%)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--brand-500)] rounded-full transition-all duration-700"
                    style={{ width: `${ready ? activePercent : 0}%` }}
                  />
                </div>
                <p className="text-xs text-fg-muted text-center pt-1">
                  {activeLevel >= 5
                    ? "Level tertinggi telah tercapai."
                    : `Tersisa ${remainingXp} XP menuju ${
                        treeStats?.nextLevelName || "Lv 2: Tunas Muda"
                      }`}
                </p>
              </div>

              {/* Stats 2x2 Grid */}
              <p className="text-xs text-fg-muted">
                Kontribusi Game Center: {treeStats?.gameXp ?? 0} XP
              </p>
              <div className="p-4 rounded-lg bg-sunken border border-line grid grid-cols-2 gap-3 text-left">
                <div>
                  <span className="text-xs text-fg-muted block">
                    Jurnal Hikmah
                  </span>
                  <span className="text-base font-semibold text-fg">
                    {treeStats?.journalCount ?? 0}{" "}
                    <span className="text-xs text-fg-muted font-normal">
                      entri
                    </span>
                  </span>
                </div>
                <div>
                  <span className="text-xs text-fg-muted block">
                    Siram Pohon
                  </span>
                  <span className="text-base font-semibold text-fg">
                    {treeStats?.waterCount ?? 0}{" "}
                    <span className="text-xs text-fg-muted font-normal">
                      kali
                    </span>
                  </span>
                </div>
                <div>
                  <span className="text-xs text-fg-muted block">
                    Latihan Napas
                  </span>
                  <span className="text-base font-semibold text-fg">
                    {treeStats?.breatheCount ?? 0}{" "}
                    <span className="text-xs text-fg-muted font-normal">
                      sesi
                    </span>
                  </span>
                </div>
                <div>
                  <span className="text-xs text-fg-muted block">
                    Skrining DASS
                  </span>
                  <span className="text-base font-semibold text-fg">
                    {treeStats?.screeningCount ?? 0}{" "}
                    <span className="text-xs text-fg-muted font-normal">
                      kali
                    </span>
                  </span>
                </div>
              </div>

              {/* Big Primary CTA Button: Siram Pohon (+20 XP) */}
              <button
                id="btn-water-tree"
                type="button"
                onClick={handleWaterTree}
                disabled={watering || Boolean(treeStats?.wateredToday)}
                className={`w-full min-h-12 px-5 rounded-md bg-action hover:bg-action-hover disabled:bg-sunken disabled:text-neutral-400 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${focusRing}`}
              >
                <Droplets size={18} strokeWidth={1.75} aria-hidden="true" />
                <span>
                  {watering
                    ? "Menyiram Pohon..."
                    : treeStats?.wateredToday
                      ? "Pohon Telah Disiram Hari Ini"
                      : "Siram Pohon (+20 XP)"}
                </span>
              </button>

              {waterMsg && (
                <p
                  role="status"
                  className="text-xs font-medium text-fg-brand bg-tint border border-[var(--brand-200)] rounded-md px-3 py-2"
                >
                  {waterMsg}
                </p>
              )}
              </div>
            </AnimatedCard>

            {/* Widget 2: Family Preparedness Mini Widget (Safety Passport Snapshot) */}
            <AnimatedCard index={5} ready={ready} reducedMotion={prefersReducedMotion}>
              <div className="bg-surface border border-line rounded-lg p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Users
                    size={18}
                    strokeWidth={1.75}
                    className="text-fg-brand"
                    aria-hidden="true"
                  />
                  <h3 className="text-base font-semibold text-fg">
                    Kesiapsiagaan Keluarga
                  </h3>
                </div>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-tint text-fg-brand font-semibold">
                  Terlindungi
                </span>
              </div>

              <div className="space-y-2.5">
                <Link
                  href="/safety-passport"
                  className={`p-3 rounded-md bg-sunken border border-line hover:border-line-strong flex items-center justify-between gap-2 transition-colors ${focusRing}`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <MapPin
                      size={17}
                      strokeWidth={1.75}
                      className="text-fg-brand shrink-0"
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-fg block">
                        Titik Kumpul Utama
                      </span>
                      <span className="text-xs text-fg-muted truncate block">
                        {summary?.passportSummary.primaryMeetingPoint?.name ||
                          "Belum ditetapkan (isi di Paspor)"}
                      </span>
                    </div>
                  </div>
                  <ChevronRight
                    size={16}
                    strokeWidth={1.75}
                    className="text-fg-subtle shrink-0"
                    aria-hidden="true"
                  />
                </Link>

                <Link
                  href="/safety-passport"
                  className={`p-3 rounded-md bg-sunken border border-line hover:border-line-strong flex items-center justify-between gap-2 transition-colors ${focusRing}`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Phone
                      size={17}
                      strokeWidth={1.75}
                      className="text-fg-brand shrink-0"
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-fg block">
                        {summary?.passportSummary.primaryContact
                          ? `Kontak Utama (${summary.passportSummary.primaryContact.relationship})`
                          : "Kontak Wali Utama"}
                      </span>
                      <span className="text-xs text-fg-muted truncate block">
                        {summary?.passportSummary.primaryContact
                          ? `${summary.passportSummary.primaryContact.name} (${summary.passportSummary.primaryContact.phone})`
                          : "Belum ditambahkan"}
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-sm bg-surface border border-line text-fg text-xs font-medium shrink-0">
                    {summary?.passportSummary.contactsCount
                      ? `${summary.passportSummary.contactsCount} kontak`
                      : "Isi"}
                  </span>
                </Link>
              </div>
              </div>
            </AnimatedCard>

            {/* Widget 3: SafeConnect 119 Hotline Card (Trauma-Informed Support) */}
            <AnimatedCard index={8} ready={ready} reducedMotion={prefersReducedMotion}>
              <div className="bg-accent-50 border border-accent-200 rounded-lg p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-fg">
                <HeartHandshake
                  size={20}
                  strokeWidth={1.75}
                  className="text-fg-accent shrink-0"
                  aria-hidden="true"
                />
                <h3 className="text-base font-semibold text-fg">
                  Siaga Darurat PFA 24 Jam
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-fg-muted leading-relaxed">
                Jika kamu atau temanmu merasa sangat panik, sedih mendalam, atau
                butuh teman bicara saat ini, layanan konseling Healing119 siap
                mendengar.
              </p>
              <div className="pt-1 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-fg-accent">
                  Layanan Kemenkes 24/7
                </span>
                <a
                  href="tel:119"
                  className={`inline-flex items-center justify-center gap-1.5 min-h-11 px-4 rounded-md bg-action hover:bg-action-hover text-white text-xs font-semibold transition-colors ${focusRing}`}
                >
                  <Phone size={15} strokeWidth={1.75} aria-hidden="true" />
                  <span>Hubungi 119 Ext 8</span>
                </a>
              </div>
              </div>
            </AnimatedCard>
          </aside>
        </div>
      </div>

      {/* ================= SAFECONNECT FOOTER BAR (CONSISTENT WITH REFERENCE) ================= */}
      <footer className="w-full bg-sunken border-t border-line mt-8">
        <div className="bg-emphasis text-white py-3.5 px-4 sm:px-6 lg:px-12">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-center sm:text-left">
              <ShieldCheck
                size={18}
                strokeWidth={1.75}
                aria-hidden="true"
                className="shrink-0"
              />
              <span className="text-xs sm:text-sm font-semibold">
                Layanan Darurat Psikososial SafeConnect 119
              </span>
              <span className="hidden md:inline text-white/80 text-xs">
                | Bantuan PFA Tanggap Bencana &amp; Trauma Anak
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-0.5 rounded-full bg-surface text-fg text-xs font-semibold">
                Bebas Pulsa 24/7
              </span>
              <a
                href="tel:119"
                className={`inline-flex items-center min-h-11 px-2 text-xs sm:text-sm text-white underline underline-offset-4 font-semibold hover:text-white/90 ${focusRing}`}
              >
                Hubungi 119 Ext 8
              </a>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold text-fg">PERMATA</span>
              </div>
              <p className="text-xs sm:text-sm text-fg-muted max-w-lg leading-relaxed">
                Platform digital Psychological First Aid (PFA) dan pemulihan
                pascatrauma ramah anak berbasis kearifan lokal Nusantara.
              </p>
              <div className="p-4 rounded-lg bg-surface border border-line max-w-lg">
                <span className="text-xs text-fg-accent font-semibold uppercase tracking-wider block mb-1">
                  Petuah Hikmah
                </span>
                <p className="text-xs sm:text-sm text-fg font-serif italic">
                  {culture === "aceh"
                    ? "“Bungoeng jeumpa meugisa meutaloe, saboh hatee peugot gampong.”"
                    : "“Mambangkik Batang Tarandam: membangkitkan asa yang terpendam bersama komunitas.”"}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <span className="text-sm font-semibold text-fg block">
                Modul &amp; Aktivitas
              </span>
              <ul className="space-y-2 text-xs sm:text-sm text-fg-muted">
                <li>
                  <Link
                    href="/jurnal"
                    className={`hover:text-fg-brand ${focusRing}`}
                  >
                    Jurnal Hikmah
                  </Link>
                </li>
                <li>
                  <Link
                    href="/safety-passport"
                    className={`hover:text-fg-brand ${focusRing}`}
                  >
                    My Safety Passport
                  </Link>
                </li>
                <li>
                  <Link
                    href="/tele-screening"
                    className={`hover:text-fg-brand ${focusRing}`}
                  >
                    Tele-Screening DASS-21
                  </Link>
                </li>
                <li>
                  <Link
                    href="/offline-survival"
                    className={`hover:text-fg-brand ${focusRing}`}
                  >
                    Offline Survival Mode
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <span className="text-sm font-semibold text-fg block">
                Privasi &amp; Keselamatan
              </span>
              <p className="text-xs sm:text-sm text-fg-muted leading-relaxed">
                Data refleksi, My Safety Passport, dan progres Pohon Harapan
                disimpan terpisah per akun pengguna.
              </p>
              <div className="flex items-center gap-2 pt-1 text-fg-muted">
                <ShieldCheck
                  size={16}
                  strokeWidth={1.75}
                  className="text-success"
                  aria-hidden="true"
                />
                <span className="text-xs font-medium">
                  Isolasi Data Per Akun Aktif
                </span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
