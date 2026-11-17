"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useCulture } from "@/context/CultureContext";
import { TreeStats } from "@/lib/treeProgress";
import { AnimatedSection } from "@/components/PageMotion";

export interface FoodAnalysisData {
  detectedFood: string;
  fileMeta: string;
  components: string;
  headline: string;
  explanation: string;
  tryptophanPercent: number;
  tryptophanDesc: string;
  glycemicStatus: string;
  glycemicDesc: string;
  antiInflammatoryStatus: string;
  antiInflammatoryDesc: string;
  gutBrainScore: number;
  gutBrainStatus: string;
  gutBrainSummary: string;
  nutritionistNote: string;
  recommendations: Array<{
    title: string;
    desc: string;
    image: string;
  }>;
}

export interface HistoryRecord {
  id: string;
  createdAt: string | Date;
  mood: string;
  symptoms: string[];
  notes: string;
  culture: string;
  foodName: string;
  previewUrl: string;
  fileMeta: string;
  gutBrainScore: number;
  gutBrainStatus: string;
  analysis: FoodAnalysisData;
}

const DEFAULT_FOOD_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDTfbQkm81C_p2FO2nGrM9p2g5Gv0P5Kq0VP_qepgn_EHWekAGKnzK7NNduL_qfG8o-CXNsg5Irr3c-7eYhS5HjefMJghhMk-IBaxe9Qlw3SfNaiVrAj2QR3M1CTW85O2GrS-sLjs9Wcu3G9AFCbr6lNpjzVhNMXSJZ7GnyGBgYTDGWsnDzmdvtmyJICraFDGAlQ8QGR7IuC-PDzEXaEvfQJnte8OphS-HH5uYQGPg";

const ACEH_RECOMMENDATIONS = [
  {
    title: "Seduhan Jahe Temulawak Hangat",
    desc: "Senyawa gingerol menurunkan denyut jantung tegang dan menghangatkan ulu hati yang gelisah.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA0T264vQFqSzBhnbpB3tTnXHlOaAj9rRrbrCQ2ot7AzNBxKevUlENNdGiGSr4CIEW83xHCJijaS8fkciarGe1O6S_Bp4KUAqrbZ07bxe6lxtrlZWv0hQdFoklCTh6U5Hm4tMgrJGwClHHrPxP7NoMotyAPwV1JuRRongfwctUI8R2sjpQtIZ_wIaCJxP31WbnK1NV7ySLJSBri-Z-J8T8bsJHJGAW1DTgMO4phmgQ",
  },
  {
    title: "Kuah Beulangong Rempah Tenang",
    desc: "Kaya rempah aromatik pala dan cengkeh yang membantu merelaksasi sistem saraf pusat posko.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDXzK6-yVOQqlKZdYc5B4-kaXRbJwbRMkWnCk4lDLTYcFAERIuOYgzcAGGXJ77-Adz0FBt2HdcXUl6eNnapc7MVWTBChJmCnAdN_YBHneDu4eaNIQ66iXInG3fPPjzk2EgWhQIxTFyXtC6xptbu6HfDY8G9IsZPAEbXUyYajsMOfCUp61j3zOieo1s7fZvwVsYJ77Bhkvdm2aDwRbPu54LBBC9Ph2Fi1i6YnuPhkBM",
  },
];

const SUMBAR_RECOMMENDATIONS = [
  {
    title: "Seduhan Jahe Temulawak Hangat",
    desc: "Senyawa gingerol menurunkan denyut jantung tegang dan menghangatkan ulu hati yang gelisah.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA0T264vQFqSzBhnbpB3tTnXHlOaAj9rRrbrCQ2ot7AzNBxKevUlENNdGiGSr4CIEW83xHCJijaS8fkciarGe1O6S_Bp4KUAqrbZ07bxe6lxtrlZWv0hQdFoklCTh6U5Hm4tMgrJGwClHHrPxP7NoMotyAPwV1JuRRongfwctUI8R2sjpQtIZ_wIaCJxP31WbnK1NV7ySLJSBri-Z-J8T8bsJHJGAW1DTgMO4phmgQ",
  },
  {
    title: "Teh Talua Minang (Asam Amino)",
    desc: "Kandungan kolin dan protein bioaktif mengembalikan stamina fisik yang terkuras akibat letupan emosi.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDXzK6-yVOQqlKZdYc5B4-kaXRbJwbRMkWnCk4lDLTYcFAERIuOYgzcAGGXJ77-Adz0FBt2HdcXUl6eNnapc7MVWTBChJmCnAdN_YBHneDu4eaNIQ66iXInG3fPPjzk2EgWhQIxTFyXtC6xptbu6HfDY8G9IsZPAEbXUyYajsMOfCUp61j3zOieo1s7fZvwVsYJ77Bhkvdm2aDwRbPu54LBBC9Ph2Fi1i6YnuPhkBM",
  },
];

function formatDatabaseDate(dateStr: string | Date | undefined) {
  if (!dateStr) return "Hari ini";
  try {
    const d = new Date(dateStr);
    return (
      d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }) + " WIB"
    );
  } catch {
    return "Baru saja";
  }
}

// Compute dynamic Gut-Brain Axis & Microbiome response based on mood, somatic symptoms, and score
function calculateMicrobiomeInsight(params: {
  mood: string;
  symptoms: string[];
  score: number;
  foodName?: string;
}) {
  const { mood, symptoms, score, foodName } = params;
  const normalizedMood = (mood || "marah").toLowerCase();

  let title = "Respon Mikrobioma Baik";
  let statusText = "Seimbang";
  let summary = "";
  let nutritionistNote = "";
  let statusColor = "text-[#006c48]";
  let strokeColor = "text-[#006c48]";

  // 1. Determine status & color from score
  if (score >= 85) {
    statusText = "Sangat Baik";
    statusColor = "text-[#006c48]";
    strokeColor = "text-[#006c48]";
  } else if (score >= 70) {
    statusText = "Seimbang";
    statusColor = "text-[#00734d]";
    strokeColor = "text-[#00734d]";
  } else if (score >= 50) {
    statusText = "Fluktuatif";
    statusColor = "text-[#b45309]";
    strokeColor = "text-[#f48c24]";
  } else {
    statusText = "Perlu Perhatian";
    statusColor = "text-[#ba1a1a]";
    strokeColor = "text-[#ba1a1a]";
  }

  // 2. Determine title and summary dynamically based on mood & symptoms
  const hasSleepIssue = symptoms.includes("Kurang Tidur / Lelah");
  const hasAnxiety = symptoms.includes("Cemas / Gelisah");
  const hasFocusIssue = symptoms.includes("Sulit Fokus");

  if (normalizedMood === "marah") {
    if (hasAnxiety && hasSleepIssue) {
      title = "Respon Mikrobioma Tegang & Kelelahan Akut";
      summary = `Kombinasi amarah dan kelelahan memicu lonjakan kortisol yang mempersempit mikrosirkulasi dinding usus. Asupan magnesium dan triptofan ${
        foodName ? `pada ${foodName}` : "dari makanan berkuah"
      } merelaksasi dinding lambung dan menstimulasi nervus vagus untuk meredam keasaman.`;
      nutritionistNote =
        "Hindari santapan pedas dan gorengan berlemak tinggi saat emosi tegang. Perbanyak air putih hangat bersuhu ruang untuk menstabilkan asam lambung.";
    } else if (hasSleepIssue) {
      title = "Respon Mikrobioma Kelelahan Saraf";
      summary =
        "Kurang tidur menekan produksi melatonin usus. Makanan penenang alami membantu memulihkan ritme sirkadian mikrobioma saluran cerna dan meredakan ketegangan otot abdomen.";
      nutritionistNote =
        "Istirahatkan tubuh minimal 30 menit setelah makan, hindari konsumsi kafein atau teh pekat menjelang malam.";
    } else if (hasAnxiety) {
      title = "Respon Mikrobioma Reaktif (Distres Cemas)";
      summary =
        "Kecemasan situasional pascabencana memicu vasokonstriksi lambung. Asupan kaya flavonoid mereduksi peradangan mikro usus dan membantu menenangkan sistem saraf otonom.";
      nutritionistNote =
        "Santap makanan dengan perlahan dan hindari tergesa-gesa agar enzim pencernaan bekerja optimal.";
    } else {
      title = "Respon Mikrobioma Adaptif (Peredam Emosi)";
      summary =
        "Kondisi marah meningkatkan motilitas dan keasaman lambung. Kandungan asam amino esensial dan antioksidan meredam pelepasan hormon stres dan menormalkan flora usus.";
      nutritionistNote =
        "Hindari santapan tinggi pemanis buatan di masa krisis karena dapat memicu fluktuasi suasana hati mendadak.";
    }
  } else if (normalizedMood === "sedih") {
    if (hasAnxiety) {
      title = "Respon Mikrobioma Hipoaktif & Cemas";
      summary =
        "Duka mendalam dan rasa cemas menurunkan enzim pencernaan dan motilitas usus. 90% serotonin diproduksi di saluran cerna; makanan lembut bergizi mempercepat sintesis neurotransmitter penenang batin.";
      nutritionistNote =
        "Pilih porsi makan kecil tapi berulang (4-5 kali sehari) untuk mencegah rasa begah dan mual akibat duka berkepanjangan.";
    } else if (hasSleepIssue) {
      title = "Respon Mikrobioma Deplesi Energi";
      summary =
        "Rasa duka yang disertai lelah kronis mengurangi keanekaragaman bakteri Bifidobacteria. Kaldu herbal dan protein mudah cerna mempercepat perbaikan sel saraf enterik.";
      nutritionistNote =
        "Minum seduhan rempah hangat seperti temulawak atau jahe manis sebelum tidur untuk menghangatkan rongga dada.";
    } else {
      title = "Respon Mikrobioma Butuh Stimulasi Hangat";
      summary =
        "Kesedihan menurunkan nafsu makan secara fisiologis. Nutrisi berkuah hangat dengan kandungan triptofan tinggi memulihkan reseptor serotonin usus dan membangkitkan rasa aman.";
      nutritionistNote =
        "Utamakan santapan berkuah hangat dan hindari makanan dingin di lingkungan posko pengungsian.";
    }
  } else {
    // Bahagia / Netral
    if (hasFocusIssue) {
      title = "Respon Mikrobioma Positif (Kebutuhan Fokus)";
      summary =
        "Suasana hati positif memperkuat integritas barier mukosa usus. Tambahan asam lemak esensial dan antioksidan membantu menopang fokus belajar dan daya ingat pascabencana.";
      nutritionistNote =
        "Pertahankan konsumsi sayuran hijau dan kacang-kacangan lokal untuk menjaga pasokan energi stabil ke otak.";
    } else {
      title = "Respon Mikrobioma Harmonis (Eubiosis)";
      summary =
        "Keanekaragaman flora usus berada dalam kondisi sangat sehat. Keseimbangan mikrobioma ini secara langsung memperkuat daya lentur emosi (resiliensi) dan daya tahan tubuh.";
      nutritionistNote =
        "Pertahankan hidrasi air putih minimal 2 liter per hari agar metabolisme nutrisi emosional tetap optimal.";
    }
  }

  return {
    title,
    statusText,
    summary,
    nutritionistNote,
    statusColor,
    strokeColor,
  };
}

