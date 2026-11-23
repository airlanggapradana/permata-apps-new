import { rounded, type MinangPose } from "./minangPainter";
import {
  QUAKE_FLOOR,
  QUAKE_OBSTACLES,
  QUAKE_WIDTH,
} from "@/lib/games/sigapBencana";

export type QuakeHouseArt = {
  rooms: HTMLImageElement[];
};

export function drawQuakeHero(
  ctx: CanvasRenderingContext2D,
  pose: MinangPose,
  art?: { image: HTMLImageElement; frame: number },
) {
  ctx.clearRect(0, 0, 96, 140);
  if (art) {
    const width = art.image.naturalWidth / 4;
    const height = art.image.naturalHeight / 2;
    const bounce =
      pose.air > 0.5 ? 0 : Math.sin(pose.gait * 2) * pose.run * 1.2;
    ctx.save();
    ctx.translate(48, 132 + bounce + pose.landing * 2);
    ctx.scale(pose.facing, 1);
    ctx.drawImage(
      art.image,
      (art.frame % 4) * width + 5,
      Math.floor(art.frame / 4) * height + 5,
      width - 10,
      height - 12,
      -48,
      -127,
      96,
      140,
    );
    ctx.restore();
    return;
  }
  ctx.save();
  ctx.translate(48, 132);
  ctx.scale(pose.facing, 1);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const stride = Math.sin(pose.gait) * pose.run * (1 - pose.air);
  const bounce =
    (Math.cos(pose.gait * 2) - 1) * pose.run +
    Math.sin(pose.time * 2) * 0.5 * (1 - pose.run) +
    pose.landing * 2.5;
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(side * 7, -25 + bounce);
    ctx.rotate(side * stride * 0.6 + side * pose.air * 0.4);
    ctx.strokeStyle = side < 0 ? "#284955" : "#3b606c";
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 10);
    ctx.lineTo(0, 20 - pose.air * 4);
    ctx.stroke();
    rounded(ctx, -5, 18 - pose.air * 4, 15, 6, 3, "#eff2db");
    ctx.restore();
  }
  ctx.save();
  ctx.translate(0, -28 + bounce);
  ctx.rotate(pose.lean * 0.08);
  rounded(ctx, -19, -28, 13, 25, 5, "#3a7975");
  rounded(ctx, -16, -25, 3, 18, 1, "#92ba9d");
  const arm = (side: number) => {
    ctx.save();
    ctx.translate(side * 13, -24);
    ctx.rotate(-stride * side * 0.7 - pose.air * side * 0.7);
    ctx.strokeStyle = side < 0 ? "#b56342" : "#df9561";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(side * 4, 17);
    ctx.stroke();
    ctx.fillStyle = "#f6cca2";
    ctx.beginPath();
    ctx.arc(side * 4, 19, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };
  arm(-1);
  rounded(ctx, -14, -31, 29, 31, [9, 9, 5, 5], "#d98652");
  rounded(ctx, -14, -7, 29, 7, [0, 0, 4, 4], "#bd6845");
  rounded(ctx, -2, -28, 3, 12, 1, "#f7dfae");
  rounded(ctx, -7, -13, 15, 6, 2, "#eeae72");
  arm(1);
  rounded(ctx, -3, -35, 9, 7, 3, "#dca67c");
  ctx.fillStyle = "#3a4141";
  ctx.beginPath();
  ctx.ellipse(0, -48, 17, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f3c69c";
  ctx.beginPath();
  ctx.ellipse(1, -45, 16, 17, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#3b4140";
  ctx.beginPath();
  ctx.moveTo(-15, -47);
  ctx.lineTo(-15, -58);
  ctx.quadraticCurveTo(0, -72, 17, -57);
  ctx.lineTo(9, -53);
  ctx.lineTo(2, -56);
  ctx.lineTo(-9, -51);
  ctx.fill();
  ctx.fillStyle = "#edb58d";
  ctx.beginPath();
  ctx.ellipse(-13, -44, 4, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  const blink = pose.time > 0 && pose.time % 4.8 > 4.65;
  for (const x of [2, 11]) {
    ctx.fillStyle = "#2c4147";
    ctx.beginPath();
    ctx.ellipse(x, -46, 1.8, blink ? 0.5 : 2.4, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = "#986449";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(7, -41, 4, 0.2, 1.7);
  ctx.stroke();
  ctx.restore();
  ctx.restore();
}

export function drawQuakeHouse(
  ctx: CanvasRenderingContext2D,
  art?: QuakeHouseArt,
) {
  if (art) {
    ctx.fillStyle = "#f4cdb1";
    ctx.fillRect(0, 0, QUAKE_WIDTH, 1800);
    ctx.save();
    ctx.translate(0, 800);
    for (let i = 0; i < 3; i++) {
      const image = art.rooms[i];
      const roomHeight = (950 * image.naturalHeight) / image.naturalWidth;
      ctx.drawImage(image, i * 950, 0, 950, roomHeight);
      // Extend the wooden floor for tall phone viewports.
      ctx.drawImage(
        image,
        0,
        image.naturalHeight - 128,
        image.naturalWidth,
        128,
        i * 950,
        roomHeight,
        950,
        1000 - roomHeight,
      );
    }
    for (const x of [950, 1900]) {
      rounded(ctx, x - 8, 0, 16, 480, 2, "#e5c49f");
      rounded(ctx, x - 7, 0, 4, 480, 1, "#fff0cb");
    }
    for (const obstacle of QUAKE_OBSTACLES) {
      const { x, width, height } = obstacle;
      const y = QUAKE_FLOOR - height;
      ctx.fillStyle = "#9e4e2533";
      ctx.beginPath();
      ctx.ellipse(
        x + width / 2,
        QUAKE_FLOOR + 3,
        width * 0.65,
        5,
        0,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      const wood = ctx.createLinearGradient(x, y, x + width, y + height);
      wood.addColorStop(0, "#efa548");
      wood.addColorStop(1, "#bf652b");
      ctx.fillStyle = wood;
      ctx.beginPath();
      ctx.roundRect(x, y, width, height, 5);
      ctx.fill();
      rounded(ctx, x + 5, y + 5, width - 10, height - 10, 2, "#cf7b31");
      ctx.strokeStyle = "#ac5624";
      ctx.lineWidth = 1;
      for (let offset = 12; offset < width - 5; offset += 12) {
        ctx.beginPath();
        ctx.moveTo(x + offset, y + 5);
        ctx.lineTo(x + offset, y + height - 5);
        ctx.stroke();
      }
      ctx.lineWidth = 7;
      ctx.strokeStyle = "#efa54d";
      ctx.beginPath();
      ctx.moveTo(x + 9, y + height - 8);
      ctx.lineTo(x + width - 9, y + 8);
      ctx.stroke();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#ffce7e";
      ctx.beginPath();
      ctx.moveTo(x + 5, y + 3);
      ctx.lineTo(x + width - 5, y + 3);
      ctx.stroke();
      for (const screwX of [x + 4, x + width - 4])
        for (const screwY of [y + 4, y + height - 4]) {
          ctx.fillStyle = "#ffcf7c";
          ctx.beginPath();
          ctx.arc(screwX, screwY, 1.8, 0, Math.PI * 2);
          ctx.fill();
        }
    }
    ctx.font = "900 15px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#fffbe5";
    ctx.fillText("KELUAR", 2724, 175);
    ctx.restore();
    return;
  }
  // Extra wall above the scene fills tall portrait viewports.
  ctx.fillStyle = "#dce3cf";
  ctx.fillRect(0, 0, QUAKE_WIDTH, 1800);
  ctx.save();
  ctx.translate(0, 800);
  const colors = ["#dce3cf", "#d6e4df", "#e9dcc2"];
  for (let room = 0; room < 3; room++) {
    const x = room * 930;
    ctx.fillStyle = colors[room];
    ctx.fillRect(x, -800, 930, 1300);
    ctx.fillStyle = "#c0cdb6";
    ctx.fillRect(x, 342, 930, 152);
    for (let panel = 0; panel < 930; panel += 62) {
      rounded(ctx, x + panel + 5, 351, 52, 129, 4, "#e3e8d34d");
    }
    rounded(ctx, x, 340, 930, 9, 2, "#a8b9a4");
    rounded(ctx, x, 488, 930, 12, 2, "#819383");
    for (const wx of [x + 120, x + 640]) {
      rounded(ctx, wx - 7, 140, 144, 147, 6, "#a28e72");
      rounded(ctx, wx, 147, 130, 132, 3, "#9dcbd0");
      ctx.fillStyle = "#d7e7cf";
      ctx.beginPath();
      ctx.moveTo(wx, 265);
      ctx.quadraticCurveTo(wx + 52, 205, wx + 130, 249);
      ctx.lineTo(wx + 130, 279);
      ctx.lineTo(wx, 279);
      ctx.fill();
      rounded(ctx, wx + 62, 147, 6, 132, 1, "#e7dcc1");
      rounded(ctx, wx, 210, 130, 5, 1, "#e7dcc1");
      rounded(ctx, wx - 13, 279, 156, 10, 3, "#8b8470");
    }
    rounded(ctx, x + 914, -800, 16, 1300, 0, "#9ea996");
    rounded(ctx, x + 902, 336, 40, 16, 3, "#b4b9a0");
  }
  // A warm wooden floor, rugs and furniture retain the original house setting.
  const floor = ctx.createLinearGradient(0, 500, 0, 1000);
  floor.addColorStop(0, "#b68b61");
  floor.addColorStop(1, "#8c674c");
  ctx.fillStyle = floor;
  ctx.fillRect(0, 500, QUAKE_WIDTH, 500);
  ctx.strokeStyle = "#6f503d55";
  ctx.lineWidth = 2;
  for (let y = 516; y < 1000; y += 25) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(QUAKE_WIDTH, y);
    ctx.stroke();
  }
  for (let x = 0; x < QUAKE_WIDTH; x += 100) {
    ctx.beginPath();
    ctx.moveTo(x, 516);
    ctx.lineTo(x, 540);
    ctx.moveTo(x + 45, 566);
    ctx.lineTo(x + 45, 590);
    ctx.stroke();
  }
  rounded(ctx, 125, 498, 520, 11, 5, "#c27958");
  rounded(ctx, 138, 499, 494, 3, 1, "#eed09a");
  rounded(ctx, 160, 414, 154, 63, 16, "#5b8b7b");
  rounded(ctx, 148, 435, 178, 52, 10, "#6c9f89");
  rounded(ctx, 167, 438, 138, 24, 5, "#a0baa0");
  for (const x of [164, 302]) rounded(ctx, x, 480, 9, 20, 2, "#75664a");
  for (const x of [378, 500]) rounded(ctx, x, 456, 10, 44, 2, "#79583d");
  rounded(ctx, 358, 440, 174, 16, 5, "#a77c50");
  rounded(ctx, 358, 438, 174, 5, 2, "#d9b77c");
  rounded(ctx, 400, 425, 28, 13, 2, "#608e94");
  // Decorative plants and framed pictures are placed behind the walkable path.
  for (const x of [60, 970, 1870, 2580]) {
    rounded(ctx, x, 464, 31, 36, [3, 3, 10, 10], "#b57654");
    ctx.strokeStyle = "#62875d";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x + 15, 466);
    ctx.lineTo(x + 15, 414);
    ctx.stroke();
    for (const side of [-1, 1])
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = i % 2 ? "#7fa574" : "#52876c";
        ctx.beginPath();
        ctx.ellipse(
          x + 15 + side * 9,
          421 + i * 13,
          15,
          6,
          side * 0.55,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
  }
  for (const x of [460, 1490, 2220]) {
    rounded(ctx, x, 185, 91, 69, 4, "#9e805d");
    rounded(ctx, x + 6, 191, 79, 57, 2, "#e9dfbb");
    ctx.fillStyle = "#7caa94";
    ctx.beginPath();
    ctx.moveTo(x + 10, 241);
    ctx.lineTo(x + 40, 207);
    ctx.lineTo(x + 78, 241);
    ctx.fill();
  }
  for (const obstacle of QUAKE_OBSTACLES) {
    const y = QUAKE_FLOOR - obstacle.height;
    rounded(ctx, obstacle.x, y, obstacle.width, obstacle.height, 4, "#ac7b4b");
    rounded(
      ctx,
      obstacle.x + 4,
      y + 4,
      obstacle.width - 8,
      obstacle.height - 8,
      2,
      "#c99b63",
    );
    rounded(ctx, obstacle.x + 26, y + 4, 7, obstacle.height - 8, 0, "#e0b67e");
    ctx.strokeStyle = "#91683f";
    ctx.lineWidth = 2;
    ctx.strokeRect(
      obstacle.x + 4,
      y + 4,
      obstacle.width - 8,
      obstacle.height - 8,
    );
  }
  rounded(ctx, 2660, 352, 135, 148, [14, 14, 0, 0], "#738f7a");
  rounded(ctx, 2670, 362, 115, 138, [9, 9, 0, 0], "#355b56");
  rounded(ctx, 2677, 371, 101, 129, [5, 5, 0, 0], "#94bba2");
  rounded(ctx, 2680, 311, 95, 29, 6, "#376d60");
  ctx.fillStyle = "#f4f0d4";
  ctx.font = "bold 13px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("KELUAR →", 2728, 331);
  rounded(ctx, 2760, 429, 6, 18, 3, "#f2d391");
  ctx.restore();
}
