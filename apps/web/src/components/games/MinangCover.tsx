"use client";

import { useEffect, useRef } from "react";
import { ClassicPainter } from "./minangPainter";
import {
  drawMinangBackdrop,
  drawMinangPalm,
  drawMinangPlatform,
} from "./minangScenery";

export default function MinangCover() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const draw = () => {
      const width = canvas.clientWidth,
        height = canvas.clientHeight;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      // Use one composition at every aspect ratio, cropping its quiet edges.
      const scale = Math.max(width / 600, height / 260);
      ctx.setTransform(
        scale * dpr,
        0,
        0,
        scale * dpr,
        ((width - 600 * scale) * dpr) / 2,
        0,
      );
      drawMinangBackdrop(ctx, 600, 260, 0, 0);
      drawMinangPalm(ctx, 58, 222, 0, 0.85);
      ClassicPainter.drawRumahGadang(ctx, 439, 165, 0.68);
      drawMinangPlatform(ctx, -100, 222, 800, 100, false);
      ctx.save();
      ctx.translate(200, 222);
      ctx.scale(1.4, 1.4);
      ClassicPainter.drawHero(ctx, 0, 0, {
        gait: 0.5,
        run: 0.12,
        air: 0,
        lean: 0,
        landing: 0,
        facing: 1,
        time: 0,
      });
      ctx.restore();
      ClassicPainter.drawSupply(ctx, 287, 197, "water", 0);
    };
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);
  return (
    <canvas
      ref={ref}
      role="img"
      aria-label="Petualang berkostum merah hitam emas di depan Rumah Gadang dan perbukitan Minangkabau"
      className="block h-full w-full"
    />
  );
}
