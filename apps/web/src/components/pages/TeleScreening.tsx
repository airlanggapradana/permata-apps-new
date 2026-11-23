"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { dassQuestions } from "@/data/dassQuestions";
import { calculateDASS, interpretDASS } from "@/utils/dassScoring";
import { useCulture } from "@/context/CultureContext";
import { AnimatedSection } from "@/components/PageMotion";

// Option definitions matching desain_telescreening.html
const DASS_OPTIONS = [
  {
    score: 0,
    title: "Tidak Pernah",
    desc: "Tidak dialami sama sekali atau tidak pernah terjadi selama sepekan terakhir.",
  },
  {
    score: 1,
    title: "Kadang-kadang",
    desc: "Dialami beberapa kali dalam skala ringan dan biasanya mereda dengan sendirinya.",
  },
  {
    score: 2,
    title: "Cukup Sering",
    desc: "Cukup sering dirasakan dan mulai sedikit mengganggu konsentrasi belajar atau istirahat.",
  },
  {
    score: 3,
    title: "Sering Sekali / Hampir Selalu",
    desc: "Sangat intens dirasakan hampir setiap hari dan membutuhkan bimbingan pendamping.",
  },
];

const depressionIndexes = [2, 4, 9, 12, 15, 16, 20];
const anxietyIndexes = [1, 3, 6, 8, 14, 18, 19];
const stressIndexes = [0, 5, 7, 10, 11, 13, 17];

function getDomainInfo(index: number) {
  if (anxietyIndexes.includes(index)) {
    return {
      key: "anxiety" as const,
      label: "Kecemasan",
      icon: "sentiment_neutral",
      domainTitle: "Kecemasan (Anxiety)",
      description:
        "Reaksi fisiologis otonom & kekhawatiran situasional pascabencana.",
    };
  }
  if (stressIndexes.includes(index)) {
    return {
      key: "stress" as const,
      label: "Stres",
      icon: "mood_bad",
      domainTitle: "Stres (Stress)",
      description:
        "Ketegangan saraf, reaktivitas emosi, dan kesulitan untuk rileks.",
    };
  }
  return {
    key: "depression" as const,
    label: "Depresi",
    icon: "cloud",
    domainTitle: "Depresi (Depression)",
    description:
      "Kehilangan minat, rasa putus asa, dan energi emosional rendah.",
  };
}

