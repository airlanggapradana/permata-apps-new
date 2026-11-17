"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import Navbar from "./Navbar";
import PageTransitionOverlay, {
  type TransitionKind,
  type TransitionPhase,
} from "./PageTransitionOverlay";
import { PageMotionProvider } from "./PageMotion";

import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import Journal from "./pages/Journal";
import AiCompanion from "./pages/AiCompanion";
import MoodFoodAnalyzer from "./pages/MoodFoodAnalyzer";
import TeleScreening from "./pages/TeleScreening";
import RoleplayPsy from "./pages/RoleplayPsy";
import GameAdventure from "./pages/GameAdventure";
import GameBreathing from "./pages/GameBreathing";
import GameHealing from "./pages/GameHealing";
import GameSiagaMinang from "./pages/GameSiagaMinang";
import OfflineSurvival from "./pages/OfflineSurvival";
import OfflineRuntime from "./OfflineRuntime";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import SafetyPassportPage from "./pages/SafetyPassportPage";

const GameQuake = dynamic(() => import("./pages/GameQuake"), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center min-h-screen bg-canvas text-fg text-base">
      Memuat Simulasi Sigap Bencana…
    </div>
  ),
});

const KNOWN_ROUTES = new Set([
  "/",
  "/dashboard",
  "/jurnal",
  "/journal",
  "/ai-companion",
  "/mood-food",
  "/tele-screening",
  "/roleplay",
  "/game-adventure",
  "/game-breath",
  "/game-healing",
  "/game-siagaminang",
  "/game-quake",
  "/offline-survival",
  "/login",
  "/register",
  "/safety-passport",
]);

const INITIAL_MIN_MS = 2200; // splash awal minimal tampil (logo + teks selesai masuk)
const INITIAL_MAX_MS = 4500; // batas tunggu preload gambar hero saat awal buka
const INITIAL_EXIT_MS = 1000; // durasi memudar splash awal

const ROUTE_ENTER_MS = 280; // durasi overlay menutup layar sebelum halaman diganti
const ROUTE_HOLD_MS = 920; // waktu animasi logo + huruf PERMATA selesai saat ganti halaman
const ROUTE_EXIT_MS = 700; // durasi overlay memudar membuka halaman baru

function normalizePath(path: string): string {
  const clean = path.split("?")[0].split("#")[0];
  if (clean.length > 1 && clean.endsWith("/")) {
    return clean.slice(0, -1);
  }
  return clean || "/";
}

