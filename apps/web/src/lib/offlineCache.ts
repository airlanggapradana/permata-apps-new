import {
  EMERGENCY_NUMBERS,
  GROUNDING_STEPS,
  PFA_PRINCIPLES,
  PHYSICAL_GUIDES,
  PSYCHOLOGICAL_SCENARIOS,
} from "@/data/offlineSurvivalData";

export const SURVIVAL_CACHE_NAME = "permata-survival-v1";
export const SURVIVAL_META_STORAGE_KEY = "permata_offline_meta_v1";
export const SURVIVAL_GOBAG_STORAGE_KEY = "permata_offline_gobag_v1";
export const SURVIVAL_CARD_STORAGE_KEY = "permata_offline_safety_card_v1";

export interface OfflineSyncMeta {
  lastSyncedAt: string;
  cachedUrlsCount: number;
}

export interface LocalSafetyCard {
  ownerName: string;
  meetingPoint: string;
  guardianContact: string;
  medicalNotes: string;
  updatedAt: string;
}

export const EMPTY_SAFETY_CARD: LocalSafetyCard = {
  ownerName: "",
  meetingPoint: "",
  guardianContact: "",
  medicalNotes: "",
  updatedAt: "",
};

export function collectRuntimeAssetUrls(): string[] {
  if (typeof window === "undefined") return [];
  const origin = window.location.origin;
  const collected = new Set<string>([
    "/offline-survival",
    "/",
    "/dashboard",
    "/manifest.webmanifest",
    "/permata-logo.webp",
    "/permata.png",
    "/tokens.css",
    "/Breathing.html",
    "/game-breath",
    "/PickAndDrop.html",
    "/SiagaMinang.html",
    "/game-siagaminang",
  ]);

  document.querySelectorAll("link[href], script[src]").forEach((el) => {
    const raw =
      el.getAttribute("href") || el.getAttribute("src") || "";
    if (!raw) return;
    try {
      const parsed = new URL(raw, origin);
      if (parsed.origin === origin && parsed.pathname.startsWith("/")) {
        collected.add(parsed.pathname);
      }
    } catch {
      // Ignore malformed URLs
    }
  });

  if (typeof performance !== "undefined" && performance.getEntriesByType) {
    const entries = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
    for (const entry of entries) {
      try {
        const parsed = new URL(entry.name);
        if (
          parsed.origin === origin &&
          (parsed.pathname.startsWith("/_next/static/") ||
            parsed.pathname.endsWith(".css") ||
            parsed.pathname.endsWith(".js"))
        ) {
          collected.add(parsed.pathname);
        }
      } catch {
        // Ignore malformed entries
      }
    }
  }

  return Array.from(collected);
}

export async function registerSurvivalServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }
  try {
    return await navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
  } catch {
    return null;
  }
}

export async function syncOfflineSurvivalBundle(): Promise<OfflineSyncMeta> {
  if (typeof window === "undefined") {
    throw new Error("Penyimpanan offline hanya tersedia di peramban.");
  }

  const urls = collectRuntimeAssetUrls();
  let cachedUrlsCount = 0;

  // Try asking active Service Worker first
  if ("serviceWorker" in navigator) {
    const reg = await registerSurvivalServiceWorker();
    const worker = reg?.active || navigator.serviceWorker.controller;
    if (worker) {
      const swResult = await new Promise<{ ok: boolean; cachedCount?: number; error?: string }>(
        (resolve) => {
          const channel = new MessageChannel();
          const timer = window.setTimeout(() => {
            resolve({ ok: false, error: "timeout" });
          }, 8000);

          channel.port1.onmessage = (event) => {
            window.clearTimeout(timer);
            resolve(event.data || { ok: false });
          };

          worker.postMessage(
            { type: "CACHE_SURVIVAL_BUNDLE", urls },
            [channel.port2]
          );
        }
      );

      if (swResult.ok && typeof swResult.cachedCount === "number") {
        cachedUrlsCount = swResult.cachedCount;
      }
    }
  }

  // Fallback / direct Cache API write so caching works immediately on first visit
  if (cachedUrlsCount === 0 && "caches" in window) {
    const cache = await caches.open(SURVIVAL_CACHE_NAME);
    const results = await Promise.allSettled(
      urls.map(async (url) => {
        const res = await fetch(url, { cache: "no-cache" });
        if (res.ok) {
          await cache.put(url, res.clone());
        }
      })
    );
    cachedUrlsCount = results.filter((r) => r.status === "fulfilled").length;
  }

  if (cachedUrlsCount === 0) {
    throw new Error(
      "Peramban tidak mendukung Cache API atau sedang offline saat mengunduh paket baru."
    );
  }

  const meta: OfflineSyncMeta = {
    lastSyncedAt: new Date().toISOString(),
    cachedUrlsCount,
  };

  try {
    localStorage.setItem(SURVIVAL_META_STORAGE_KEY, JSON.stringify(meta));
  } catch {
    // Ignore storage quota errors
  }

  return meta;
}

