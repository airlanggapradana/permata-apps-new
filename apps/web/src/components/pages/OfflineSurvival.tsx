"use client";

import React, {
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  Backpack,
  CheckCircle2,
  ChevronDown,
  Download,
  Flame,
  Hand,
  HeartHandshake,
  Info,
  Mountain,
  Pause,
  Phone,
  Play,
  Printer,
  RotateCcw,
  Search,
  ShieldAlert,
  Trash2,
  Waves,
  Wifi,
  WifiOff,
  Wind,
  CloudRain,
} from "lucide-react";
import { useCulture } from "@/context/CultureContext";
import {
  EMERGENCY_NUMBERS,
  GO_BAG_ITEMS,
  GROUNDING_STEPS,
  PFA_PRINCIPLES,
  PHYSICAL_GUIDES,
  PSYCHOLOGICAL_SCENARIOS,
  SurvivalTopicId,
} from "@/data/offlineSurvivalData";
import {
  buildStandaloneSurvivalHtml,
  clearLocalSafetyCard,
  EMPTY_SAFETY_CARD,
  LocalSafetyCard,
  OfflineSyncMeta,
  readGoBagChecked,
  readLocalSafetyCard,
  readOfflineMeta,
  syncOfflineSurvivalBundle,
  writeGoBagChecked,
  writeLocalSafetyCard,
} from "@/lib/offlineCache";

type MainTab = "physical" | "psychological" | "preparedness";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]";

const TOPIC_ICONS: Record<SurvivalTopicId, React.ReactNode> = {
  earthquake: <Activity size={18} strokeWidth={1.75} aria-hidden="true" />,
  tsunami: <Waves size={18} strokeWidth={1.75} aria-hidden="true" />,
  flood: <CloudRain size={18} strokeWidth={1.75} aria-hidden="true" />,
  landslide: <Mountain size={18} strokeWidth={1.75} aria-hidden="true" />,
  fire: <Flame size={18} strokeWidth={1.75} aria-hidden="true" />,
  "first-aid": <ShieldAlert size={18} strokeWidth={1.75} aria-hidden="true" />,
};

const BREATH_PHASES = [
  { key: "inhale", label: "Tarik napas perlahan lewat hidung", duration: 4 },
  { key: "hold", label: "Tahan lembut tanpa menegangkan bahu", duration: 4 },
  { key: "exhale", label: "Hembuskan perlahan lewat mulut", duration: 6 },
] as const;

const subscribeOnlineStatus = (callback: () => void) => {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
};

