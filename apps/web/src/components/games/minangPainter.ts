// Vector artwork preserves the classic Minang costume at every screen density.
export type MinangPose = {
  gait: number;
  run: number;
  air: number;
  lean: number;
  landing: number;
  facing: number;
  time: number;
};

function oval(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
  color: string,
) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

export function rounded(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number | number[],
  color: string,
) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

export const ClassicPainter = {
  drawHero(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    pose: MinangPose,
  ) {
    const stride = Math.sin(pose.gait) * pose.run * (1 - pose.air);
    const bounce =
      (Math.cos(pose.gait * 2) - 1) * 1.1 * pose.run * (1 - pose.air);
    const breath =
      Math.sin(pose.time * 2.3) * 0.65 * (1 - pose.run) * (1 - pose.air);
    const bodyY = bounce + breath + pose.landing * 3;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(pose.facing, 1);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    // Legs rotate at the hips instead of changing length during a step.
    const leg = (side: number, behind: boolean) => {
      ctx.save();
      ctx.translate(side * 6, -24 + bodyY);
      ctx.rotate(stride * side * 0.62 + pose.air * side * 0.45);
      ctx.strokeStyle = behind ? "#172b32" : "#253944";
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(side * pose.air * 3, 12 - pose.air * 3);
      ctx.lineTo(side * pose.air * 3 + stride * side * 2, 20 - pose.air * 6);
      ctx.stroke();
      rounded(
        ctx,
        -5 + side * pose.air * 3,
        16 - pose.air * 6,
        14,
        7,
        3,
        behind ? "#14242b" : "#1d3038",
      );
      rounded(
        ctx,
        -4 + side * pose.air * 3,
        20 - pose.air * 6,
        13,
        2,
        1,
        "#dbb66d",
      );
      ctx.restore();
    };
    leg(-1, true);
    leg(1, false);
    ctx.save();
    ctx.translate(0, -28 + bodyY);
    ctx.rotate(pose.lean * 0.09);
    rounded(ctx, -19, -24, 12, 22, 5, "#96373b");
    rounded(ctx, -18, -21, 4, 16, 2, "#c77355");
    const arm = (side: number, behind: boolean) => {
      ctx.save();
      ctx.translate(side * 12, -23);
      ctx.rotate(-stride * side * 0.7 - pose.air * side * 0.75);
      ctx.strokeStyle = behind ? "#1a3038" : "#344852";
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(side * 3, 11);
      ctx.lineTo(side * 4 + 2, 17);
      ctx.stroke();
      oval(ctx, side * 4 + 2, 18, 4, 4.5, behind ? "#d69a73" : "#f6c99e");
      ctx.restore();
    };
    arm(-1, true);
    const coat = ctx.createLinearGradient(-14, -31, 15, 0);
    coat.addColorStop(0, "#344851");
    coat.addColorStop(1, "#172a33");
    ctx.fillStyle = coat;
    ctx.beginPath();
    ctx.roundRect(-13, -30, 27, 30, [8, 8, 4, 4]);
    ctx.fill();
    ctx.strokeStyle = "#ecc779";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-5, -28);
    ctx.lineTo(1, -21);
    ctx.lineTo(7, -28);
    ctx.moveTo(1, -21);
    ctx.lineTo(1, -8);
    ctx.stroke();
    rounded(ctx, -13, -8, 27, 7, 2, "#b63b3d");
    rounded(ctx, -13, -8, 27, 2, 1, "#f2cb75");
    rounded(ctx, -2, -8, 5, 6, 1, "#eec575");
    for (const px of [-8, 8]) {
      ctx.fillStyle = "#d7ad61";
      ctx.beginPath();
      ctx.moveTo(px, -17);
      ctx.lineTo(px + 2, -15);
      ctx.lineTo(px, -13);
      ctx.lineTo(px - 2, -15);
      ctx.fill();
    }
    arm(1, false);
    rounded(ctx, -3, -35, 9, 7, 3, "#dda57b");
    oval(ctx, 0, -46, 16, 17, "#513d35");
    oval(ctx, 1, -44, 15.5, 16.5, "#f4c69b");
    oval(ctx, -13, -43, 4, 5, "#e9ae83");
    oval(ctx, 15, -43, 3, 4.5, "#efbd93");
    oval(ctx, -11.5, -43, 1.5, 2.5, "#d19070");
    oval(ctx, 9, -39, 4, 2, "#e7a08b");
    const blink = pose.time > 0 && pose.time % 4.8 > 4.65;
    for (const eyeX of [2, 11]) {
      oval(ctx, eyeX, -46, 1.8, blink ? 0.6 : 2.5, "#27333b");
      if (!blink) oval(ctx, eyeX + 0.5, -47, 0.6, 0.8, "#fff9e9");
    }
    ctx.strokeStyle = "#754d3c";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(7, -41, 4, 0.2, 1.7);
    ctx.stroke();
    const hat = ctx.createLinearGradient(0, -78, 0, -58);
    hat.addColorStop(0, "#e76850");
    hat.addColorStop(1, "#a72e3b");
    ctx.fillStyle = hat;
    ctx.beginPath();
    ctx.moveTo(-16, -57);
    ctx.quadraticCurveTo(-17, -68, -22, -76);
    ctx.quadraticCurveTo(-9, -74, 0, -70);
    ctx.quadraticCurveTo(11, -75, 21, -76);
    ctx.lineTo(16, -57);
    ctx.quadraticCurveTo(0, -54, -16, -57);
    ctx.fill();
    ctx.strokeStyle = "#f4d28a";
    ctx.lineWidth = 1.8;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-14, -61);
    ctx.quadraticCurveTo(1, -59, 15, -61);
    ctx.stroke();
    ctx.fillStyle = "#f7d38b";
    ctx.beginPath();
    ctx.moveTo(0, -70);
    ctx.lineTo(3, -66);
    ctx.lineTo(0, -62);
    ctx.lineTo(-3, -66);
    ctx.fill();
    ctx.restore();
    ctx.restore();
  },

  drawRumahGadang(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    scale: number,
    isGoal = false,
  ) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    oval(ctx, 0, 83, 147, 12, "#183d3424");
    for (const px of [-105, -65, 65, 105])
      rounded(ctx, px, 50, 9, 30, 2, "#594235");
    const wall = ctx.createLinearGradient(0, 0, 0, 70);
    wall.addColorStop(0, "#b2764a");
    wall.addColorStop(1, "#75452f");
    ctx.fillStyle = wall;
    ctx.fillRect(-121, -4, 242, 70);
    rounded(ctx, -128, 60, 256, 8, 3, "#563a2d");
    ctx.strokeStyle = "#ebbc72";
    ctx.lineWidth = 2;
    for (let px = -110; px < 115; px += 28) {
      ctx.strokeRect(px, 8, 19, 40);
      ctx.beginPath();
      ctx.moveTo(px + 9, 15);
      ctx.lineTo(px + 14, 25);
      ctx.lineTo(px + 9, 35);
      ctx.lineTo(px + 4, 25);
      ctx.closePath();
      ctx.stroke();
    }
    for (const px of [-80, 58]) {
      rounded(ctx, px, 12, 22, 28, 3, "#263f40");
      rounded(ctx, px + 3, 14, 5, 23, 1, "#edc47a");
      rounded(ctx, px + 14, 14, 5, 23, 1, "#edc47a");
    }
    rounded(ctx, -20, 22, 40, 40, [14, 14, 0, 0], "#3e3028");
    rounded(ctx, -12, 29, 24, 33, 3, "#e4b66a");
    for (let i = 0; i < 3; i++)
      rounded(ctx, -24 - i * 5, 66 + i * 5, 48 + i * 10, 5, 1, "#b88a5a");
    const roof = ctx.createLinearGradient(0, -94, 0, 0);
    roof.addColorStop(0, "#40545b");
    roof.addColorStop(1, "#1d333c");
    ctx.fillStyle = roof;
    ctx.beginPath();
    ctx.moveTo(-154, 0);
    ctx.quadraticCurveTo(-184, -38, -187, -98);
    ctx.quadraticCurveTo(-130, -40, -76, -57);
    ctx.quadraticCurveTo(-63, -64, -61, -94);
    ctx.quadraticCurveTo(-25, -54, 0, -65);
    ctx.quadraticCurveTo(25, -54, 61, -94);
    ctx.quadraticCurveTo(63, -64, 76, -57);
    ctx.quadraticCurveTo(130, -40, 187, -98);
    ctx.quadraticCurveTo(184, -38, 154, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#f2cb84";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.strokeStyle = "#80928a";
    ctx.lineWidth = 1;
    for (let px = -125; px <= 125; px += 20) {
      ctx.beginPath();
      ctx.moveTo(px, -5);
      ctx.lineTo(px * 0.92, -30 - Math.abs(px) * 0.05);
      ctx.stroke();
    }
    if (isGoal) {
      rounded(ctx, -86, -151, 172, 34, 17, "#183b3bef");
      ctx.fillStyle = "#ffe1a0";
      ctx.font = "bold 13px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("RUMAH GADANG", 0, -129);
    }
    ctx.restore();
  },

  drawSupply(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    type: string,
    frame: number,
  ) {
    ctx.save();
    const bob = Math.sin(frame * 0.035 + x * 0.01) * 3;
    oval(ctx, x, y + 22, 14, 3, "#294d3826");
    ctx.translate(x, y + bob - 2);
    const halo = ctx.createRadialGradient(0, 0, 8, 0, 0, 29);
    halo.addColorStop(0, "#fff5ce70");
    halo.addColorStop(1, "#fff5ce00");
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(0, 0, 29, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "#fff0bc8a";
    ctx.beginPath();
    ctx.arc(0, 0, 24, 0, Math.PI * 2);
    ctx.stroke();
    if (type === "water") {
      rounded(ctx, -9, -14, 18, 32, 6, "#a3e7ee");
      rounded(ctx, -8, -3, 16, 19, 4, "#389cbd");
      rounded(ctx, -6, -19, 12, 7, 2, "#e7f4e9");
      rounded(ctx, -9, 2, 18, 8, 2, "#eff5d9");
      rounded(ctx, -5, -10, 3, 10, 1.5, "#ffffff9c");
      oval(ctx, 0, 6, 2, 3, "#4f9fa9");
    } else if (type === "food") {
      rounded(ctx, -13, -13, 26, 31, 5, "#ba7048");
      rounded(ctx, -14, -15, 28, 6, 3, "#edd5a4");
      rounded(ctx, -14, 13, 28, 5, 2, "#eed4a1");
      rounded(ctx, -13, -4, 26, 15, 2, "#efe0b4");
      oval(ctx, 0, 3, 5, 5, "#7c9c62");
      ctx.strokeStyle = "#d7ecc7";
      ctx.beginPath();
      ctx.moveTo(-2, 4);
      ctx.lineTo(1, 0);
      ctx.stroke();
    } else if (type === "kit") {
      rounded(ctx, -7, -19, 14, 9, 3, "#708b83");
      rounded(ctx, -16, -12, 32, 27, 5, "#fff0d6");
      rounded(ctx, -16, 9, 32, 6, [0, 0, 5, 5], "#d8d8bd");
      rounded(ctx, -10, -2, 20, 6, 1, "#ca5250");
      rounded(ctx, -3, -9, 6, 20, 1, "#ca5250");
    } else {
      ctx.rotate(-0.28);
      rounded(ctx, -6, -6, 12, 25, 3, "#36545c");
      rounded(ctx, -7, 12, 14, 5, 2, "#e4ba6d");
      rounded(ctx, -11, -18, 22, 17, 5, "#e2b465");
      rounded(ctx, -8, -17, 16, 8, 4, "#fff1b0");
      rounded(ctx, -2, 0, 4, 5, 1, "#b3c6b4");
    }
    ctx.restore();
  },
};