export function readOfflineMeta(): OfflineSyncMeta | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SURVIVAL_META_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<OfflineSyncMeta>;
    if (typeof parsed.lastSyncedAt === "string" && typeof parsed.cachedUrlsCount === "number") {
      return {
        lastSyncedAt: parsed.lastSyncedAt,
        cachedUrlsCount: parsed.cachedUrlsCount,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function readGoBagChecked(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(SURVIVAL_GOBAG_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

export function writeGoBagChecked(state: Record<string, boolean>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SURVIVAL_GOBAG_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors
  }
}

export function readLocalSafetyCard(): LocalSafetyCard {
  if (typeof window === "undefined") return EMPTY_SAFETY_CARD;
  try {
    const raw = localStorage.getItem(SURVIVAL_CARD_STORAGE_KEY);
    if (!raw) return EMPTY_SAFETY_CARD;
    const parsed = JSON.parse(raw) as Partial<LocalSafetyCard>;
    return {
      ownerName: typeof parsed.ownerName === "string" ? parsed.ownerName : "",
      meetingPoint: typeof parsed.meetingPoint === "string" ? parsed.meetingPoint : "",
      guardianContact: typeof parsed.guardianContact === "string" ? parsed.guardianContact : "",
      medicalNotes: typeof parsed.medicalNotes === "string" ? parsed.medicalNotes : "",
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : "",
    };
  } catch {
    return EMPTY_SAFETY_CARD;
  }
}

export function writeLocalSafetyCard(card: LocalSafetyCard): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SURVIVAL_CARD_STORAGE_KEY, JSON.stringify(card));
  } catch {
    // Ignore storage errors
  }
}