export default function OfflineSurvival() {
  const { culture } = useCulture();

  // Connection & cache readiness state
  const isOnline = useSyncExternalStore(
    subscribeOnlineStatus,
    () => navigator.onLine,
    () => true,
  );
  const [syncMeta, setSyncMeta] = useState<OfflineSyncMeta | null>(null);
  const [syncStatus, setSyncStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [syncError, setSyncError] = useState<string | null>(null);

  // Navigation & search state
  const [activeTab, setActiveTab] = useState<MainTab>("physical");
  const [selectedTopicId, setSelectedTopicId] =
    useState<SurvivalTopicId>("earthquake");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [expandedScenarioId, setExpandedScenarioId] = useState<string | null>(
    PSYCHOLOGICAL_SCENARIOS[0]?.id ?? null,
  );

  // Interactive breathing 4-4-6 state
  const [breathRunning, setBreathRunning] = useState<boolean>(false);
  const [breathPhaseIdx, setBreathPhaseIdx] = useState<number>(0);
  const [breathRemaining, setBreathRemaining] = useState<number>(
    BREATH_PHASES[0].duration,
  );
  const [breathCycles, setBreathCycles] = useState<number>(0);

  // Interactive grounding 5-4-3-2-1 state
  const [groundingDone, setGroundingDone] = useState<boolean[]>(() =>
    GROUNDING_STEPS.map(() => false),
  );

  // Local Go-Bag checklist & Safety Card (no server, no auth)
  const [goBagChecked, setGoBagChecked] = useState<Record<string, boolean>>({});
  const [safetyCard, setSafetyCard] =
    useState<LocalSafetyCard>(EMPTY_SAFETY_CARD);
  const [cardFeedback, setCardFeedback] = useState<string | null>(null);
  const [confirmClearCard, setConfirmClearCard] = useState<boolean>(false);

  // Hydrate client-only localStorage state after mount without hydration mismatch
  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      setSyncMeta(readOfflineMeta());
      setGoBagChecked(readGoBagChecked());
      setSafetyCard(readLocalSafetyCard());
    });
    return () => {
      active = false;
    };
  }, []);

  // Breathing timer loop
  useEffect(() => {
    if (!breathRunning) return;

    const timer = window.setInterval(() => {
      setBreathRemaining((prev) => {
        if (prev > 1) {
          return prev - 1;
        }
        const nextIdx = (breathPhaseIdx + 1) % BREATH_PHASES.length;
        if (nextIdx === 0) {
          setBreathCycles((c) => c + 1);
        }
        setBreathPhaseIdx(nextIdx);
        return BREATH_PHASES[nextIdx].duration;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [breathRunning, breathPhaseIdx]);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredPhysicalGuides = useMemo(() => {
    if (!normalizedQuery) return PHYSICAL_GUIDES;
    return PHYSICAL_GUIDES.filter((guide) => {
      const hay = [
        guide.title,
        guide.summary,
        ...guide.immediateSteps,
        ...guide.firstAidSteps,
        ...guide.avoidList,
        ...guide.seekHelpSigns,
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(normalizedQuery);
    });
  }, [normalizedQuery]);

  const filteredPsychScenarios = useMemo(() => {
    if (!normalizedQuery) return PSYCHOLOGICAL_SCENARIOS;
    return PSYCHOLOGICAL_SCENARIOS.filter((sc) => {
      const hay = [sc.title, sc.situation, ...sc.forSelf, ...sc.forChildOrPeer]
        .join(" ")
        .toLowerCase();
      return hay.includes(normalizedQuery);
    });
  }, [normalizedQuery]);

  const activePhysicalGuide = useMemo(() => {
    const matchInFiltered = filteredPhysicalGuides.find(
      (g) => g.id === selectedTopicId,
    );
    return (
      matchInFiltered ||
      filteredPhysicalGuides[0] ||
      PHYSICAL_GUIDES.find((g) => g.id === selectedTopicId) ||
      PHYSICAL_GUIDES[0]
    );
  }, [filteredPhysicalGuides, selectedTopicId]);

  const handleSyncOfflineBundle = async () => {
    setSyncStatus("loading");
    setSyncError(null);
    try {
      const meta = await syncOfflineSurvivalBundle();
      setSyncMeta(meta);
      setSyncStatus("success");
    } catch (err) {
      setSyncStatus("error");
      setSyncError(
        err instanceof Error
          ? err.message
          : "Gagal menyimpan paket offline di perangkat ini.",
      );
    }
  };

  const handleDownloadStandaloneHtml = () => {
    const html = buildStandaloneSurvivalHtml(safetyCard);
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "permata-panduan-darurat-offline.html";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleResetBreathing = () => {
    setBreathRunning(false);
    setBreathPhaseIdx(0);
    setBreathRemaining(BREATH_PHASES[0].duration);
    setBreathCycles(0);
  };

  const toggleGroundingStep = (idx: number) => {
    setGroundingDone((prev) => prev.map((val, i) => (i === idx ? !val : val)));
  };

  const toggleGoBagItem = (id: string) => {
    setGoBagChecked((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      writeGoBagChecked(next);
      return next;
    });
  };

  const resetGoBagChecklist = () => {
    setGoBagChecked({});
    writeGoBagChecked({});
  };

  const handleSaveSafetyCard = (e: React.FormEvent) => {
    e.preventDefault();
    const nextCard: LocalSafetyCard = {
      ownerName: safetyCard.ownerName.trim(),
      meetingPoint: safetyCard.meetingPoint.trim(),
      guardianContact: safetyCard.guardianContact.trim(),
      medicalNotes: safetyCard.medicalNotes.trim(),
      updatedAt: new Date().toISOString(),
    };
    setSafetyCard(nextCard);
    writeLocalSafetyCard(nextCard);
    setConfirmClearCard(false);
    setCardFeedback("Tersimpan aman di perangkat ini tanpa dikirim ke server.");
  };

  const handleClearSafetyCard = () => {
    clearLocalSafetyCard();
    setSafetyCard(EMPTY_SAFETY_CARD);
    setConfirmClearCard(false);
    setCardFeedback(
      "Data kartu keselamatan lokal di perangkat ini telah dihapus.",
    );
  };

  const handleTabKeyDown = (e: React.KeyboardEvent, idx: number) => {
    const order: MainTab[] = ["physical", "psychological", "preparedness"];
    if (e.key === "ArrowRight") {
      e.preventDefault();
      setActiveTab(order[(idx + 1) % order.length]);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      setActiveTab(order[(idx - 1 + order.length) % order.length]);
    }
  };

  const currentBreathPhase = BREATH_PHASES[breathPhaseIdx];
  const breathProgressPct = Math.round(
    ((currentBreathPhase.duration - breathRemaining + 1) /
      currentBreathPhase.duration) *
      100,
  );
  const groundingCompletedCount = groundingDone.filter(Boolean).length;
  const goBagCompletedCount = GO_BAG_ITEMS.filter(
    (item) => goBagChecked[item.id],
  ).length;
  const goBagProgressPct = Math.round(
    (goBagCompletedCount / GO_BAG_ITEMS.length) * 100,
  );

  return (
    <main className="min-h-screen bg-canvas text-fg pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 space-y-8">
        {/* ================= ZONE 1: HEADER & OFFLINE READINESS ================= */}
        <section
          aria-labelledby="survival-heading"
          className="bg-surface border border-line rounded-xl p-6 sm:p-8 shadow-xs"
        >
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="space-y-3 max-w-[65ch]">
              <div className="flex flex-wrap items-center gap-2.5">
                <span
                  className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${
                    isOnline
                      ? "bg-tint text-fg-brand border-[var(--brand-200)]"
                      : "bg-accent-50 text-warning border-accent-200"
                  }`}
                >
                  {isOnline ? (
                    <Wifi size={14} strokeWidth={1.75} aria-hidden="true" />
                  ) : (
                    <WifiOff size={14} strokeWidth={1.75} aria-hidden="true" />
                  )}
                  <span>
                    {isOnline
                      ? "Jaringan tersedia (mode mandiri siap)"
                      : "Perangkat offline, panduan lokal aktif"}
                  </span>
                </span>

                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-sunken text-fg-muted border border-line">
                  <CheckCircle2
                    size={14}
                    strokeWidth={1.75}
                    className="text-success"
                    aria-hidden="true"
                  />
                  <span>Tanpa login dan tanpa koneksi server</span>
                </span>
              </div>

              <h1
                id="survival-heading"
                className="text-2xl sm:text-4xl font-bold text-fg tracking-tight leading-tight"
              >
                Offline Survival Mode
              </h1>

              <p className="text-sm sm:text-base text-fg-muted leading-relaxed">
                Panduan keselamatan fisik, pertolongan pertama, dan dukungan
                psikologis awal (PFA) untuk menghadapi situasi darurat bencana
                meskipun jaringan internet terputus.
              </p>
            </div>

            {/* Readiness Controls */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0 lg:w-80">
              <button
                type="button"
                onClick={handleSyncOfflineBundle}
                disabled={syncStatus === "loading"}
                aria-busy={syncStatus === "loading"}
                className={`inline-flex items-center justify-center gap-2 min-h-11 px-4 py-2.5 rounded-md bg-action hover:bg-action-hover disabled:bg-sunken disabled:text-neutral-400 text-white text-sm font-medium transition-colors ${focusRing}`}
              >
                <Download size={18} strokeWidth={1.75} aria-hidden="true" />
                <span>
                  {syncStatus === "loading"
                    ? "Menyimpan paket ke perangkat..."
                    : syncMeta
                      ? "Perbarui Paket Offline"
                      : "Simpan Paket Offline di Perangkat"}
                </span>
              </button>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={handleDownloadStandaloneHtml}
                  className={`inline-flex items-center justify-center gap-1.5 min-h-11 px-3 py-2 rounded-md bg-surface border border-line-strong hover:bg-sunken text-fg text-xs sm:text-sm font-medium transition-colors ${focusRing}`}
                >
                  <Download size={16} strokeWidth={1.75} aria-hidden="true" />
                  <span>Unduh HTML</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className={`inline-flex items-center justify-center gap-1.5 min-h-11 px-3 py-2 rounded-md bg-surface border border-line-strong hover:bg-sunken text-fg text-xs sm:text-sm font-medium transition-colors ${focusRing}`}
                >
                  <Printer size={16} strokeWidth={1.75} aria-hidden="true" />
                  <span>Cetak</span>
                </button>
              </div>

              {/* Status Feedback (Loading / Success / Error) */}
              {syncStatus === "error" && syncError && (
                <div
                  role="alert"
                  className="bg-surface border border-line border-l-4 border-l-danger rounded-md p-3 text-xs text-fg flex items-start gap-2"
                >
                  <AlertTriangle
                    size={16}
                    strokeWidth={1.75}
                    className="text-danger shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <span>
                    {syncError} Gunakan tombol Unduh HTML sebagai salinan
                    cadangan.
                  </span>
                </div>
              )}

              {syncStatus !== "error" && (
                <div className="bg-sunken border border-line rounded-md px-3 py-2.5 text-xs text-fg-muted">
                  {syncStatus === "success" && syncMeta ? (
                    <span className="text-fg">
                      Paket offline tersimpan ({syncMeta.cachedUrlsCount} aset)
                      pada{" "}
                      {new Date(syncMeta.lastSyncedAt).toLocaleTimeString(
                        "id-ID",
                        { hour: "2-digit", minute: "2-digit" },
                      )}
                      .
                    </span>
                  ) : syncMeta ? (
                    <span>
                      Terakhir disimpan offline:{" "}
                      {new Date(syncMeta.lastSyncedAt).toLocaleString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      .
                    </span>
                  ) : (
                    <span>
                      Tekan Simpan Paket Offline selagi ada sinyal agar halaman
                      tetap terbuka saat internet mati total.
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ================= ZONE 2: TRIAGE TABS & SEARCH ================= */}
        <section
          aria-label="Navigasi dan pencarian panduan darurat"
          className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div
            role="tablist"
            aria-label="Kategori panduan keselamatan offline"
            className="flex flex-wrap gap-2 bg-surface border border-line p-1.5 rounded-lg"
          >
            {(
              [
                {
                  id: "physical" as const,
                  label: "Keselamatan Fisik",
                  icon: (
                    <ShieldAlert
                      size={16}
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                  ),
                },
                {
                  id: "psychological" as const,
                  label: "Keselamatan Psikologis (PFA)",
                  icon: (
                    <HeartHandshake
                      size={16}
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                  ),
                },
                {
                  id: "preparedness" as const,
                  label: "Tas Siaga & Kontak Darurat",
                  icon: (
                    <Backpack size={16} strokeWidth={1.75} aria-hidden="true" />
                  ),
                },
              ] as const
            ).map((tab, idx) => {
              const selected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`tab-${tab.id}`}
                  role="tab"
                  type="button"
                  aria-selected={selected}
                  aria-controls={`panel-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  onKeyDown={(e) => handleTabKeyDown(e, idx)}
                  className={`inline-flex items-center gap-2 min-h-11 px-4 py-2 rounded-md text-sm font-medium transition-colors ${focusRing} ${
                    selected
                      ? "bg-action text-white"
                      : "text-fg-muted hover:bg-sunken hover:text-fg"
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="w-full md:w-80">
            <label htmlFor="survival-search" className="sr-only">
              Cari panduan keselamatan fisik atau psikologis
            </label>
            <div className="relative">
              <Search
                size={18}
                strokeWidth={1.75}
                className="text-fg-subtle absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id="survival-search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari: gempa, luka bakar, panik..."
                className={`w-full min-h-11 bg-surface border border-line-input rounded-md pl-10 pr-4 text-sm text-fg placeholder:text-fg-subtle ${focusRing}`}
              />
            </div>
          </div>
        </section>

        {/* Search summary across both domains when filtering */}
        {normalizedQuery && (
          <div className="bg-tint border border-[var(--brand-200)] rounded-lg px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-sm">
            <p className="text-fg">
              Hasil pencarian untuk <strong>{searchQuery}</strong>:{" "}
              {filteredPhysicalGuides.length} panduan fisik dan{" "}
              {filteredPsychScenarios.length} skenario psikologis.
            </p>
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className={`min-h-11 px-3 rounded-md text-fg-brand font-medium hover:bg-surface transition-colors ${focusRing}`}
            >
              Reset pencarian
            </button>
          </div>
        )}

        {/* ================= PANEL 1: KESELAMATAN FISIK ================= */}
        {activeTab === "physical" && (
          <section
            id="panel-physical"
            role="tabpanel"
            aria-labelledby="tab-physical"
            className="space-y-6"
          >
            {filteredPhysicalGuides.length === 0 ? (
              <div className="bg-surface border border-line rounded-lg p-8 text-center space-y-3">
                <p className="text-base font-medium text-fg">
                  Tidak ada panduan keselamatan fisik yang cocok dengan kata
                  kunci &quot;{searchQuery}&quot;.
                </p>
                <p className="text-sm text-fg-muted">
                  Coba kata kunci lain seperti gempa, tsunami, banjir, luka,
                  atau reset pencarian untuk melihat semua panduan.
                </p>
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className={`inline-flex items-center justify-center min-h-11 px-4 rounded-md bg-action hover:bg-action-hover text-white text-sm font-medium ${focusRing}`}
                >
                  Tampilkan semua panduan
                </button>
              </div>
            ) : (
              <>
                {/* Disaster Topic Selector */}
                <div
                  className="flex flex-wrap gap-2.5"
                  role="group"
                  aria-label="Pilih situasi bencana atau pertolongan pertama"
                >
                  {filteredPhysicalGuides.map((guide) => {
                    const isSelected = activePhysicalGuide.id === guide.id;
                    return (
                      <button
                        key={guide.id}
                        type="button"
                        onClick={() => setSelectedTopicId(guide.id)}
                        aria-pressed={isSelected}
                        className={`inline-flex items-center gap-2 min-h-11 px-4 py-2 rounded-full border text-sm font-medium transition-colors ${focusRing} ${
                          isSelected
                            ? "bg-tint border-action text-fg-brand"
                            : "bg-surface border-line-strong text-fg-muted hover:bg-sunken hover:text-fg"
                        }`}
                      >
                        {TOPIC_ICONS[guide.id]}
                        <span>{guide.title}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Active Physical Guide Detail */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left: Immediate Steps & First Aid */}
                  <div className="lg:col-span-8 space-y-6">
                    <article className="bg-surface border border-line rounded-lg p-6 sm:p-8 shadow-xs space-y-6">
                      <div className="space-y-2 border-b border-line pb-5">
                        <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.06em] text-fg-brand">
                          {TOPIC_ICONS[activePhysicalGuide.id]}
                          <span>Protokol Keselamatan Fisik</span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-semibold text-fg">
                          {activePhysicalGuide.title}
                        </h2>
                        <p className="text-sm sm:text-base text-fg-muted leading-relaxed max-w-[65ch]">
                          {activePhysicalGuide.summary}
                        </p>
                      </div>

                      <div className="space-y-3">
                        <h3 className="text-base font-semibold text-fg">
                          Langkah Segera Saat Terjadi
                        </h3>
                        <ol className="space-y-3">
                          {activePhysicalGuide.immediateSteps.map((step, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-3 bg-sunken border border-line rounded-md p-4"
                            >
                              <span className="w-7 h-7 rounded-full bg-action text-white text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">
                                {i + 1}
                              </span>
                              <span className="text-sm text-fg leading-relaxed max-w-[65ch]">
                                {step}
                              </span>
                            </li>
                          ))}
                        </ol>
                      </div>

                      <div className="space-y-3 pt-2">
                        <h3 className="text-base font-semibold text-fg">
                          Penanganan Awal &amp; Pertolongan Pertama
                        </h3>
                        <ul className="space-y-2.5">
                          {activePhysicalGuide.firstAidSteps.map((step, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-2.5 text-sm text-fg-muted leading-relaxed max-w-[65ch]"
                            >
                              <CheckCircle2
                                size={18}
                                strokeWidth={1.75}
                                className="text-success shrink-0 mt-0.5"
                                aria-hidden="true"
                              />
                              <span>{step}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </article>
                  </div>

                  {/* Right: Safety Boundaries & Medical Red Flags */}
                  <aside className="lg:col-span-4 space-y-6">
                    <div className="bg-surface border border-line border-l-4 border-l-warning rounded-lg p-6 shadow-xs space-y-3">
                      <div className="flex items-center gap-2 text-warning font-semibold text-sm">
                        <AlertTriangle
                          size={18}
                          strokeWidth={1.75}
                          aria-hidden="true"
                        />
                        <h3>Hal yang Harus Dihindari</h3>
                      </div>
                      <ul className="space-y-2.5">
                        {activePhysicalGuide.avoidList.map((item, i) => (
                          <li
                            key={i}
                            className="text-sm text-fg-muted leading-relaxed pl-3 border-l border-line-strong"
                          >
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-emphasis text-white rounded-lg p-6 shadow-xs space-y-3">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <Info size={18} strokeWidth={1.75} aria-hidden="true" />
                        <h3>Kapan Segera Cari Bantuan Medis</h3>
                      </div>
                      <ul className="space-y-2.5">
                        {activePhysicalGuide.seekHelpSigns.map((sign, i) => (
                          <li
                            key={i}
                            className="text-sm text-white/90 leading-relaxed flex items-start gap-2"
                          >
                            <span
                              aria-hidden="true"
                              className="w-1.5 h-1.5 rounded-full bg-white mt-2 shrink-0"
                            />
                            <span>{sign}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="pt-2 border-t border-white/20">
                        <button
                          type="button"
                          onClick={() => setActiveTab("preparedness")}
                          className={`inline-flex items-center justify-center w-full min-h-11 px-4 rounded-md bg-surface text-fg hover:bg-sunken text-sm font-medium transition-colors ${focusRing}`}
                        >
                          Lihat Daftar Nomor Darurat
                        </button>
                      </div>
                    </div>
                  </aside>
                </div>
              </>
            )}
          </section>
        )}

        {/* ================= PANEL 2: KESELAMATAN PSIKOLOGIS (PFA) ================= */}
        {activeTab === "psychological" && (
          <section
            id="panel-psychological"
            role="tabpanel"
            aria-labelledby="tab-psychological"
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
          >
            {/* Left Column: PFA Principles & Acute Stress Scenarios */}
            <div className="lg:col-span-7 space-y-6">
              {/* Cultural Wisdom Anchor */}
              <div className="bg-accent-50 border border-accent-200 rounded-lg p-5 space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-[0.06em] text-fg-accent">
                  {culture === "sumbar"
                    ? "Penguat Budaya: Mambangkik Batang Tarandam"
                    : "Penguat Budaya: Kearifan Meuseuraya"}
                </p>
                <p className="text-sm text-fg leading-relaxed">
                  {culture === "sumbar"
                    ? "Reaksi takut, gemetar, atau menangis setelah bencana adalah respon wajar tubuh untuk bertahan. Pelan-pelan kita pulih bersama sanak saudara dan lingkungan sekitar."
                    : "Dalam kebersamaan Meuseuraya, rasa cemas tidak perlu dipikul sendirian. Menemani anak dengan tutur lembut adalah langkah awal pemulihan."}
                </p>
              </div>

              {/* 3-Step PFA Guide */}
              <div className="bg-surface border border-line rounded-lg p-6 shadow-xs space-y-5">
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold text-fg">
                    Pertolongan Pertama Psikologis (PFA): 3 Langkah
                  </h2>
                  <p className="text-sm text-fg-muted">
                    Panduan praktis untuk orang tua, relawan, guru, atau remaja
                    saat menenangkan diri dan mendampingi anak di situasi
                    darurat.
                  </p>
                </div>

                <div className="space-y-4">
                  {PFA_PRINCIPLES.map((principle) => (
                    <div
                      key={principle.step}
                      className="bg-sunken border border-line rounded-md p-4 space-y-2.5"
                    >
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-action text-white text-xs font-semibold shrink-0">
                          {principle.step}
                        </span>
                        <div>
                          <span className="text-xs font-semibold tracking-[0.06em] text-fg-brand uppercase">
                            {principle.code}
                          </span>
                          <h3 className="text-base font-semibold text-fg">
                            {principle.title}
                          </h3>
                        </div>
                      </div>
                      <p className="text-sm text-fg-muted leading-relaxed">
                        {principle.description}
                      </p>
                      <ul className="space-y-1.5 pt-1">
                        {principle.practicalActions.map((act, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2 text-sm text-fg leading-relaxed"
                          >
                            <CheckCircle2
                              size={16}
                              strokeWidth={1.75}
                              className="text-success shrink-0 mt-1"
                              aria-hidden="true"
                            />
                            <span>{act}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              {/* Acute Stress Scenarios Accordion */}
              <div className="bg-surface border border-line rounded-lg p-6 shadow-xs space-y-4">
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold text-fg">
                    Penanganan Kondisi Psikologis Saat Darurat
                  </h2>
                  <p className="text-sm text-fg-muted">
                    Pilih kondisi yang sedang dialami untuk melihat langkah
                    penanganan mandiri dan cara mendampingi anak.
                  </p>
                </div>

                {filteredPsychScenarios.length === 0 ? (
                  <div className="bg-sunken border border-line rounded-md p-6 text-center space-y-3">
                    <p className="text-sm text-fg">
                      Tidak ada skenario psikologis yang cocok dengan kata kunci
                      &quot;{searchQuery}&quot;.
                    </p>
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className={`min-h-11 px-4 rounded-md bg-action hover:bg-action-hover text-white text-sm font-medium ${focusRing}`}
                    >
                      Tampilkan semua skenario
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredPsychScenarios.map((sc) => {
                      const isOpen = expandedScenarioId === sc.id;
                      const panelId = `scenario-panel-${sc.id}`;
                      return (
                        <div
                          key={sc.id}
                          className="border border-line rounded-md overflow-hidden"
                        >
                          <button
                            type="button"
                            aria-expanded={isOpen}
                            aria-controls={panelId}
                            onClick={() =>
                              setExpandedScenarioId(isOpen ? null : sc.id)
                            }
                            className={`w-full min-h-11 px-4 py-3.5 bg-surface hover:bg-sunken flex items-center justify-between gap-3 text-left transition-colors ${focusRing}`}
                          >
                            <span className="text-sm sm:text-base font-medium text-fg">
                              {sc.title}
                            </span>
                            <ChevronDown
                              size={18}
                              strokeWidth={1.75}
                              className={`text-fg-muted shrink-0 transition-transform duration-200 ${
                                isOpen ? "rotate-180" : ""
                              }`}
                              aria-hidden="true"
                            />
                          </button>

                          {isOpen && (
                            <div
                              id={panelId}
                              className="px-4 pb-4 pt-2 bg-sunken border-t border-line space-y-4"
                            >
                              <p className="text-sm text-fg-muted leading-relaxed">
                                {sc.situation}
                              </p>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-surface border border-line rounded-md p-4 space-y-2">
                                  <h4 className="text-sm font-semibold text-fg">
                                    Untuk Diri Sendiri
                                  </h4>
                                  <ul className="space-y-2">
                                    {sc.forSelf.map((item, idx) => (
                                      <li
                                        key={idx}
                                        className="text-sm text-fg-muted leading-relaxed flex items-start gap-2"
                                      >
                                        <span
                                          aria-hidden="true"
                                          className="w-1.5 h-1.5 rounded-full bg-action mt-2 shrink-0"
                                        />
                                        <span>{item}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>

                                <div className="bg-surface border border-line rounded-md p-4 space-y-2">
                                  <h4 className="text-sm font-semibold text-fg">
                                    Saat Mendampingi Anak atau Teman
                                  </h4>
                                  <ul className="space-y-2">
                                    {sc.forChildOrPeer.map((item, idx) => (
                                      <li
                                        key={idx}
                                        className="text-sm text-fg-muted leading-relaxed flex items-start gap-2"
                                      >
                                        <span
                                          aria-hidden="true"
                                          className="w-1.5 h-1.5 rounded-full bg-action mt-2 shrink-0"
                                        />
                                        <span>{item}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>

                              <p className="text-xs text-fg-muted bg-accent-50 border border-accent-200 rounded-sm px-3 py-2">
                                {culture === "sumbar"
                                  ? sc.culturalNoteSumbar
                                  : sc.culturalNoteAceh}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Interactive Offline Calming Tools */}
            <aside className="lg:col-span-5 space-y-6">
              {/* Interactive 4-4-6 Breathing Tool */}
              <div className="bg-surface border border-line rounded-lg p-6 shadow-xs space-y-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.06em] text-fg-brand">
                      <Wind size={15} strokeWidth={1.75} aria-hidden="true" />
                      <span>Latihan Napas Offline</span>
                    </div>
                    <h3 className="text-lg font-semibold text-fg">
                      Napas Tenang 4-4-6
                    </h3>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-tint text-fg-brand text-xs font-medium">
                    Siklus: {breathCycles}
                  </span>
                </div>

                <div
                  aria-live="polite"
                  className="bg-tint border border-[var(--brand-200)] rounded-lg p-5 text-center space-y-3"
                >
                  <p className="text-sm font-medium text-fg-brand">
                    {currentBreathPhase.label}
                  </p>
                  <div className="text-4xl font-semibold text-fg tabular-nums">
                    {breathRemaining} detik
                  </div>
                  <div className="h-2 w-full bg-surface rounded-full overflow-hidden border border-line">
                    <div
                      className="h-full bg-action transition-all duration-300"
                      style={{ width: `${breathProgressPct}%` }}
                    />
                  </div>
                  <p className="text-xs text-fg-muted">
                    Tarik 4 detik, tahan 4 detik, hembuskan perlahan 6 detik.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setBreathRunning((r) => !r)}
                    className={`flex-1 inline-flex items-center justify-center gap-2 min-h-11 px-4 rounded-md bg-action hover:bg-action-hover text-white text-sm font-medium transition-colors ${focusRing}`}
                  >
                    {breathRunning ? (
                      <>
                        <Pause
                          size={16}
                          strokeWidth={1.75}
                          aria-hidden="true"
                        />
                        <span>Jeda Latihan</span>
                      </>
                    ) : (
                      <>
                        <Play size={16} strokeWidth={1.75} aria-hidden="true" />
                        <span>Mulai Napas Tenang</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleResetBreathing}
                    className={`inline-flex items-center justify-center gap-2 min-h-11 px-4 rounded-md bg-surface border border-line-strong hover:bg-sunken text-fg text-sm font-medium transition-colors ${focusRing}`}
                  >
                    <RotateCcw
                      size={16}
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                    <span>Ulang</span>
                  </button>
                </div>
              </div>

              {/* Interactive 5-4-3-2-1 Grounding */}
              <div className="bg-surface border border-line rounded-lg p-6 shadow-xs space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.06em] text-fg-brand">
                      <Hand size={15} strokeWidth={1.75} aria-hidden="true" />
                      <span>Stabilisasi Emosi</span>
                    </div>
                    <h3 className="text-lg font-semibold text-fg">
                      Grounding Sensori 5-4-3-2-1
                    </h3>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-sunken text-fg-muted text-xs font-medium border border-line">
                    {groundingCompletedCount} / {GROUNDING_STEPS.length}
                  </span>
                </div>

                <p className="text-sm text-fg-muted">
                  Tandai setiap langkah secara perlahan untuk membantu pikiran
                  kembali hadir di tempat yang aman saat panik.
                </p>

                <div className="space-y-2.5">
                  {GROUNDING_STEPS.map((step, idx) => {
                    const checked = groundingDone[idx];
                    return (
                      <label
                        key={step.count}
                        className={`flex items-start gap-3 min-h-11 p-3.5 rounded-md border cursor-pointer transition-colors ${
                          checked
                            ? "bg-tint border-action"
                            : "bg-surface border-line hover:bg-sunken"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleGroundingStep(idx)}
                          className={`w-5 h-5 mt-0.5 accent-action rounded shrink-0 ${focusRing}`}
                        />
                        <div className="space-y-0.5 min-w-0">
                          <div className="text-sm font-medium text-fg">
                            {step.count} {step.sense}: {step.prompt}
                          </div>
                          <div className="text-xs text-fg-muted">
                            {step.example}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>

                {groundingCompletedCount > 0 && (
                  <div className="flex items-center justify-between pt-2 border-t border-line">
                    <span className="text-xs text-fg-muted">
                      {groundingCompletedCount === GROUNDING_STEPS.length
                        ? "Semua langkah selesai. Ambil satu napas tenang lagi."
                        : "Lanjutkan sesuai kenyamananmu."}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setGroundingDone(GROUNDING_STEPS.map(() => false))
                      }
                      className={`min-h-11 px-3 rounded-md text-xs font-medium text-fg-brand hover:bg-tint ${focusRing}`}
                    >
                      Reset
                    </button>
                  </div>
                )}
              </div>

              {/* Reminder for Human Help */}
              <div className="bg-surface border border-line border-l-4 border-l-info rounded-lg p-5 space-y-2">
                <h3 className="text-sm font-semibold text-fg">
                  Butuh Pendampingan Manusia Segera?
                </h3>
                <p className="text-sm text-fg-muted leading-relaxed">
                  Jika ada anak atau penyintas yang tampak sangat putus asa,
                  menyakiti diri, atau terpisah dari keluarga, segera laporkan
                  ke petugas posko terdekat atau hubungi{" "}
                  <strong className="text-fg">
                    119 ekstensi 8 (Healing119)
                  </strong>{" "}
                  bila sinyal seluler tersedia.
                </p>
              </div>
            </aside>
          </section>
        )}

        {/* ================= PANEL 3: TAS SIAGA, KARTU LOKAL & KONTAK ================= */}
        {activeTab === "preparedness" && (
          <section
            id="panel-preparedness"
            role="tabpanel"
            aria-labelledby="tab-preparedness"
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
          >
            {/* Left: Go-Bag Checklist */}
            <div className="lg:col-span-6 bg-surface border border-line rounded-lg p-6 shadow-xs space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold text-fg">
                    Checklist Tas Siaga Bencana
                  </h2>
                  <p className="text-sm text-fg-muted">
                    Tersimpan otomatis di perangkat ini tanpa perlu akun.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-tint text-fg-brand text-xs font-semibold shrink-0">
                  {goBagCompletedCount} / {GO_BAG_ITEMS.length} siap
                </span>
              </div>

              <div>
                <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--brand-500)] transition-all duration-300"
                    style={{ width: `${goBagProgressPct}%` }}
                  />
                </div>
                <p className="text-xs text-fg-subtle mt-2">
                  Kesiapan perlengkapan: {goBagProgressPct}%
                </p>
              </div>

              <div className="space-y-2.5">
                {GO_BAG_ITEMS.map((item) => {
                  const checked = !!goBagChecked[item.id];
                  return (
                    <label
                      key={item.id}
                      className={`flex items-start gap-3 min-h-11 p-3.5 rounded-md border cursor-pointer transition-colors ${
                        checked
                          ? "bg-tint border-action"
                          : "bg-surface border-line hover:bg-sunken"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleGoBagItem(item.id)}
                        className={`w-5 h-5 mt-0.5 accent-action rounded shrink-0 ${focusRing}`}
                      />
                      <div className="space-y-0.5 min-w-0">
                        <div className="text-sm font-medium text-fg">
                          {item.label}
                        </div>
                        <div className="text-xs text-fg-muted">{item.note}</div>
                      </div>
                    </label>
                  );
                })}
              </div>

              {goBagCompletedCount > 0 && (
                <div className="pt-2 border-t border-line flex justify-end">
                  <button
                    type="button"
                    onClick={resetGoBagChecklist}
                    className={`min-h-11 px-4 rounded-md text-sm font-medium text-fg-brand hover:bg-tint ${focusRing}`}
                  >
                    Kosongkan checklist
                  </button>
                </div>
              )}
            </div>

            {/* Right: Local Family Safety Card + Official Emergency Numbers */}
            <div className="lg:col-span-6 space-y-6">
              {/* Local Safety Card (Client-Only LocalStorage) */}
              <div className="bg-surface border border-line rounded-lg p-6 shadow-xs space-y-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-tint text-fg-brand text-xs font-medium">
                    <CheckCircle2
                      size={13}
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                    <span>Penyimpanan Lokal Perangkat</span>
                  </div>
                  <h2 className="text-xl font-semibold text-fg">
                    Kartu Keselamatan Keluarga (Offline)
                  </h2>
                  <p className="text-sm text-fg-muted">
                    Catat titik kumpul dan kontak wali di perangkat ini agar
                    mudah ditunjukkan saat darurat. Data tidak dikirim ke server
                    mana pun.
                  </p>
                </div>

                <form onSubmit={handleSaveSafetyCard} className="space-y-4">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="card-owner-name"
                      className="block text-sm font-medium text-fg"
                    >
                      Nama Anak atau Pemilik Perangkat
                    </label>
                    <input
                      id="card-owner-name"
                      type="text"
                      value={safetyCard.ownerName}
                      onChange={(e) =>
                        setSafetyCard((s) => ({
                          ...s,
                          ownerName: e.target.value,
                        }))
                      }
                      placeholder="Nama lengkap atau nama panggilan"
                      className={`w-full min-h-11 bg-surface border border-line-input rounded-md px-4 text-sm text-fg placeholder:text-fg-subtle ${focusRing}`}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="card-meeting-point"
                      className="block text-sm font-medium text-fg"
                    >
                      Titik Kumpul Keluarga yang Disepakati
                    </label>
                    <input
                      id="card-meeting-point"
                      type="text"
                      value={safetyCard.meetingPoint}
                      onChange={(e) =>
                        setSafetyCard((s) => ({
                          ...s,
                          meetingPoint: e.target.value,
                        }))
                      }
                      placeholder="Contoh: Lapangan Balai Desa / Halaman Masjid"
                      className={`w-full min-h-11 bg-surface border border-line-input rounded-md px-4 text-sm text-fg placeholder:text-fg-subtle ${focusRing}`}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="card-guardian-contact"
                      className="block text-sm font-medium text-fg"
                    >
                      Nama &amp; Nomor Telepon Wali / Orang Dewasa Tepercaya
                    </label>
                    <input
                      id="card-guardian-contact"
                      type="text"
                      value={safetyCard.guardianContact}
                      onChange={(e) =>
                        setSafetyCard((s) => ({
                          ...s,
                          guardianContact: e.target.value,
                        }))
                      }
                      placeholder="Contoh: Ibu / Wali - 08xx-xxxx-xxxx"
                      className={`w-full min-h-11 bg-surface border border-line-input rounded-md px-4 text-sm text-fg placeholder:text-fg-subtle ${focusRing}`}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="card-medical-notes"
                      className="block text-sm font-medium text-fg"
                    >
                      Catatan Medis, Alergi, atau Obat Rutin
                    </label>
                    <textarea
                      id="card-medical-notes"
                      rows={3}
                      value={safetyCard.medicalNotes}
                      onChange={(e) =>
                        setSafetyCard((s) => ({
                          ...s,
                          medicalNotes: e.target.value,
                        }))
                      }
                      placeholder="Contoh: Golongan darah O, asma (bawa inhaler)"
                      className={`w-full bg-surface border border-line-input rounded-md p-3.5 text-sm text-fg placeholder:text-fg-subtle ${focusRing}`}
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="submit"
                      className={`inline-flex items-center justify-center min-h-11 px-5 rounded-md bg-action hover:bg-action-hover text-white text-sm font-medium transition-colors ${focusRing}`}
                    >
                      Simpan di Perangkat
                    </button>

                    {!confirmClearCard ? (
                      <button
                        type="button"
                        onClick={() => setConfirmClearCard(true)}
                        className={`inline-flex items-center gap-1.5 min-h-11 px-3 rounded-md text-sm font-medium text-fg-muted hover:text-danger hover:bg-sunken transition-colors ${focusRing}`}
                      >
                        <Trash2
                          size={16}
                          strokeWidth={1.75}
                          aria-hidden="true"
                        />
                        <span>Hapus Data Lokal</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleClearSafetyCard}
                          className={`min-h-11 px-3.5 rounded-md bg-danger text-white text-xs font-medium ${focusRing}`}
                        >
                          Ya, hapus data
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmClearCard(false)}
                          className={`min-h-11 px-3 rounded-md border border-line-strong bg-surface text-fg text-xs font-medium ${focusRing}`}
                        >
                          Batal
                        </button>
                      </div>
                    )}
                  </div>

                  {cardFeedback && (
                    <p
                      role="status"
                      className="text-xs text-success font-medium bg-tint border border-[var(--brand-200)] rounded-md px-3 py-2"
                    >
                      {cardFeedback}
                    </p>
                  )}
                </form>
              </div>

              {/* Official Emergency Directory */}
              <div className="bg-surface border border-line rounded-lg p-6 shadow-xs space-y-4">
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold text-fg">
                    Nomor Darurat Resmi Indonesia
                  </h2>
                  <p className="text-sm text-fg-muted">
                    Panggilan suara tetap memerlukan sinyal seluler lokal. Jika
                    jaringan terputus total, segera datangi posko resmi,
                    puskesmas, atau orang dewasa tepercaya di sekitar.
                  </p>
                </div>

                <div className="divide-y divide-line border border-line rounded-md">
                  {EMERGENCY_NUMBERS.map((item) => (
                    <div
                      key={item.number}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-base font-semibold text-fg">
                            {item.number}
                          </span>
                          <span className="text-xs font-medium px-2 py-0.5 rounded-sm bg-sunken text-fg-muted border border-line">
                            {item.scope}
                          </span>
                        </div>
                        <div className="text-sm font-medium text-fg-brand">
                          {item.agency}
                        </div>
                        <p className="text-xs text-fg-muted leading-relaxed">
                          {item.note}
                        </p>
                      </div>

                      <a
                        href={item.dialHref}
                        className={`inline-flex items-center justify-center gap-2 min-h-11 px-4 rounded-md bg-surface border border-line-strong hover:bg-sunken text-fg text-sm font-medium shrink-0 transition-colors ${focusRing}`}
                      >
                        <Phone
                          size={15}
                          strokeWidth={1.75}
                          aria-hidden="true"
                        />
                        <span>Panggil</span>
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Quick links to standalone offline-capable games */}
        <section
          aria-label="Akses cepat modul relaksasi dan kesiapsiagaan"
          className="bg-surface border border-line rounded-lg p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-fg">
              Akses Modul Pendukung Tanpa Login
            </h2>
            <p className="text-sm text-fg-muted">
              Modul latihan napas dan simulasi tas siaga juga dapat dijalankan
              secara mandiri di peramban setelah paket offline disimpan.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              href="/Breathing.html"
              className={`inline-flex items-center justify-center min-h-11 px-4 rounded-md bg-surface border border-line-strong hover:bg-sunken text-fg text-sm font-medium transition-colors ${focusRing}`}
            >
              ZenBreath (HTML)
            </a>
            <a
              href="/PickAndDrop.html"
              className={`inline-flex items-center justify-center min-h-11 px-4 rounded-md bg-surface border border-line-strong hover:bg-sunken text-fg text-sm font-medium transition-colors ${focusRing}`}
            >
              Tas Siaga Game (HTML)
            </a>
            <Link
              href="/dashboard"
              className={`inline-flex items-center justify-center min-h-11 px-4 rounded-md bg-tint hover:bg-[var(--brand-100)] text-fg-brand text-sm font-medium transition-colors ${focusRing}`}
            >
              Ke Dashboard
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
