"use client";
import { useEffect, useRef } from "react";
import type { QuakeBridge } from "@/game/quakeBridge";

export default function QuakeScene({
  bridge,
  onError,
}: {
  bridge: QuakeBridge;
  onError: (message: string) => void;
}) {
  const parent = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let disposed = false;
    let game: import("phaser").Game | null = null;
    const observer = new ResizeObserver(() => {
      if (game && parent.current)
        game.scale.resize(
          parent.current.clientWidth,
          parent.current.clientHeight,
        );
    });
    void (async () => {
      try {
        const [{ default: Phaser }, { default: config }] = await Promise.all([
          import("phaser"),
          import("@/game/config"),
        ]);
        if (disposed || !parent.current) return;
        game = new Phaser.Game(config(parent.current, bridge));
        observer.observe(parent.current);
      } catch {
        if (!disposed)
          onError(
            "Arena belum berhasil dimuat. Periksa koneksi, lalu coba lagi.",
          );
      }
    })();
    return () => {
      disposed = true;
      observer.disconnect();
      bridge.inputRef.current.enabled = false;
      bridge.stateRef.current = null;
      game?.destroy(true);
    };
  }, [bridge, onError]);
  return <div ref={parent} className="absolute inset-0" />;
}
