"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useCulture } from "@/context/CultureContext";
import { useAuth } from "@/context/AuthContext";
import { HopeTree } from "@/components/HopeTree";
import {
  Users,
  ShieldCheck,
  Trophy,
  Gamepad2,
  MessageCircle,
  Camera,
  WifiOff,
  Lock,
  Droplets,
  LogIn,
} from "lucide-react";
import Link from "next/link";

const Dashboard = () => {
  const { culture } = useCulture();
  const { user, treeStats, isLoading: authLoading, setTreeStats } = useAuth();
  const [watering, setWatering] = useState(false);
  const [waterMsg, setWaterMsg] = useState<string | null>(null);

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

  const activeLevel = user && treeStats ? treeStats.level : 1;
  const activePercent = user && treeStats ? treeStats.progressPercent : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32 }}
      className="max-w-7xl mx-auto px-6 md:px-8 py-10 md:py-16"
    >
      {/* ================= TOP SECTION ================= */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* LEFT SIDE */}
        <div className="lg:col-span-2 space-y-8">
          {/* Banner Header */}
          <header className="bg-tint border border-[var(--brand-200)] rounded-xl p-8 md:p-10 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl md:text-3xl font-semibold text-fg">
                  {user
                    ? `Halo, ${user.fullName}!`
                    : "Halo, Penyintas Tangguh!"}
                </h2>
                <p className="mt-2 text-base text-fg-muted">
                  {culture === "aceh"
                    ? '"Peugah hal nyang na, peubuet nyang baik" - Katakanlah yang ada, perbuatlah yang baik.'
                    : '"Mambangkik Batang Tarandam" - Semangat bangkit dari keterpurukan.'}
                </p>
              </div>
              {!authLoading && !user && (
                <Link
                  href="/login?next=/dashboard"
                  className="inline-flex items-center justify-center gap-2 min-h-11 px-5 rounded-md bg-action hover:bg-action-hover text-white text-sm font-medium transition-colors shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
                >
                  <LogIn size={16} strokeWidth={1.75} aria-hidden="true" />
                  <span>Masuk Akun</span>
                </Link>
              )}
            </div>
          </header>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* My Safety Passport */}
            <Link
              href="/safety-passport"
              prefetch={false}
              className="bg-surface border border-line rounded-lg p-6 shadow-xs hover:border-line-strong hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group focus-visible:outline-2 focus-visible:outline-action"
            >
              <Lock size={24} strokeWidth={1.75} className="text-fg-brand mb-4" />
              <h4 className="text-base font-semibold text-fg">
                My Safety Passport
              </h4>
              <p className="text-xs text-fg-muted mt-1 leading-relaxed">
                {user
                  ? "Data Keluarga & Titik Kumpul Pribadi"
                  : "Dilindungi Akun (Masuk untuk Akses)"}
              </p>
            </Link>

            {/* Forum — no link (not clickable in original) */}
            <div className="bg-surface border border-line rounded-lg p-6 shadow-xs hover:border-line-strong hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
              <Users size={24} className="text-fg-brand mb-4" />
              <h4 className="text-base font-semibold text-fg">
                {culture === "aceh" ? "Saweu Syedara" : "Badunsanak"}
              </h4>
              <p className="text-xs text-fg-muted mt-1 leading-relaxed">
                Forum Terkurasi &amp; Anonim
              </p>
            </div>

            {/* Tele Screening */}
            <Link
              href="/tele-screening"
              prefetch={false}
              className="bg-surface border border-line rounded-lg p-6 shadow-xs hover:border-line-strong hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group focus-visible:outline-2 focus-visible:outline-action"
            >
              <ShieldCheck size={24} className="text-fg-brand mb-4" />
              <h4 className="text-base font-semibold text-fg">
                Tele-Screening &amp; Triage
              </h4>
              <p className="text-xs text-fg-muted mt-1 leading-relaxed">
                Deteksi Risiko Berbasis AI
              </p>
            </Link>

            {/* AI Companion */}
            <Link
              href="/ai-companion"
              prefetch={false}
              className="bg-surface border border-line rounded-lg p-6 shadow-xs hover:border-line-strong hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group focus-visible:outline-2 focus-visible:outline-action"
            >
              <MessageCircle size={24} className="text-fg-brand mb-4" />
              <h4 className="text-base font-semibold text-fg">
                AI Mental Support Companion
              </h4>
              <p className="text-xs text-fg-muted mt-1 leading-relaxed">
                Hybrid AI + Crisis Detection
              </p>
            </Link>

            {/* Mood+Food Analyzer */}
            <Link
              href="/mood-food"
              prefetch={false}
              className="bg-surface border border-line rounded-lg p-6 shadow-xs hover:border-line-strong hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group focus-visible:outline-2 focus-visible:outline-action"
            >
              <Camera size={24} className="text-fg-brand mb-4" />
              <h4 className="text-base font-semibold text-fg">
                Mood + Food AI Analyzer
              </h4>
              <p className="text-xs text-fg-muted mt-1 leading-relaxed">
                Analisis Emosi &amp; Nutrisi Berbasis AI
              </p>
            </Link>

            {/* Offline Survival Mode */}
            <Link
              href="/offline-survival"
              prefetch={false}
              className="bg-surface border border-line rounded-lg p-6 shadow-xs hover:border-line-strong hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group focus-visible:outline-2 focus-visible:outline-action"
            >
              <WifiOff size={24} strokeWidth={1.75} className="text-fg-brand mb-4" />
              <h4 className="text-base font-semibold text-fg">
                Offline Survival Mode
              </h4>
              <p className="text-xs text-fg-muted mt-1 leading-relaxed">
                Panduan Darurat Fisik &amp; PFA Tanpa Internet
              </p>
            </Link>
          </div>
        </div>

        {/* RIGHT SIDE - HOPE TREE (PER-USER ISOLATED) */}
        <div className="bg-surface border border-line rounded-xl p-8 shadow-xs flex flex-col items-center">
          <h3 className="text-xs font-semibold tracking-[0.06em] text-fg-subtle uppercase mb-2">
            Progress Resiliensi
          </h3>
          {user && treeStats && (
            <p className="text-xs text-fg-muted mb-6 text-center">
              Pohon Harapan milik <strong className="text-fg">{user.childName}</strong>
            </p>
          )}
          {!user && (
            <p className="text-xs text-fg-muted mb-6 text-center">
              Masuk untuk menyimpan progres pribadi Anda
            </p>
          )}

          <HopeTree level={activeLevel} />

          {authLoading ? (
            <p className="mt-6 text-xs text-fg-muted">
              Memuat progres Pohon Harapan...
            </p>
          ) : user && treeStats ? (
            <div className="mt-6 w-full space-y-4">
              <div>
                <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--brand-500)] rounded-full transition-all duration-300"
                    style={{ width: `${activePercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-fg-subtle mt-2">
                  <span>{treeStats.levelName}</span>
                  <span>{treeStats.totalXp} XP ({activePercent}%)</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs bg-sunken border border-line rounded-md p-3">
                <div className="text-fg-muted">
                  Jurnal: <strong className="text-fg">{treeStats.journalCount}</strong>
                </div>
                <div className="text-fg-muted">
                  Siram: <strong className="text-fg">{treeStats.waterCount}</strong>
                </div>
                <div className="text-fg-muted">
                  Napas: <strong className="text-fg">{treeStats.breatheCount}</strong>
                </div>
                <div className="text-fg-muted">
                  Skrining: <strong className="text-fg">{treeStats.screeningCount ?? 0}</strong>
                </div>
              </div>

              <button
                type="button"
                onClick={handleWaterTree}
                disabled={watering || treeStats.wateredToday}
                className="w-full inline-flex items-center justify-center gap-2 min-h-11 px-4 rounded-md bg-action hover:bg-action-hover disabled:bg-sunken disabled:text-neutral-400 text-white text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
              >
                <Droplets size={16} strokeWidth={1.75} aria-hidden="true" />
                <span>
                  {watering
                    ? "Menyiram..."
                    : treeStats.wateredToday
                    ? "Sudah Disiram Hari Ini"
                    : "Siram Pohon (+20 XP)"}
                </span>
              </button>

              {waterMsg && (
                <p role="status" className="text-xs text-center text-fg-brand">
                  {waterMsg}
                </p>
              )}
            </div>
          ) : (
            <div className="mt-6 w-full space-y-3 text-center">
              <p className="text-xs text-fg-muted leading-relaxed">
                Setiap akun menyimpan level Pohon Harapan dan catatan jurnalnya
                sendiri agar data tidak tercampur.
              </p>
              <Link
                href="/login?next=/dashboard"
                className="w-full inline-flex items-center justify-center gap-2 min-h-11 px-4 rounded-md bg-action hover:bg-action-hover text-white text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
              >
                <LogIn size={16} strokeWidth={1.75} aria-hidden="true" />
                <span>Masuk untuk Lihat Progres</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ================= DAILY GOALS ================= */}
      <div className="mt-14">
        <div className="flex items-center gap-2 mb-6">
          <Trophy size={20} className="text-fg-brand" />
          <h3 className="text-xs font-semibold tracking-[0.06em] text-fg-subtle uppercase">
            Target Harian
          </h3>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            { title: "Jurnal Hikmah", xp: "+50 XP Refleksi", href: "/jurnal" },
            { title: "Latihan Napas", xp: "+30 XP Tenang", href: "/game-breath" },
            { title: "Meditasi Budaya", xp: "+40 XP Fokus", href: "/game-healing" },
          ].map((goal) => (
            <div
              key={goal.title}
              className="bg-surface border border-line rounded-lg p-5 flex items-center gap-4 hover:border-line-strong hover:shadow-sm transition-all duration-200"
            >
              <Link href={goal.href} prefetch={false} className="flex-1">
                <h5 className="font-medium text-fg">{goal.title}</h5>
                <p className="text-xs text-fg-muted mt-0.5">{goal.xp}</p>
              </Link>
              <input
                type="checkbox"
                defaultChecked={false}
                className="w-5 h-5 ml-auto accent-action rounded"
              />
            </div>
          ))}
        </div>
      </div>

      {/* ================= GAME CENTER ================= */}
      <div className="mt-14">
        <div className="flex items-center gap-2 mb-6">
          <Gamepad2 size={20} className="text-fg-brand" />
          <h3 className="text-xs font-semibold tracking-[0.06em] text-fg-subtle uppercase">
            Game Center Resiliensi
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 mt-6">
          <Link href="/game-quake" prefetch={false}>
            <div className="bg-surface border border-line rounded-lg p-6 shadow-xs hover:border-line-strong hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <h4 className="text-base font-semibold text-fg mb-1">
                Sigap Bencana
              </h4>
              <p className="text-xs text-fg-muted mt-1 leading-relaxed">
                Edukasi Mitigasi &amp; Respons Cepat
              </p>
            </div>
          </Link>

          <Link href="/game-healing" prefetch={false}>
            <div className="bg-surface border border-line rounded-lg p-6 shadow-xs hover:border-line-strong hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <h4 className="text-base font-semibold text-fg mb-1">
                Pinch and Drop
              </h4>
              <p className="text-xs text-fg-muted mt-1 leading-relaxed">
                Prepare before disaster
              </p>
            </div>
          </Link>

          <Link href="/game-adventure" prefetch={false}>
            <div className="bg-surface border border-line rounded-lg p-6 shadow-xs hover:border-line-strong hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <h4 className="text-base font-semibold text-fg mb-1">
                Adventure Budaya
              </h4>
              <p className="text-xs text-fg-muted mt-1 leading-relaxed">
                Roleplay Naratif Nusantara
              </p>
            </div>
          </Link>

          {/* Roleplay — emphasis card */}
          <Link href="/roleplay" prefetch={false}>
            <div className="bg-emphasis text-white rounded-lg p-6 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <h4 className="text-base font-semibold text-white mb-1">
                Roleplay Psikoedukasi
              </h4>
              <p className="text-xs text-white/75 mt-1 leading-relaxed">
                Simulasi Mental &amp; Growth Path
              </p>
            </div>
          </Link>

          <Link href="/game-siagaminang" prefetch={false}>
            <div className="bg-surface border border-line rounded-lg p-6 shadow-xs hover:border-line-strong hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <h4 className="text-base font-semibold text-fg mb-1">
                Siaga Minang
              </h4>
              <p className="text-xs text-fg-muted mt-1 leading-relaxed">
                Mempersiapkan tangkap sigap bencana dan melatih motorik
              </p>
            </div>
          </Link>

          <Link href="/game-breath" prefetch={false}>
            <div className="bg-surface border border-line rounded-lg p-6 shadow-xs hover:border-line-strong hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <h4 className="text-base font-semibold text-fg mb-1">
                Breathing Calm
              </h4>
              <p className="text-xs text-fg-muted mt-1 leading-relaxed">
                Latihan Nafas Anti Stress
              </p>
            </div>
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