export default function ThemedContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const nextPathname = usePathname();
  const initialPath = normalizePath(nextPathname ?? "/");

  const [displayedPath, setDisplayedPath] = useState<string>(initialPath);
  const [pendingHash, setPendingHash] = useState<string | null>(null);
  const [transitionPhase, setTransitionPhase] =
    useState<TransitionPhase>("covered");
  const [transitionKind, setTransitionKind] =
    useState<TransitionKind>("initial");
  const [transitionId, setTransitionId] = useState<number>(0);

  const targetPathRef = useRef<string>(initialPath);
  const initialPathRef = useRef<string>(initialPath);
  const timersRef = useRef<number[]>([]);
  const cancelInitialRef = useRef<(() => void) | null>(null);
  const prevOverflowRef = useRef<string | null>(null);
  const heroReadyRef = useRef<boolean>(false);
  const heroReadyResolversRef = useRef<(() => void)[]>([]);

  const handleHeroReady = useCallback(() => {
    heroReadyRef.current = true;
    heroReadyResolversRef.current.forEach((resolve) => resolve());
    heroReadyResolversRef.current = [];
  }, []);

  const clearTransitionTimers = useCallback(() => {
    if (cancelInitialRef.current) {
      cancelInitialRef.current();
      cancelInitialRef.current = null;
    }
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  }, []);

  const startPageTransition = useCallback(
    (dest: string, hash: string) => {
      clearTransitionTimers();
      targetPathRef.current = dest;

      if (
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        setDisplayedPath(dest);
        setPendingHash(hash || null);
        setTransitionPhase("idle");
        if (!hash) {
          window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
        }
        return;
      }

      setTransitionKind("route");
      setTransitionId((id) => id + 1);
      setTransitionPhase("entering");

      const tCover = window.setTimeout(() => {
        setDisplayedPath(dest);
        setPendingHash(hash || null);
        setTransitionPhase("covered");
        if (!hash) {
          window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
        }

        const tExit = window.setTimeout(() => {
          setTransitionPhase("exiting");

          const tDone = window.setTimeout(() => {
            setTransitionPhase("idle");
          }, ROUTE_EXIT_MS);
          timersRef.current.push(tDone);
        }, ROUTE_HOLD_MS);
        timersRef.current.push(tExit);
      }, ROUTE_ENTER_MS);

      timersRef.current.push(tCover);
    },
    [clearTransitionTimers]
  );

  // Kunci scroll body hanya saat layar tertutup curtain transisi
  useEffect(() => {
    if (transitionPhase === "entering" || transitionPhase === "covered") {
      if (prevOverflowRef.current === null) {
        prevOverflowRef.current = document.body.style.overflow;
      }
      document.body.style.overflow = "hidden";
    } else if (prevOverflowRef.current !== null) {
      document.body.style.overflow = prevOverflowRef.current;
      prevOverflowRef.current = null;
    }
  }, [transitionPhase]);

  useEffect(() => {
    return () => {
      clearTransitionTimers();
      if (prevOverflowRef.current !== null) {
        document.body.style.overflow = prevOverflowRef.current;
        prevOverflowRef.current = null;
      }
    };
  }, [clearTransitionTimers]);

  // Splash awal saat website pertama kali dibuka
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const frameId = requestAnimationFrame(() => setTransitionPhase("idle"));
      return () => cancelAnimationFrame(frameId);
    }

    let cancelled = false;
    const localTimers: number[] = [];
    cancelInitialRef.current = () => {
      cancelled = true;
      localTimers.forEach((id) => window.clearTimeout(id));
    };

    const minShown = new Promise<void>((resolve) => {
      localTimers.push(window.setTimeout(resolve, INITIAL_MIN_MS));
    });

    const heroReady =
      initialPathRef.current === "/"
        ? new Promise<void>((resolve) => {
            if (heroReadyRef.current) {
              resolve();
              return;
            }
            heroReadyResolversRef.current.push(resolve);
            localTimers.push(window.setTimeout(resolve, INITIAL_MAX_MS));
          })
        : Promise.resolve();

    Promise.all([minShown, heroReady]).then(() => {
      if (cancelled) return;
      setTransitionPhase("exiting");
      const doneTimer = window.setTimeout(() => {
        if (cancelled) return;
        setTransitionPhase("idle");
      }, INITIAL_EXIT_MS);
      timersRef.current.push(doneTimer);
    });

    return () => {
      cancelled = true;
      localTimers.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  // Tangani navigasi programatik Next.js (mis. router.push setelah login/register)
  useEffect(() => {
    if (!nextPathname) return;
    const dest = normalizePath(nextPathname);
    if (dest === targetPathRef.current) return;
    const frameId = requestAnimationFrame(() => {
      startPageTransition(dest, window.location.hash);
    });
    return () => cancelAnimationFrame(frameId);
  }, [nextPathname, startPageTransition]);

  // Tangani tombol Back / Forward browser
  useEffect(() => {
    const onPopState = () => {
      const dest = normalizePath(window.location.pathname);
      if (dest !== targetPathRef.current) {
        startPageTransition(dest, window.location.hash);
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [startPageTransition]);

  const handleClickCapture = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }

      const target = e.target as HTMLElement | null;
      const anchor = target?.closest("a");
      if (!anchor) return;

      if (
        (anchor.target && anchor.target !== "_self") ||
        anchor.hasAttribute("download")
      ) {
        return;
      }

      const href = anchor.getAttribute("href");
      if (!href || !href.startsWith("/")) return;

      const url = new URL(href, window.location.origin);
      const dest = normalizePath(url.pathname);
      if (!KNOWN_ROUTES.has(dest)) return;

      const hash = url.hash;
      const samePage = dest === targetPathRef.current;

      // Anchor di halaman yang sama: biarkan browser/Next yang scroll.
      if (samePage && hash) return;

      e.preventDefault();
      e.stopPropagation();

      const fullUrl = url.pathname + url.search + hash;
      if (!samePage) {
        window.history.pushState(null, "", fullUrl);
        startPageTransition(dest, hash);
      } else {
        if (url.search !== window.location.search) {
          window.history.pushState(null, "", fullUrl);
        }
        window.scrollTo({
          top: 0,
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "auto"
            : "smooth",
        });
      }
    },
    [startPageTransition]
  );

  useEffect(() => {
    if (!pendingHash) return;
    const id = pendingHash.slice(1);
    const frame = requestAnimationFrame(() => {
      document
        .getElementById(id)
        ?.scrollIntoView({ behavior: "instant" as ScrollBehavior });
      setPendingHash(null);
    });
    return () => cancelAnimationFrame(frame);
  }, [pendingHash, displayedPath]);

  const renderPage = () => {
    switch (displayedPath) {
      case "/":
        return (
          <LandingPage
            transitionPhase={transitionPhase}
            onHeroReady={handleHeroReady}
          />
        );
      case "/dashboard":
        return <Dashboard transitionPhase={transitionPhase} />;
      case "/jurnal":
      case "/journal":
        return <Journal />;
      case "/ai-companion":
        return <AiCompanion />;
      case "/mood-food":
        return <MoodFoodAnalyzer />;
      case "/tele-screening":
        return <TeleScreening />;
      case "/roleplay":
        return <RoleplayPsy />;
      case "/game-adventure":
        return <GameAdventure />;
      case "/game-breath":
        return <GameBreathing />;
      case "/game-healing":
        return <GameHealing />;
      case "/game-siagaminang":
        return <GameSiagaMinang />;
      case "/game-quake":
        return <GameQuake />;
      case "/offline-survival":
        return <OfflineSurvival />;
      case "/login":
        return <LoginPage />;
      case "/register":
        return <RegisterPage />;
      case "/safety-passport":
        return <SafetyPassportPage />;
      default:
        return children;
    }
  };

  return (
    <div
      onClickCapture={handleClickCapture}
      className="min-h-screen bg-canvas text-fg font-sans selection:bg-action selection:text-white"
    >
      <PageTransitionOverlay
        phase={transitionPhase}
        kind={transitionKind}
        transitionId={transitionId}
      />
      <Navbar currentPath={displayedPath} />
      <OfflineRuntime currentPath={displayedPath} />
      <PageMotionProvider transitionPhase={transitionPhase}>
        {renderPage()}
      </PageMotionProvider>
    </div>
  );
}
