"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCulture } from "@/context/CultureContext";
import { TreeStats, calculateTreeStats } from "@/lib/treeProgress";
import { AnimatedSection } from "@/components/PageMotion";
import RichText from "@/components/RichText";
import {
  AI_PERSONAS,
  AiPersona,
  AiPersonaId,
  DEFAULT_PERSONA_ID,
  buildPersonaGreeting,
  getPersona,
} from "@/lib/aiPersonas";

const crisisKeywords = [
  "bunuh diri",
  "ingin mati",
  "tidak ingin hidup",
  "hopeless",
  "self harm",
  "menyakiti diri",
  "putus asa",
];

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "crisis" | "rejected";
  personaId?: AiPersonaId;
  content: string;
  timeStr: string;
  culturalWisdom?: {
    title: string;
    quote: string;
    meaning: string;
  };
  hasActionButtons?: boolean;
}

function formatCurrentTime() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(
    now.getMinutes(),
  ).padStart(2, "0")} WIB`;
}

function PersonaAvatar({
  persona,
  size,
  className = "",
}: {
  persona: AiPersona;
  size: number;
  className?: string;
}) {
  return (
    <span
      className={`rounded-full flex items-center justify-center shrink-0 overflow-hidden shadow-sm ring-2 ring-white ${className}`}
      style={{ width: size, height: size, backgroundColor: persona.soft }}
    >
      <Image
        src={persona.mascot}
        alt={`Maskot ${persona.name}`}
        width={size * 2}
        height={size * 2}
        className="w-full h-full object-contain scale-125"
      />
    </span>
  );
}

function buildGreetingMessage(
  p: AiPersona,
  culture: string,
  id: string,
  timeStr: string,
): ChatMessage {
  return {
    id,
    role: "assistant",
    personaId: p.id,
    content: buildPersonaGreeting(p),
    timeStr,
    culturalWisdom: {
      title:
        culture === "kalimantan"
          ? "Falsafah Handep & Rumah Betang"
          : "Kearifan Meuseuraya Aceh",
      quote:
        culture === "kalimantan"
          ? "“Bapakat kita bagawi, bapasang kita basanding; teguh laksana ulin di rimba.”"
          : "“Bungoeng jeumpa meugisa meutaloe, saboh hatee peugot gampong.”",
      meaning:
        culture === "kalimantan"
          ? "Rasa cemas ini adalah fase pemulihan. Sebagaimana warga di Rumah Betang yang saling menopang, kamu punya ketangguhan laksana kayu ulin untuk bangkit."
          : "Duka dan lelah ini kita pikul bersama di posko. Bunga yang saling bertaut akan menguatkan kembali asa masa depan.",
    },
    hasActionButtons: true,
  };
}

export default function AiCompanion() {
  const { culture, setCulture } = useCulture();
  const msgCountRef = useRef(1);

  const [personaId, setPersonaId] = useState<AiPersonaId>(DEFAULT_PERSONA_ID);
  const persona = getPersona(personaId);

  // Initial greeting
  const [messages, setMessages] = useState<ChatMessage[]>([
    buildGreetingMessage(
      getPersona(DEFAULT_PERSONA_ID),
      culture,
      "msg-welcome-1",
      "10:12 WIB",
    ),
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathPhaseIndex, setBreathPhaseIndex] = useState(0);

  // Real-time emotion radar state
  const [detectedEmotion, setDetectedEmotion] = useState<{
    label: string;
    stablePercent: number;
    alertPercent: number;
    resiliencePoints: number;
  }>({
    label: "Cemas Situasional",
    stablePercent: 40,
    alertPercent: 60,
    resiliencePoints: 45,
  });

  // Grounding 5-4-3-2-1 checked state
  const [groundingChecked, setGroundingChecked] = useState<boolean[]>([
    false,
    false,
    false,
    false,
    false,
  ]);

  // Real tree stats from database
  const [treeStats, setTreeStats] = useState<TreeStats | null>(null);
  const [mobileChatHeight, setMobileChatHeight] = useState<number | null>(null);

  const streamRef = useRef<HTMLDivElement>(null);
  const chatCardRef = useRef<HTMLDivElement>(null);

  // SSR-safe visualViewport resize listener for mobile virtual keyboard
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const handleViewportResize = () => {
      if (window.innerWidth < 1024 && window.innerHeight - vv.height > 120) {
        setMobileChatHeight(Math.max(300, Math.floor(vv.height - 84)));
      } else {
        setMobileChatHeight(null);
      }
    };
    vv.addEventListener("resize", handleViewportResize);
    return () => vv.removeEventListener("resize", handleViewportResize);
  }, []);

  // Fetch real Hope Tree stats on mount
  useEffect(() => {
    let isMounted = true;
    async function loadStats() {
      try {
        const res = await fetch("/api/journal");
        const data = await res.json();
        if (isMounted && data.stats?.treeStats) {
          setTreeStats(data.stats.treeStats);
        }
      } catch (err) {
        console.warn("Could not fetch tree stats:", err);
      }
    }
    loadStats();
    return () => {
      isMounted = false;
    };
  }, []);

  const activeTreeStats: TreeStats =
    treeStats ||
    calculateTreeStats({
      journalCount: 4,
      waterCount: 1,
      breatheCount: 1,
      screeningCount: 1,
      wateredToday: true,
    });

  // Auto-scroll chat stream
  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.scrollTop = streamRef.current.scrollHeight;
    }
  }, [messages, loading, breathingActive]);

  // Breathing exercise cyclic ticker
  useEffect(() => {
    if (!breathingActive) return;
    const interval = setInterval(() => {
      setBreathPhaseIndex((prev) => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(interval);
  }, [breathingActive]);

  // Recording timer ticker
  useEffect(() => {
    if (!isRecording) return;
    const interval = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isRecording]);

  const breathingPhases = [
    "Tarik napas perlahan lewat hidung (4 detik)...",
    "Tahan napas sejenak, rasakan dadamu tenang (3 detik)...",
    "Hembuskan perlahan lewat bibir (5 detik)...",
  ];

  const detectCrisis = (text: string) => {
    return crisisKeywords.some((keyword) =>
      text.toLowerCase().includes(keyword),
    );
  };

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText ?? input;
    if (!textToSend.trim() || loading) return;

    const time = formatCurrentTime();
    const userMsg: ChatMessage = {
      id: `usr-${msgCountRef.current++}`,
      role: "user",
      content: textToSend.trim(),
      timeStr: time,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInput("");

    // Crisis check
    if (detectCrisis(textToSend)) {
      setMessages((prev) => [
        ...prev,
        {
          id: `crisis-${msgCountRef.current++}`,
          role: "crisis",
          content:
            "Saya sangat prihatin dan peduli dengan apa yang kamu alami. Kamu sangat berharga dan tidak sendirian menghadapi ini. Dukungan profesional dan pertolongan darurat siaga menemanimu sekarang.",
          timeStr: time,
        },
      ]);
      setDetectedEmotion({
        label: "Krisis Butuh Rujukan",
        stablePercent: 15,
        alertPercent: 85,
        resiliencePoints: detectedEmotion.resiliencePoints + 10,
      });
      return;
    }

    setLoading(true);

    try {
      const historyPayload = messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .slice(-6)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          culture,
          persona: personaId,
          history: historyPayload,
        }),
      });

      const data = await res.json();

      if (data.status === "crisis") {
        setMessages((prev) => [
          ...prev,
          {
            id: `crisis-${msgCountRef.current++}`,
            role: "crisis",
            content:
              data.crisis?.immediateResponse ||
              data.reply ||
              "Perasaanmu sangat berharga dan didengar. Segera ceritakan hal ini kepada orang dewasa tepercaya atau hubungi layanan darurat SafeConnect 119.",
            timeStr: formatCurrentTime(),
          },
        ]);
        setDetectedEmotion({
          label: "Krisis Butuh Rujukan",
          stablePercent: 15,
          alertPercent: 85,
          resiliencePoints: detectedEmotion.resiliencePoints + 10,
        });
        return;
      }

      if (data.status === "rejected" || data.rejected) {
        setMessages((prev) => [
          ...prev,
          {
            id: `rej-${msgCountRef.current++}`,
            role: "rejected",
            content:
              data.message ||
              data.reply ||
              "Maaf, ruang ini khusus untuk mendengarkan cerita dan pendampingan pemulihan pascabencana.",
            timeStr: formatCurrentTime(),
          },
        ]);
        return;
      }

      // Dynamic emotion estimation only for accepted on-topic messages
      const lower = textToSend.toLowerCase();
      if (
        lower.includes("takut") ||
        lower.includes("gempa") ||
        lower.includes("panik") ||
        lower.includes("angin")
      ) {
        setDetectedEmotion({
          label: "Waspada Pascabencana",
          stablePercent: 30,
          alertPercent: 70,
          resiliencePoints: detectedEmotion.resiliencePoints + 15,
        });
      } else if (
        lower.includes("tenang") ||
        lower.includes("lega") ||
        lower.includes("terima kasih") ||
        lower.includes("bisa")
      ) {
        setDetectedEmotion({
          label: "Tenang & Berdaya",
          stablePercent: 75,
          alertPercent: 25,
          resiliencePoints: detectedEmotion.resiliencePoints + 20,
        });
      } else {
        setDetectedEmotion({
          label: "Reflektif & Curhat",
          stablePercent: 55,
          alertPercent: 45,
          resiliencePoints: detectedEmotion.resiliencePoints + 10,
        });
      }

      const replyText =
        data.reply ||
        "Aku mendengarmu. Ceritamu sangat berharga. Mari kita hadapi perasaan ini bersama satu langkah demi satu langkah.";

      // Attach cultural wisdom snippet
      const aiMsg: ChatMessage = {
        id: `ai-${msgCountRef.current++}`,
        role: "assistant",
        personaId,
        content: replyText,
        timeStr: formatCurrentTime(),
        culturalWisdom: {
          title:
            culture === "kalimantan"
              ? "Kearifan Handep Kalimantan"
              : "Semangat Meuseuraya Aceh",
          quote:
            culture === "kalimantan"
              ? "“Bapakat kita bagawi, bapasang kita basanding; saperti ulin teguh di tanah rimba.”"
              : "“Udep sare mate syahid, beusajan lam geunaseh. Badai brat ka lheueh ta lewati, singoh langet teuh glah.”",
          meaning:
            culture === "kalimantan"
              ? "Dari kebersamaan di bawah atap Rumah Betang, daya lentur jiwamu akan tumbuh kokoh merawat masa depan."
              : "Kebersamaan dan gotong-royong adalah obat penawar duka bencana yang paling mujarab.",
        },
        hasActionButtons: true,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${msgCountRef.current++}`,
          role: "assistant",
          personaId,
          content:
            "Terima kasih sudah sangat berani menceritakan rasa takut ini. Merasa waspada dan berdebar setelah bencana adalah reaksi alami tubuh untuk melindungi diri. Kamu aman dan tidak sendirian di sini.",
          timeStr: formatCurrentTime(),
          hasActionButtons: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPersona = (id: AiPersonaId) => {
    if (id === personaId || loading) return;
    const next = getPersona(id);
    const hasConversation = messages.some((m) => m.role === "user");
    const greeting = buildGreetingMessage(
      next,
      culture,
      `msg-persona-${msgCountRef.current++}`,
      formatCurrentTime(),
    );
    setPersonaId(id);
    setMessages((prev) => (hasConversation ? [...prev, greeting] : [greeting]));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleMicRecording = () => {
    if (!isRecording) {
      setRecordingSeconds(0);
      setIsRecording(true);
    } else {
      setIsRecording(false);
      setRecordingSeconds(0);
      // Simulate speech-to-text input
      const sampleVoicePrompts = [
        "Tadi malam terdengar gemuruh angin kencang di posko, saya merasa sangat takut dan dada berdebar.",
        "Aku kangen suasana rumah dan bermain bersama teman sekolah.",
        "Bagaimana cara menenangkan diri saat tiba-tiba merasa panik?",
      ];
      const randomPrompt =
        sampleVoicePrompts[
          Math.floor(Math.random() * sampleVoicePrompts.length)
        ];
      setInput(randomPrompt);
    }
  };

  const handleResetSession = () => {
    if (confirm("Mulai sesi percakapan pendampingan baru yang bersih?")) {
      setMessages([
        {
          id: `msg-reset-${msgCountRef.current++}`,
          role: "assistant",
          personaId,
          content: `Sesi baru telah dimulai.

${buildPersonaGreeting(persona)}`,
          timeStr: formatCurrentTime(),
          hasActionButtons: true,
        },
      ]);
      setBreathingActive(false);
    }
  };

  const toggleGroundingItem = (index: number) => {
    setGroundingChecked((prev) => {
      const copy = [...prev];
      copy[index] = !copy[index];
      return copy;
    });
  };

  const promptStarters = [
    {
      label: "Cemas suara gemuruh",
      text: "Saya merasa cemas jika mendengar suara keras seperti gemuruh angin di posko.",
    },
    {
      label: "Rindu rumah & sekolah",
      text: "Saya sangat kangen rumah dan teman sekolah di tenda pengungsian.",
    },
    {
      label: "Pandu Grounding 5-4-3-2-1",
      text: "Tolong pandu saya melakukan teknik grounding 5-4-3-2-1 untuk meredakan panik.",
    },
    {
      label:
        culture === "kalimantan"
          ? "Petuah Handep Borneo"
          : "Petuah Meuseuraya Aceh",
      text:
        culture === "kalimantan"
          ? "Ceritakan kearifan Handep dan Rumah Betang tentang saling menguatkan di masa sulit."
          : "Ceritakan petuah Meuseuraya Aceh tentang saling menguatkan di masa sulit.",
    },
  ];

  return (
    <div className="w-full bg-canvas text-[#191c1e] antialiased selection:bg-action selection:text-white min-h-screen-safe flex flex-col justify-between">
      {/* MAIN CONTENT */}
      <main className="w-full bg-canvas min-h-[calc(100dvh-20rem)] py-5 sm:py-8">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-12 flex flex-col gap-5 sm:gap-8 pb-8 sm:pb-12">
          {/* Section 1: Header, Breadcrumbs & Security Badges */}
          <AnimatedSection index={0}>
            <div className="flex flex-col gap-3 sm:gap-4">
              <nav className="flex flex-wrap items-center gap-1.5 sm:gap-2 font-label-sm text-label-sm text-[#414844]">
                <Link
                  className="hover:text-[#012d1d] transition-colors flex items-center gap-1"
                  href="/"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    home
                  </span>
                  <span>Beranda</span>
                </Link>
                <span className="material-symbols-outlined text-[14px] text-[#c1c8c2]">
                  chevron_right
                </span>
                <Link
                  className="hover:text-[#012d1d] transition-colors"
                  href="/#programs"
                >
                  Modul Resiliensi
                </Link>
                <span className="material-symbols-outlined text-[14px] text-[#c1c8c2]">
                  chevron_right
                </span>
                <span className="text-[#012d1d] font-semibold">
                  AI Mental Support Companion
                </span>
              </nav>

              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div className="flex flex-col max-w-2xl gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-1 rounded-full bg-[#92f7c3] text-[#005235] font-label-sm text-label-sm flex items-center gap-1.5 font-bold">
                      <span className="w-2 h-2 rounded-full bg-[#006c48] animate-pulse"></span>
                      <span>PFA Guided Protocol v2.4</span>
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-[#e6e8ea] text-[#414844] font-label-sm text-label-sm flex items-center gap-1 font-semibold">
                      <span className="material-symbols-outlined text-[14px]">
                        lock
                      </span>
                      <span>Enkripsi Anonim End-to-End</span>
                    </span>
                  </div>
                  <h1 className="font-headline-lg text-headline-lg text-[#012d1d] tracking-tight font-bold">
                    Teman Bicara &amp; Pendamping Resiliensi Jiwa
                  </h1>
                  <p className="font-body-md text-body-md text-[#414844] leading-relaxed">
                    Ruang dengar aman berbasis empati dan Psychological First
                    Aid (PFA) anak. Mengintegrasikan kearifan lokal{" "}
                    <span className="font-semibold text-[#012d1d]">
                      Meuseuraya
                    </span>{" "}
                    (gotong-royong pemulihan jiwa) dan{" "}
                    <span className="font-semibold text-[#012d1d]">
                      Mambangkik Batang Tarandam
                    </span>{" "}
                    (resiliensi bangkit dari kesulitan).
                  </p>
                </div>
              </div>
            </div>
          </AnimatedSection>

          {/* Section 1b: Persona Picker */}
          <AnimatedSection index={1}>
            <div className="bg-white rounded-xl shadow-sm border border-line p-4 sm:p-5 md:p-6 flex flex-col gap-3 sm:gap-4">
              <div className="flex flex-col gap-1">
                <h2 className="font-headline-sm text-headline-sm text-fg-brand font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-fg-brand text-[22px]">
                    diamond
                  </span>
                  Pilih Teman Bicaramu
                </h2>
                <p className="font-body-sm text-body-sm text-[#414844] text-sm">
                  Setiap teman punya karakter dan gaya yang berbeda. Pilih yang
                  paling nyaman untukmu, kamu bisa berganti kapan saja.
                </p>
              </div>

              <div
                role="radiogroup"
                aria-label="Pilih persona chatbot"
                className="grid grid-cols-2 xl:grid-cols-4 gap-2.5 sm:gap-3"
              >
                {AI_PERSONAS.map((p) => {
                  const active = p.id === personaId;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      disabled={loading}
                      onClick={() => handleSelectPersona(p.id)}
                      className={`text-left p-3 sm:p-4 rounded-xl border-2 transition-all flex flex-col sm:flex-row items-start gap-2 sm:gap-3 min-h-14 disabled:opacity-60 ${
                        active
                          ? "shadow-sm"
                          : "border-slate-100 bg-[#f7f9fb] hover:bg-white hover:shadow-sm"
                      }`}
                      style={
                        active
                          ? { borderColor: p.accent, backgroundColor: p.soft }
                          : undefined
                      }
                    >
                      <PersonaAvatar persona={p} size={48} className="sm:w-16 sm:h-16" />
                      <span className="flex flex-col gap-0.5 min-w-0">
                        <span
                          className="font-headline-sm text-sm sm:text-base font-bold flex items-center gap-1"
                          style={{ color: active ? p.softText : "#012d1d" }}
                        >
                          <span className="truncate">{p.name}</span>
                          {active && (
                            <span className="material-symbols-outlined text-[16px] sm:text-[18px] shrink-0">
                              check_circle
                            </span>
                          )}
                        </span>
                        <span className="text-[11px] sm:text-xs font-semibold text-[#414844] line-clamp-2">
                          {p.tagline}
                        </span>
                        <span className="hidden sm:inline text-xs text-[#414844]/80 italic">
                          “{p.slogan}”
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>

              <details className="sm:hidden rounded-xl overflow-hidden" style={{ backgroundColor: persona.soft, color: persona.softText }}>
                <summary className="min-h-11 px-4 py-2.5 text-sm font-semibold cursor-pointer flex items-center justify-between gap-2">
                  <span>Tentang {persona.name}: {persona.tagline}</span>
                  <span className="material-symbols-outlined text-[18px]">expand_more</span>
                </summary>
                <div className="px-4 pb-4 pt-1 flex flex-col gap-2.5">
                  <p className="text-sm leading-relaxed">{persona.persona}</p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {persona.traits.map((trait) => (
                      <span
                        key={trait}
                        className="px-2.5 py-1 rounded-full bg-white/75 text-xs font-semibold"
                      >
                        {trait}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs opacity-90">
                    <strong>{persona.name}</strong> terinspirasi dari{" "}
                    {persona.gem.toLowerCase()}: {persona.meaning} {persona.fit}
                  </p>
                </div>
              </details>

              <div
                className="hidden sm:flex rounded-xl p-4 flex-col sm:flex-row items-center gap-4"
                style={{
                  backgroundColor: persona.soft,
                  color: persona.softText,
                }}
              >
                <Image
                  src={persona.mascot}
                  alt={`Maskot ${persona.name}`}
                  width={160}
                  height={160}
                  className="w-32 h-32 object-contain shrink-0"
                />
                <div className="flex flex-col gap-2.5">
                  <p className="text-sm leading-relaxed">{persona.persona}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    {persona.traits.map((trait) => (
                      <span
                        key={trait}
                        className="px-2.5 py-1 rounded-full bg-white/70 text-xs font-semibold"
                      >
                        {trait}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs opacity-80">
                    <strong>{persona.name}</strong> terinspirasi dari{" "}
                    {persona.gem.toLowerCase()}: {persona.meaning} {persona.fit}
                  </p>
                </div>
              </div>
            </div>
          </AnimatedSection>

          {/* Section 2: Main Two-Column Interactive Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* COLUMN 1: Interaktif Chat Workspace (Col-span-8) */}
            <section className="lg:col-span-8 flex flex-col gap-4">
              <AnimatedSection index={2}>
                <div
                  ref={chatCardRef}
                  style={
                    mobileChatHeight
                      ? { height: `${mobileChatHeight}px` }
                      : undefined
                  }
                  className="bg-white rounded-xl shadow-sm border border-line flex flex-col overflow-hidden h-[calc(100dvh-10.5rem)] min-h-[460px] lg:h-auto lg:min-h-0"
                >
                  {/* Workspace Header & Cultural Selector */}
                  <div className="bg-[#f2f4f6]/80 px-3.5 sm:px-6 py-3 sm:py-4 flex flex-wrap items-center justify-between gap-2.5 sm:gap-4 border-b border-line shrink-0">
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <PersonaAvatar persona={persona} size={40} className="sm:w-11 sm:h-11" />
                        <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-action ring-2 ring-white"></span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                          <span className="font-headline-sm text-base sm:text-headline-sm text-fg-brand font-bold truncate">
                            {persona.name}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-tint text-fg-brand font-label-sm text-xs font-semibold shrink-0">
                            Ramah Anak
                          </span>
                        </div>
                        <span className="font-label-sm text-xs text-[#414844] truncate">
                          {persona.slogan}
                        </span>
                      </div>
                    </div>

                    {/* Cultural Modality Switcher & Reset */}
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                      <span className="font-label-sm text-label-sm text-[#414844] hidden sm:inline">
                        Sentuhan:
                      </span>
                      <div className="inline-flex p-1 rounded-xl bg-[#eceef0] gap-1 flex-1 sm:flex-initial">
                        <button
                          type="button"
                          onClick={() => setCulture("aceh")}
                          className={`flex-1 sm:flex-initial min-h-11 sm:min-h-9 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                            culture === "aceh"
                              ? "bg-white text-fg-brand shadow-sm"
                              : "text-[#414844] hover:text-fg"
                          }`}
                        >
                          <span className="w-2 h-2 rounded-full bg-[#006c48] shrink-0"></span>
                          <span className="truncate">Aceh</span>
                          <span className="hidden sm:inline">(Meuseuraya)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setCulture("kalimantan")}
                          className={`flex-1 sm:flex-initial min-h-11 sm:min-h-9 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                            culture === "kalimantan"
                              ? "bg-white text-fg-brand shadow-sm font-semibold"
                              : "text-[#414844] hover:text-fg"
                          }`}
                        >
                          <span className="w-2 h-2 rounded-full bg-[#a62b1f] shrink-0"></span>
                          <span className="truncate">Kalimantan</span>
                          <span className="hidden sm:inline">(Dayak)</span>
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={handleResetSession}
                        aria-label="Bersihkan Percakapan dan Mulai Sesi Baru"
                        className="min-w-11 min-h-11 rounded-xl bg-[#eceef0] hover:bg-[#e6e8ea] text-[#414844] hover:text-fg flex items-center justify-center transition-colors shrink-0"
                        title="Bersihkan Percakapan & Mulai Sesi Baru"
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          restart_alt
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Safe Space Psychological Affirmation Banner */}
                  <div className="px-3.5 sm:px-6 py-2 bg-tint flex items-center justify-between gap-3 text-fg-brand font-label-sm text-xs border-b border-line shrink-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="material-symbols-outlined text-fg-brand text-[18px] shrink-0">
                        spa
                      </span>
                      <span className="leading-snug">
                        Tempat ini adalah ruang amanmu. Apapun yang kamu
                        rasakan, perasaanmu valid, nyata, dan kamu berharga.
                      </span>
                    </div>
                    <span className="hidden md:inline font-semibold text-fg-brand shrink-0">
                      Protokol PFA Anak
                    </span>
                  </div>

                  {/* Conversation Stream Area */}
                  <div
                    ref={streamRef}
                    className="flex-1 min-h-0 p-3.5 sm:p-6 md:p-8 flex flex-col gap-4 sm:gap-6 overflow-y-auto lg:max-h-[640px] bg-canvas lg:min-h-[380px]"
                  >
                    {/* Context Date Indicator */}
                    <div className="flex items-center justify-center">
                      <span className="px-3 py-1 rounded-full bg-[#e6e8ea] text-[#414844] font-label-sm text-label-sm font-medium">
                        Hari ini • Pendampingan Resiliensi Sesi #
                        {messages.length}
                      </span>
                    </div>

                    {/* Message Bubbles */}
                    {messages.map((msg) => {
                      if (msg.role === "crisis") {
                        return (
                          <div
                            key={msg.id}
                            className="p-5 rounded-xl bg-[#ffdad6] text-[#93000a] flex flex-col gap-3 max-w-2xl border border-red-200"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2 font-bold text-sm">
                                <span className="material-symbols-outlined text-[20px] shrink-0">
                                  emergency
                                </span>
                                <span>
                                  Kamu Tidak Sendirian — Bantuan Siaga
                                  Menemanimu
                                </span>
                              </div>
                              <span className="px-2 py-0.5 rounded-full bg-[#93000a] text-white text-[11px] font-bold shrink-0">
                                24 Jam Bebas Pulsa
                              </span>
                            </div>
                            <p className="text-sm leading-relaxed">
                              {msg.content}
                            </p>
                            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2.5 pt-2 border-t border-red-300">
                              <a
                                href="tel:119"
                                className="min-h-11 px-4 py-2 rounded-xl bg-[#ba1a1a] text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-1.5 shadow-sm hover:opacity-90"
                              >
                                <span className="material-symbols-outlined text-[16px]">
                                  call
                                </span>
                                <span>Panggil SafeConnect 119</span>
                              </a>
                              <Link
                                href="/tele-screening"
                                className="min-h-11 px-4 py-2 rounded-xl bg-white text-[#93000a] text-xs sm:text-sm font-semibold hover:bg-red-50 border border-red-200 inline-flex items-center justify-center"
                              >
                                Skrining Triase DASS-21
                              </Link>
                            </div>
                          </div>
                        );
                      }

                      if (msg.role === "rejected") {
                        return (
                          <div
                            key={msg.id}
                            role="alert"
                            className="p-4 rounded-xl bg-amber-50 text-amber-950 flex items-start gap-3 max-w-2xl border border-amber-300 animate-fade-in"
                          >
                            <span className="material-symbols-outlined text-amber-700 text-[20px] shrink-0 mt-0.5">
                              info
                            </span>
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-xs uppercase tracking-wide text-amber-900">
                                  Di Luar Topik Pemulihan
                                </span>
                                <span className="text-[11px] text-amber-700">
                                  {msg.timeStr}
                                </span>
                              </div>
                              <p className="text-sm leading-relaxed">
                                {msg.content}
                              </p>
                            </div>
                          </div>
                        );
                      }

                      if (msg.role === "assistant") {
                        const msgPersona = getPersona(
                          msg.personaId ?? personaId,
                        );
                        return (
                          <div
                            key={msg.id}
                            className="flex items-start gap-2.5 sm:gap-3.5 max-w-2xl animate-fade-in min-w-0"
                          >
                            <PersonaAvatar
                              persona={msgPersona}
                              size={36}
                              className="mt-1 sm:w-11 sm:h-11"
                            />
                            <div className="flex flex-col gap-1.5 sm:gap-2 flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-headline-sm text-sm text-fg-brand font-semibold">
                                  {msgPersona.name}
                                </span>
                                <span className="px-2 py-0.5 rounded-full bg-tint text-fg-brand font-label-sm text-xs font-medium">
                                  {culture === "kalimantan"
                                    ? "Resonansi Kalimantan"
                                    : "Resonansi Aceh"}
                                </span>
                                <span className="font-label-sm text-label-sm text-[#414844]">
                                  {msg.timeStr}
                                </span>
                              </div>

                              <div className="bg-white p-3.5 sm:p-5 rounded-xl rounded-tl-sm shadow-sm text-[#191c1e] text-sm sm:text-base flex flex-col gap-3 sm:gap-3.5 border border-line break-words">
                                <RichText text={msg.content} />

                                {/* Cultural Wisdom Card Callout */}
                                {msg.culturalWisdom && (
                                  <div className="p-3 sm:p-3.5 rounded-lg bg-[#f2f4f6] flex items-start gap-2.5 sm:gap-3 border-l-3 border-action">
                                    <span className="material-symbols-outlined text-[#f48c24] text-[20px] sm:text-[22px] shrink-0 mt-0.5">
                                      auto_awesome
                                    </span>
                                    <div className="flex flex-col gap-1 min-w-0">
                                      <span className="font-headline-sm text-sm text-fg-brand font-bold">
                                        {msg.culturalWisdom.title}
                                      </span>
                                      <p className="italic text-xs text-fg font-medium">
                                        {msg.culturalWisdom.quote}
                                      </p>
                                      <p className="font-body-sm text-body-sm text-[#414844] text-xs">
                                        {msg.culturalWisdom.meaning}
                                      </p>
                                    </div>
                                  </div>
                                )}

                                {/* Action Buttons inside Bubble */}
                                {msg.hasActionButtons && (
                                  <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 pt-1">
                                    <button
                                      type="button"
                                      onClick={() => setBreathingActive(true)}
                                      className="inline-flex items-center justify-center gap-2 min-h-11 px-4 py-2 rounded-xl bg-action text-white font-label-md font-semibold hover:bg-action-hover shadow-sm transition-transform active:scale-95 text-xs sm:text-sm"
                                    >
                                      <span className="material-symbols-outlined text-[18px]">
                                        air
                                      </span>
                                      <span>Mulai Panduan Napas 2 Menit</span>
                                    </button>
                                    <Link
                                      href="/journal"
                                      className="inline-flex items-center justify-center gap-2 min-h-11 px-4 py-2 rounded-xl bg-tint text-fg-brand font-label-md font-semibold hover:opacity-90 transition-colors text-xs sm:text-sm"
                                    >
                                      <span className="material-symbols-outlined text-[18px]">
                                        edit_note
                                      </span>
                                      <span>
                                        Catat ke Jurnal Hikmah (+50 XP)
                                      </span>
                                    </Link>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      }

                      // User Message
                      return (
                        <div
                          key={msg.id}
                          className="flex items-start justify-end gap-3.5 max-w-2xl ml-auto animate-fade-in"
                        >
                          <div className="flex flex-col items-end gap-1.5">
                            <div className="flex items-center gap-2">
                              <span className="font-label-sm text-label-sm text-[#414844]">
                                {msg.timeStr}
                              </span>
                              <span className="font-headline-sm text-sm text-[#012d1d] font-semibold">
                                Kamu
                              </span>
                            </div>
                            <div className="bg-[#012d1d] text-white p-4 rounded-xl rounded-tr-sm shadow-sm font-body-md text-body-md max-w-xl">
                              <p className="whitespace-pre-line leading-relaxed">
                                {msg.content}
                              </p>
                            </div>
                            <span className="font-label-sm text-label-sm text-[#006c48] flex items-center gap-1 font-semibold">
                              <span className="material-symbols-outlined text-[14px]">
                                done_all
                              </span>
                              <span>Diterima secara aman</span>
                            </span>
                          </div>
                          <div className="w-9 h-9 rounded-full bg-[#92f7c3] text-[#005235] flex items-center justify-center shrink-0 mt-1 font-bold text-sm">
                            KM
                          </div>
                        </div>
                      );
                    })}

                    {/* AI Typing Indicator */}
                    {loading && (
                      <div className="flex items-center gap-3 max-w-xl animate-fade-in">
                        <PersonaAvatar persona={persona} size={44} />
                        <div className="bg-white px-4 py-3 rounded-xl rounded-tl-sm shadow-sm flex items-center gap-2 border border-slate-100">
                          <span className="w-2 h-2 rounded-full bg-[#006c48] animate-bounce"></span>
                          <span
                            className="w-2 h-2 rounded-full bg-[#006c48] animate-bounce"
                            style={{ animationDelay: "0.2s" }}
                          ></span>
                          <span
                            className="w-2 h-2 rounded-full bg-[#006c48] animate-bounce"
                            style={{ animationDelay: "0.4s" }}
                          ></span>
                          <span className="font-label-sm text-label-sm text-[#414844] ml-1">
                            {persona.name} sedang merangkai kata empati...
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Dynamic Interactive Breathing Visualizer Container */}
                    {breathingActive && (
                      <div className="max-w-xl mx-auto w-full p-4 rounded-xl bg-[#92f7c3]/40 border border-[#006c48]/30 flex items-center justify-between gap-4 animate-fade-in">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#006c48] text-white flex items-center justify-center animate-pulse shrink-0">
                            <span className="material-symbols-outlined text-[20px]">
                              self_improvement
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="font-headline-sm text-sm text-[#012d1d] font-bold">
                              {breathingPhases[breathPhaseIndex]}
                            </span>
                            <span className="font-body-sm text-body-sm text-[#414844] text-xs">
                              Ikuti ritme lingkaran untuk relaksasi detak
                              jantung
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setBreathingActive(false)}
                          aria-label="Tutup Panduan Napas"
                          className="text-[#414844] hover:text-[#012d1d] min-w-11 min-h-11 inline-flex items-center justify-center rounded-lg hover:bg-black/5 shrink-0"
                          title="Tutup Panduan Napas"
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            close
                          </span>
                        </button>
                      </div>
                    )}

                    {/* Crisis Safety Guardrail Banner */}
                    <div className="p-3.5 rounded-xl bg-[#ffdad6]/90 text-[#93000a] flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-red-200">
                      <div className="flex items-start sm:items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-[#ba1a1a] text-white flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                          <span className="material-symbols-outlined text-[18px]">
                            favorite
                          </span>
                        </div>
                        <p className="font-body-sm text-body-sm text-xs sm:text-sm leading-relaxed">
                          Jika kamu merasa sangat kewalahan, sedih mendalam,
                          atau butuh teman bicara manusia langsung, konselor
                          psikologis anak di <strong>SafeConnect 119</strong>{" "}
                          siap mendengarkanmu tanpa biaya.
                        </p>
                      </div>
                      <a
                        className="w-full sm:w-auto min-h-11 px-4 py-2 rounded-lg bg-[#ba1a1a] text-white font-label-md font-semibold inline-flex items-center justify-center shrink-0 hover:opacity-90 text-xs sm:text-sm shadow-sm"
                        href="tel:119"
                      >
                        Panggil 119
                      </a>
                    </div>
                  </div>

                  {/* Quick Suggestion Action Pills (Prompt Starters) */}
                  <div className="px-3.5 sm:px-6 py-2 bg-white flex items-center gap-2 overflow-x-auto border-t border-line no-scrollbar shrink-0">
                    <span className="font-label-sm text-label-sm text-[#414844] shrink-0 flex items-center gap-1 font-semibold">
                      <span className="material-symbols-outlined text-[14px]">
                        tips_and_updates
                      </span>
                      <span>Pemantik:</span>
                    </span>
                    {promptStarters.map((starter, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSendMessage(starter.text)}
                        className="shrink-0 min-h-11 sm:min-h-9 px-3.5 py-1.5 rounded-full bg-[#eceef0] text-[#414844] hover:bg-tint hover:text-fg-brand transition-colors font-label-sm text-xs font-medium"
                      >
                        {starter.label}
                      </button>
                    ))}
                  </div>

                  {/* Chat Input Area */}
                  <div className="p-3 sm:p-4 md:p-6 bg-[#f2f4f6] flex flex-col gap-2 border-t border-line shrink-0">
                    {isRecording && (
                      <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-[#ffdad6] text-[#93000a] text-xs font-semibold animate-pulse">
                        <span className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-red-600 shrink-0"></span>
                          Merekam Suara (0:
                          {recordingSeconds < 10
                            ? `0${recordingSeconds}`
                            : recordingSeconds}
                          )... Klik mic lagi untuk selesai.
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsRecording(false)}
                          className="underline min-h-11 px-2"
                        >
                          Batal
                        </button>
                      </div>
                    )}

                    <div className="relative flex items-center gap-2 sm:gap-3">
                      <button
                        type="button"
                        onClick={toggleMicRecording}
                        aria-label={
                          isRecording
                            ? "Berhenti Merekam"
                            : "Gunakan Catatan Suara"
                        }
                        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-all ${
                          isRecording
                            ? "bg-[#ba1a1a] text-white animate-pulse"
                            : "bg-white text-[#414844] hover:text-fg-brand"
                        }`}
                        title={
                          isRecording
                            ? "Berhenti Merekam"
                            : "Gunakan Catatan Suara (Voice Note)"
                        }
                      >
                        <span className="material-symbols-outlined text-[22px]">
                          mic
                        </span>
                      </button>

                      <div className="relative flex-1 min-w-0">
                        <input
                          type="text"
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          onKeyDown={handleKeyDown}
                          onFocus={() => {
                            if (window.innerWidth < 1024) {
                              chatCardRef.current?.scrollIntoView({
                                behavior: "smooth",
                                block: "nearest",
                              });
                            }
                          }}
                          disabled={loading}
                          placeholder={`Tulis pesan untuk ${persona.name}...`}
                          className="w-full h-12 pl-3.5 sm:pl-4 pr-11 rounded-xl bg-white text-[#191c1e] text-base font-body-md placeholder:text-[#414844]/60 shadow-sm focus:outline-none focus:ring-2 focus:ring-action/50 border border-slate-200"
                        />
                        <button
                          type="button"
                          aria-label="Sisipkan simbol emosi tenang"
                          onClick={() =>
                            setInput((prev) =>
                              prev
                                ? `${prev} 🌿`
                                : "Saya merasa butuh menenangkan diri 🌿",
                            )
                          }
                          className="absolute right-0.5 top-1/2 -translate-y-1/2 w-11 h-11 inline-flex items-center justify-center text-[#414844] hover:text-fg-brand rounded-lg"
                          title="Simbol Emosi Alami"
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            spa
                          </span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSendMessage()}
                        disabled={loading || !input.trim()}
                        aria-label="Kirim Pesan"
                        className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-transform active:scale-95 group ${
                          input.trim() && !loading
                            ? "bg-action hover:bg-action-hover text-white"
                            : "bg-[#eceef0] text-[#717973] cursor-not-allowed"
                        }`}
                        title="Kirim Pesan"
                      >
                        <span className="material-symbols-outlined text-[22px] group-hover:translate-x-0.5 transition-transform">
                          send
                        </span>
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center justify-between text-xs text-[#414844] px-1 pt-1 gap-2">
                      <span className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[14px] text-[#006c48]">
                          shield
                        </span>
                        <span>
                          Pesanmu diproses secara privat tanpa mencatat nama
                          asli atau lokasi GPS posko.
                        </span>
                      </span>
                      <span>
                        Bukan pengganti diagnosis dokter psikiatri atau medis
                        krisis.
                      </span>
                    </div>
                  </div>
                </div>
              </AnimatedSection>

              {/* Supportive Micro Cards Below Chat */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <AnimatedSection index={2} className="h-full">
                  <div className="h-full p-4 rounded-xl bg-white shadow-sm border border-slate-100 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#c1ecd4] text-[#274e3d] flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[18px]">
                        verified
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-headline-sm text-sm text-[#012d1d] font-semibold">
                        Validasi Emosi
                      </span>
                      <span className="font-body-sm text-xs text-[#414844]">
                        Takut, sedih, dan marah adalah emosi yang sah setelah
                        peristiwa genting.
                      </span>
                    </div>
                  </div>
                </AnimatedSection>

                <AnimatedSection index={3} className="h-full">
                  <div className="h-full p-4 rounded-xl bg-white shadow-sm border border-slate-100 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#92f7c3] text-[#005235] flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[18px]">
                        group
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-headline-sm text-sm text-[#012d1d] font-semibold">
                        Meuseuraya Jiwa
                      </span>
                      <span className="font-body-sm text-xs text-[#414844]">
                        Beban hati berkurang saat dipikul bersama komunitas yang
                        peduli.
                      </span>
                    </div>
                  </div>
                </AnimatedSection>

                <AnimatedSection index={4} className="h-full">
                  <div className="h-full p-4 rounded-xl bg-white shadow-sm border border-slate-100 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#ffdcc3] text-[#2f1500] flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[18px]">
                        emoji_objects
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-headline-sm text-sm text-[#012d1d] font-semibold">
                        Tumbuh Melenting
                      </span>
                      <span className="font-body-sm text-xs text-[#414844]">
                        Setiap percakapan membantu membentuk kembali fondasi
                        ketangguhanmu.
                      </span>
                    </div>
                  </div>
                </AnimatedSection>
              </div>
            </section>

            {/* COLUMN 2: Sidebar Panel Pendamping & Keselamatan (Col-span-4) */}
            <aside className="lg:col-span-4 flex flex-col gap-6">
              {/* Widget 1: Radar Emosi Sesi */}
              <AnimatedSection index={2}>
                <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#006c48] text-[22px]">
                        sentiment_neutral
                      </span>
                      <h2 className="font-headline-sm text-headline-sm text-[#012d1d] font-semibold">
                        Radar Emosi Sesi
                      </h2>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-[#92f7c3] text-[#005235] font-label-sm text-xs font-bold">
                      Real-Time
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-[#f2f4f6] flex flex-col gap-3">
                    <div className="flex justify-between items-center text-sm font-label-sm">
                      <span className="text-[#414844]">
                        Emosi Teridentifikasi:
                      </span>
                      <span className="font-bold text-[#012d1d]">
                        {detectedEmotion.label}
                      </span>
                    </div>

                    {/* Visual Segmented Bar */}
                    <div className="w-full h-3 rounded-full bg-[#e6e8ea] overflow-hidden flex">
                      <div
                        className="h-full bg-[#006c48] transition-all duration-500 rounded-l-full"
                        style={{ width: `${detectedEmotion.stablePercent}%` }}
                      ></div>
                      <div
                        className="h-full bg-[#ffb77d] transition-all duration-500 rounded-r-full"
                        style={{ width: `${detectedEmotion.alertPercent}%` }}
                      ></div>
                    </div>

                    <div className="flex justify-between items-center text-xs text-[#414844]">
                      <span>Stabil ({detectedEmotion.stablePercent}%)</span>
                      <span className="text-[#012d1d] font-semibold">
                        Waspada Trauma ({detectedEmotion.alertPercent}%)
                      </span>
                    </div>
                  </div>

                  {/* Resilience Points Earned in Session */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#c1ecd4]/40 border border-[#c1ecd4]/60">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#1b4332] text-white flex items-center justify-center">
                        <span className="material-symbols-outlined text-[16px]">
                          military_tech
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-label-sm text-label-sm font-bold text-[#012d1d]">
                          +{detectedEmotion.resiliencePoints} Poin Resiliensi
                        </span>
                        <span className="text-[11px] text-[#414844]">
                          Didapatkan dari keterbukaan cerita
                        </span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-[#006c48] text-[20px]">
                      trending_up
                    </span>
                  </div>
                </div>
              </AnimatedSection>

              {/* Widget 2: Grounding 5-4-3-2-1 Guide */}
              <AnimatedSection index={3}>
                <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#006c48] text-[22px]">
                        nature_people
                      </span>
                      <h2 className="font-headline-sm text-headline-sm text-[#012d1d] font-semibold">
                        Teknik Grounding 5-4-3-2-1
                      </h2>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-[#eceef0] text-[#414844] font-label-sm text-xs font-semibold">
                      Pereda Panik
                    </span>
                  </div>

                  <p className="font-body-sm text-body-sm text-[#414844] text-xs">
                    Saat rasa takut datang mendadak di posko, kembalikan
                    kesadaranmu pada saat ini:
                  </p>

                  <div className="flex flex-col gap-2">
                    {[
                      {
                        count: 5,
                        label: "Lihat",
                        target: "5 benda di sekitarmu",
                      },
                      {
                        count: 4,
                        label: "Raba",
                        target: "4 tekstur benda di dekatmu",
                      },
                      {
                        count: 3,
                        label: "Dengar",
                        target: "3 suara di sekelilingmu",
                      },
                      {
                        count: 2,
                        label: "Hirup",
                        target: "2 aroma udara segar",
                      },
                      {
                        count: 1,
                        label: "Rasakan",
                        target: "1 tarikan napas dalam",
                      },
                    ].map((step, idx) => {
                      const isDone = groundingChecked[idx];
                      return (
                        <button
                          key={step.count}
                          type="button"
                          aria-pressed={isDone}
                          onClick={() => toggleGroundingItem(idx)}
                          className={`w-full text-left min-h-11 p-2.5 rounded-lg flex items-center justify-between gap-3 cursor-pointer transition-all border ${
                            isDone
                              ? "bg-tint border-action text-fg-brand"
                              : "bg-[#f2f4f6] border-transparent text-[#191c1e] hover:bg-[#eceef0]"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span
                              className={`w-6 h-6 rounded-full font-label-sm text-xs flex items-center justify-center font-bold shrink-0 ${
                                isDone
                                  ? "bg-action text-white"
                                  : "bg-emphasis text-white"
                              }`}
                            >
                              {step.count}
                            </span>
                            <span className="font-body-sm text-body-sm text-xs">
                              {step.label} <strong>{step.target}</strong>
                            </span>
                          </div>
                          <span
                            className={`material-symbols-outlined text-[18px] shrink-0 ${
                              isDone ? "text-fg-brand" : "text-slate-400"
                            }`}
                          >
                            {isDone ? "check_circle" : "radio_button_unchecked"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </AnimatedSection>

              {/* Widget 3: Petuah Kearifan Nusantara Card */}
              <AnimatedSection index={4}>
                <div className="bg-gradient-to-br from-white to-[#f2f4f6] rounded-xl p-5 shadow-sm border border-slate-100 flex flex-col gap-3 relative overflow-hidden">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#f48c24] text-[20px]">
                      auto_stories
                    </span>
                    <span className="font-headline-sm text-headline-sm text-[#012d1d] font-semibold">
                      Mutiara Hikmah Nusantara
                    </span>
                  </div>

                  <blockquote className="italic font-body-md text-body-md text-[#191c1e] pl-3 border-l-2 border-[#1b4332] my-1 text-sm leading-relaxed">
                    {culture === "kalimantan"
                      ? "“Bapakat kita bagawi, bapasang kita basanding; teguh laksana ulin di rimba.”"
                      : "“Udep sare mate syahid, beusajan lam geunaseh. Badai brat ka lheueh ta lewati, singoh langet teuh glah.”"}
                  </blockquote>

                  <div className="flex flex-col text-xs text-[#414844]">
                    <span className="font-bold text-[#012d1d]">
                      {culture === "kalimantan"
                        ? "Pepatah Handep Dayak Kalimantan"
                        : "Pepatah Meuseuraya Aceh"}
                    </span>
                    <span>
                      {culture === "kalimantan"
                        ? "Artinya: Gotong royong di Rumah Betang menyatukan kekuatan; bersama kita kokoh menghadapi masa pascabencana seperti ulin."
                        : "Artinya: Kebersamaan adalah penyembuh terbesar; sesudah badai lebat, fajar harapan akan selalu merekah."}
                    </span>
                  </div>
                </div>
              </AnimatedSection>

              {/* Widget 4: Pohon Harapan (Hope Tree Mini Progress) */}
              <AnimatedSection index={5}>
                <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#006c48] text-[22px]">
                        park
                      </span>
                      <h2 className="font-headline-sm text-headline-sm text-[#012d1d] font-semibold">
                        Pohon Harapanmu
                      </h2>
                    </div>
                    <span className="font-label-sm text-xs text-[#006c48] font-bold">
                      {activeTreeStats.levelName}
                    </span>
                  </div>

                  <div className="relative h-28 rounded-xl bg-[#f2f4f6] overflow-hidden flex items-center justify-center border border-slate-100">
                    <svg
                      className="w-20 h-20 text-[#006c48] transition-transform duration-500 hover:scale-105"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M12 2L6 9H9V14H6L12 21L18 14H15V9H18L12 2Z"
                        opacity="0.85"
                      ></path>
                      <circle cx="12" cy="7" fill="#f48c24" r="1.5"></circle>
                      <circle cx="9.5" cy="11" fill="#92f7c3" r="1.5"></circle>
                      <circle cx="14.5" cy="11" fill="#ffdcc3" r="1.5"></circle>
                    </svg>
                    <div className="absolute bottom-2 text-[11px] font-label-sm text-[#414844] bg-white/80 px-2.5 py-0.5 rounded-full border border-slate-200 backdrop-blur-xs font-semibold">
                      {activeTreeStats.totalXp} XP • {activeTreeStats.stageName}
                    </div>
                  </div>

                  <p className="text-xs text-[#414844] leading-relaxed">
                    Setiap cerita yang kamu bagikan memberikan nutrisi untuk
                    memekarkan ranting baru di pohon resiliensimu.
                  </p>
                  <Link
                    href="/journal"
                    className="text-xs font-semibold text-[#006c48] hover:underline flex items-center gap-1"
                  >
                    <span>Buka Pohon Harapan</span>
                    <span className="material-symbols-outlined text-[14px]">
                      arrow_forward
                    </span>
                  </Link>
                </div>
              </AnimatedSection>

              {/* Widget 5: Darurat Siaga SafeConnect 119 Card */}
              <AnimatedSection index={6}>
                <div className="bg-[#ffdad6] rounded-xl p-5 shadow-sm border border-red-200 flex flex-col gap-3">
                  <div className="flex items-center gap-2.5 text-[#93000a]">
                    <div className="w-8 h-8 rounded-full bg-[#ba1a1a] text-white flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[18px]">
                        support_agent
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-headline-sm text-sm font-bold text-[#93000a]">
                        SafeConnect 119
                      </span>
                      <span className="text-xs text-[#93000a]/80">
                        Siaga PFA 24 Jam • Bebas Pulsa
                      </span>
                    </div>
                  </div>
                  <p className="font-body-sm text-xs text-[#93000a]/90 leading-relaxed">
                    Jika kamu, adik, atau teman di posko membutuhkan pertolongan
                    psikologis darurat atau evakuasi medis krisis:
                  </p>
                  <a
                    className="w-full min-h-11 py-2.5 rounded-xl bg-[#ba1a1a] text-white font-label-md text-label-md font-semibold flex items-center justify-center gap-2 hover:opacity-95 shadow-sm transition-opacity text-sm"
                    href="tel:119"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      call
                    </span>
                    <span>Hubungi SafeConnect 119</span>
                  </a>
                </div>
              </AnimatedSection>
            </aside>
          </div>
        </div>
      </main>

      {/* FOOTER: Matching landing page & design file */}
      <footer className="w-full bg-[#f2f4f6] border-t border-[#c1c8c2]/30 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-10">
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
                    className="hover:text-[#012d1d] transition-colors"
                  >
                    Skrining Mandiri DASS-21 Adaptif
                  </Link>
                </li>
                <li>
                  <Link
                    href="/ai-companion"
                    className="hover:text-[#012d1d] transition-colors font-medium text-[#006c48]"
                  >
                    AI Mental Support Companion
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
