"use client";

import React, { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import Navbar from "./Navbar";

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
  const [clientPath, setClientPath] = useState<string | null>(null);
  const [pendingHash, setPendingHash] = useState<string | null>(null);

  useEffect(() => {
    if (nextPathname) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setClientPath(normalizePath(nextPathname));
    }
  }, [nextPathname]);

  useEffect(() => {
    const onPopState = () => {
      setClientPath(normalizePath(window.location.pathname));
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const currentPath = normalizePath(clientPath ?? nextPathname ?? "/");

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

      const dest = normalizePath(href);
      if (!KNOWN_ROUTES.has(dest)) return;

      const hashIndex = href.indexOf("#");
      const hash = hashIndex >= 0 ? href.slice(hashIndex) : "";
      const samePage = dest === normalizePath(window.location.pathname);

      // Anchor di halaman yang sama: biarkan browser/Next yang scroll.
      if (samePage && hash) return;

      e.preventDefault();
      e.stopPropagation();

      if (!samePage) {
        window.history.pushState(null, "", dest + hash);
      }
      setClientPath(dest);
      if (hash) {
        setPendingHash(hash);
      } else {
        window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
      }
    },
    []
  );

  useEffect(() => {
    if (!pendingHash) return;
    const id = pendingHash.slice(1);
    const frame = requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView();
      setPendingHash(null);
    });
    return () => cancelAnimationFrame(frame);
  }, [pendingHash, currentPath]);

  const renderPage = () => {
    switch (currentPath) {
      case "/":
        return <LandingPage />;
      case "/dashboard":
        return <Dashboard />;
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
      className="min-h-screen bg-[#F8FAF8] text-slate-800 font-sans selection:bg-brand-500 selection:text-white"
    >
      <Navbar currentPath={currentPath} />
      <OfflineRuntime currentPath={currentPath} />
      {renderPage()}
    </div>
  );
}
