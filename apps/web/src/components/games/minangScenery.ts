import { rounded } from "./minangPainter";

export function drawMinangBackdrop(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  camera: number,
  time: number,
) {
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, "#64b9dc");
  sky.addColorStop(0.55, "#b2e1dd");
  sky.addColorStop(1, "#e0edce");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);
  const sunX = width * 0.78,
    sunY = height * 0.25;
  const glow = ctx.createRadialGradient(sunX, sunY, 8, sunX, sunY, 130);
  glow.addColorStop(0, "#fff6cbb0");
  glow.addColorStop(1, "#fff6cb00");
  ctx.fillStyle = glow;
  ctx.fillRect(sunX - 130, sunY - 130, 260, 260);
  ctx.fillStyle = "#fff1be";
  ctx.beginPath();
  ctx.arc(sunX, sunY, 28, 0, Math.PI * 2);
  ctx.fill();
  // Closed cloud silhouettes avoid the joins of overlapping stroked circles.
  const cloudOffset = camera * 0.12 + time * 3;
  for (
    let i = Math.floor(cloudOffset / 235) - 1;
    i < Math.ceil((width + cloudOffset) / 235) + 1;
    i++
  ) {
    const x = i * 235 - cloudOffset;
    const y = height * (0.16 + ((i + 9) % 3) * 0.1);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(i % 2 ? 1 : 0.75, 0.7);
    ctx.fillStyle = "#ffffffb5";
    ctx.beginPath();
    ctx.moveTo(-45, 12);
    ctx.bezierCurveTo(-70, 9, -62, -18, -40, -16);
    ctx.bezierCurveTo(-35, -45, 3, -44, 12, -22);
    ctx.bezierCurveTo(37, -32, 57, -9, 47, 8);
    ctx.bezierCurveTo(25, 20, -24, 18, -45, 12);
    ctx.fill();
    ctx.restore();
  }
  // Mountain and rice-terrace layers move at different depths.
  const horizon = height * 0.68;
  for (let layer = 0; layer < 3; layer++) {
    const parallax = camera * [0.12, 0.22, 0.36][layer];
    const base = horizon + layer * 67;
    ctx.fillStyle = ["#7cb6b6", "#639e96", "#4e8c78"][layer];
    ctx.beginPath();
    ctx.moveTo(-80, height);
    for (let x = -80; x <= width + 80; x += 12) {
      const wave = Math.sin((x + parallax + layer * 251) * 0.004);
      const ridge = Math.cos((x + parallax) * 0.009 + layer) * 16;
      ctx.lineTo(x, base - (layer === 0 ? 115 : 48) * wave + ridge);
    }
    ctx.lineTo(width + 80, height);
    ctx.closePath();
    ctx.fill();
    if (layer === 2) {
      ctx.strokeStyle = "#b5cf8a45";
      ctx.lineWidth = 3;
      for (let terrace = 1; terrace <= 5; terrace++) {
        ctx.beginPath();
        for (let x = -20; x <= width + 20; x += 12) {
          const y =
            base +
            terrace * 17 -
            Math.sin((x + parallax + layer * 251) * 0.004) * 48 +
            Math.cos((x + parallax) * 0.009 + layer) * 16;
          if (x === -20) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    }
  }
  // A few distant birds use the same frozen clock as the rest of the scenery.
  ctx.strokeStyle = "#3b6e784f";
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 3; i++) {
    const x = width * 0.47 + i * 17 - camera * 0.03;
    const y = height * 0.34 + i * 7 + Math.sin(time * 2 + i) * 2;
    ctx.beginPath();
    ctx.moveTo(x - 5, y);
    ctx.quadraticCurveTo(x - 2, y - 4, x, y);
    ctx.quadraticCurveTo(x + 2, y - 4, x + 5, y);
    ctx.stroke();
  }
}

export function drawMinangPalm(
  ctx: CanvasRenderingContext2D,
  x: number,
  ground: number,
  time: number,
  size = 1,
) {
  ctx.save();
  ctx.translate(x, ground);
  ctx.scale(size, size);
  ctx.lineCap = "round";
  ctx.strokeStyle = "#7c6140";
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(8, -48, -3, -105);
  ctx.stroke();
  ctx.strokeStyle = "#bb9860";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-2, -2);
  ctx.quadraticCurveTo(6, -46, -5, -102);
  ctx.stroke();
  for (let i = 0; i < 6; i++) {
    const dir = i < 3 ? -1 : 1,
      angle = (i % 3) * 0.35 - 0.35;
    ctx.save();
    ctx.translate(-3, -105);
    ctx.rotate(angle + Math.sin(time * 1.3 + x) * 0.025);
    ctx.fillStyle = i % 2 ? "#3b7957" : "#4f9061";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(dir * 34, -28 + (i % 3) * 13, dir * 68, 18);
    ctx.quadraticCurveTo(dir * 29, -2, 0, 0);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

export function drawMinangPlatform(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  wood: boolean,
) {
  if (wood) {
    rounded(ctx, x + 3, y + 7, width - 6, 18, 5, "#2c45302e");
    rounded(ctx, x, y, width, 19, 5, "#a66f45");
    rounded(ctx, x, y, width, 6, 3, "#e1b677");
    ctx.strokeStyle = "#754e35";
    ctx.lineWidth = 1.5;
    for (let plank = 24; plank < width; plank += 27) {
      ctx.beginPath();
      ctx.moveTo(x + plank, y + 6);
      ctx.lineTo(x + plank, y + 18);
      ctx.stroke();
    }
    for (const end of [x + 9, x + width - 9])
      rounded(ctx, end, y + 9, 3, 3, 1.5, "#f2cd92");
    return;
  }
  const soil = ctx.createLinearGradient(0, y, 0, y + Math.min(height, 250));
  soil.addColorStop(0, "#aa7954");
  soil.addColorStop(0.25, "#916346");
  soil.addColorStop(1, "#684f40");
  ctx.fillStyle = soil;
  ctx.fillRect(x, y + 8, width, height);
  rounded(ctx, x, y, width, 16, [7, 7, 3, 3], "#528c56");
  rounded(ctx, x + 2, y, width - 4, 5, 2, "#a8cb78");
  // Restrict texture work to the visible strip, including when the world is long.
  const start = Math.max(12, Math.floor(-x / 38) * 38);
  const end = Math.min(width - 8, ctx.canvas.width + Math.max(0, -x));
  for (let px = start; px < end; px += 38) {
    const hash = Math.abs(Math.sin((px + width) * 7.1));
    rounded(ctx, x + px, y + 32 + hash * 21, 6 + hash * 6, 3, 1.5, "#d7a87770");
    rounded(ctx, x + px + 14, y + 86 + hash * 36, 5, 3, 1.5, "#4a3a3024");
    if (px % 76 === 12) {
      ctx.strokeStyle = "#d0dda0";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x + px, y + 2);
      ctx.quadraticCurveTo(x + px - 2, y - 6, x + px - 5, y - 7);
      ctx.moveTo(x + px, y + 2);
      ctx.lineTo(x + px + 3, y - 5);
      ctx.stroke();
    }
  }
}