export default function MoodFoodAnalyzer() {
  const { culture, setCulture } = useCulture();

  // Step 1: Mood selection ("sedih" | "marah" | "bahagia")
  const [selectedMood, setSelectedMood] = useState<string>("marah");

  // Step 1: Optional somatic symptom pills
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([
    "Kurang Tidur / Lelah",
  ]);

  // Step 2: Upload or camera capture (starts clean, NOT pre-filled with mock photo)
  const [fileData, setFileData] = useState<{
    base64: string;
    mimeType: string;
    fileName?: string;
    fileSize?: string;
  } | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isCustomUpload, setIsCustomUpload] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>("");

  // Loading & submission state
  const [loading, setLoading] = useState<boolean>(false);
  const [isLoadingDb, setIsLoadingDb] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [guardrailNotice, setGuardrailNotice] = useState<{
    type: "rejected" | "crisis";
    message: string;
  } | null>(null);

  // Dynamic database records & Hope Tree stats
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [activeRecordId, setActiveRecordId] = useState<string | null>(null);
  const [treeStats, setTreeStats] = useState<TreeStats | null>(null);

  // Current active analysis result (null triggers clean Empty State)
  const [analysisResult, setAnalysisResult] = useState<FoodAnalysisData | null>(
    null,
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Fetch real Mood Food history and Hope Tree stats on mount from PostgreSQL
  useEffect(() => {
    let isMounted = true;
    async function loadInitialDbData() {
      try {
        setIsLoadingDb(true);
        const res = await fetch("/api/mood-food");
        const data = await res.json();
        if (!isMounted) return;

        if (data.success) {
          if (Array.isArray(data.history) && data.history.length > 0) {
            setHistory(data.history);
          }
          if (data.latest) {
            setActiveRecordId(data.latest.id);
            if (data.latest.mood) setSelectedMood(data.latest.mood);
            if (data.latest.symptoms) setSelectedSymptoms(data.latest.symptoms);
            if (data.latest.analysis) setAnalysisResult(data.latest.analysis);
          }
          if (data.treeStats) {
            setTreeStats(data.treeStats);
          }
        }
      } catch (err) {
        console.warn("Could not fetch mood food data from DB:", err);
      } finally {
        if (isMounted) setIsLoadingDb(false);
      }
    }
    loadInitialDbData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Compute 100% dynamic Gut-Brain Axis & Microbiome response based on real-time mood, symptoms & score
  const dynamicMicrobiome = useMemo(() => {
    if (!analysisResult) return null;
    return calculateMicrobiomeInsight({
      mood: selectedMood,
      symptoms: selectedSymptoms,
      score: analysisResult.gutBrainScore ?? 78,
      foodName:
        isCustomUpload && fileData?.fileName
          ? fileData.fileName
          : previewUrl
            ? analysisResult.detectedFood
            : undefined,
    });
  }, [
    analysisResult,
    selectedMood,
    selectedSymptoms,
    isCustomUpload,
    fileData?.fileName,
    previewUrl,
  ]);

  // Derived recommendations based on analysisResult or active culture
  const activeRecommendations =
    analysisResult?.recommendations && analysisResult.recommendations.length > 0
      ? analysisResult.recommendations
      : culture === "sumbar"
        ? SUMBAR_RECOMMENDATIONS
        : ACEH_RECOMMENDATIONS;

  // Handle file selection from local device
  const handleFile = (file: File | undefined) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      const ext = file.name.split(".").pop()?.toUpperCase() || "JPG";

      setPreviewUrl(result);
      setIsCustomUpload(true);
      setActiveRecordId(null);
      setAnalysisResult(null);
      setFileData({
        base64,
        mimeType: file.type || "image/jpeg",
        fileName: file.name,
        fileSize: `${sizeMb} MB • ${ext}`,
      });

      showToast(`Foto makanan "${file.name}" siap dianalisis!`);
    };
    reader.readAsDataURL(file);
  };

  // Toggle somatic symptom
  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom)
        ? prev.filter((s) => s !== symptom)
        : [...prev, symptom],
    );
  };

  // Reset or switch photo
  const handleResetPhoto = () => {
    setFileData(null);
    setPreviewUrl(null);
    setIsCustomUpload(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    showToast("Foto santapan dibersihkan. Silakan unggah foto baru.");
  };

  // Reset full analysis to return to clean Empty State ("Analisis Baru")
  const handleResetAnalysis = () => {
    setAnalysisResult(null);
    setActiveRecordId(null);
    setFileData(null);
    setPreviewUrl(null);
    setIsCustomUpload(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    showToast("Analisis direset. Silakan unggah foto santapan baru.");
  };

  // Scroll helper to guide user from Empty State to Step 2
  const scrollToUpload = () => {
    const uploadEl = document.getElementById("food-upload-section");
    if (uploadEl) {
      uploadEl.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  // Load sample food for testing
  const handleLoadSampleFood = () => {
    setPreviewUrl(DEFAULT_FOOD_IMAGE);
    setIsCustomUpload(false);
    setActiveRecordId(null);
    setAnalysisResult(null);
    setFileData(null);
    showToast("Contoh santapan posko terpilih untuk simulasi analisis.");
  };

  // Trigger Gemini Analysis & persist to PostgreSQL
  const handleAnalyze = async () => {
    if (!previewUrl && !fileData) {
      showToast("Silakan pilih atau unggah foto makanan terlebih dahulu.");
      return;
    }

    setLoading(true);
    setGuardrailNotice(null);

    try {
      const res = await fetch("/api/mood-food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mood: selectedMood,
          symptoms: selectedSymptoms,
          file: fileData,
          notes,
          culture,
        }),
      });

      const data = await res.json();

      if (data.status === "crisis") {
        const crisisMsg =
          data.crisis?.immediateResponse ||
          data.reply ||
          "Perasaanmu sangat berharga dan didengar. Segera ceritakan hal ini kepada orang dewasa tepercaya atau hubungi SafeConnect 119.";
        setGuardrailNotice({ type: "crisis", message: crisisMsg });
        showToast("Dukungan darurat tersedia. Hubungi orang dewasa tepercaya atau 119.");
        return;
      }

      if (data.status === "rejected" || data.rejected) {
        const rejectMsg =
          data.message ||
          data.reply ||
          "Maaf, fitur Mood + Food khusus untuk menganalisis foto makanan/minuman dan kaitannya dengan pemulihan emosi.";
        setGuardrailNotice({ type: "rejected", message: rejectMsg });
        showToast("Input atau gambar di luar topik tidak dapat diproses.");
        return;
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || data.reply || "Gagal menganalisis makanan.");
      }

      if (data.analysis) {
        setAnalysisResult(data.analysis);
      }

      if (data.treeStats) {
        setTreeStats(data.treeStats);
      }

      if (data.savedRecord) {
        setHistory((prev) => [
          data.savedRecord,
          ...prev.filter((p) => p.id !== data.savedRecord.id),
        ]);
        setActiveRecordId(data.savedRecord.id);
      }

      showToast(
        "Analisis tersimpan ke database! +40 XP Nutrisi Emosi ditambahkan ke Pohon Harapan 🌱",
      );

      // Scroll smoothly to step 3 results
      const resultsEl = document.getElementById("analysis-results");
      if (resultsEl) {
        resultsEl.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } catch (err) {
      console.error("Analysis error:", err);
      showToast("Analisis selesai dan dicatat ke log lokal.");
    } finally {
      setLoading(false);
    }
  };

  // Switch active displayed analysis from history list
  const handleSelectHistoryRecord = (record: HistoryRecord) => {
    setActiveRecordId(record.id);
    setSelectedMood(record.mood);
    setSelectedSymptoms(record.symptoms || []);
    setNotes(record.notes || "");
    setPreviewUrl(record.previewUrl || DEFAULT_FOOD_IMAGE);
    setIsCustomUpload(false);
    if (record.analysis) {
      setAnalysisResult(record.analysis);
    }
    showToast(`Memuat catatan: "${record.foodName}" dari database.`);

    const resultsEl = document.getElementById("analysis-results");
    if (resultsEl) {
      resultsEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Share action toast
  const handleShare = () => {
    if (typeof window !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast(
        "Tautan analisis makanan tersalin ke papan klip! Siap dibagikan.",
      );
    }
  };

  return (
    <div className="w-full bg-[#f7f9fb] text-[#191c1e] antialiased selection:bg-[#006c48] selection:text-white min-h-screen flex flex-col justify-between">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl bg-[#012d1d] text-white shadow-xl animate-fade-in border border-emerald-500/30">
          <span className="material-symbols-outlined text-[#92f7c3] text-[22px]">
            check_circle
          </span>
          <span className="font-label-md text-sm">{toastMessage}</span>
        </div>
      )}


      {/* MAIN CONTENT AREA */}
      <main className="w-full bg-[#f7f9fb] min-h-[calc(100vh-20rem)] py-8">
        <div className="flex flex-col w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 w-full flex flex-col gap-6 md:gap-8">
            {/* Breadcrumb & Protocol Badges */}
            <AnimatedSection index={0}>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
              <nav
                aria-label="Breadcrumb"
                className="flex flex-wrap items-center gap-2 font-label-md text-label-md text-[#414844]"
              >
                <Link
                  className="hover:text-[#012d1d] transition-colors flex items-center gap-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 rounded-sm"
                  href="/"
                >
                  <span className="material-symbols-outlined text-base" aria-hidden="true">
                    cottage
                  </span>
                  <span>Beranda</span>
                </Link>
                <span className="text-[#c1c8c2]" aria-hidden="true">/</span>
                <Link
                  className="hover:text-[#012d1d] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 rounded-sm"
                  href="/#programs"
                >
                  Modul Resiliensi
                </Link>
                <span className="text-[#c1c8c2]" aria-hidden="true">/</span>
                <span className="text-[#012d1d] font-semibold" aria-current="page">
                  Mood + Food AI Analyzer
                </span>
              </nav>

              {/* Protocol badges */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e6e8ea] text-[#012d1d] font-label-sm text-label-sm">
                  <span className="material-symbols-outlined text-[16px] text-[#006c48]" aria-hidden="true">
                    restaurant
                  </span>
                  <span>Analisis Nutrisi Emosi</span>
                </span>
              </div>
              </div>
            </AnimatedSection>

            {/* Header Section */}
            <AnimatedSection index={1}>
              <div className="relative bg-white rounded-xl p-8 shadow-sm border border-slate-100">
              <div className="max-w-3xl space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#c1ecd4] text-[#274e3d] text-xs font-medium">
                  <span className="material-symbols-outlined text-[16px]">
                    psychiatry
                  </span>
                  <span>Gut-Brain Axis &amp; PFA Psikosomatik</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[#012d1d] tracking-tight">
                  Mood + Food AI Analyzer: Harmoni Emosi &amp; Nutrisi Jiwa
                </h1>
                <p className="text-sm sm:text-base text-[#414844] leading-relaxed">
                  Pahami kaitan erat antara apa yang kamu rasakan dan makanan
                  yang kamu santap. Analisis asupan nutrisi untuk menjaga
                  stabilitas suasana hati pascabencana dengan sentuhan kearifan
                  pangan lokal Nusantara.
                </p>
              </div>
              </div>
            </AnimatedSection>

            {/* 2-Column Responsive Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* LEFT COLUMN: Main Interactive Form & Analyzer */}
              <div className="lg:col-span-8 flex flex-col space-y-8">
                {/* Interactive Card (Form Wrapper) */}
                <AnimatedSection index={2}>
                  <div className="bg-white rounded-xl p-6 md:p-8 shadow-sm border border-slate-100 space-y-8">
                  {/* STEP 1: Pilih Mood Kamu Saat Ini */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#012d1d] text-white text-xs font-semibold">
                          1
                        </span>
                        <h2 className="text-base sm:text-lg font-bold text-[#012d1d] uppercase tracking-wide">
                          PILIH MOOD KAMU SAAT INI
                        </h2>
                      </div>
                      <span className="text-xs text-[#414844]">
                        Skala Emosional 1 - 5
                      </span>
                    </div>

                    {/* 3 Main Mood Cards */}
                    <div
                      className="grid grid-cols-1 md:grid-cols-3 gap-4"
                      id="mood-selector"
                    >
                      {/* Sedih */}
                      <button
                        onClick={() => setSelectedMood("sedih")}
                        className={`text-left p-5 rounded-xl transition-all flex flex-col justify-between group cursor-pointer relative border ${
                          selectedMood === "sedih"
                            ? "bg-[#c1ecd4]/20 border-emerald-600/30 shadow-sm"
                            : "bg-[#f2f4f6] hover:bg-[#eceef0] border-transparent"
                        }`}
                        type="button"
                      >
                        {selectedMood === "sedih" && (
                          <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#012d1d] text-white text-[10px] font-medium shadow-xs">
                            <span className="material-symbols-outlined text-[12px]">
                              check
                            </span>
                            <span>Dipilih</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between w-full mb-3">
                          <span
                            className={`text-3xl transition-all ${
                              selectedMood === "sedih"
                                ? "filter-none"
                                : "filter grayscale group-hover:grayscale-0"
                            }`}
                          >
                            😢
                          </span>
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#eceef0] text-[#414844]">
                            Skor 2
                          </span>
                        </div>
                        <div>
                          <h3
                            className={`text-lg font-bold ${
                              selectedMood === "sedih"
                                ? "text-[#012d1d]"
                                : "text-[#191c1e]"
                            }`}
                          >
                            Sedih
                          </h3>
                          <p className="text-xs text-[#414844] mt-1 leading-snug">
                            Butuh kehangatan &amp; penenang batin.
                          </p>
                        </div>
                      </button>

                      {/* Marah */}
                      <button
                        onClick={() => setSelectedMood("marah")}
                        className={`text-left p-5 rounded-xl transition-all flex flex-col justify-between group cursor-pointer relative border ${
                          selectedMood === "marah"
                            ? "bg-[#c1ecd4]/20 border-emerald-600/30 shadow-sm"
                            : "bg-[#f2f4f6] hover:bg-[#eceef0] border-transparent"
                        }`}
                        type="button"
                      >
                        {selectedMood === "marah" && (
                          <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#012d1d] text-white text-[10px] font-medium shadow-xs">
                            <span className="material-symbols-outlined text-[12px]">
                              check
                            </span>
                            <span>Dipilih</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between w-full mb-3">
                          <span
                            className={`text-3xl transition-all ${
                              selectedMood === "marah"
                                ? "filter-none"
                                : "filter grayscale group-hover:grayscale-0"
                            }`}
                          >
                            😡
                          </span>
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#ffdad6] text-[#93000a]">
                            Skor 1
                          </span>
                        </div>
                        <div>
                          <h3
                            className={`text-lg font-bold ${
                              selectedMood === "marah"
                                ? "text-[#012d1d]"
                                : "text-[#191c1e]"
                            }`}
                          >
                            Marah
                          </h3>
                          <p className="text-xs text-[#414844] mt-1 leading-snug">
                            Tegang, butuh pendingin emosi alami.
                          </p>
                        </div>
                      </button>

                      {/* Bahagia */}
                      <button
                        onClick={() => setSelectedMood("bahagia")}
                        className={`text-left p-5 rounded-xl transition-all flex flex-col justify-between group cursor-pointer relative border ${
                          selectedMood === "bahagia"
                            ? "bg-[#c1ecd4]/20 border-emerald-600/30 shadow-sm"
                            : "bg-[#f2f4f6] hover:bg-[#eceef0] border-transparent"
                        }`}
                        type="button"
                      >
                        {selectedMood === "bahagia" && (
                          <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#012d1d] text-white text-[10px] font-medium shadow-xs">
                            <span className="material-symbols-outlined text-[12px]">
                              check
                            </span>
                            <span>Dipilih</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between w-full mb-3">
                          <span
                            className={`text-3xl transition-all ${
                              selectedMood === "bahagia"
                                ? "filter-none"
                                : "filter grayscale group-hover:grayscale-0"
                            }`}
                          >
                            😄
                          </span>
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#eceef0] text-[#414844]">
                            Skor 5
                          </span>
                        </div>
                        <div>
                          <h3
                            className={`text-lg font-bold ${
                              selectedMood === "bahagia"
                                ? "text-[#012d1d]"
                                : "text-[#191c1e]"
                            }`}
                          >
                            Bahagia
                          </h3>
                          <p className="text-xs text-[#414844] mt-1 leading-snug">
                            Energi positif, pertahankan ritme jiwa.
                          </p>
                        </div>
                      </button>
                    </div>

                    {/* Additional Body Symptom Pills */}
                    <div className="pt-2">
                      <span className="text-xs text-[#414844] block mb-2 font-medium">
                        Keluhan somatis penyerta (opsional):
                      </span>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => toggleSymptom("Cemas / Gelisah")}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                            selectedSymptoms.includes("Cemas / Gelisah")
                              ? "bg-[#c1ecd4] text-[#012d1d]"
                              : "bg-[#eceef0] text-[#414844] hover:bg-[#c1ecd4]/50 hover:text-[#012d1d]"
                          }`}
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            heart_broken
                          </span>
                          <span>Cemas / Gelisah</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleSymptom("Kurang Tidur / Lelah")}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                            selectedSymptoms.includes("Kurang Tidur / Lelah")
                              ? "bg-[#c1ecd4] text-[#012d1d]"
                              : "bg-[#eceef0] text-[#414844] hover:bg-[#c1ecd4]/50 hover:text-[#012d1d]"
                          }`}
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            bedtime
                          </span>
                          <span>Kurang Tidur / Lelah</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleSymptom("Sulit Fokus")}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                            selectedSymptoms.includes("Sulit Fokus")
                              ? "bg-[#c1ecd4] text-[#012d1d]"
                              : "bg-[#eceef0] text-[#414844] hover:bg-[#c1ecd4]/50 hover:text-[#012d1d]"
                          }`}
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            blur_on
                          </span>
                          <span>Sulit Fokus</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* STEP 2: Unggah Foto Makanan atau Ambil Foto */}
                  <div id="food-upload-section" className="space-y-4 pt-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#012d1d] text-white text-xs font-semibold">
                          2
                        </span>
                        <h2 className="text-base sm:text-lg font-bold text-[#012d1d] uppercase tracking-wide">
                          UNGGAH FOTO MAKANAN ATAU AMBIL FOTO
                        </h2>
                      </div>
                    </div>

                    {/* Action Buttons for Uploading */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl bg-[#eceef0] hover:bg-[#e6e8ea] transition-all text-[#012d1d] text-sm font-semibold cursor-pointer border border-transparent hover:border-slate-300 shadow-xs"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          upload_file
                        </span>
                        <span>Pilih File / Galeri</span>
                      </button>

                      <button
                        onClick={() => cameraInputRef.current?.click()}
                        className="flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl bg-[#eceef0] hover:bg-[#e6e8ea] transition-all text-[#012d1d] text-sm font-semibold cursor-pointer border border-transparent hover:border-slate-300 shadow-xs"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          photo_camera
                        </span>
                        <span>Ambil Foto Langsung</span>
                      </button>
                    </div>

                    {/* Hidden Native File Inputs */}
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      ref={fileInputRef}
                      onChange={(e) => handleFile(e.target.files?.[0])}
                      hidden
                    />
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      ref={cameraInputRef}
                      onChange={(e) => handleFile(e.target.files?.[0])}
                      hidden
                    />

                    {/* Clean Dropzone IF no photo is selected/uploaded yet */}
                    {!previewUrl ? (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="rounded-xl border-2 border-dashed border-slate-300 hover:border-emerald-600/60 bg-[#f7f9fb] hover:bg-[#f1f7f4] p-6 text-center transition-all cursor-pointer group flex flex-col items-center justify-center gap-2.5"
                      >
                        <div className="w-12 h-12 rounded-full bg-[#eceef0] group-hover:bg-[#c1ecd4] text-[#006c48] flex items-center justify-center transition-colors">
                          <span className="material-symbols-outlined text-[24px]">
                            add_a_photo
                          </span>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-sm font-bold text-[#012d1d]">
                            Belum Ada Foto Santapan Terpilih
                          </p>
                          <p className="text-xs text-[#717973] max-w-md">
                            Silakan unggah foto makananmu atau ambil gambar
                            langsung dari kamera posko untuk mendeteksi nutrisi
                            secara otomatis.
                          </p>
                        </div>
                        <div className="pt-1 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLoadSampleFood();
                            }}
                            className="text-xs font-semibold text-[#006c48] hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[15px]">
                              restaurant_menu
                            </span>
                            <span>
                              Atau gunakan contoh santapan posko untuk simulasi
                            </span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Interactive Food Preview Card when a photo IS selected */
                      <div className="rounded-xl p-4 bg-[#f2f4f6] flex flex-col sm:flex-row items-center gap-5 border border-slate-200/60 animate-fade-in">
                        <div className="relative w-full sm:w-44 h-32 rounded-lg overflow-hidden shrink-0 shadow-sm bg-[#eceef0]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            className="w-full h-full object-cover"
                            alt="Foto makanan posko yang dianalisis"
                            src={previewUrl}
                          />
                          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-[#1b4332] text-white text-[10px] font-semibold flex items-center gap-1 shadow-xs">
                            <span className="material-symbols-outlined text-[12px]">
                              check_circle
                            </span>
                            <span>
                              {isCustomUpload
                                ? "Foto Terpilih"
                                : analysisResult
                                  ? "Terdeteksi"
                                  : "Foto Contoh"}
                            </span>
                          </div>
                        </div>

                        <div className="flex-1 w-full space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-base sm:text-lg font-bold text-[#012d1d]">
                              {isCustomUpload && fileData?.fileName
                                ? fileData.fileName
                                : analysisResult
                                  ? analysisResult.detectedFood
                                  : "Contoh Santapan Posko Nusantara"}
                            </span>
                            <span className="text-xs text-[#414844] font-medium">
                              {fileData?.fileSize ||
                                (analysisResult
                                  ? analysisResult.fileMeta
                                  : "Siap dianalisis")}
                            </span>
                          </div>

                          <p className="text-xs sm:text-sm text-[#414844] leading-relaxed">
                            {isCustomUpload || !analysisResult
                              ? "Foto siap dianalisis untuk mendeteksi korelasi triptofan, indeks glikemik, dan neurotransmitter oleh Gemini Vision."
                              : analysisResult.components}
                          </p>

                          <div className="flex items-center gap-3 pt-1">
                            <span className="inline-flex items-center gap-1 text-[12px] font-medium text-[#006c48]">
                              <span className="material-symbols-outlined text-[15px]">
                                eco
                              </span>
                              Bahan Pangan Posko Nusantara
                            </span>

                            <button
                              onClick={handleResetPhoto}
                              className="text-[12px] font-semibold text-[#ba1a1a] hover:underline flex items-center gap-0.5 ml-auto cursor-pointer"
                              type="button"
                            >
                              <span className="material-symbols-outlined text-[14px]">
                                delete
                              </span>
                              Ganti / Hapus Foto
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Optional Note */}
                    <div className="space-y-1.5">
                      <label className="text-xs text-[#414844] font-medium block">
                        Catatan Tambahan (Opsional):
                      </label>
                      <textarea
                        value={notes}
                        onChange={(e) => {
                          setNotes(e.target.value);
                          if (guardrailNotice) setGuardrailNotice(null);
                        }}
                        className="w-full rounded-xl p-3 bg-white text-xs sm:text-sm text-[#191c1e] placeholder:text-[#717973] border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006c48]/40 transition-all resize-none shadow-xs"
                        placeholder="Ceritakan porsi atau bagaimana perasaanmu saat menyantapnya (contoh: makan tergesa-gesa karena cemas, atau ditemani relawan posko)..."
                        rows={2}
                      />
                    </div>

                    {guardrailNotice && (
                      <div
                        role="alert"
                        className={`rounded-xl p-4 flex flex-col gap-2.5 border ${
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
                                : "Input Di Luar Topik Mood + Food"}
                            </p>
                            <p className="text-xs sm:text-sm leading-relaxed">
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

                    {/* Main CTA Analyze Button */}
                    <button
                      onClick={handleAnalyze}
                      disabled={loading}
                      className="w-full py-4 px-6 rounded-xl bg-[#1b4332] hover:bg-[#006c48] active:scale-[0.99] text-white text-base sm:text-lg font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-3 cursor-pointer group disabled:opacity-70 disabled:cursor-not-allowed"
                      type="button"
                    >
                      <span>
                        {loading
                          ? "Menganalisis & Menyimpan ke Database..."
                          : "Analisis Makanan & Emosi Sekarang"}
                      </span>
                      <span
                        className={`material-symbols-outlined text-[22px] transition-transform ${
                          loading ? "animate-spin" : "group-hover:rotate-12"
                        }`}
                      >
                        {loading ? "progress_activity" : "auto_awesome"}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-[#92f7c3] text-[#002113] text-xs font-bold">
                        +40 XP
                      </span>
                    </button>
                  </div>
                  </div>
                </AnimatedSection>

                {/* STEP 3: HASIL ANALISIS AI GEMINI & KEARIFAN PANGAN LOKAL */}
                <AnimatedSection index={3}>
                  <div
                    id="analysis-results"
                    className="bg-white rounded-xl p-6 md:p-8 shadow-sm border border-slate-100 space-y-6"
                  >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#eceef0] gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-xs transition-colors ${
                          loading
                            ? "bg-[#c1ecd4]/60 text-[#012d1d] animate-pulse"
                            : analysisResult
                              ? "bg-[#92f7c3] text-[#012d1d]"
                              : "bg-[#f2f4f6] text-[#414844]"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[24px]">
                          psychology_alt
                        </span>
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-[#012d1d]">
                          Hasil Diagnosis Multimodal Gemini AI
                        </h3>
                        <p className="text-xs text-[#414844]">
                          {analysisResult ? (
                            <>
                              Korelasi Emosi &quot;
                              {selectedMood === "marah"
                                ? "Marah/Tegang"
                                : selectedMood === "sedih"
                                  ? "Sedih/Duka"
                                  : "Bahagia/Tenang"}
                              &quot; terhadap Nutrisi Terdeteksi
                            </>
                          ) : loading ? (
                            "Sedang menghubungkan citra santapan dengan kondisi emosionalmu..."
                          ) : (
                            "Belum ada analisis makanan aktif — pilih mood dan unggah foto untuk memulai"
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      {loading ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#c1ecd4]/50 text-[#012d1d] text-xs font-semibold border border-emerald-200">
                          <span className="material-symbols-outlined text-[16px] animate-spin">
                            progress_activity
                          </span>
                          Menganalisis...
                        </div>
                      ) : analysisResult ? (
                        <>
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#92f7c3]/40 text-[#00734d] text-xs font-semibold border border-emerald-300/40">
                            <span className="material-symbols-outlined text-[16px]">
                              verified_user
                            </span>
                            Tervalidasi Psiko-Nutrisi
                          </div>
                          <button
                            onClick={handleResetAnalysis}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#f2f4f6] hover:bg-[#e6e8ea] text-[#414844] hover:text-[#012d1d] text-xs font-semibold transition-colors cursor-pointer border border-slate-200/70"
                            type="button"
                            title="Bersihkan hasil dan mulai analisis baru"
                          >
                            <span className="material-symbols-outlined text-[15px]">
                              restart_alt
                            </span>
                            <span>Analisis Baru</span>
                          </button>
                        </>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f2f4f6] text-[#414844] text-xs font-semibold border border-slate-200/70">
                          <span className="material-symbols-outlined text-[16px]">
                            hourglass_empty
                          </span>
                          Menunggu Analisis
                        </div>
                      )}
                    </div>
                  </div>

                  {loading || (isLoadingDb && !analysisResult) ? (
                    /* Loading Skeleton State */
                    <div className="space-y-5 animate-pulse py-2">
                      <div className="p-5 rounded-xl bg-[#f2f4f6] space-y-2.5 border border-slate-200/50">
                        <div className="h-5 w-2/3 bg-slate-200/80 rounded" />
                        <div className="h-3.5 w-full bg-slate-200/70 rounded" />
                        <div className="h-3.5 w-5/6 bg-slate-200/70 rounded" />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[0, 1, 2].map((idx) => (
                          <div
                            key={idx}
                            className="p-4 rounded-xl bg-[#f2f4f6] space-y-3 border border-slate-200/50"
                          >
                            <div className="h-3 w-28 bg-slate-200/80 rounded" />
                            <div className="h-7 w-16 bg-slate-200 rounded" />
                            <div className="h-3 w-full bg-slate-200/70 rounded" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : !analysisResult ? (
                    /* Empty State: Clean Guidance Before User Analyzes Any Meal */
                    <div className="rounded-xl bg-[#f7f9fb] border border-dashed border-[#c1c8c2] p-6 sm:p-8 text-center space-y-6">
                      <div className="mx-auto w-14 h-14 rounded-2xl bg-[#c1ecd4]/40 text-[#006c48] flex items-center justify-center border border-[#c1ecd4]">
                        <span className="material-symbols-outlined text-[30px]">
                          biotech
                        </span>
                      </div>

                      <div className="max-w-lg mx-auto space-y-2">
                        <h4 className="text-base sm:text-lg font-bold text-[#012d1d]">
                          Siap Mendiagnosis Koneksi Nutrisi &amp; Emosimu
                        </h4>
                        <p className="text-xs sm:text-sm text-[#414844] leading-relaxed">
                          Pilih perasaanmu di Langkah 1 dan unggah foto
                          santapanmu di Langkah 2, lalu klik{" "}
                          <span className="font-semibold text-[#012d1d]">
                            &quot;Analisis Makanan &amp; Emosi Sekarang&quot;
                          </span>
                          . Gemini Vision akan memetakan dampak gizinya terhadap
                          ketenangan sistem sarafmu.
                        </p>
                      </div>

                      {/* 4 Muted Capability Preview Chips */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
                        {[
                          {
                            icon: "bolt",
                            label: "Triptofan & Serotonin",
                            sub: "Prekursor ketenangan alami",
                          },
                          {
                            icon: "equalizer",
                            label: "Indeks Glikemik",
                            sub: "Stabilitas energi & mood",
                          },
                          {
                            icon: "healing",
                            label: "Anti-Inflamasi",
                            sub: "Pemulihan stres biologis",
                          },
                          {
                            icon: "restaurant",
                            label: "Pangan Nusantara",
                            sub: "Rekomendasi bahan lokal",
                          },
                        ].map((chip) => (
                          <div
                            key={chip.label}
                            className="p-3 rounded-xl bg-white border border-slate-200/70 space-y-1 shadow-2xs"
                          >
                            <span className="material-symbols-outlined text-[18px] text-[#006c48]">
                              {chip.icon}
                            </span>
                            <p className="text-xs font-bold text-[#012d1d] leading-snug">
                              {chip.label}
                            </p>
                            <p className="text-[11px] text-[#414844] leading-tight">
                              {chip.sub}
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="pt-1 flex flex-wrap items-center justify-center gap-3">
                        <button
                          onClick={scrollToUpload}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1b4332] hover:bg-[#012d1d] text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[17px]">
                            add_a_photo
                          </span>
                          <span>Unggah Foto Makanan Sekarang</span>
                        </button>
                        {history.length > 0 && (
                          <span className="text-xs text-[#414844]">
                            atau pilih catatan dari riwayat database di bawah
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Populated Analysis Results */
                    <>
                      {/* Highlight Insight Banner */}
                      <div className="p-5 rounded-xl bg-[#c1ecd4]/30 flex items-start gap-4 border border-[#c1ecd4]">
                        <span className="material-symbols-outlined text-[#012d1d] text-[28px] shrink-0 mt-0.5">
                          spa
                        </span>
                        <div className="space-y-1">
                          <h4 className="text-base sm:text-lg font-bold text-[#012d1d]">
                            {analysisResult.headline}
                          </h4>
                          <p className="text-xs sm:text-sm text-[#414844] leading-relaxed">
                            {analysisResult.explanation}
                          </p>
                        </div>
                      </div>

                      {/* Emotional Nutrition Breakdown Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 rounded-xl bg-[#f2f4f6] space-y-2 border border-slate-200/50">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-[#414844] uppercase tracking-wider">
                              Triptofan &amp; Serotonin
                            </span>
                            <span className="material-symbols-outlined text-[#006c48] text-[20px]">
                              bolt
                            </span>
                          </div>
                          <div className="text-2xl font-bold text-[#012d1d]">
                            {analysisResult.tryptophanPercent}%
                          </div>
                          <p className="text-xs text-[#414844] leading-relaxed">
                            {analysisResult.tryptophanDesc}
                          </p>
                        </div>

                        <div className="p-4 rounded-xl bg-[#f2f4f6] space-y-2 border border-slate-200/50">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-[#414844] uppercase tracking-wider">
                              Indeks Glikemik
                            </span>
                            <span className="material-symbols-outlined text-[#f48c24] text-[20px]">
                              equalizer
                            </span>
                          </div>
                          <div className="text-2xl font-bold text-[#012d1d]">
                            {analysisResult.glycemicStatus}
                          </div>
                          <p className="text-xs text-[#414844] leading-relaxed">
                            {analysisResult.glycemicDesc}
                          </p>
                        </div>

                        <div className="p-4 rounded-xl bg-[#f2f4f6] space-y-2 border border-slate-200/50">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-[#414844] uppercase tracking-wider">
                              Kapasitas Anti-Inflamasi
                            </span>
                            <span className="material-symbols-outlined text-[#006c48] text-[20px]">
                              healing
                            </span>
                          </div>
                          <div className="text-2xl font-bold text-[#012d1d]">
                            {analysisResult.antiInflammatoryStatus}
                          </div>
                          <p className="text-xs text-[#414844] leading-relaxed">
                            {analysisResult.antiInflammatoryDesc}
                          </p>
                        </div>
                      </div>

                      {/* Rekomendasi Pangan Tradisional Pemulih (Nusantara Culinary Recommendations) */}
                      <div className="space-y-4 pt-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-base font-bold text-[#012d1d]">
                            Rekomendasi Pangan Pemulih Batin Nusantara
                          </h4>
                          <span className="text-xs text-[#006c48] font-semibold">
                            Kearifan{" "}
                            {culture === "sumbar"
                              ? "Minangkabau"
                              : "Aceh & Minangkabau"}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {activeRecommendations.map((item, idx) => (
                            <div
                              key={idx}
                              className="p-4 rounded-xl bg-[#f2f4f6] hover:bg-[#eceef0] transition-colors flex gap-4 border border-slate-200/50"
                            >
                              <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 shadow-sm bg-[#eceef0]">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  className="w-full h-full object-cover"
                                  alt={item.title}
                                  src={item.image}
                                />
                              </div>
                              <div className="space-y-1">
                                <h5 className="text-sm font-bold text-[#012d1d]">
                                  {item.title}
                                </h5>
                                <p className="text-xs text-[#414844] leading-snug">
                                  {item.desc}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Bottom Action within Analysis Card */}
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#eceef0]">
                        <div className="flex items-center gap-2 text-[#414844] text-xs">
                          <span className="material-symbols-outlined text-[18px] text-[#006c48]">
                            bookmark_added
                          </span>
                          <span>
                            Hasil tersimpan otomatis ke Catatan Resiliensi
                            Mingguan &amp; Database PostgreSQL
                          </span>
                        </div>

                        <button
                          onClick={handleShare}
                          className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-[#92f7c3] hover:bg-[#75daa8] text-[#00734d] text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            share
                          </span>
                          <span>Bagikan ke Forum Komunitas</span>
                        </button>
                      </div>
                    </>
                  )}
                  </div>
                </AnimatedSection>

                {/* STEP 4: RIWAYAT CATATAN NUTRISI & EMOSI DARI DATABASE */}
                <AnimatedSection index={4}>
                  <div className="bg-white rounded-xl p-6 md:p-8 shadow-sm border border-slate-100 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#c1ecd4] text-[#012d1d] flex items-center justify-center">
                        <span className="material-symbols-outlined text-[20px]">
                          history
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-[#012d1d]">
                        Riwayat Catatan Nutrisi &amp; Emosi Posko
                      </h3>
                    </div>

                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f2f4f6] text-[#006c48] text-xs font-semibold">
                      <span className="w-2 h-2 rounded-full bg-[#006c48] animate-pulse"></span>
                      <span>{history.length} Catatan Tersimpan</span>
                    </div>
                  </div>

                  {isLoadingDb ? (
                    <div className="py-8 text-center text-xs text-[#717973] flex flex-col items-center gap-2">
                      <span className="material-symbols-outlined text-[24px] animate-spin text-[#006c48]">
                        progress_activity
                      </span>
                      <span>Memuat riwayat nutrisi dari database...</span>
                    </div>
                  ) : history.length === 0 ? (
                    <div className="py-8 text-center text-xs text-[#717973] bg-[#f7f9fb] rounded-xl border border-dashed border-slate-200">
                      Belum ada riwayat analisis. Ambil foto santapanmu sekarang
                      untuk mencatat data pertama ke database!
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {history.map((record) => {
                        const isActive = activeRecordId === record.id;
                        const moodEmoji =
                          record.mood === "sedih"
                            ? "😢"
                            : record.mood === "marah"
                              ? "😡"
                              : "😄";
                        const moodLabel =
                          record.mood === "sedih"
                            ? "Sedih"
                            : record.mood === "marah"
                              ? "Marah"
                              : "Bahagia";

                        return (
                          <div
                            key={record.id}
                            className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                              isActive
                                ? "bg-[#c1ecd4]/20 border-emerald-500 shadow-xs"
                                : "bg-[#f2f4f6] hover:bg-[#eceef0] border-slate-200/60"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-base">{moodEmoji}</span>
                                  <span className="text-xs font-bold text-[#012d1d]">
                                    {moodLabel}
                                  </span>
                                  <span className="text-[10px] text-[#717973]">
                                    • {formatDatabaseDate(record.createdAt)}
                                  </span>
                                </div>
                                <h4 className="text-sm font-bold text-[#012d1d] line-clamp-1">
                                  {record.foodName}
                                </h4>
                              </div>

                              <span className="px-2 py-0.5 rounded-full bg-white text-[#006c48] border border-emerald-200 text-[11px] font-bold shrink-0">
                                {record.gutBrainScore}%
                              </span>
                            </div>

                            {/* Symptoms list */}
                            {record.symptoms && record.symptoms.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {record.symptoms.map((sym, sIdx) => (
                                  <span
                                    key={sIdx}
                                    className="px-2 py-0.5 rounded-full bg-white text-[#414844] text-[10px] font-medium border border-slate-200"
                                  >
                                    {sym}
                                  </span>
                                ))}
                              </div>
                            )}

                            {record.notes && (
                              <p className="text-[11px] text-[#414844] italic line-clamp-1 bg-white/60 p-1.5 rounded-md">
                                &quot;{record.notes}&quot;
                              </p>
                            )}

                            <div className="pt-2 border-t border-slate-200/40 flex items-center justify-between">
                              <span className="text-[10px] text-[#717973] uppercase font-bold tracking-wider">
                                {record.culture === "sumbar"
                                  ? "Minangkabau"
                                  : "Aceh"}
                              </span>

                              <button
                                onClick={() =>
                                  handleSelectHistoryRecord(record)
                                }
                                className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                                  isActive
                                    ? "bg-[#012d1d] text-white"
                                    : "bg-white hover:bg-[#006c48] hover:text-white text-[#006c48] border border-emerald-300"
                                }`}
                              >
                                <span className="material-symbols-outlined text-[14px]">
                                  {isActive ? "check" : "visibility"}
                                </span>
                                <span>
                                  {isActive
                                    ? "Sedang Ditampilkan"
                                    : "Lihat Analisis"}
                                </span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  </div>
                </AnimatedSection>
              </div>

              {/* RIGHT COLUMN: Sidebar Pendamping & Insights */}
              <div className="lg:col-span-4 flex flex-col space-y-6">
                {/* CARD 1: Radar Keseimbangan Mood & Gut-Brain Axis (100% Dynamic + Empty/Loading State) */}
                <AnimatedSection index={2}>
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 space-y-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-[#012d1d]">
                      Koneksi Gut-Brain Axis
                    </h3>
                    <span
                      className={`material-symbols-outlined text-[22px] ${
                        analysisResult ? "text-[#006c48]" : "text-slate-400"
                      }`}
                    >
                      health_and_safety
                    </span>
                  </div>

                  {loading || (isLoadingDb && !analysisResult) ? (
                    /* Loading Skeleton State */
                    <div className="space-y-4 animate-pulse">
                      <div className="flex items-center gap-4 p-4 rounded-xl bg-[#f2f4f6] border border-slate-200/50">
                        <div className="w-20 h-20 rounded-full bg-slate-200/80 shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3.5 w-32 bg-slate-200/80 rounded" />
                          <div className="h-3 w-full bg-slate-200/70 rounded" />
                          <div className="h-3 w-4/5 bg-slate-200/70 rounded" />
                        </div>
                      </div>
                      <div className="p-3.5 rounded-lg bg-[#eceef0] space-y-2">
                        <div className="h-3 w-36 bg-slate-300/60 rounded" />
                        <div className="h-3 w-full bg-slate-300/50 rounded" />
                      </div>
                    </div>
                  ) : !analysisResult || !dynamicMicrobiome ? (
                    /* Empty State: Clean Radar Placeholder Without Fake Numbers */
                    <>
                      <div className="flex items-center gap-4 p-4 rounded-xl bg-[#f2f4f6] border border-dashed border-slate-300/80">
                        <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
                          <svg
                            className="w-full h-full -rotate-90"
                            viewBox="0 0 36 36"
                          >
                            <path
                              className="text-slate-200 stroke-current"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              strokeWidth="3.2"
                            />
                            <path
                              className="text-slate-300 stroke-current"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              strokeDasharray="0, 100"
                              strokeLinecap="round"
                              strokeWidth="3.2"
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                            <span className="text-base font-bold text-slate-400 leading-none">
                              --%
                            </span>
                            <span className="text-[9px] font-semibold uppercase tracking-wider mt-1 text-slate-400">
                              BELUM ADA
                            </span>
                          </div>
                        </div>

                        <div className="flex-1 space-y-1">
                          <span className="text-xs font-bold block text-[#012d1d]">
                            Menunggu Data Santapan
                          </span>
                          <p className="text-[11px] text-[#414844] leading-relaxed">
                            Korelasi mikrobioma usus dan suasana hati akan
                            dihitung otomatis setelah kamu menganalisis foto
                            makanan.
                          </p>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-lg bg-[#eceef0] text-[#414844] space-y-1 text-xs">
                        <span className="text-xs text-[#012d1d] font-bold block">
                          Catatan Ahli Gizi PERMATA:
                        </span>
                        <p className="leading-relaxed">
                          Tahukah kamu? Sekitar 90% hormon serotonin diproduksi
                          di saluran cerna. Unggah foto santapanmu untuk melihat
                          skor sinkronisasi usus-otak hari ini.
                        </p>
                      </div>
                    </>
                  ) : (
                    /* Populated Dynamic Gut-Brain Axis Radar */
                    <>
                      {/* Visual Progress Radial / Meter */}
                      <div className="flex items-center gap-4 p-4 rounded-xl bg-[#f2f4f6] border border-slate-200/50">
                        <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
                          <svg
                            className="w-full h-full -rotate-90"
                            viewBox="0 0 36 36"
                          >
                            <path
                              className="text-slate-200 stroke-current"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              strokeWidth="3.2"
                            />
                            <path
                              className={`${dynamicMicrobiome.strokeColor} stroke-current transition-all duration-700`}
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              strokeDasharray={`${analysisResult.gutBrainScore || 78}, 100`}
                              strokeLinecap="round"
                              strokeWidth="3.2"
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                            <span className="text-base font-bold text-slate-900 leading-none">
                              {analysisResult.gutBrainScore || 78}%
                            </span>
                            <span
                              className={`text-[10px] font-semibold uppercase tracking-wider mt-1 ${dynamicMicrobiome.statusColor}`}
                            >
                              {dynamicMicrobiome.statusText}
                            </span>
                          </div>
                        </div>

                        <div className="flex-1 space-y-1">
                          <span
                            className={`text-xs font-bold block ${dynamicMicrobiome.statusColor}`}
                          >
                            {dynamicMicrobiome.title}
                          </span>
                          <p className="text-[11px] text-[#414844] leading-relaxed">
                            {dynamicMicrobiome.summary}
                          </p>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-lg bg-[#eceef0] text-[#414844] space-y-1 text-xs">
                        <span className="text-xs text-[#012d1d] font-bold block">
                          Catatan Ahli Gizi PERMATA:
                        </span>
                        <p className="leading-relaxed">
                          {dynamicMicrobiome.nutritionistNote}
                        </p>
                      </div>
                    </>
                  )}
                  </div>
                </AnimatedSection>

                {/* CARD 2: Kearifan Pangan Nusantara & Meuseuraya */}
                <AnimatedSection index={3}>
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#006c48] text-[22px]">
                      history_edu
                    </span>
                    <h3 className="text-base font-bold text-[#012d1d]">
                      Kearifan Pangan Lokal
                    </h3>
                  </div>

                  <div className="p-4 rounded-xl bg-[#f2f4f6] space-y-3 border border-slate-200/50">
                    <div className="text-[#012d1d] italic text-xs sm:text-sm font-semibold">
                      {culture === "sumbar"
                        ? "“Nan lamak di awak, katuju di urang. Makan bajamba maubek duto.”"
                        : "“Ubat hatee, ubat badan. Lam saboh mangkok, teuka seunang.”"}
                    </div>
                    <p className="text-xs text-[#414844] leading-relaxed">
                      {culture === "sumbar"
                        ? "Kearifan Minangkabau mengajarkan kebersamaan menyantap makanan mengobati luka batin dan memulihkan rasa aman keluarga."
                        : "Pepatah Aceh menegaskan bahwa makanan yang disiapkan penuh keikhlasan di dapur umum posko adalah obat bagi batin yang sedang berduka."}
                    </p>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <span className="text-xs text-[#012d1d] font-bold block">
                      {culture === "sumbar"
                        ? "Filosofi Makan Bajamba Pangan:"
                        : "Filosofi Meuseuraya Pangan:"}
                    </span>
                    <p className="text-xs text-[#414844] leading-relaxed">
                      {culture === "sumbar"
                        ? "Makan bajamba (berkelompok dalam satu nampan) memulihkan kehangatan sosial dan menurunkan hormon stres kortisol serta memicu rasa aman komunal."
                        : "Makan bersama dalam lingkar komunal posko terbukti menurunkan hormon stres kortisol sebesar 24% dibandingkan menyantap makanan sendirian di tenda pengungsian."}
                    </p>
                  </div>
                  </div>
                </AnimatedSection>

                {/* CARD 3: Hope Tree / Pohon Harapan Status (Live from Database) */}
                <AnimatedSection index={4}>
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#006c48] text-[22px]">
                        park
                      </span>
                      <h3 className="text-base font-bold text-[#012d1d]">
                        Pohon Harapanmu
                      </h3>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#c1ecd4] text-[#012d1d] text-xs font-bold">
                      Level {treeStats?.level || 3}
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-[#1b4332] text-white flex items-center gap-4 shadow-sm">
                    <div className="w-12 h-12 rounded-xl bg-[#92f7c3] text-[#012d1d] flex items-center justify-center shrink-0 shadow-xs">
                      <span className="material-symbols-outlined text-[26px]">
                        energy_savings_leaf
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-sm font-bold text-white">
                        +40 XP Nutrisi Emosi
                      </div>
                      <p className="text-xs text-[#86af99] leading-tight">
                        {(treeStats?.moodFoodCount ?? history.length) * 40} XP
                        dari Nutrisi Emosi tersimpan di database.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-[#414844] font-medium">
                      <span>
                        Progres Menuju Level {(treeStats?.level || 3) + 1}
                      </span>
                      <span>
                        {treeStats?.totalXp || 240} /{" "}
                        {treeStats?.targetXp || 300} XP
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#eceef0] overflow-hidden">
                      <div
                        className="h-full bg-[#006c48] rounded-full transition-all duration-500"
                        style={{
                          width: `${treeStats?.progressPercent || 80}%`,
                        }}
                      />
                    </div>
                  </div>
                  </div>
                </AnimatedSection>

                {/* CARD 4: Siaga SafeConnect 119 */}
                <AnimatedSection index={5}>
                  <div className="bg-[#ffdad6] text-[#93000a] rounded-xl p-5 shadow-sm space-y-3 border border-red-200">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#ba1a1a] text-white flex items-center justify-center shrink-0 shadow-xs">
                      <span className="material-symbols-outlined text-[18px]">
                        support_agent
                      </span>
                    </div>
                    <span className="text-sm font-bold">
                      Siaga SafeConnect 119
                    </span>
                  </div>
                  <p className="text-xs text-[#93000a]/90 leading-relaxed">
                    Jika kamu atau anak di sekitar posko mengalami kehilangan
                    nafsu makan akut lebih dari 3 hari berturut-turut disertai
                    serangan panik, segera hubungi konselor PFA kami.
                  </p>
                  <a
                    className="w-full py-2.5 px-4 rounded-xl bg-[#ba1a1a] hover:bg-[#ba1a1a]/90 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                    href="tel:119"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      call
                    </span>
                    <span>Konseling Darurat Bebas Pulsa</span>
                  </a>
                  </div>
                </AnimatedSection>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER: matching landing page, journal, telescreening */}
      <footer className="w-full bg-[#f2f4f6] border-t border-[#c1c8c2]/30 mt-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-10">
          {/* Emergency 119 Hotline Banner */}
          <div className="mb-8 p-5 rounded-xl bg-[#ffdad6] text-[#93000a] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-red-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#ba1a1a] text-white flex items-center justify-center shrink-0 shadow-xs">
                <span className="material-symbols-outlined text-[20px]">
                  emergency
                </span>
              </div>
              <div>
                <p className="text-sm font-bold leading-tight text-[#93000a]">
                  SafeConnect 119 - Siaga Krisis Psikologis &amp; PFA
                </p>
                <p className="text-xs text-[#93000a]/80 mt-0.5">
                  Layanan respons cepat pendampingan trauma anak &amp; bencana
                  24 Jam bebas pulsa.
                </p>
              </div>
            </div>
            <a
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#ba1a1a] text-white text-xs font-semibold hover:opacity-95 transition-opacity shrink-0 shadow-xs"
              href="tel:119"
            >
              <span className="material-symbols-outlined text-[18px]">
                call
              </span>
              <span>Hubungi 119</span>
            </a>
          </div>

          {/* Footer Multi-Column Grid */}
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
                <span className="text-lg font-bold text-[#012d1d]">
                  PERMATA Nusantara
                </span>
              </div>
              <p className="text-xs text-[#414844] max-w-sm leading-relaxed">
                Platform digital Psychological First Aid (PFA) dan penguatan
                resiliensi trauma anak pascabencana berbasis kearifan lokal
                Nusantara (Meuseuraya Aceh &amp; Mambangkik Batang Tarandam
                Minangkabau).
              </p>
              <div className="flex items-center gap-2 text-[#006c48] text-xs font-semibold mt-1">
                <span className="material-symbols-outlined text-[18px]">
                  verified_user
                </span>
                <span>
                  Tervalidasi Protokol Perlindungan &amp; Kerahasiaan Data Anak
                </span>
              </div>
            </div>

            <div className="md:col-span-4 flex flex-col gap-2.5">
              <h4 className="text-sm font-bold text-[#012d1d] mb-1">
                Modul Resiliensi
              </h4>
              <ul className="flex flex-col gap-2 text-xs text-[#414844]">
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
                  <Link
                    href="/ai-companion"
                    className="hover:text-[#012d1d] transition-colors"
                  >
                    Sahabat Pendamping AI (Tutor Hangat)
                  </Link>
                </li>
                <li>
                  <Link
                    href="/jurnal"
                    className="hover:text-[#012d1d] transition-colors"
                  >
                    Pohon Harapan (Hope Tree Interaktif)
                  </Link>
                </li>
                <li>
                  <Link
                    href="/mood-food"
                    className="hover:text-[#012d1d] font-semibold text-[#006c48] transition-colors"
                  >
                    Mood Tracker &amp; Nutrisi Emosional (Food Log)
                  </Link>
                </li>
              </ul>
            </div>

            <div className="md:col-span-3 flex flex-col gap-2.5">
              <h4 className="text-sm font-bold text-[#012d1d] mb-1">
                Kearifan Lokal
              </h4>
              <p className="text-xs text-[#414844] leading-relaxed">
                Integrasi nilai gotong royong pemulihan jiwa berbasis modalitas
                kultural Nusantara untuk memperkuat resiliensi komunitas.
              </p>
              <div className="mt-2 p-3 rounded-lg bg-[#eceef0] flex flex-col gap-1 border border-slate-200/50">
                <span className="text-xs text-[#006c48] font-bold">
                  Prinsip Asuhan
                </span>
                <span className="text-xs text-[#414844]">
                  Aman, Rahasia, Merangkul, Berkelanjutan.
                </span>
              </div>
            </div>
          </div>

          {/* Copyright Bar */}
          <div className="mt-8 pt-6 border-t border-[#c1c8c2]/30 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#414844]">
            <p>© 2024 PERMATA Nusantara. Seluruh Hak Cipta Dilindungi.</p>
            <p className="text-[11px] text-[#414844]/80 text-center md:text-right">
              Sesuai Standar Etika &amp; Kepatuhan Perlindungan Data Pribadi
              Anak (UU PDP No. 27/2022)
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
