"use client";

import React, { useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { WifiOff } from "lucide-react";
import { registerSurvivalServiceWorker } from "@/lib/offlineCache";

const subscribeOnlineStatus = (callback: () => void) => {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
};

export default function OfflineRuntime({
  currentPath,
}: {
  currentPath: string;
}) {
  const isOnline = useSyncExternalStore(
    subscribeOnlineStatus,
    () => navigator.onLine,
    () => true
  );

  useEffect(() => {
    registerSurvivalServiceWorker();
  }, []);

  if (isOnline || currentPath === "/offline-survival") {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-surface border-b border-line-strong border-l-4 border-l-warning px-4 sm:px-6 py-3"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <WifiOff
            size={20}
            strokeWidth={1.75}
            className="text-warning shrink-0 mt-0.5 sm:mt-0"
            aria-hidden="true"
          />
          <p className="text-sm text-fg">
            Perangkat sedang offline. Buka Mode Darurat Offline untuk mengakses panduan keselamatan fisik dan PFA tanpa internet atau login.
          </p>
        </div>
        <Link
          href="/offline-survival"
          className="inline-flex items-center justify-center min-h-11 px-4 rounded-md bg-action hover:bg-action-hover text-white text-sm font-medium transition-colors shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
        >
          Buka Siaga Offline
        </Link>
      </div>
    </div>
  );
}