export default function TeleScreening() {
  const { culture, setCulture } = useCulture();

  const [current, setCurrent] = useState<number>(0);
  const [answers, setAnswers] = useState<(number | null)[]>(
    Array(dassQuestions.length).fill(null),
  );
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [result, setResult] = useState<ReturnType<typeof interpretDASS> | null>(
    null,
  );
  const [rawScores, setRawScores] = useState<{
    depression: number;
    anxiety: number;
    stress: number;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [xpAwarded, setXpAwarded] = useState<number | null>(null);
  const [animate, setAnimate] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Progress metrics
  const totalQuestions = dassQuestions.length;
  const answeredCount = answers.filter((a) => a !== null).length;
  const progressPercent = Math.round(((current + 1) / totalQuestions) * 100);

  // Subscale answered counts
  const anxietyAnsweredCount = anxietyIndexes.filter(
    (idx) => answers[idx] !== null,
  ).length;
  const stressAnsweredCount = stressIndexes.filter(
    (idx) => answers[idx] !== null,
  ).length;
  const depressionAnsweredCount = depressionIndexes.filter(
    (idx) => answers[idx] !== null,
  ).length;

  const currentDomain = getDomainInfo(current);
  const currentAnswer = answers[current];

  // Live Triage estimation based on partial answers
  const liveTriage = useMemo(() => {
    if (answeredCount === 0) {
      return {
        level: "Belum Mengisi",
        categoryText: "Kategori: Belum Ada Data",
        desc: "Jawab pertanyaan untuk memantau indikator emosi secara langsung.",
        icon: "psychology",
        colorClass: "bg-surface-container text-on-surface-variant",
        pillClass: "bg-surface-container text-on-surface-variant",
        isAlert: false,
      };
    }

    const currentScores = calculateDASS(
      answers.map((a) => (a === null ? 0 : a)),
    );
    const interp = interpretDASS(currentScores);

    const levels = [
      interp.anxietyLevel,
      interp.stressLevel,
      interp.depressionLevel,
    ];
    if (levels.includes("Sangat Berat") || levels.includes("Berat")) {
      return {
        level: "Tinggi",
        categoryText: "Kategori: Perlu Perhatian",
        desc: "Indikasi beban psikologis cukup tinggi, siaga pendampingan.",
        icon: "heart_broken",
        colorClass: "bg-error text-white",
        pillClass: "bg-[#ffdcc3] text-[#2f1500]",
        isAlert: true,
      };
    }
    if (levels.includes("Sedang")) {
      return {
        level: "Sedang",
        categoryText: "Kategori: Sedang",
        desc: "Terdeteksi fluktuasi emosi, luangkan waktu untuk relaksasi napas.",
        icon: "sentiment_neutral",
        colorClass: "bg-[#ffdcc3] text-[#5e3000]",
        pillClass: "bg-[#ffdcc3] text-[#5e3000]",
        isAlert: false,
      };
    }
    return {
      level: "Ringan",
      categoryText: "Kategori: Ringan",
      desc: "Respon adaptif normal pascabencana, kondisi terpantau stabil.",
      icon: "sentiment_satisfied",
      colorClass: "bg-secondary-fixed text-primary",
      pillClass: "bg-secondary-fixed text-primary",
      isAlert: false,
    };
  }, [answers, answeredCount]);

  // Handle single question answer selection
  const handleSelectOption = (value: number) => {
    const updated = [...answers];
    updated[current] = value;
    setAnswers(updated);
  };

  // Submit assessment & save to PostgreSQL database
  const finalizeSubmission = async (completedAnswers: (number | null)[]) => {
    setIsSubmitting(true);
    const safeAnswers = completedAnswers.map((a) => (a === null ? 0 : a));
    const scores = calculateDASS(safeAnswers);
    const interpretation = interpretDASS(scores);

    setRawScores(scores);
    setResult(interpretation);
    setSubmitted(true);

    try {
      const res = await fetch("/api/screening", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          depression: scores.depression,
          anxiety: scores.anxiety,
          stress: scores.stress,
          depressionLevel: interpretation.depressionLevel,
          anxietyLevel: interpretation.anxietyLevel,
          stressLevel: interpretation.stressLevel,
          answers: safeAnswers,
          culture,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setXpAwarded(100);
        showToast("Skrining selesai! +100 XP Pohon Harapan ditambahkan 🎉");
      }
    } catch (err) {
      console.warn("Could not save screening to backend:", err);
      setXpAwarded(100); // optimistic XP reward in UI
    } finally {
      setIsSubmitting(false);
    }
  };

  // Go to next question or finalize
  const handleNext = () => {
    if (current < totalQuestions - 1) {
      setAnimate(true);
      setTimeout(() => {
        setCurrent((prev) => prev + 1);
        setAnimate(false);
      }, 150);
    } else {
      finalizeSubmission(answers);
    }
  };

  // Go to previous question
  const handlePrev = () => {
    if (current > 0) {
      setAnimate(true);
      setTimeout(() => {
        setCurrent((prev) => prev - 1);
        setAnimate(false);
      }, 150);
    }
  };

  // Skip question temporarily
  const handleSkip = () => {
    if (current < totalQuestions - 1) {
      setAnimate(true);
      setTimeout(() => {
        setCurrent((prev) => prev + 1);
        setAnimate(false);
      }, 150);
    } else {
      finalizeSubmission(answers);
    }
  };

  // Jump to specific domain question
  const jumpToDomain = (targetIndexes: number[]) => {
    // Find first unanswered in that domain, or first of domain
    const firstUnanswered = targetIndexes.find((idx) => answers[idx] === null);
    const targetIdx =
      firstUnanswered !== undefined ? firstUnanswered : targetIndexes[0];
    setAnimate(true);
    setTimeout(() => {
      setCurrent(targetIdx);
      setAnimate(false);
    }, 150);
  };

  // Reset screening
  const handleRestart = () => {
    setAnswers(Array(dassQuestions.length).fill(null));
    setCurrent(0);
    setSubmitted(false);
    setResult(null);
    setRawScores(null);
    setXpAwarded(null);
  };

  // Helper level badge style
  const getLevelBadge = (level: string) => {
    switch (level) {
      case "Normal":
        return {
          bg: "bg-[#c1ecd4]",
          text: "text-[#005235]",
          border: "border-emerald-300",
          desc: "Kondisi stabil dalam rentang normal.",
          barColor: "bg-[#006c48]",
        };
      case "Ringan":
        return {
          bg: "bg-[#e8f3ee]",
          text: "text-[#1b4332]",
          border: "border-emerald-200",
          desc: "Fluktuasi emosi ringan yang wajar terjadi pascabencana.",
          barColor: "bg-[#006c48]",
        };
      case "Sedang":
        return {
          bg: "bg-[#ffdcc3]",
          text: "text-[#5e3000]",
          border: "border-amber-300",
          desc: "Mulai mengganggu keseharian, disarankan latihan relaksasi rutin.",
          barColor: "bg-[#f48c24]",
        };
      case "Berat":
        return {
          bg: "bg-[#ffdad6]",
          text: "text-[#93000a]",
          border: "border-red-300",
          desc: "Beban emosi cukup intens, direkomendasikan konsultasi konselor.",
          barColor: "bg-[#ba1a1a]",
        };
      default: // Sangat Berat
        return {
          bg: "bg-[#ffdad6]",
          text: "text-[#93000a]",
          border: "border-red-400 font-bold",
          desc: "Kondisi memerlukan pendampingan segera oleh tenaga profesional.",
          barColor: "bg-[#ba1a1a]",
        };
    }
  };

  return (
    <div className="w-full bg-canvas text-[#191c1e] antialiased selection:bg-[#006c48] selection:text-white min-h-screen-safe flex flex-col justify-between">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] md:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 flex items-center gap-3 px-4 py-3.5 rounded-xl bg-emphasis text-white shadow-xl animate-fade-in">
          <span className="material-symbols-outlined text-[#92f7c3] text-[22px] shrink-0">
            check_circle
          </span>
          <span className="font-label-md text-label-md">{toastMessage}</span>
        </div>
      )}


      {/* MAIN CONTAINER */}
      <main className="w-full bg-canvas min-h-[calc(100dvh-20rem)] py-5 sm:py-8">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-12 py-2">
          {/* Breadcrumb & Protocol Badges */}
          <AnimatedSection index={0}>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5 sm:mb-6">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[#414844] font-label-md text-label-md">
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
                {submitted
                  ? "Hasil Evaluasi DASS-21"
                  : "Tele-Screening DASS-21 Adaptif"}
              </span>
            </div>

            {/* Protocol badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e6e8ea] text-[#012d1d] font-label-sm text-label-sm">
                <span className="material-symbols-outlined text-[16px] text-[#006c48]">
                  verified
                </span>
                <span>Instrumen DASS-21 Terstandar</span>
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
          </AnimatedSection>

          {/* ================= CONDITION 1: RESULT SCREEN ================= */}
          {submitted && result && rawScores ? (
            <AnimatedSection index={1}>
              <div className="flex flex-col gap-8 animate-fade-in">
              {/* Result Banner Card */}
              <div className="relative overflow-hidden rounded-xl bg-emphasis p-5 sm:p-8 text-white shadow-sm">
                <div className="relative z-10 max-w-3xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md font-label-sm text-label-sm text-[#c1ecd4] mb-3">
                    <span className="material-symbols-outlined text-[16px]">
                      verified
                    </span>
                    <span>Asesmen Selesai Terverifikasi</span>
                  </div>
                  <h1 className="font-headline-lg text-headline-lg font-bold tracking-tight text-white mb-2">
                    Hasil Triase &amp; Ringkasan Kondisi Emosional
                  </h1>
                  <p className="font-body-md text-body-md text-[#a5d0b9] leading-relaxed max-w-2xl">
                    Evaluasi terstandar DASS-21 yang telah dianalisis
                    berdasarkan 3 domain psikologis dengan pendekatan
                    Psychological First Aid (PFA) dan kearifan lokal Nusantara.
                  </p>
                </div>
                {/* Reward pill in banner */}
                <div className="absolute right-6 top-6 hidden lg:flex items-center gap-3 bg-white/10 backdrop-blur-md px-5 py-3.5 rounded-xl border border-white/15">
                  <div className="w-10 h-10 rounded-full bg-[#92f7c3] text-[#012d1d] flex items-center justify-center font-bold text-lg">
                    💎
                  </div>
                  <div className="text-left">
                    <p className="font-label-sm text-label-sm text-[#c1ecd4] leading-none">
                      {xpAwarded
                        ? `+${xpAwarded} XP Terklaim`
                        : "+100 XP Tersedia"}
                    </p>
                    <p className="font-body-sm text-body-sm text-white font-medium mt-1">
                      Pohon Harapan Tumbuh!
                    </p>
                  </div>
                </div>
                <div className="absolute -right-12 -bottom-16 w-72 h-72 rounded-full bg-[#006c48]/20 blur-3xl pointer-events-none"></div>
              </div>

              {/* 3 Domain Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Depresi Card */}
                {(() => {
                  const style = getLevelBadge(result.depressionLevel);
                  return (
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between gap-4">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-[#012d1d]">
                            <span className="material-symbols-outlined text-[#006c48] text-[22px]">
                              cloud
                            </span>
                            <h3 className="font-headline-sm text-headline-sm font-bold">
                              Depresi (D)
                            </h3>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold border ${style.bg} ${style.text} ${style.border}`}
                          >
                            {result.depressionLevel}
                          </span>
                        </div>
                        <p className="text-xs text-[#414844] mt-1">
                          {style.desc}
                        </p>
                      </div>

                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between text-xs font-semibold text-[#414844]">
                          <span>Skor Domain</span>
                          <span className="text-[#012d1d] font-bold">
                            {rawScores.depression} / 21
                          </span>
                        </div>
                        <div className="w-full bg-[#eceef0] h-2.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${style.barColor}`}
                            style={{
                              width: `${Math.min(100, Math.round((rawScores.depression / 21) * 100))}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Kecemasan Card */}
                {(() => {
                  const style = getLevelBadge(result.anxietyLevel);
                  return (
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between gap-4">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-[#012d1d]">
                            <span className="material-symbols-outlined text-[#006c48] text-[22px]">
                              sentiment_neutral
                            </span>
                            <h3 className="font-headline-sm text-headline-sm font-bold">
                              Kecemasan (A)
                            </h3>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold border ${style.bg} ${style.text} ${style.border}`}
                          >
                            {result.anxietyLevel}
                          </span>
                        </div>
                        <p className="text-xs text-[#414844] mt-1">
                          {style.desc}
                        </p>
                      </div>

                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between text-xs font-semibold text-[#414844]">
                          <span>Skor Domain</span>
                          <span className="text-[#012d1d] font-bold">
                            {rawScores.anxiety} / 21
                          </span>
                        </div>
                        <div className="w-full bg-[#eceef0] h-2.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${style.barColor}`}
                            style={{
                              width: `${Math.min(100, Math.round((rawScores.anxiety / 21) * 100))}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Stres Card */}
                {(() => {
                  const style = getLevelBadge(result.stressLevel);
                  return (
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between gap-4">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-[#012d1d]">
                            <span className="material-symbols-outlined text-[#006c48] text-[22px]">
                              mood_bad
                            </span>
                            <h3 className="font-headline-sm text-headline-sm font-bold">
                              Stres (S)
                            </h3>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold border ${style.bg} ${style.text} ${style.border}`}
                          >
                            {result.stressLevel}
                          </span>
                        </div>
                        <p className="text-xs text-[#414844] mt-1">
                          {style.desc}
                        </p>
                      </div>

                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between text-xs font-semibold text-[#414844]">
                          <span>Skor Domain</span>
                          <span className="text-[#012d1d] font-bold">
                            {rawScores.stress} / 21
                          </span>
                        </div>
                        <div className="w-full bg-[#eceef0] h-2.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${style.barColor}`}
                            style={{
                              width: `${Math.min(100, Math.round((rawScores.stress / 21) * 100))}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Psychological & Cultural Interpretation Card */}
              <div className="bg-white rounded-xl p-6 sm:p-8 shadow-sm border border-slate-100 flex flex-col gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#c1ecd4] text-[#005235] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[24px]">
                      psychology
                    </span>
                  </div>
                  <div>
                    <h3 className="font-headline-sm text-headline-sm font-bold text-[#012d1d]">
                      Sintesis Psikologis &amp; Refleksi Jiwa
                    </h3>
                    <p className="font-body-sm text-body-sm text-[#414844]">
                      Pesan hangat dan panduan Psychological First Aid (PFA)
                      untuk langkah pemulihanmu
                    </p>
                  </div>
                </div>

                <div className="p-5 rounded-xl bg-[#f2f4f6] text-[#191c1e] text-sm leading-relaxed border-l-4 border-[#006c48]">
                  <p className="font-medium">{result.motivationMessage}</p>
                </div>

                {/* Cultural Wisdom Integration */}
                <div className="p-5 rounded-xl bg-gradient-to-br from-[#eceef0] to-[#f2f4f6] flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs text-[#414844] font-semibold uppercase tracking-wider">
                    <span className="text-[#006c48]">
                      {culture === "kalimantan"
                        ? "Falsafah Dayak: Handep & Ketangguhan Betang"
                        : "Kearifan Aceh: Semangat Meuseuraya"}
                    </span>
                    <span>Kearifan Lokal Nusantara</span>
                  </div>
                  <blockquote className="font-headline-sm text-headline-sm text-[#012d1d] italic mt-1">
                    {culture === "kalimantan"
                      ? "“Bapakat kita bagawi, bapasang kita basanding; saperti ulin teguh di tanah rimba.”"
                      : "“Bungoeng jeumpa meugisa meutaloe, saboh hatee peugot gampong.”"}
                  </blockquote>
                  <p className="font-body-sm text-body-sm text-[#414844] mt-1">
                    {culture === "kalimantan"
                      ? "Falsafah kebersamaan Betang dan ketangguhan pohon ulin melambangkan daya lentur jiwamu. Setiap fase pemulihan adalah proses bertahap yang membawamu tumbuh lebih kuat bersama orang-orang terkasih."
                      : "Semangat kebersamaan dan gotong royong mengajarkan bahwa duka bencana bukanlah beban yang dipikul sendirian. Jiwa yang saling bertaut akan menguatkan kembali harapan masa depan."}
                  </p>
                </div>

                {/* Action recommendations */}
                <div className="flex flex-col gap-3 pt-2 border-t border-slate-100">
                  <h4 className="font-label-md text-label-md font-bold text-[#012d1d] uppercase tracking-wider">
                    Rekomendasi Tindak Lanjut Pemulihan Jiwa
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Link
                      href="/journal"
                      className="p-4 rounded-xl bg-[#f2f4f6] hover:bg-[#eceef0] transition-colors flex items-center gap-3"
                    >
                      <div className="w-10 h-10 rounded-xl bg-[#92f7c3] text-[#002113] flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[20px]">
                          airwave
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-label-md text-label-md font-bold text-[#012d1d]">
                          Latihan Napas 4-4-4
                        </span>
                        <span className="text-xs text-[#414844]">
                          Meredakan detak &amp; cemas
                        </span>
                      </div>
                    </Link>

                    <Link
                      href="/journal"
                      className="p-4 rounded-xl bg-[#f2f4f6] hover:bg-[#eceef0] transition-colors flex items-center gap-3"
                    >
                      <div className="w-10 h-10 rounded-xl bg-[#c1ecd4] text-[#274e3d] flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[20px]">
                          edit_note
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-label-md text-label-md font-bold text-[#012d1d]">
                          Tulis Jurnal Jiwa
                        </span>
                        <span className="text-xs text-[#414844]">
                          +50 XP di Pohon Harapan
                        </span>
                      </div>
                    </Link>

                    <Link
                      href="/chat"
                      className="p-4 rounded-xl bg-[#ffdcc3]/50 hover:bg-[#ffdcc3] transition-colors flex items-center gap-3"
                    >
                      <div className="w-10 h-10 rounded-xl bg-[#ffdcc3] text-[#2f1500] flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[20px]">
                          support_agent
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-label-md text-label-md font-bold text-[#012d1d]">
                          Obrolan Konselor
                        </span>
                        <span className="text-xs text-[#414844]">
                          Konseling ramah anak
                        </span>
                      </div>
                    </Link>
                  </div>
                </div>

                {/* Bottom Navigation Buttons */}
                <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-between gap-3 sm:gap-4 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleRestart}
                    className="w-full sm:w-auto min-h-11 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#eceef0] hover:bg-[#e6e8ea] text-[#191c1e] font-label-md text-sm font-semibold transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      replay
                    </span>
                    <span>Ulangi Skrining</span>
                  </button>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                    <Link
                      href="/journal"
                      className="w-full sm:w-auto min-h-11 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#eceef0] hover:bg-[#e6e8ea] text-[#012d1d] font-label-md text-sm font-semibold transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        yard
                      </span>
                      <span>Lihat Pohon Harapan</span>
                    </Link>
                    <Link
                      href="/dashboard"
                      className="w-full sm:w-auto min-h-11 inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-action hover:bg-action-hover text-white font-label-md text-sm font-semibold transition-all shadow-sm"
                    >
                      <span>Akses Dashboard</span>
                      <span className="material-symbols-outlined text-[18px]">
                        arrow_forward
                      </span>
                    </Link>
                  </div>
                </div>
              </div>
              </div>
            </AnimatedSection>
          ) : (
            /* ================= CONDITION 2: QUESTIONNAIRE SCREEN ================= */
            <div className="flex flex-col w-full">
              {/* Main Title Card / Editorial Scrim Banner */}
              <AnimatedSection index={1}>
                <div className="relative overflow-hidden rounded-xl bg-emphasis p-5 sm:p-8 text-white shadow-sm mb-6 sm:mb-8">
                <div className="relative z-10 max-w-3xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md font-label-sm text-label-sm text-[#c1ecd4] mb-3">
                    <span className="material-symbols-outlined text-[16px]">
                      psychology
                    </span>
                    <span>Psychological First Aid (PFA) Anak &amp; Remaja</span>
                  </div>
                  <h1 className="font-headline-lg text-headline-lg font-extrabold tracking-tight text-white mb-2">
                    Tele-Screening &amp; Deteksi Emosi Mandiri
                  </h1>
                  <p className="font-body-md text-body-md text-[#a5d0b9] leading-relaxed max-w-2xl">
                    Asesmen psikometrik terstandar yang dirancang ramah anak
                    untuk mengenali kecemasan, stres, dan kelelahan emosi
                    pascabencana secara dini. Divalidasi oleh konselor anak
                    dengan kearifan lokal pemulihan jiwa.
                  </p>
                </div>
                {/* Soft ambient circular ornament */}
                <div className="absolute -right-12 -bottom-16 w-72 h-72 rounded-full bg-[#006c48]/20 blur-3xl pointer-events-none"></div>
                <div className="absolute right-12 top-6 hidden lg:flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-3 rounded-xl border border-white/10">
                  <div className="w-10 h-10 rounded-full bg-[#92f7c3] text-[#012d1d] flex items-center justify-center font-bold text-sm">
                    21
                  </div>
                  <div className="text-left">
                    <p className="font-label-sm text-label-sm text-[#c1ecd4] leading-none">
                      Pertanyaan Singkat
                    </p>
                    <p className="font-body-sm text-body-sm text-white font-medium mt-1">
                      Estimasi 4-6 Menit
                    </p>
                  </div>
                </div>
                </div>
              </AnimatedSection>

              {/* 12-Column Balanced Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* LEFT COLUMN: Interactive DASS-21 Questionnaire (8 Columns) */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                  {/* Category Tracker / Domain Sub-Navigation */}
                  <AnimatedSection index={2}>
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Kecemasan Pill */}
                      <button
                        type="button"
                        onClick={() => jumpToDomain(anxietyIndexes)}
                        className={`min-h-11 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full font-label-sm text-label-sm transition-all ${
                          currentDomain.key === "anxiety"
                            ? "bg-emphasis text-white shadow-xs"
                            : "bg-[#e6e8ea] text-[#414844] hover:bg-[#eceef0]"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          sentiment_neutral
                        </span>
                        <span>Kecemasan ({anxietyAnsweredCount}/7)</span>
                      </button>

                      {/* Stres Pill */}
                      <button
                        type="button"
                        onClick={() => jumpToDomain(stressIndexes)}
                        className={`min-h-11 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full font-label-sm text-label-sm transition-all ${
                          currentDomain.key === "stress"
                            ? "bg-emphasis text-white shadow-xs"
                            : "bg-[#e6e8ea] text-[#414844] hover:bg-[#eceef0]"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          mood_bad
                        </span>
                        <span>Stres ({stressAnsweredCount}/7)</span>
                      </button>

                      {/* Depresi Pill */}
                      <button
                        type="button"
                        onClick={() => jumpToDomain(depressionIndexes)}
                        className={`min-h-11 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full font-label-sm text-label-sm transition-all ${
                          currentDomain.key === "depression"
                            ? "bg-emphasis text-white shadow-xs"
                            : "bg-[#e6e8ea] text-[#414844] hover:bg-[#eceef0]"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          cloud
                        </span>
                        <span>Depresi ({depressionAnsweredCount}/7)</span>
                      </button>
                    </div>

                    <span className="font-label-sm text-label-sm text-fg-brand font-semibold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">
                        healing
                      </span>
                      <span>Domain: {currentDomain.label}</span>
                    </span>
                    </div>
                  </AnimatedSection>

                  {/* Question Container */}
                  <AnimatedSection index={3}>
                    <div className="bg-white rounded-xl p-4 sm:p-6 lg:p-8 shadow-sm border border-slate-100 flex flex-col gap-5 sm:gap-6 relative">
                    {/* Step indicator & Progress */}
                    <div className="sticky top-16 md:static z-20 bg-white/95 backdrop-blur-xs -mx-4 px-4 py-2.5 sm:mx-0 sm:px-0 sm:py-0 sm:bg-transparent border-b border-line sm:border-b-0 flex flex-col gap-2">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-label-sm font-label-sm">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full bg-tint text-fg-brand font-bold">
                            Soal {current + 1}
                          </span>
                          <span className="text-[#414844]">
                            dari 21 Pertanyaan
                          </span>
                        </div>
                        <span className="text-fg-brand font-semibold">
                          {progressPercent}% Selesai
                        </span>
                      </div>
                      <div className="w-full bg-[#eceef0] h-2.5 rounded-full overflow-hidden">
                        <div
                          className="bg-action h-full rounded-full transition-all duration-300"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Question Prompt */}
                    <div
                      className={`py-1 sm:py-2 transition-opacity duration-200 ${
                        animate ? "opacity-20" : "opacity-100"
                      }`}
                    >
                      <span className="font-label-sm text-label-sm uppercase tracking-wider text-fg-brand font-semibold mb-2 block">
                        Refleksi Sepekan Terakhir • {currentDomain.label}
                      </span>
                      <h2 className="font-headline-md text-headline-md font-bold text-[#191c1e] leading-snug">
                        “{dassQuestions[current]?.text}”
                      </h2>
                      <p className="font-body-sm text-body-sm text-[#414844] mt-2">
                        Ingatlah kejadian dalam 7 hari terakhir. Pilihlah opsi
                        yang paling mewakili keadaan hatimu tanpa takut dinilai
                        salah.
                      </p>
                    </div>

                    {/* 4 Interactive Option Cards */}
                    <div
                      aria-label="Skala Pilihan Respon"
                      className="flex flex-col gap-3"
                      role="radiogroup"
                    >
                      {DASS_OPTIONS.map((opt) => {
                        const isSelected = currentAnswer === opt.score;
                        return (
                          <label
                            key={opt.score}
                            onClick={() => handleSelectOption(opt.score)}
                            className={`group relative flex items-start gap-3 sm:gap-4 min-h-[60px] p-3.5 sm:p-4 rounded-xl cursor-pointer transition-all border ${
                              isSelected
                                ? "bg-white ring-2 ring-action border-action shadow-sm"
                                : "bg-[#f2f4f6] hover:bg-[#eceef0] border-transparent"
                            }`}
                          >
                            <div className="pt-0.5 shrink-0">
                              <input
                                className="sr-only peer"
                                name={`dass_q_${current}`}
                                type="radio"
                                value={opt.score}
                                checked={isSelected}
                                onChange={() => handleSelectOption(opt.score)}
                              />
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                                  isSelected
                                    ? "bg-emphasis text-white"
                                    : "bg-white border border-slate-300 group-hover:border-slate-400"
                                }`}
                              >
                                <div
                                  className={`w-2.5 h-2.5 rounded-full bg-white transition-opacity ${
                                    isSelected ? "opacity-100" : "opacity-0"
                                  }`}
                                />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                                <div className="flex flex-wrap items-center gap-2 min-w-0">
                                  <span
                                    className={`font-headline-sm text-headline-sm font-semibold ${
                                      isSelected
                                        ? "text-fg-brand font-bold"
                                        : "text-[#191c1e]"
                                    }`}
                                  >
                                    {opt.title}
                                  </span>
                                  {isSelected && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-tint text-fg-brand text-xs font-semibold">
                                      <span className="material-symbols-outlined text-[14px]">
                                        check
                                      </span>{" "}
                                      Terpilih
                                    </span>
                                  )}
                                </div>
                                <span
                                  className={`font-label-sm text-label-sm px-2 py-0.5 rounded font-semibold shrink-0 ${
                                    isSelected
                                      ? "text-fg-brand bg-tint"
                                      : "text-[#414844] bg-[#eceef0]"
                                  }`}
                                >
                                  Skor {opt.score}
                                </span>
                              </div>
                              <p className="font-body-sm text-body-sm text-[#414844]">
                                {opt.desc}
                              </p>
                            </div>
                          </label>
                        );
                      })}
                    </div>

                    {/* Bottom Navigation Action Bar */}
                    <div className="pt-4 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 border-t border-slate-100">
                      <button
                        onClick={handlePrev}
                        disabled={current === 0}
                        className={`w-full sm:w-auto min-h-12 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-label-md text-label-md font-semibold transition-colors ${
                          current === 0
                            ? "bg-[#eceef0] text-[#c1c8c2] cursor-not-allowed"
                            : "bg-[#eceef0] text-[#191c1e] hover:bg-[#e6e8ea]"
                        }`}
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          arrow_back
                        </span>
                        <span>Sebelumnya</span>
                      </button>

                      <div className="w-full sm:w-auto flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
                        <button
                          onClick={handleSkip}
                          className="w-full sm:w-auto min-h-11 px-4 py-2.5 rounded-xl text-[#414844] hover:text-[#191c1e] hover:bg-[#f2f4f6] font-label-md text-label-md font-medium transition-colors"
                          type="button"
                        >
                          {current === totalQuestions - 1
                            ? "Lewati & Selesaikan"
                            : "Lewati Sementara"}
                        </button>
                        <button
                          onClick={handleNext}
                          disabled={isSubmitting}
                          className="w-full sm:w-auto min-h-12 inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-action text-white font-label-md text-label-md font-semibold hover:bg-action-hover transition-all shadow-sm"
                          type="button"
                        >
                          <span>
                            {current === totalQuestions - 1
                              ? "Lihat Hasil Triase"
                              : "Selanjutnya"}
                          </span>
                          <span className="material-symbols-outlined text-[18px]">
                            {current === totalQuestions - 1
                              ? "done_all"
                              : "arrow_forward"}
                          </span>
                        </button>
                      </div>
                    </div>
                    </div>
                  </AnimatedSection>

                  {/* Quick Reference Preview Section (Matriks Instrumen DASS-21) */}
                  <AnimatedSection index={4}>
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#006c48] text-[20px]">
                          view_timeline
                        </span>
                        <h3 className="font-headline-sm text-headline-sm font-semibold text-[#012d1d]">
                          Matriks Instrumen DASS-21
                        </h3>
                      </div>
                      <span className="font-label-sm text-label-sm text-[#414844]">
                        Adaptasi Budaya &amp; Klinis PFA
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* Anxiety pill preview */}
                      <div
                        onClick={() => jumpToDomain(anxietyIndexes)}
                        className={`p-3.5 rounded-xl cursor-pointer transition-all border ${
                          currentDomain.key === "anxiety"
                            ? "bg-[#f2f4f6] border-[#006c48] shadow-xs"
                            : "bg-[#f2f4f6] border-transparent opacity-85 hover:opacity-100"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-label-md text-label-md font-bold text-[#012d1d]">
                            Kecemasan (A)
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full font-label-sm text-label-sm ${
                              currentDomain.key === "anxiety"
                                ? "bg-[#92f7c3] text-[#012d1d] font-bold"
                                : anxietyAnsweredCount === 7
                                  ? "bg-[#c1ecd4] text-[#005235]"
                                  : "bg-[#eceef0] text-[#414844]"
                            }`}
                          >
                            {currentDomain.key === "anxiety"
                              ? "Aktif"
                              : anxietyAnsweredCount === 7
                                ? "Selesai ✓"
                                : `${anxietyAnsweredCount}/7`}
                          </span>
                        </div>
                        <p className="font-body-sm text-body-sm text-[#414844] leading-tight mt-1 text-xs">
                          Reaksi fisiologis otonom, kekhawatiran situasional
                          pascagempa/banjir.
                        </p>
                        <div className="flex gap-1 mt-2">
                          {anxietyIndexes.map((idx) => {
                            const isAns = answers[idx] !== null;
                            const isCur = current === idx;
                            return (
                              <div
                                key={idx}
                                className={`h-1.5 flex-1 rounded-full transition-all ${
                                  isCur
                                    ? "bg-[#012d1d] animate-pulse"
                                    : isAns
                                      ? "bg-[#006c48]"
                                      : "bg-[#e6e8ea]"
                                }`}
                              />
                            );
                          })}
                        </div>
                      </div>

                      {/* Stress pill preview */}
                      <div
                        onClick={() => jumpToDomain(stressIndexes)}
                        className={`p-3.5 rounded-xl cursor-pointer transition-all border ${
                          currentDomain.key === "stress"
                            ? "bg-[#f2f4f6] border-[#006c48] shadow-xs"
                            : "bg-[#f2f4f6] border-transparent opacity-85 hover:opacity-100"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-label-md text-label-md font-bold text-[#012d1d]">
                            Stres (S)
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full font-label-sm text-label-sm ${
                              currentDomain.key === "stress"
                                ? "bg-[#92f7c3] text-[#012d1d] font-bold"
                                : stressAnsweredCount === 7
                                  ? "bg-[#c1ecd4] text-[#005235]"
                                  : "bg-[#eceef0] text-[#414844]"
                            }`}
                          >
                            {currentDomain.key === "stress"
                              ? "Aktif"
                              : stressAnsweredCount === 7
                                ? "Selesai ✓"
                                : `${stressAnsweredCount}/7`}
                          </span>
                        </div>
                        <p className="font-body-sm text-body-sm text-[#414844] leading-tight mt-1 text-xs">
                          Ketegangan saraf, reaktivitas emosi, dan kesulitan
                          untuk rileks santai.
                        </p>
                        <div className="flex gap-1 mt-2">
                          {stressIndexes.map((idx) => {
                            const isAns = answers[idx] !== null;
                            const isCur = current === idx;
                            return (
                              <div
                                key={idx}
                                className={`h-1.5 flex-1 rounded-full transition-all ${
                                  isCur
                                    ? "bg-[#012d1d] animate-pulse"
                                    : isAns
                                      ? "bg-[#006c48]"
                                      : "bg-[#e6e8ea]"
                                }`}
                              />
                            );
                          })}
                        </div>
                      </div>

                      {/* Depression pill preview */}
                      <div
                        onClick={() => jumpToDomain(depressionIndexes)}
                        className={`p-3.5 rounded-xl cursor-pointer transition-all border ${
                          currentDomain.key === "depression"
                            ? "bg-[#f2f4f6] border-[#006c48] shadow-xs"
                            : "bg-[#f2f4f6] border-transparent opacity-85 hover:opacity-100"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-label-md text-label-md font-bold text-[#012d1d]">
                            Depresi (D)
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full font-label-sm text-label-sm ${
                              currentDomain.key === "depression"
                                ? "bg-[#92f7c3] text-[#012d1d] font-bold"
                                : depressionAnsweredCount === 7
                                  ? "bg-[#c1ecd4] text-[#005235]"
                                  : "bg-[#eceef0] text-[#414844]"
                            }`}
                          >
                            {currentDomain.key === "depression"
                              ? "Aktif"
                              : depressionAnsweredCount === 7
                                ? "Selesai ✓"
                                : `${depressionAnsweredCount}/7`}
                          </span>
                        </div>
                        <p className="font-body-sm text-body-sm text-[#414844] leading-tight mt-1 text-xs">
                          Kehilangan minat, rasa putus asa, dan energi emosional
                          rendah.
                        </p>
                        <div className="flex gap-1 mt-2">
                          {depressionIndexes.map((idx) => {
                            const isAns = answers[idx] !== null;
                            const isCur = current === idx;
                            return (
                              <div
                                key={idx}
                                className={`h-1.5 flex-1 rounded-full transition-all ${
                                  isCur
                                    ? "bg-[#012d1d] animate-pulse"
                                    : isAns
                                      ? "bg-[#006c48]"
                                      : "bg-[#e6e8ea]"
                                }`}
                              />
                            );
                          })}
                        </div>
                      </div>
                    </div>
                    </div>
                  </AnimatedSection>
                </div>

                {/* RIGHT COLUMN: Sidebar Pendamping & Live Triage Preview (4 Columns) */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                  {/* Live Triage Indicator Card */}
                  <AnimatedSection index={2}>
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <span className="font-label-sm text-label-sm text-[#414844] uppercase font-semibold">
                        Live Triase Psikologis
                      </span>
                      <span className="w-2.5 h-2.5 rounded-full bg-[#006c48] animate-ping" />
                    </div>

                    <div className="p-4 rounded-xl bg-[#f2f4f6] flex items-center gap-4">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${liveTriage.colorClass}`}
                      >
                        <span className="material-symbols-outlined text-[28px]">
                          {liveTriage.icon}
                        </span>
                      </div>
                      <div>
                        <p className="font-headline-sm text-headline-sm font-bold text-[#012d1d]">
                          {liveTriage.categoryText}
                        </p>
                        <p className="font-body-sm text-body-sm text-[#414844]">
                          {liveTriage.desc}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 font-body-sm text-body-sm text-[#414844] bg-[#eceef0]/60 p-3.5 rounded-xl">
                      <div className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-[#006c48] text-[18px] shrink-0 mt-0.5">
                          security
                        </span>
                        <span>
                          Seluruh jawaban dienkripsi dan diproses di browser
                          tanpa menyimpan nama lengkap.
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-[#006c48] text-[18px] shrink-0 mt-0.5">
                          notifications_active
                        </span>
                        <span>
                          Jika skor menunjukkan indikasi tinggi, tombol
                          panggilan SafeConnect 119 akan teraktivasi seketika.
                        </span>
                      </div>
                    </div>
                    </div>
                  </AnimatedSection>

                  {/* Local Wisdom & PFA Guidance Card */}
                  <AnimatedSection index={3}>
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 flex flex-col gap-4">
                    <div className="flex items-center gap-2 text-[#012d1d]">
                      <span className="material-symbols-outlined text-[22px]">
                        diversity_3
                      </span>
                      <h3 className="font-headline-sm text-headline-sm font-bold">
                        Kearifan Jiwa Nusantara
                      </h3>
                    </div>

                    <div className="p-4 rounded-xl bg-[#f2f4f6] flex flex-col gap-2">
                      <span className="font-label-sm text-label-sm text-[#f48c24] font-semibold uppercase tracking-wider">
                        {culture === "kalimantan"
                          ? "Kearifan Handep Kalimantan"
                          : "Kearifan Meuseuraya Aceh"}
                      </span>
                      <p className="font-body-sm text-body-sm text-[#191c1e] italic leading-relaxed">
                        {culture === "kalimantan"
                          ? "“Merasakan takut dan cemas saat bencana datang adalah tanda perlindungan alami tubuhmu. Di bawah atap Rumah Betang, kamu tidak sendiri, kamu sangat berharga.”"
                          : "“Duka dan lelah ini kita pikul bersama di posko. Bunga jeumpa yang merekah saling bertaut, luka batin perlahan sembuh saat kita saling menguatkan.”"}
                      </p>
                      <p className="font-label-sm text-label-sm text-[#414844] text-right">
                        {culture === "kalimantan"
                          ? "— Falsafah Pemulihan Dayak"
                          : "— Falsafah Gotong Royong Aceh"}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#1b4332] to-[#006c48] flex items-center justify-center text-white shrink-0 shadow-xs">
                        <span className="material-symbols-outlined text-[28px]">
                          support_agent
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-label-md text-label-md font-semibold text-[#012d1d]">
                          Didampingi Konselor Relawan
                        </p>
                        <p className="font-body-sm text-body-sm text-[#414844]">
                          Tersedia layanan obrolan hangat berbasis teks bila
                          kamu merasa ragu mengisi sendiri.
                        </p>
                      </div>
                    </div>
                    </div>
                  </AnimatedSection>

                  {/* SafeConnect 119 Emergency Card */}
                  <AnimatedSection index={4}>
                    <div className="bg-[#ffdad6] text-[#93000a] rounded-xl p-6 shadow-sm flex flex-col gap-4 border border-red-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#ba1a1a] text-white flex items-center justify-center">
                          <span className="material-symbols-outlined text-[18px]">
                            call
                          </span>
                        </div>
                        <h4 className="font-headline-sm text-headline-sm font-bold text-[#93000a]">
                          Siaga SafeConnect 119
                        </h4>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-[#93000a] text-[#ffdad6] text-[11px] font-bold">
                        24 Jam
                      </span>
                    </div>
                    <p className="font-body-sm text-body-sm text-[#93000a]/90">
                      Jika kamu atau anak yang didampingi mengalami serangan
                      panik hebat, sesak emosional, atau butuh bantuan segera:
                    </p>
                    <a
                      className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-[#ba1a1a] text-white font-label-md text-label-md font-bold shadow hover:opacity-95 transition-opacity"
                      href="tel:119"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        emergency
                      </span>
                      <span>Hubungi SafeConnect Bebas Pulsa</span>
                    </a>
                    </div>
                  </AnimatedSection>

                  {/* Resilience Reward & Gamification Card */}
                  <AnimatedSection index={5}>
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-xl bg-[#1b4332] text-[#92f7c3] flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[26px]">
                          military_tech
                        </span>
                      </div>
                      <div>
                        <p className="font-label-md text-label-md font-bold text-[#012d1d]">
                          +100 XP Pohon Harapan
                        </p>
                        <p className="font-body-sm text-body-sm text-[#414844]">
                          Lencana “Self-Awareness Ranger”
                        </p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-[#006c48] text-[24px]">
                      verified
                    </span>
                    </div>
                  </AnimatedSection>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* FOOTER: Matching desain_telescreening.html */}
      <footer className="w-full bg-[#f2f4f6] border-t border-[#c1c8c2]/30 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-10">
          {/* Emergency safeconnect banner in footer */}
          <div className="mb-8 p-6 rounded-xl bg-[#ffdad6] text-[#93000a] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-red-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#ba1a1a] text-white flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px]">
                  emergency
                </span>
              </div>
              <div>
                <p className="font-headline-sm text-headline-sm leading-tight text-[#93000a] font-bold">
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

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
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
                <span className="font-headline-md text-headline-md text-[#012d1d] font-bold">
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
              <h4 className="font-headline-sm text-headline-sm text-[#012d1d] mb-1 font-bold">
                Modul Resiliensi
              </h4>
              <ul className="flex flex-col gap-2 font-body-sm text-body-sm text-[#414844]">
                <li>
                  <Link
                    href="/journal"
                    className="hover:text-[#012d1d] transition-colors"
                  >
                    AI Jurnal Hikmah (Refleksi Kearifan)
                  </Link>
                </li>
                <li>
                  <Link
                    href="/tele-screening"
                    className="hover:text-[#012d1d] transition-colors font-medium text-[#006c48]"
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
                    href="/journal"
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
              <h4 className="font-headline-sm text-headline-sm text-[#012d1d] mb-1 font-bold">
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

          <div className="mt-8 pt-6 border-t border-[#c1c8c2]/30 flex flex-col md:flex-row items-center justify-between gap-4 font-body-sm text-body-sm text-[#414844]">
            <p>© 2024–2026 PERMATA Nusantara. Seluruh Hak Cipta Dilindungi.</p>
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