export function clearLocalSafetyCard(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(SURVIVAL_CARD_STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function buildStandaloneSurvivalHtml(card: LocalSafetyCard): string {
  const hasCard =
    card.ownerName.trim() ||
    card.meetingPoint.trim() ||
    card.guardianContact.trim() ||
    card.medicalNotes.trim();

  const cardBlock = hasCard
    ? `<section class="card">
        <h2>Kartu Keselamatan Keluarga (Data Lokal)</h2>
        <p><strong>Nama Anak / Pemilik:</strong> ${escapeHtml(card.ownerName || "-")}</p>
        <p><strong>Titik Kumpul Keluarga:</strong> ${escapeHtml(card.meetingPoint || "-")}</p>
        <p><strong>Kontak Wali / Orang Dewasa Tepercaya:</strong> ${escapeHtml(card.guardianContact || "-")}</p>
        <p><strong>Catatan Medis / Alergi:</strong> ${escapeHtml(card.medicalNotes || "-")}</p>
      </section>`
    : "";

  const physicalHtml = PHYSICAL_GUIDES.map(
    (g) => `<article class="card">
      <h3>${escapeHtml(g.title)}</h3>
      <p>${escapeHtml(g.summary)}</p>
      <h4>Langkah Segera</h4>
      <ol>${g.immediateSteps.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ol>
      <h4>Penanganan Awal</h4>
      <ul>${g.firstAidSteps.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ul>
      <h4>Hal yang Harus Dihindari</h4>
      <ul>${g.avoidList.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ul>
    </article>`
  ).join("");

  const pfaHtml = PFA_PRINCIPLES.map(
    (p) => `<article class="card">
      <h3>Langkah ${p.step}: ${escapeHtml(p.code)} (${escapeHtml(p.title)})</h3>
      <p>${escapeHtml(p.description)}</p>
      <ul>${p.practicalActions.map((a) => `<li>${escapeHtml(a)}</li>`).join("")}</ul>
    </article>`
  ).join("");

  const psychScenariosHtml = PSYCHOLOGICAL_SCENARIOS.map(
    (sc) => `<article class="card">
      <h3>${escapeHtml(sc.title)}</h3>
      <p>${escapeHtml(sc.situation)}</p>
      <h4>Untuk Diri Sendiri</h4>
      <ul>${sc.forSelf.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ul>
      <h4>Saat Mendampingi Anak atau Teman</h4>
      <ul>${sc.forChildOrPeer.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ul>
    </article>`
  ).join("");

  const groundingHtml = GROUNDING_STEPS.map(
    (step) =>
      `<li><strong>${step.count} ${escapeHtml(step.sense)}:</strong> ${escapeHtml(step.prompt)} (${escapeHtml(step.example)})</li>`
  ).join("");

  const emergencyHtml = EMERGENCY_NUMBERS.map(
    (n) =>
      `<li><strong>${escapeHtml(n.number)} (${escapeHtml(n.agency)}):</strong> ${escapeHtml(n.note)}</li>`
  ).join("");

  return `<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>PERMATA - Panduan Darurat Offline</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.55; color: #1C1917; background: #F7FAF8; margin: 0; padding: 24px; }
    main { max-width: 820px; margin: 0 auto; }
    h1 { font-size: 24px; margin-bottom: 6px; color: #1B4332; }
    h2 { font-size: 20px; margin-top: 28px; color: #1B4332; border-bottom: 1px solid #D6D3D1; padding-bottom: 6px; }
    h3 { font-size: 17px; margin: 0 0 8px; }
    h4 { font-size: 14px; margin: 12px 0 6px; color: #22563F; }
    p, li { font-size: 14px; color: #44403C; }
    .card { background: #FFFFFF; border: 1px solid #E7E5E4; border-radius: 12px; padding: 16px 20px; margin-bottom: 14px; }
    .meta { font-size: 12px; color: #57534E; margin-bottom: 18px; }
  </style>
</head>
<body>
  <main>
    <h1>PERMATA Nusantara: Panduan Darurat Offline</h1>
    <p class="meta">Dokumen ini dapat dibuka tanpa koneksi internet dan tanpa login. Diunduh pada ${escapeHtml(new Date().toLocaleString("id-ID"))}.</p>
    ${cardBlock}
    <h2>1. Nomor Darurat Resmi Indonesia</h2>
    <div class="card">
      <p>Panggilan telepon tetap bergantung pada sinyal seluler setempat. Jika jaringan terputus, segera cari posko terdekat atau orang dewasa tepercaya.</p>
      <ul>${emergencyHtml}</ul>
    </div>
    <h2>2. Keselamatan Fisik &amp; Penanganan Awal</h2>
    ${physicalHtml}
    <h2>3. Pertolongan Pertama Psikologis (PFA)</h2>
    ${pfaHtml}
    <h2>4. Teknik Grounding 5-4-3-2-1</h2>
    <div class="card"><ol>${groundingHtml}</ol></div>
    <h2>5. Penanganan Reaksi Stres Akut</h2>
    ${psychScenariosHtml}
  </main>
</body>
</html>`;
}
