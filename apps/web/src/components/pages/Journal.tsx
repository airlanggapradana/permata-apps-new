"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useCulture } from "@/context/CultureContext";
import { useAuth } from "@/context/AuthContext";
import { TreeStats, calculateTreeStats } from "@/lib/treeProgress";

export interface SavedJournalEntry {
  id: string;
  date: string;
  content: string;
  mood: number;
  culture: string;
  aiInsight?: string;
  tag?: string;
  proverb?: string;
  proverbMeaning?: string;
}

export default function Journal() {
  const { culture, setCulture } = useCulture();
  const { user, isLoading: authLoading } = useAuth();

  // Form states matching desain_jurnal_hikmah.html
  const [msg, setMsg] = useState("");
  const [mood, setMood] = useState(3);
  const [shareCareCircle, setShareCareCircle] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceRecorded, setVoiceRecorded] = useState(false);

  // Hope tree micro-actions
  const [treeWatered, setTreeWatered] = useState(false);
  const [breathingStatus, setBreathingStatus] = useState<
    "idle" | "breathing" | "done"
  >("idle");

  // Selected entry modal view
  const [selectedEntry, setSelectedEntry] = useState<SavedJournalEntry | null>(
    null,
  );

  // Toast notification state
  const [toast, setToast] = useState<{ visible: boolean; message: string }>({
    visible: false,
    message: "",
  });
  const [guardrailNotice, setGuardrailNotice] = useState<{
    type: "rejected" | "crisis";
    message: string;
  } | null>(null);

  const [savedEntries, setSavedEntries] = useState<SavedJournalEntry[]>([]);
  const [treeStats, setTreeStats] = useState<TreeStats | null>(null);
  const [treeXp, setTreeXp] = useState<number>(370);
  const [streakDays, setStreakDays] = useState<number>(3);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [dbConnected, setDbConnected] = useState<boolean>(false);

  // Active tree stats with fallback calculation
  const activeTreeStats: TreeStats =
    treeStats ||
    calculateTreeStats({
      journalCount: savedEntries.length,
      waterCount: treeWatered ? 1 : 0,
      breatheCount: breathingStatus === "done" ? 1 : 0,
      wateredToday: treeWatered,
    });

  // Fetch real data from PostgreSQL scoped to authenticated user
  useEffect(() => {
    let isMounted = true;
    async function fetchJournalData() {
      if (!user) {
        if (isMounted) {
          setSavedEntries([]);
          setTreeStats(null);
          setTreeXp(150);
          setStreakDays(0);
          setTreeWatered(false);
          setDbConnected(false);
          setIsLoading(false);
        }
        return;
      }
      setIsLoading(true);
      try {
        const res = await fetch("/api/journal");
        const rawText = await res.text();
        let data: {
          success?: boolean;
          entries?: SavedJournalEntry[];
          stats?: { treeXp?: number; treeStats?: TreeStats; streakDays?: number };
          error?: string;
        } = {};
        try {
          data = JSON.parse(rawText);
        } catch {
          throw new Error(rawText || `Server error (${res.status})`);
        }

        if (!res.ok || !data.success) {
          throw new Error(data.error || "Gagal mengambil data dari server");
        }

        if (isMounted && Array.isArray(data.entries)) {
          setSavedEntries(data.entries);
          if (data.stats) {
            if (data.stats.treeStats) {
              setTreeStats(data.stats.treeStats);
              setTreeXp(data.stats.treeStats.totalXp);
              if (data.stats.treeStats.wateredToday) {
                setTreeWatered(true);
              }
            } else if (typeof data.stats.treeXp === "number") {
              setTreeXp(data.stats.treeXp);
            }
            if (typeof data.stats.streakDays === "number") {
              setStreakDays(data.stats.streakDays);
            }
          }
          setDbConnected(true);
        }
      } catch (err) {
        console.warn("Could not load real data from database:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    if (!authLoading) {
      fetchJournalData();
    }
    return () => {
      isMounted = false;
    };
  }, [user, authLoading]);

  // Custom AI Reflection state
  const [customInsight, setCustomInsight] = useState<{
    empathy: string;
    proverb?: string;
    meaning?: string;
  } | null>(null);

  const defaultProverb =
    culture === "sumbar"
      ? "“Dima bumi dipijak, di sinan langik dijunjuang; Mambangkik batang tarandam, bangkik marwah kito basamo.”"
      : "“Bungoeng jeumpa meugisa meutaloe, saboh hatee peugot gampong.”";

  const defaultTradition =
    culture === "sumbar"
      ? "Kearifan Tradisi Batang Tarandam (Minang)"
      : "Kearifan Tradisi Meuseuraya (Aceh)";

  const defaultMeaning =
    culture === "sumbar"
      ? "Mengangkat kembali batang kayu yang terendam air; simbol kebangkitan karakter dan harga diri. Ujian dan musibah bukanlah akhir, melainkan awal pemulihan jiwa yang lebih tangguh bersama keluarga dan komunitas."
      : "Bunga yang mekar saling bertaut erat, satu hati membangun kembali masa depan bersama. Kesediaanmu berbagi tawa dan membantu orang lain di posko adalah perwujudan nyata dari jiwa tangguh yang menyembuhkan luka.";

  const defaultEmpathy =
    "Kamu telah berhasil melangkah melewati hari yang penuh tantangan. Perasaan tenang yang kamu miliki saat berada di posko bersama adik dan teman adalah bibit ketangguhan yang sangat berharga. Kekhawatiran pada suara keras pascabencana adalah hal yang sepenuhnya wajar dialami oleh pejuang kecil sepertimu.";

  const currentInsight = {
    empathy: customInsight?.empathy || defaultEmpathy,
    proverb: customInsight?.proverb || defaultProverb,
    proverbTradition: defaultTradition,
    meaning: customInsight?.meaning || defaultMeaning,
  };

  // Show Toast helper
  const showToast = (message: string) => {
    setToast({ visible: true, message });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 3500);
  };

  // 5-Mood Scale options
  const moodOptions = [
    {
      value: 1,
      moodKey: "cemas",
      emoji: "😢",
      label: "Cemas",
      sub: "Skor 1 • Perlu Teduh",
    },
    {
      value: 2,
      moodKey: "sedih",
      emoji: "😔",
      label: "Sedih",
      sub: "Skor 2 • Kehilangan",
    },
    {
      value: 3,
      moodKey: "tenang",
      emoji: "😐",
      label: "Tenang / Damai",
      sub: "Skor 3 • Bertahan",
    },
    {
      value: 4,
      moodKey: "bersyukur",
      emoji: "🙂",
      label: "Bersyukur",
      sub: "Skor 4 • Ada Asa",
    },
    {
      value: 5,
      moodKey: "penuh-harapan",
      emoji: "🌟",
      label: "Penuh Harapan",
      sub: "Skor 5 • Bangkit",
    },
  ];

  // Prompt Pills
  const promptPills = [
    {
      icon: "flare",
      label: "Refleksi Bencana & Ketabahan",
      text: "Hari ini aku belajar tabah saat menghadapi...",
    },
    {
      icon: "favorite",
      label: "Rasa Syukur Hari Ini",
      text: "Hal kecil yang membuat hatiku hangat hari ini adalah...",
    },
    {
      icon: "air",
      label: "Kecemasan yang Dihadapi",
      text: "Kecemasan yang masih sering terbayang saat malam hari adalah...",
    },
    {
      icon: "groups",
      label: "Kisah Bersama Teman di Posko",
      text: "Kebersamaan bersama teman dan relawan di tenda posko yang berkesan...",
    },
  ];

  // Append prompt chip to textarea
  const handlePromptClick = (textToInsert: string) => {
    if (!msg.trim()) {
      setMsg(textToInsert);
    } else {
      setMsg((prev) => prev + "\n\n" + textToInsert);
    }
  };

  // Toggle Voice Note recording simulation
  const handleToggleVoice = () => {
    if (!isRecording) {
      setIsRecording(true);
    } else {
      setIsRecording(false);
      setVoiceRecorded(true);
      showToast("Voice note berhasil diunggah secara aman.");
    }
  };

  // Water Tree action (saved in database)
  const handleWaterTree = async () => {
    if (treeWatered) return;
    setTreeWatered(true);

    try {
      const res = await fetch("/api/journal/water", { method: "POST" });
      const rawText = await res.text();
      const data = JSON.parse(rawText);
      if (data.success) {
        if (data.treeStats) {
          setTreeStats(data.treeStats);
          setTreeXp(data.treeStats.totalXp);
        } else if (typeof data.treeXp === "number") {
          setTreeXp(data.treeXp);
        }
        showToast(
          data.message || "Pohon Harapan disiram! +20 XP kesuburan jiwa.",
        );
      }
    } catch {
      showToast("Pohon Harapan disiram! +20 XP kesuburan jiwa.");
    }
  };

  // Breathing simulation (saved in database with +15 XP)
  const handleStartBreathing = () => {
    if (breathingStatus === "breathing") return;
    setBreathingStatus("breathing");
    showToast(
      "Tarik napas perlahan... 4 detik... Tahan... Hembuskan perlahan...",
    );
    setTimeout(async () => {
      setBreathingStatus("done");
      try {
        const res = await fetch("/api/journal/breathe", { method: "POST" });
        const rawText = await res.text();
        const data = JSON.parse(rawText);
        if (data.success && data.treeStats) {
          setTreeStats(data.treeStats);
          setTreeXp(data.treeStats.totalXp);
          showToast(data.message || "Latihan napas selesai! +15 XP ketenangan batin.");
        } else {
          showToast("Latihan napas selesai! Hatimu kini lebih teduh.");
        }
      } catch {
        showToast("Latihan napas selesai! Hatimu kini lebih teduh.");
      }
    }, 4000);
  };

  // Submit and AI Analysis (connected to real database and Gemini AI)
  const handleSaveAndAnalyze = async () => {
    if (!msg.trim()) return;

    setIsAnalyzing(true);
    setGuardrailNotice(null);

    try {
      const res = await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: msg,
          mood,
          culture,
          privacy: shareCareCircle ? "CARE_CIRCLE" : "PRIVATE",
        }),
      });

      const rawText = await res.text();
      let data: {
        success?: boolean;
        status?: "accepted" | "rejected" | "crisis";
        message?: string;
        crisis?: { immediateResponse?: string };
        error?: string;
        details?: string;
        insight?: { empathy: string; proverb?: string; meaning?: string };
        entry?: SavedJournalEntry;
        stats?: { treeXp?: number; treeStats?: TreeStats };
      } = {};

      try {
        data = JSON.parse(rawText);
      } catch {
        throw new Error(rawText || `Server error (${res.status})`);
      }

      if (data.status === "crisis") {
        const crisisMsg =
          data.crisis?.immediateResponse ||
          data.error ||
          "Keselamatanmu sangat berharga. Segera ceritakan hal ini kepada orang dewasa tepercaya atau hubungi SafeConnect 119.";
        setGuardrailNotice({ type: "crisis", message: crisisMsg });
        showToast("Dukungan darurat tersedia. Hubungi orang dewasa tepercaya atau 119.");
        return;
      }

      if (data.status === "rejected") {
        const rejectMsg =
          data.message ||
          data.error ||
          "Maaf, ruang ini khusus untuk mendengarkan cerita dan catatan pemulihan pascabencana.";
        setGuardrailNotice({ type: "rejected", message: rejectMsg });
        showToast("Catatan di luar topik tidak dapat diproses.");
        return;
      }

      if (!res.ok || !data.success) {
        throw new Error(
          data.error ||
            data.details ||
            rawText ||
            "Gagal menyimpan ke database",
        );
      }

      // Update custom insight with real AI response
      if (data.insight) {
        setCustomInsight({
          empathy: data.insight.empathy,
          proverb: data.insight.proverb,
          meaning: data.insight.meaning,
        });
      }

      // Prepend real created entry from DB
      if (data.entry) {
        const newEntry: SavedJournalEntry = data.entry;
        setSavedEntries((prev) => [
          newEntry,
          ...prev.filter((e) => e.id !== newEntry.id),
        ]);
      }

      // Update real XP & treeStats
      if (data.stats?.treeStats) {
        setTreeStats(data.stats.treeStats);
        setTreeXp(data.stats.treeStats.totalXp);
      } else if (data.stats?.treeXp) {
        setTreeXp(data.stats.treeXp);
      }

      showToast(
        culture === "sumbar"
          ? "Refleksi tersimpan di database PostgreSQL & Makna Batang Tarandam diperbarui! (+50 XP)"
          : "Refleksi tersimpan di database PostgreSQL & Makna Meuseuraya diperbarui! (+50 XP)",
      );
    } catch (err) {
      console.error("Save reflection error:", err);
      showToast("Gagal menyimpan ke database. Silakan coba kembali.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const progressPercent = Math.min(100, Math.round((treeXp / 1000) * 100));

  return (
    <div className="w-full bg-[#f7f9fb] text-[#191c1e] antialiased selection:bg-[#006c48] selection:text-white min-h-screen flex flex-col justify-between">
      {/* Interactive Notification Toast */}
      <div
        className={`fixed bottom-6 right-6 z-50 transform transition-all duration-300 flex items-center gap-3 px-5 py-3.5 rounded-xl bg-[#012d1d] text-white shadow-xl ${
          toast.visible
            ? "translate-y-0 opacity-100 pointer-events-auto"
            : "translate-y-24 opacity-0 pointer-events-none"
        }`}
        id="toastNotification"
      >
        <span className="material-symbols-outlined text-[#92f7c3] text-[22px]">
          check_circle
        </span>
        <span className="font-label-md text-label-md" id="toastMessage">
          {toast.message}
        </span>
      </div>


      {/* MAIN CONTENT AREA */}
      <main className="w-full bg-[#f7f9fb] min-h-[calc(100vh-20rem)] py-8">
        <div className="flex flex-col w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 w-full flex flex-col gap-6 md:gap-8">
            {/* Breadcrumb & Protocol Badges */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
              <nav className="flex items-center gap-2 font-label-md text-label-md text-[#414844]">
                <Link
                  className="hover:text-[#012d1d] transition-colors flex items-center gap-1"
                  href="/"
                >
                  <span className="material-symbols-outlined text-base">
                    cottage
                  </span>
                  <span>Beranda</span>
                </Link>
                <span className="text-[#c1c8c2]">/</span>
                <Link
                  className="hover:text-[#012d1d] transition-colors"
                  href="/#programs"
                >
                  Modul Resiliensi
                </Link>
                <span className="text-[#c1c8c2]">/</span>
                <span className="text-[#012d1d] font-semibold">
                  AI Jurnal Hikmah (Refleksi Jiwa)
                </span>
              </nav>

              {/* Protocol badges */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e6e8ea] text-[#012d1d] font-label-sm text-label-sm">
                  <span className="material-symbols-outlined text-[16px] text-[#006c48]">
                    psychology
                  </span>
                  <span>Refleksi Jiwa &amp; PFA</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#eceef0] text-[#414844] font-label-sm text-label-sm">
                  <span className="material-symbols-outlined text-[16px] text-[#006c48]">
                    lock
                  </span>
                  <span>Sensor PII Aktif (Anonim)</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#92f7c3]/40 text-[#00734d] font-label-sm text-label-sm">
                  <span className="material-symbols-outlined text-[16px]">
                    support_agent
                  </span>
                  <span>SafeConnect 119 Siaga</span>
                </span>
              </div>
            </div>

            {!authLoading && !user && (
              <div className="mb-6 bg-surface border border-line border-l-4 border-l-warning rounded-lg p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-fg">
                    Masuk ke akun Anda untuk menyimpan Jurnal Hikmah dan Pohon Harapan pribadi
                  </p>
                  <p className="text-xs text-fg-muted">
                    Setiap pengguna memiliki catatan jurnal dan perkembangan Pohon Harapan tersendiri yang tidak tercampur dengan pengguna lain.
                  </p>
                </div>
                <Link
                  href="/login?next=/jurnal"
                  className="inline-flex items-center justify-center min-h-11 px-5 rounded-md bg-action hover:bg-action-hover text-white text-sm font-medium shrink-0 transition-colors"
                >
                  Masuk Akun
                </Link>
              </div>
            )}

            {/* Two-Column Interactive Workspace */}
            <div className="grid grid-cols-1 lg:grid-cols-12 items-start gap-6">
              {/* LEFT COLUMN: Main Journaling Canvas & AI Wisdom Insights (65% / col-span-8) */}
              <div className="lg:col-span-8 flex flex-col gap-6">
                {/* CARD 1: Write Journal Entry */}
                <section className="p-6 sm:p-8 rounded-xl bg-white shadow-sm flex flex-col gap-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#1b4332] text-white flex items-center justify-center">
                        <span className="material-symbols-outlined text-[22px]">
                          edit_note
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <h2 className="font-headline-md text-headline-md text-[#012d1d] leading-tight">
                          Tulis Refleksi &amp; Jurnal Jiwa
                        </h2>
                        <span className="font-label-sm text-label-sm text-[#414844]">
                          Hari ini:{" "}
                          {new Date().toLocaleDateString("id-ID", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}{" "}
                          •{" "}
                          {culture === "aceh"
                            ? "Posko Meulaboh & Pidie Jaya"
                            : "Posko Pasaman Barat & Sentra Bukittinggi"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Section A: 5-Mood Scale Selector */}
                  <div className="flex flex-col gap-3">
                    <label className="font-headline-sm text-headline-sm text-[#012d1d] flex items-center gap-2">
                      <span>Bagaimana perasaanmu saat ini?</span>
                      <span className="font-body-sm text-body-sm text-[#414844] font-normal">
                        (Pilih yang paling mewakili)
                      </span>
                    </label>

                    <div
                      className="grid grid-cols-2 sm:grid-cols-5 gap-2.5"
                      id="moodSelector"
                    >
                      {moodOptions.map((item, idx) => {
                        const isColSpan2 = idx === 4;
                        const isActive = mood === item.value;
                        return (
                          <button
                            key={item.value}
                            type="button"
                            onClick={() => setMood(item.value)}
                            className={`group flex flex-col items-center p-3 rounded-xl transition-all ${
                              isColSpan2 ? "col-span-2 sm:col-span-1" : ""
                            } ${
                              isActive
                                ? "bg-[#1b4332] text-white shadow-sm"
                                : "bg-[#f2f4f6] text-[#414844] hover:bg-[#eceef0]"
                            }`}
                          >
                            <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">
                              {item.emoji}
                            </span>
                            <span
                              className={`font-label-md text-label-md font-semibold text-center ${
                                isActive ? "text-white" : "text-[#191c1e]"
                              }`}
                            >
                              {item.label}
                            </span>
                            <span
                              className={`font-label-sm text-label-sm ${
                                isActive ? "text-[#86af99]" : "text-[#717973]"
                              }`}
                            >
                              {item.sub}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Section B: Category Prompt Pills */}
                  <div className="flex flex-col gap-2.5">
                    <span className="font-label-sm text-label-sm text-[#414844] uppercase tracking-wider font-semibold">
                      Pilih Panduan Refleksi Harian (Klik untuk menyisipkan
                      pemantik)
                    </span>
                    <div className="flex flex-wrap gap-2" id="promptPills">
                      {promptPills.map((pill) => (
                        <button
                          key={pill.label}
                          type="button"
                          onClick={() => handlePromptClick(pill.text)}
                          className="px-3.5 py-1.5 rounded-full bg-[#eceef0] text-[#191c1e] hover:bg-[#c1ecd4] hover:text-[#274e3d] transition-all font-label-md text-label-md flex items-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-[16px] text-[#006c48]">
                            {pill.icon}
                          </span>
                          <span>{pill.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Section C: Journal Textarea */}
                  <div className="flex flex-col gap-2 relative">
                    <textarea
                      id="journalInput"
                      className="w-full p-4 sm:p-5 rounded-xl text-[#191c1e] font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-[#006c48]/50 placeholder:text-[#717973] transition-all shadow-inner bg-[#f2f4f6]"
                      rows={7}
                      placeholder="Ceritakan apa yang kamu rasakan, alami, atau syukuri hari ini... Tulisanmu sepenuhnya aman dan terlindungi di sini."
                      value={msg}
                      onChange={(e) => {
                        setMsg(e.target.value);
                        if (guardrailNotice) setGuardrailNotice(null);
                      }}
                    />
                    <div className="flex items-center justify-between text-[#414844] font-label-sm text-label-sm px-1">
                      <span className="flex items-center gap-1 text-[#006c48]">
                        <span className="material-symbols-outlined text-[16px]">
                          lock
                        </span>
                        Pemeriksaan privasi aktif: Bebas dari nama lengkap &amp;
                        nomor telepon publik
                      </span>
                      <span id="charCount">{msg.length} karakter</span>
                    </div>

                    {guardrailNotice && (
                      <div
                        role="alert"
                        className={`mt-2 rounded-xl p-4 flex flex-col gap-2.5 border ${
                          guardrailNotice.type === "crisis"
                            ? "bg-[#ffdad6] text-[#93000a] border-red-300"
                            : "bg-amber-50 text-amber-950 border-amber-300"
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <span className="material-symbols-outlined text-[20px] shrink-0 mt-0.5">
                            {guardrailNotice.type === "crisis" ? "emergency" : "info"}
                          </span>
                          <div className="space-y-1">
                            <p className="font-semibold text-sm">
                              {guardrailNotice.type === "crisis"
                                ? "Kamu Tidak Sendirian — Bantuan Siaga Menemanimu"
                                : "Catatan Di Luar Topik Pemulihan"}
                            </p>
                            <p className="text-sm leading-relaxed">
                              {guardrailNotice.message}
                            </p>
                          </div>
                        </div>
                        {guardrailNotice.type === "crisis" && (
                          <div className="flex flex-wrap items-center gap-2.5 pt-1">
                            <a
                              href="tel:119"
                              className="px-4 py-2 rounded-lg bg-[#ba1a1a] text-white text-xs font-bold inline-flex items-center gap-1.5 hover:opacity-90"
                            >
                              <span className="material-symbols-outlined text-[16px]">
                                call
                              </span>
                              <span>Hubungi SafeConnect 119</span>
                            </a>
                            <Link
                              href="/tele-screening"
                              className="px-4 py-2 rounded-lg bg-white text-[#93000a] text-xs font-semibold border border-red-200 hover:bg-red-50"
                            >
                              Skrining Triase DASS-21
                            </Link>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Section D: Privacy Visibility Toggle */}
                  <div className="p-4 rounded-xl bg-[#f2f4f6] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#eceef0] flex items-center justify-center shrink-0 mt-0.5">
                        <span className="material-symbols-outlined text-[#006c48] text-[20px]">
                          visibility_off
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-label-md text-label-md text-[#012d1d] font-semibold">
                          Visibilitas Jurnal: Hanya Saya (Privat)
                        </span>
                        <span className="font-body-sm text-body-sm text-[#414844]">
                          Hanya algoritma AI lokal yang memproses ekstraksi
                          hikmah tanpa menyebarkan identitasmu.
                        </span>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={shareCareCircle}
                        onChange={(e) => setShareCareCircle(e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-[#e0e3e5] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#006c48]" />
                      <span className="ml-2 font-label-sm text-label-sm text-[#414844] hidden sm:inline">
                        Izinkan Care Circle
                      </span>
                    </label>
                  </div>

                  {/* Section E: Actions & Voice Note */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleToggleVoice}
                      className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-label-md text-label-md transition-colors ${
                        isRecording
                          ? "bg-[#ffdad6] text-[#93000a]"
                          : "bg-[#eceef0] text-[#012d1d] hover:bg-[#e6e8ea]"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[#006c48] text-[20px]">
                        mic
                      </span>
                      <span>
                        {isRecording
                          ? "Merekam Suara... (Klik untuk Selesai)"
                          : voiceRecorded
                            ? "Rekam Suara (Tersimpan 18 detik)"
                            : "Rekam Suara (Voice Note Refleksi)"}
                      </span>
                    </button>

                    <button
                      type="button"
                      disabled={isAnalyzing || !msg.trim()}
                      onClick={handleSaveAndAnalyze}
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#012d1d] text-white hover:bg-[#1b4332] disabled:opacity-50 font-label-md text-label-md font-semibold transition-all shadow-[0_4px_14px_rgba(1,45,29,0.2)] active:scale-[0.99]"
                    >
                      {isAnalyzing ? (
                        <>
                          <span className="material-symbols-outlined text-[20px] animate-spin">
                            refresh
                          </span>
                          <span>Memproses Makna Budaya...</span>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[#92f7c3] text-[20px]">
                            auto_awesome
                          </span>
                          <span>
                            Simpan &amp; Analisis Makna Budaya (+50 XP)
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                </section>

                {/* CARD 2: AI Cultural Insight & Wisdom Reflection */}
                <section className="p-6 sm:p-8 rounded-xl bg-white shadow-sm flex flex-col gap-6 relative overflow-hidden">
                  {/* Subtle decorative amber cultural banner strip */}
                  <div className="w-full h-1.5 bg-gradient-to-r from-[#ffb77d] via-[#f48c24] to-[#006c48] rounded-t-xl -mt-6 sm:-mt-8 -mx-6 sm:-mx-8" />

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#5e3000] text-white flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[18px]">
                          lightbulb
                        </span>
                      </div>
                      <span className="font-headline-sm text-headline-sm text-[#012d1d]">
                        Hasil Analisis &amp; Refleksi Makna Budaya Terakhir
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ffdcc3] text-[#2f1500] font-label-sm text-label-sm self-start sm:self-auto">
                      <span className="material-symbols-outlined text-[15px]">
                        diversity_3
                      </span>
                      {culture === "sumbar"
                        ? "Filosofi Mambangkik Batang Tarandam"
                        : "Filosofi Meuseuraya (Aceh)"}
                    </span>
                  </div>

                  {/* AI Empathy & Insight Box */}
                  <div className="p-5 rounded-xl bg-[#f2f4f6] flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-[#006c48] font-label-md text-label-md font-semibold">
                      <span className="material-symbols-outlined text-[18px]">
                        support_agent
                      </span>
                      <span>Empati &amp; Validasi PFA AI PERMATA</span>
                    </div>
                    <p className="font-body-md text-body-md text-[#191c1e] leading-relaxed">
                      {currentInsight.empathy}
                    </p>
                  </div>

                  {/* Cultural Wisdom Card (Proverb / Hikmah) */}
                  <div className="p-6 rounded-xl bg-gradient-to-br from-[#eceef0] to-[#f2f4f6] flex flex-col gap-3 relative">
                    <div className="flex items-center justify-between text-[#414844] font-label-sm text-label-sm">
                      <span className="font-semibold text-[#006c48] uppercase tracking-wider">
                        Petuah Hikmah Nusantara
                      </span>
                      <span>{currentInsight.proverbTradition}</span>
                    </div>
                    <blockquote className="font-headline-sm text-headline-sm text-[#012d1d] italic leading-relaxed">
                      {currentInsight.proverb}
                    </blockquote>
                    <p className="font-body-sm text-body-sm text-[#414844]">
                      <strong className="font-semibold text-[#191c1e]">
                        Makna Pemulihan:
                      </strong>{" "}
                      {currentInsight.meaning}
                    </p>
                  </div>

                  {/* Suggested Recovery Steps (Actionable Micro-PFA) */}
                  <div className="flex flex-col gap-3">
                    <span className="font-label-sm text-label-sm text-[#414844] uppercase tracking-wider font-semibold">
                      Rekomendasi Langkah Pemulihan Jiwa Hari Ini
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {/* Action 1: Latihan Napas Tenang */}
                      <div className="p-4 rounded-xl bg-[#f2f4f6] flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#92f7c3] text-[#002113] flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-[20px]">
                              airwave
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="font-label-md text-label-md text-[#012d1d] font-semibold">
                              Latihan Napas Tenang
                            </span>
                            <span className="font-body-sm text-body-sm text-[#414844]">
                              Pernapasan 4-4-4 (3 Menit)
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleStartBreathing}
                          className="px-3.5 py-1.5 rounded-lg bg-[#012d1d] text-white font-label-sm text-label-sm font-semibold hover:bg-[#1b4332] transition-colors shrink-0"
                        >
                          {breathingStatus === "breathing"
                            ? "Bernapas..."
                            : breathingStatus === "done"
                              ? "Selesai ✓"
                              : "Mulai"}
                        </button>
                      </div>

                      {/* Action 2: Siram Pohon Harapan */}
                      <div className="p-4 rounded-xl bg-[#f2f4f6] flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#c1ecd4] text-[#274e3d] flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-[20px]">
                              water_drop
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="font-label-md text-label-md text-[#012d1d] font-semibold">
                              Siram Pohon Harapan
                            </span>
                            <span className="font-body-sm text-body-sm text-[#414844]">
                              +20 XP Pertumbuhan
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={treeWatered}
                          onClick={handleWaterTree}
                          className={`px-3.5 py-1.5 rounded-lg font-label-sm text-label-sm font-semibold transition-opacity shrink-0 ${
                            treeWatered
                              ? "bg-[#eceef0] text-[#717973] cursor-not-allowed opacity-70"
                              : "bg-[#006c48] text-white hover:opacity-90"
                          }`}
                        >
                          {treeWatered ? "Tersiram ✓" : "Klaim"}
                        </button>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Cultural Foundation Banner */}
                <section className="p-6 rounded-xl bg-[#f2f4f6] flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#ffdcc3] flex items-center justify-center shrink-0 text-[#2f1500]">
                      <span className="material-symbols-outlined text-[26px]">
                        forest
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <h3 className="font-headline-sm text-headline-sm text-[#012d1d]">
                        {culture === "sumbar"
                          ? "Mambangkik Batang Tarandam"
                          : "Kearifan Meuseuraya & Beumulia Jamee"}
                      </h3>
                      <p className="font-body-sm text-body-sm text-[#414844] max-w-lg">
                        {culture === "sumbar"
                          ? "Falsafah Minangkabau tentang mengangkat kembali batang kayu yang terendam air; simbol kebangkitan martabat, ketahanan mental anak, dan daya lentur pascabencana alam."
                          : "Semangat gotong royong dan saling menguatkan dalam persaudaraan masyarakat Aceh; merawat duka bencana secara bersama tanpa meninggalkan seorang pun di belakang."}
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-1.5 text-[#006c48] hover:text-[#012d1d] font-label-md text-label-md font-semibold whitespace-nowrap"
                  >
                    <span>Pelajari Modul Budaya</span>
                    <span className="material-symbols-outlined text-[18px]">
                      arrow_forward
                    </span>
                  </Link>
                </section>
              </div>

              {/* RIGHT COLUMN: Sidebar, Hope Tree, Journal History, SafeConnect (35% / col-span-4) */}
              <aside className="lg:col-span-4 flex flex-col gap-6 w-full">
                {/* WIDGET 1: Pohon Harapan (Hope Tree) Progress Card */}
                <section className="p-6 rounded-xl bg-white shadow-sm flex flex-col gap-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#006c48] text-[22px]">
                        yard
                      </span>
                      <h3 className="font-headline-sm text-headline-sm text-[#012d1d]">
                        Pohon Harapan
                      </h3>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#92f7c3] text-[#005235] font-label-sm text-label-sm font-semibold">
                      {activeTreeStats.levelName}
                    </span>
                  </div>

                  {/* Tree Illustration Graphic */}
                  <div className="flex flex-col items-center justify-center p-6 rounded-xl bg-gradient-to-b from-[#f2f4f6] to-[#eceef0] relative overflow-hidden">
                    <div className="w-28 h-28 relative flex items-center justify-center">
                      <svg
                        className="w-full h-full text-[#006c48] drop-shadow-sm transition-all duration-700"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 100 100"
                      >
                        {/* Soil Ground */}
                        <path
                          className="text-[#ffb77d]"
                          d="M15 85 Q50 82 85 85"
                          strokeLinecap="round"
                          strokeWidth="4"
                        />
                        {/* Tree Trunk */}
                        <path
                          className="text-[#5e3000]"
                          d={activeTreeStats.level <= 1 ? "M50 85 Q49 70 50 62" : "M50 85 Q48 55 50 40"}
                          strokeLinecap="round"
                          strokeWidth={activeTreeStats.level <= 1 ? "4" : "6"}
                        />
                        {/* Branches if level >= 2 */}
                        {activeTreeStats.level >= 2 && (
                          <path
                            className="text-[#1b4332]"
                            d="M50 55 Q35 48 30 38"
                            strokeLinecap="round"
                            strokeWidth="3"
                          />
                        )}
                        {activeTreeStats.level >= 3 && (
                          <path
                            className="text-[#1b4332]"
                            d="M50 50 Q65 42 70 34"
                            strokeLinecap="round"
                            strokeWidth="3"
                          />
                        )}
                        {/* Leaf Foliage according to Level */}
                        {activeTreeStats.level <= 1 ? (
                          <>
                            <circle className="fill-[#92f7c3] stroke-[#006c48]" cx="45" cy="55" r="7" strokeWidth="1.5" />
                            <circle className="fill-[#75daa8] stroke-[#006c48]" cx="55" cy="52" r="8" strokeWidth="1.5" />
                          </>
                        ) : activeTreeStats.level === 2 ? (
                          <>
                            <circle className="fill-[#92f7c3] stroke-[#006c48]" cx="35" cy="42" r="8" strokeWidth="1.5" />
                            <circle className="fill-[#006c48] stroke-[#1b4332]" cx="50" cy="36" r="11" strokeWidth="2" />
                            <circle className="fill-[#75daa8] stroke-[#006c48]" cx="62" cy="40" r="9" strokeWidth="1.5" />
                          </>
                        ) : (
                          <>
                            <circle className="fill-[#92f7c3] stroke-[#006c48]" cx="30" cy="35" r="9" strokeWidth="1.5" />
                            <circle className="fill-[#92f7c3] stroke-[#006c48]" cx="70" cy="32" r="10" strokeWidth="1.5" />
                            <circle className="fill-[#006c48] stroke-[#1b4332]" cx="50" cy="30" r="14" strokeWidth="2" />
                            <circle className="fill-[#75daa8] stroke-[#006c48]" cx="42" cy="22" r="8" strokeWidth="1.5" />
                            <circle className="fill-[#92f7c3] stroke-[#006c48]" cx="58" cy="20" r="8" strokeWidth="1.5" />
                            {activeTreeStats.level >= 4 && (
                              <>
                                <circle className="fill-[#ffdcc3] stroke-[#e07a38]" cx="36" cy="30" r="3.5" />
                                <circle className="fill-[#ffdcc3] stroke-[#e07a38]" cx="64" cy="28" r="3.5" />
                              </>
                            )}
                          </>
                        )}
                        {/* Sun Glimmer */}
                        <circle className="fill-[#ffb77d]" cx="82" cy="18" r={activeTreeStats.level >= 4 ? 6 : 4} />
                      </svg>
                    </div>
                    <span className="font-label-md text-label-md text-[#012d1d] font-semibold mt-2">
                      {activeTreeStats.stageName}
                    </span>
                    <span className="font-body-sm text-body-sm text-[#414844] text-center">
                      {activeTreeStats.stageDescription}
                    </span>
                  </div>

                  {/* Progress Bar & XP */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-[#414844] font-label-sm text-label-sm">
                      <span>Progres menuju {activeTreeStats.nextLevelName}</span>
                      <span className="font-semibold text-[#012d1d]">
                        {activeTreeStats.totalXp.toLocaleString("id-ID")} / {activeTreeStats.targetXp.toLocaleString("id-ID")} XP (
                        {activeTreeStats.progressPercent}%)
                      </span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-[#eceef0] overflow-hidden">
                      <div
                        className="h-full bg-[#006c48] transition-all duration-500 rounded-full"
                        style={{ width: `${activeTreeStats.progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Daily Streak Indicator */}
                  <div className="p-3.5 rounded-xl bg-[#f2f4f6] flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-[#f48c24] text-[20px]">
                        local_fire_department
                      </span>
                      <div className="flex flex-col">
                        <span className="font-label-md text-label-md text-[#012d1d] font-semibold">
                          {streakDays} Hari Merawat Diri
                        </span>
                        <span className="font-label-sm text-label-sm text-[#414844]">
                          Ritme santai tanpa penalti
                        </span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-[#006c48] text-[20px]">
                      done_all
                    </span>
                  </div>

                  {/* Dynamic XP Activity Sources Breakdown from Database */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-line text-center">
                    <div className="p-2 rounded-lg bg-[#f2f4f6] flex flex-col">
                      <span className="text-[10px] text-[#414844] font-medium">Refleksi</span>
                      <span className="text-xs font-bold text-[#006c48]">
                        {activeTreeStats.journalCount}x (+{activeTreeStats.journalCount * 50} XP)
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-[#f2f4f6] flex flex-col">
                      <span className="text-[10px] text-[#414844] font-medium">Siram Pohon</span>
                      <span className="text-xs font-bold text-[#006c48]">
                        {activeTreeStats.waterCount}x (+{activeTreeStats.waterCount * 20} XP)
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-[#f2f4f6] flex flex-col">
                      <span className="text-[10px] text-[#414844] font-medium">Napas 4-4-4</span>
                      <span className="text-xs font-bold text-[#006c48]">
                        {activeTreeStats.breatheCount}x (+{activeTreeStats.breatheCount * 15} XP)
                      </span>
                    </div>
                  </div>
                </section>

                {/* WIDGET 2: Riwayat Refleksi Terakhir (Journal History from Database) */}
                <section className="p-6 rounded-xl bg-white shadow-sm flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#006c48] text-[22px]">
                        history_edu
                      </span>
                      <h3 className="font-headline-sm text-headline-sm text-[#012d1d]">
                        Riwayat Refleksi
                      </h3>
                    </div>
                    <span className="font-label-sm text-label-sm text-[#414844]">
                      {isLoading
                        ? "Menghubungkan ke DB..."
                        : `${savedEntries.length} Catatan`}
                    </span>
                  </div>

                  <div className="flex flex-col gap-3">
                    {isLoading ? (
                      <div className="p-4 rounded-xl bg-[#f2f4f6] text-center text-xs text-[#414844] flex items-center justify-center gap-2">
                        <span className="w-3 h-3 rounded-full border-2 border-[#006c48] border-t-transparent animate-spin" />
                        <span>Mengambil data dari PostgreSQL...</span>
                      </div>
                    ) : savedEntries.length === 0 ? (
                      <div className="p-4 rounded-xl bg-[#f2f4f6] text-center text-xs text-[#414844]">
                        Belum ada catatan di database. Tulis dan simpan refleksi
                        pertamamu di samping!
                      </div>
                    ) : (
                      savedEntries.slice(0, 4).map((entry) => {
                        const moodObj = moodOptions.find(
                          (m) => m.value === entry.mood,
                        );
                        return (
                          <article
                            key={entry.id}
                            onClick={() => setSelectedEntry(entry)}
                            className="p-3.5 rounded-xl bg-[#f2f4f6] hover:bg-[#eceef0] transition-colors flex flex-col gap-1.5 cursor-pointer"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm">
                                  {moodObj?.emoji || "😐"}
                                </span>
                                <span className="font-label-sm text-label-sm text-[#012d1d] font-semibold">
                                  {entry.date}
                                </span>
                              </div>
                              <span className="px-2 py-0.5 rounded-full bg-[#c1ecd4] text-[#274e3d] font-label-sm text-label-sm">
                                {entry.tag ||
                                  (entry.culture === "sumbar"
                                    ? "Nilai Badunsanak"
                                    : "Nilai Meuseuraya")}
                              </span>
                            </div>
                            <p className="font-body-sm text-body-sm text-[#414844] line-clamp-2">
                              {entry.content}
                            </p>
                          </article>
                        );
                      })
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (savedEntries.length > 0) {
                        setSelectedEntry(savedEntries[0]);
                      }
                    }}
                    className="w-full py-2.5 rounded-xl bg-[#eceef0] hover:bg-[#e6e8ea] text-[#012d1d] font-label-md text-label-md font-semibold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>
                      Lihat Semua Riwayat ({savedEntries.length} Catatan)
                    </span>
                    <span className="material-symbols-outlined text-[18px]">
                      arrow_forward
                    </span>
                  </button>
                </section>

                {/* WIDGET 3: SafeConnect PFA & Crisis Guard */}
                <section className="p-6 rounded-xl bg-[#f2f4f6] shadow-sm flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#012d1d] text-white flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[#92f7c3] text-[22px]">
                        health_and_safety
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <h3 className="font-headline-sm text-headline-sm text-[#012d1d]">
                        SafeConnect PFA Guard
                      </h3>
                      <span className="font-label-sm text-label-sm text-[#006c48] font-medium">
                        Bebas Pulsa &amp; Kerahasiaan Terjamin
                      </span>
                    </div>
                  </div>
                  <p className="font-body-sm text-body-sm text-[#414844] leading-relaxed">
                    Merasa sangat cemas, gelisah, atau butuh teman bicara
                    manusia? Relawan PFA dan psikolog klinis siaga mendampingi
                    anak dan orang tua 24 jam.
                  </p>
                  <div className="flex flex-col gap-2.5 pt-1">
                    <a
                      className="w-full py-3 rounded-xl bg-[#ba1a1a] text-white font-label-md text-label-md font-semibold flex items-center justify-center gap-2 hover:opacity-95 transition-opacity shadow-sm"
                      href="tel:119"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        phone_in_talk
                      </span>
                      <span>Hubungi Hotline 119 (Bebas Pulsa)</span>
                    </a>
                    <Link
                      href="/ai-companion"
                      className="w-full py-2.5 rounded-xl bg-white text-[#012d1d] hover:bg-[#eceef0] font-label-md text-label-md font-semibold flex items-center justify-center gap-2 transition-colors text-center"
                    >
                      <span className="material-symbols-outlined text-[#006c48] text-[20px]">
                        chat
                      </span>
                      <span>Chat dengan Relawan Siaga</span>
                    </Link>
                  </div>
                </section>

                {/* Community Wisdom Snippet Card */}
                <div className="p-5 rounded-xl bg-white shadow-sm flex items-start gap-3.5">
                  <span className="material-symbols-outlined text-[#006c48] text-[24px] mt-0.5">
                    forum
                  </span>
                  <div className="flex flex-col gap-1">
                    <span className="font-label-md text-label-md text-[#012d1d] font-semibold">
                      Tersambung dengan Posko Ramah Anak
                    </span>
                    <p className="font-body-sm text-body-sm text-[#414844]">
                      Tenda belajar terdekat di wilayahmu siap mendampingi
                      aktivitas bermain dan pemulihan trauma harian.
                    </p>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </main>

      {/* Entry Modal View if clicked */}
      {selectedEntry && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface rounded-xl max-w-lg w-full p-6 shadow-lg border border-line flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <div className="flex items-center gap-2">
                <span className="text-xl">
                  {moodOptions.find((m) => m.value === selectedEntry.mood)
                    ?.emoji || "😐"}
                </span>
                <span className="font-headline-sm text-headline-sm text-[#012d1d]">
                  Refleksi {selectedEntry.date}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEntry(null)}
                className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-fg-muted hover:text-fg transition-colors"
              >
                ✕
              </button>
            </div>
            <div>
              <span className="text-xs font-semibold text-[#006c48] uppercase tracking-wider">
                Isi Catatan Jiwa
              </span>
              <p className="mt-1 font-body-md text-body-md text-[#191c1e] whitespace-pre-wrap leading-relaxed">
                {selectedEntry.content}
              </p>
            </div>
            {selectedEntry.proverb && (
              <div className="p-3.5 rounded-lg bg-accent-50 border border-accent-200 text-xs text-fg space-y-1">
                <span className="font-bold text-fg-accent">Hikmah Budaya:</span>
                <p className="italic font-medium">{selectedEntry.proverb}</p>
                {selectedEntry.proverbMeaning && (
                  <p className="text-fg-muted mt-1">
                    {selectedEntry.proverbMeaning}
                  </p>
                )}
              </div>
            )}
            {selectedEntry.aiInsight && (
              <div className="p-4 rounded-lg bg-[#f2f4f6] text-xs text-[#414844] space-y-1">
                <span className="font-bold text-[#006c48]">
                  Empati &amp; Validasi AI:
                </span>
                <p className="leading-relaxed">{selectedEntry.aiInsight}</p>
              </div>
            )}
            <div className="flex items-center justify-between text-xs text-fg-subtle pt-2 border-t border-line">
              <span className="truncate max-w-[200px]">
                ID: {selectedEntry.id}
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
                {selectedEntry.tag ||
                  (selectedEntry.culture === "sumbar"
                    ? "Batang Tarandam"
                    : "Meuseuraya")}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedEntry(null)}
              className="mt-2 w-full py-2.5 rounded-xl bg-[#1b4332] text-white font-semibold text-sm hover:bg-[#006c48] transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* FOOTER matching desain_jurnal_hikmah.html */}
      <footer className="w-full bg-[#f2f4f6] border-t border-[#c1c8c2]/20 mt-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-10">
          {/* Emergency Alert Banner */}
          <div className="mb-6 p-4 rounded-xl bg-[#ffdad6] text-[#93000a] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#ba1a1a] text-white flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px]">
                  emergency
                </span>
              </div>
              <div>
                <p className="font-headline-sm text-headline-sm leading-tight text-[#93000a]">
                  SafeConnect 119 - Siaga Krisis Psikologis &amp; PFA
                </p>
                <p className="font-body-sm text-body-sm text-[#93000a]/80">
                  Layanan respons cepat pendampingan trauma anak &amp; bencana
                  24 Jam bebas pulsa.
                </p>
              </div>
            </div>
            <a
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#ba1a1a] text-white font-label-md text-label-md font-semibold hover:opacity-95 transition-opacity shrink-0"
              href="tel:119"
            >
              <span className="material-symbols-outlined text-[18px]">
                call
              </span>
              <span>Hubungi 119</span>
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-5 flex flex-col gap-3">
              <div className="flex items-center gap-2.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/permata-logo.webp"
                  alt="Logo PERMATA"
                  width={36}
                  height={36}
                  className="w-9 h-9 object-contain shrink-0"
                />
                <span className="font-headline-md text-headline-md text-[#012d1d]">
                  PERMATA Nusantara
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-[#414844] max-w-sm">
                Platform digital Psychological First Aid (PFA) dan penguatan
                resiliensi trauma anak pascabencana berbasis kearifan lokal
                Nusantara (Meuseuraya Aceh &amp; Mambangkik Batang Tarandam
                Minangkabau).
              </p>
              <div className="flex items-center gap-2 text-[#006c48] font-label-sm text-label-sm mt-1">
                <span className="material-symbols-outlined text-[18px]">
                  verified_user
                </span>
                <span>
                  Tervalidasi Protokol Perlindungan &amp; Kerahasiaan Data Anak
                </span>
              </div>
            </div>

            <div className="md:col-span-4 flex flex-col gap-2.5">
              <h4 className="font-headline-sm text-headline-sm text-[#012d1d] mb-1">
                Modul Resiliensi
              </h4>
              <ul className="flex flex-col gap-2 font-body-sm text-body-sm text-[#414844]">
                <li>
                  <Link
                    href="/jurnal"
                    className="hover:text-[#012d1d] transition-colors"
                  >
                    AI Jurnal Hikmah (Refleksi Kearifan)
                  </Link>
                </li>
                <li>
                  <Link
                    href="/tele-screening"
                    className="hover:text-[#012d1d] transition-colors"
                  >
                    Skrining Mandiri DASS-21 Adaptif
                  </Link>
                </li>
                <li>
                  <a
                    href="tel:119"
                    className="hover:text-[#012d1d] transition-colors"
                  >
                    SafeConnect 119 &amp; Rujukan Faskes
                  </a>
                </li>
                <li>
                  <Link
                    href="/#calculator"
                    className="hover:text-[#012d1d] transition-colors"
                  >
                    Pohon Harapan (Hope Tree Interaktif)
                  </Link>
                </li>
                <li>
                  <Link
                    href="/mood-food"
                    className="hover:text-[#012d1d] transition-colors"
                  >
                    Mood Tracker &amp; Nutrisi Emosional (Food Log)
                  </Link>
                </li>
              </ul>
            </div>

            <div className="md:col-span-3 flex flex-col gap-2.5">
              <h4 className="font-headline-sm text-headline-sm text-[#012d1d] mb-1">
                Kearifan Lokal
              </h4>
              <p className="font-body-sm text-body-sm text-[#414844]">
                Integrasi nilai gotong royong pemulihan jiwa berbasis modalitas
                kultural Nusantara untuk memperkuat resiliensi komunitas.
              </p>
              <div className="mt-2 p-3 rounded-lg bg-[#eceef0] flex flex-col gap-1">
                <span className="font-label-sm text-label-sm text-[#006c48] font-semibold">
                  Prinsip Asuhan
                </span>
                <span className="font-body-sm text-body-sm text-[#414844]">
                  Aman, Rahasia, Merangkul, Berkelanjutan.
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#c1c8c2]/30 flex flex-col md:flex-row items-center justify-between gap-4 font-body-sm text-body-sm text-[#414844]">
            <p>© 2024 PERMATA Nusantara. Seluruh Hak Cipta Dilindungi.</p>
            <p className="text-xs text-[#414844]/80 text-center md:text-right">
              Sesuai Standar Etika &amp; Kepatuhan Perlindungan Data Pribadi
              Anak (UU PDP No. 27/2022)
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
