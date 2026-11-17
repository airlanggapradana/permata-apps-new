"use client";

import { useEffect, useRef, type RefObject } from "react";
import {
  createMinangState,
  stepMinang,
  getMinangSnapshot,
  MINANG_WORLD_WIDTH,
  MINANG_HEIGHT,
  MINANG_SPEED,
  MINANG_PICKUPS,
  MINANG_GROUND_Y,
  MINANG_CHECKPOINTS,
  MINANG_PLATFORMS,
  type MinangState,
  type MinangInput,
  type MinangSnapshot,
  type MinangEvent,
} from "@/lib/games/siagaMinang";
import { ClassicPainter, rounded, type MinangPose } from "./minangPainter";
import {
  drawMinangBackdrop,
  drawMinangPalm,
  drawMinangPlatform,
} from "./minangScenery";

type Spark = { x: number; y: number; vx: number; vy: number; life: number };

function paint(
  ctx: CanvasRenderingContext2D,
  state: MinangState,
  viewWidth: number,
  viewHeight: number,
  cameraX: number,
  offsetY: number,
  reducedMotion: boolean,
  sparks: Spark[],
  visual: { x: number; y: number; pose: MinangPose },
) {
  const time = reducedMotion ? 0 : state.elapsedMs / 1000;
  const frame = time * 60;
  drawMinangBackdrop(
    ctx,
    viewWidth,
    viewHeight,
    reducedMotion ? 0 : cameraX,
    time,
  );
  ctx.save();
  ctx.translate(0, offsetY);
  for (const worldX of [700, 1420, 2230, 2730, 3540, 4130]) {
    const x = worldX - cameraX;
    if (x > -100 && x < viewWidth + 100)
      drawMinangPalm(ctx, x, MINANG_GROUND_Y, time, worldX % 3 ? 1 : 0.85);
  }
  for (const platform of MINANG_PLATFORMS) {
    const x = platform.x - cameraX;
    if (x + platform.width < 0 || x > viewWidth) continue;
    drawMinangPlatform(
      ctx,
      x,
      platform.y,
      platform.width,
      Math.max(platform.height, viewHeight - platform.y - offsetY),
      platform.kind === "wood",
    );
  }
  for (const checkpoint of MINANG_CHECKPOINTS) {
    const x = checkpoint.x - cameraX;
    if (x < -60 || x > viewWidth + 80) continue;
    const visited = state.checkpoints.includes(checkpoint.id);
    rounded(ctx, x - 5, MINANG_GROUND_Y - 2, 10, 5, 2, "#4c6346");
    ctx.strokeStyle = "#cbb57b";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x, MINANG_GROUND_Y);
    ctx.lineTo(x, MINANG_GROUND_Y - 115);
    ctx.stroke();
    const flutter = Math.sin(time * 3 + x * 0.01) * 3;
    ctx.fillStyle = visited ? "#dfb965" : "#bb4d4a";
    ctx.beginPath();
    ctx.moveTo(x + 2, MINANG_GROUND_Y - 111);
    ctx.bezierCurveTo(
      x + 18,
      MINANG_GROUND_Y - 117 + flutter,
      x + 29,
      MINANG_GROUND_Y - 102,
      x + 47,
      MINANG_GROUND_Y - 109 + flutter,
    );
    ctx.lineTo(x + 43, MINANG_GROUND_Y - 82 + flutter);
    ctx.quadraticCurveTo(
      x + 22,
      MINANG_GROUND_Y - 77,
      x + 2,
      MINANG_GROUND_Y - 85,
    );
    ctx.closePath();
    ctx.fill();
    rounded(ctx, x - 31, MINANG_GROUND_Y - 151, 70, 26, 13, "#1b4143ed");
    ctx.fillStyle = visited ? "#ffe2a0" : "#fff6dc";
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(
      checkpoint.name + (visited ? " ✓" : ""),
      x + 4,
      MINANG_GROUND_Y - 134,
    );
  }
  ClassicPainter.drawRumahGadang(
    ctx,
    MINANG_WORLD_WIDTH - 250 - cameraX,
    MINANG_GROUND_Y - 80,
    1,
    true,
  );
  for (const pickup of MINANG_PICKUPS) {
    if (state.collectedPickups.includes(pickup.id)) continue;
    const x = pickup.x - cameraX;
    if (x < -50 || x > viewWidth + 50) continue;
    ClassicPainter.drawSupply(
      ctx,
      x,
      pickup.y,
      pickup.type === "first-aid" ? "kit" : pickup.type,
      frame,
    );
  }
  const surface = MINANG_PLATFORMS.find(
    (platform) =>
      visual.x >= platform.x &&
      visual.x <= platform.x + platform.width &&
      platform.y >= visual.y + 46,
  );
  if (surface) {
    const altitude = Math.max(0, surface.y - visual.y - 48);
    ctx.fillStyle = "#173e3426";
    ctx.beginPath();
    ctx.ellipse(
      visual.x - cameraX,
      surface.y + 3,
      Math.max(6, 18 - altitude * 0.045),
      3.5,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  ctx.save();
  ctx.translate(visual.x - cameraX, visual.y + 48);
  ctx.scale(0.82, 0.82);
  ClassicPainter.drawHero(ctx, 0, 0, visual.pose);
  ctx.restore();
  if (!reducedMotion)
    for (const spark of sparks) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, spark.life / 0.55);
      ctx.fillStyle = "#FFD700";
      ctx.beginPath();
      ctx.arc(spark.x - cameraX, spark.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  ctx.restore();
}

export default function MinangScene({
  inputRef,
  gameRef,
  reducedMotion,
  onUpdate,
  onEvent,
  onFinish,
}: {
  inputRef: RefObject<MinangInput>;
  gameRef: RefObject<MinangState | null>;
  reducedMotion: boolean;
  onUpdate: (snapshot: MinangSnapshot) => void;
  onEvent: (event: MinangEvent) => void;
  onFinish: (snapshot: MinangSnapshot) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reducedRef = useRef(reducedMotion);
  useEffect(() => {
    reducedRef.current = reducedMotion;
  }, [reducedMotion]);
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const state = createMinangState();
    gameRef.current = state;
    let animation = 0,
      lastTime = 0,
      accumulator = 0,
      lastUpdate = -Infinity;
    let cameraX = 0,
      viewport = 1000,
      previousX = state.x;
    let physicsX = state.x,
      physicsY = state.y;
    const visual = {
      x: state.x,
      y: state.y,
      pose: {
        gait: 0,
        run: 0,
        air: 0,
        lean: 0,
        landing: 0,
        facing: 1,
        time: 0,
      } as MinangPose,
    };
    let viewHeight = 600,
      offsetY = 0;
    let sparks: Spark[] = [];
    const resize = () => {
      const width = canvas.parentElement?.clientWidth ?? 1000;
      const height = canvas.parentElement?.clientHeight || 600;
      viewport = Math.min(1000, Math.max(480, width));
      const scale = width / viewport,
        dpr = Math.min(2, window.devicePixelRatio || 1);
      viewHeight = height / scale;
      offsetY =
        viewHeight -
        MINANG_HEIGHT -
        (window.matchMedia("(pointer: coarse)").matches ? 80 : 24) / scale;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.height = `${height}px`;
      context.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas.parentElement ?? canvas);
    const frame = (now: number) => {
      const elapsed = Math.min(
        0.1,
        Math.max(0, (now - (lastTime || now)) / 1000),
      );
      lastTime = now;
      if (inputRef.current.enabled && !state.won) {
        accumulator += elapsed;
        while (accumulator >= 1 / 60) {
          physicsX = state.x;
          physicsY = state.y;
          const wasGrounded = state.onGround,
            fallSpeed = state.vy;
          const events = stepMinang(state, inputRef.current);
          if (!wasGrounded && state.onGround && !reducedRef.current)
            visual.pose.landing = Math.min(1, Math.max(0, fallSpeed) / 650);
          for (const event of events)
            if (event.type === "item" && !reducedRef.current) {
              for (let i = 0; i < 12; i++)
                sparks.push({
                  x: event.x ?? state.x,
                  y: event.y ?? state.y,
                  vx: Math.cos((i * Math.PI) / 6) * 90,
                  vy: Math.sin((i * Math.PI) / 6) * 90 - 70,
                  life: 0.55,
                });
            }
          events.forEach(onEvent);
          accumulator -= 1 / 60;
          if (state.won) {
            inputRef.current.enabled = false;
            onUpdate(getMinangSnapshot(state));
            onFinish(getMinangSnapshot(state));
            break;
          }
        }
      } else {
        accumulator = 0;
        state.jumpHeld = false;
        state.jumpBuffer = 0;
        physicsX = state.x;
        physicsY = state.y;
      }
      // Interpolate between fixed physics ticks, including on 90/120/144 Hz screens.
      // Teleports snap immediately rather than sweeping across the level.
      const teleported = Math.abs(state.x - previousX) > 100;
      if (teleported) {
        physicsX = state.x;
        physicsY = state.y;
      }
      const alpha = inputRef.current.enabled ? accumulator * 60 : 1;
      const renderedX = physicsX + (state.x - physicsX) * alpha;
      const renderedY = physicsY + (state.y - physicsY) * alpha;
      if (inputRef.current.enabled) {
        const blend = 1 - Math.exp(-elapsed / 0.085);
        const travel = teleported ? 0 : Math.abs(renderedX - visual.x);
        visual.pose.gait += travel * 0.115;
        visual.pose.run +=
          (Math.min(1, Math.abs(state.vx) / MINANG_SPEED) - visual.pose.run) *
          blend;
        visual.pose.air += ((state.onGround ? 0 : 1) - visual.pose.air) * blend;
        visual.pose.lean +=
          (state.vx / MINANG_SPEED - visual.pose.lean) * blend;
        visual.pose.facing +=
          (state.facing - visual.pose.facing) *
          (1 - Math.exp(-elapsed / 0.045));
        visual.pose.landing *= Math.exp(-elapsed / 0.07);
        visual.pose.time = state.elapsedMs / 1000;
      }
      visual.x = renderedX;
      visual.y = renderedY;
      if (reducedRef.current)
        Object.assign(visual.pose, {
          gait: 0,
          run: 0,
          air: 0,
          lean: 0,
          landing: 0,
          facing: state.facing,
          time: 0,
        });
      const target = Math.max(
        0,
        Math.min(MINANG_WORLD_WIDTH - viewport, visual.x - viewport * 0.32),
      );
      if (inputRef.current.enabled) {
        for (const spark of sparks) {
          spark.x += spark.vx * elapsed;
          spark.y += spark.vy * elapsed;
          spark.vy += 280 * elapsed;
          spark.life -= elapsed;
        }
        sparks = sparks.filter((spark) => spark.life > 0).slice(-100);
      }
      if (reducedRef.current || Math.abs(state.x - previousX) > 100)
        cameraX = target;
      else if (inputRef.current.enabled)
        cameraX += (target - cameraX) * (1 - Math.exp(-elapsed / 0.08));
      previousX = state.x;
      paint(
        context,
        state,
        viewport,
        viewHeight,
        cameraX,
        offsetY,
        reducedRef.current,
        sparks,
        visual,
      );
      canvas.dataset.visualX = visual.x.toFixed(3);
      canvas.dataset.visualY = visual.y.toFixed(3);
      canvas.dataset.playerX = state.x.toFixed(2);
      canvas.dataset.playerY = state.y.toFixed(2);
      canvas.dataset.grounded = String(state.onGround);
      if (
        now - lastUpdate >= 100 &&
        (inputRef.current.enabled || lastUpdate === -Infinity)
      ) {
        onUpdate(getMinangSnapshot(state));
        lastUpdate = now;
      }
      animation = requestAnimationFrame(frame);
    };
    animation = requestAnimationFrame(frame);
    canvas.focus({ preventScroll: true });
    return () => {
      cancelAnimationFrame(animation);
      observer.disconnect();
      gameRef.current = null;
    };
  }, [inputRef, gameRef, onUpdate, onEvent, onFinish]);
  return (
    <canvas
      ref={canvasRef}
      tabIndex={0}
      aria-label="Area permainan Siaga Minang. Gunakan panah kiri kanan atau A D untuk berjalan dan Spasi, panah atas, atau W untuk melompat."
      className="block h-full w-full focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-[#ecd298]"
    />
  );
}
