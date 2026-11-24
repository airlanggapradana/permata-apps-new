import { MINANG_BRIDGE, MINANG_GROUND_Y } from "@/lib/games/siagaMinang";
import type { MinangPose } from "./minangPainter";
import { rounded } from "./minangPainter";

export type MinangArtwork = {
  backgrounds: HTMLImageElement[];
  hero: HTMLImageElement;
  icons: HTMLImageElement;
  terrain: HTMLImageElement;
  guide: HTMLImageElement;
};
const base = "/images/siaga-minang/";
const readImage = (path: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = path;
  });
export async function loadMinangArtwork(): Promise<MinangArtwork> {
  const [village, route, evacuation, hero, icons, terrain, guide] =
    await Promise.all([
      ...[
        "village-v2",
        "route-v2",
        "evacuation-v2",
        "aira-v2",
        "items-v2",
        "terrain-v2",
        "naya-v2",
      ].map((name) => readImage(base + name + ".webp")),
    ]);
  return {
    backgrounds: [village, route, evacuation],
    hero,
    icons,
    terrain,
    guide,
  };
}

export function drawMinangArtBackdrop(
  ctx: CanvasRenderingContext2D,
  art: MinangArtwork,
  width: number,
  height: number,
  zone: number,
  camera: number,
) {
  const image = art.backgrounds[zone];
  const scale = Math.max(
    (width + 80) / image.naturalWidth,
    height / image.naturalHeight,
  );
  const w = image.naturalWidth * scale,
    h = image.naturalHeight * scale;
  ctx.drawImage(
    image,
    (width - w) / 2 - Math.sin(camera * 0.0008) * 25,
    (height - h) * 0.4,
    w,
    h,
  );
}

export function drawMinangArtPlatform(
  ctx: CanvasRenderingContext2D,
  art: MinangArtwork,
  x: number,
  y: number,
  width: number,
  height: number,
  raised: boolean,
) {
  const h = raised ? 40 : height;
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, width, h, raised ? 9 : [7, 7, 0, 0]);
  ctx.clip();
  const tileWidth = 420,
    tileHeight = 210;
  const start = Math.max(0, Math.floor(-x / tileWidth) * tileWidth);
  for (
    let offset = start;
    offset < width && x + offset < 1200;
    offset += tileWidth
  ) {
    ctx.drawImage(
      art.terrain,
      x + offset,
      y,
      tileWidth,
      raised ? 95 : tileHeight,
    );
    if (!raised && h > tileHeight) {
      ctx.drawImage(
        art.terrain,
        0,
        150,
        art.terrain.naturalWidth,
        art.terrain.naturalHeight - 150,
        x + offset,
        y + tileHeight,
        tileWidth,
        h - tileHeight,
      );
    }
  }
  ctx.restore();
  if (raised) {
    ctx.strokeStyle = "#856047";
    ctx.lineWidth = 3;
    for (const rope of [x + 12, x + width - 12]) {
      ctx.beginPath();
      ctx.moveTo(rope, y - 135);
      ctx.lineTo(rope, y);
      ctx.stroke();
    }
  }
}

export function drawMinangArtSupply(
  ctx: CanvasRenderingContext2D,
  art: MinangArtwork,
  index: number,
  x: number,
  y: number,
  time: number,
) {
  const bob = Math.sin(time * 2.3 + index) * 2;
  ctx.save();
  ctx.translate(x, y + bob);
  ctx.shadowColor = "#ffed57";
  ctx.shadowBlur = 13;
  ctx.fillStyle = "#fff7de";
  ctx.beginPath();
  ctx.arc(0, 0, 25, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "#fffdf0";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, 23, 0, Math.PI * 2);
  ctx.clip();
  const cell = art.icons.naturalWidth / 4;
  ctx.drawImage(
    art.icons,
    (index % 4) * cell + 8,
    Math.floor(index / 4) * cell + 8,
    cell - 16,
    cell - 16,
    -25,
    -25,
    50,
    50,
  );
  ctx.restore();
}

export function drawMinangArtHero(
  ctx: CanvasRenderingContext2D,
  art: MinangArtwork,
  pose: MinangPose,
  vy: number,
  grounded: boolean,
) {
  const frame =
    pose.time === 0
      ? 0
      : !grounded
        ? vy < 0
          ? 6
          : 7
        : pose.run > 0.1
          ? 1 + (Math.floor(pose.gait / 1.5) % 5)
          : 0;
  const w = art.hero.naturalWidth / 4,
    h = art.hero.naturalHeight / 2;
  ctx.save();
  ctx.scale(pose.facing, 1);
  ctx.drawImage(
    art.hero,
    (frame % 4) * w + 9,
    Math.floor(frame / 4) * h + 9,
    w - 18,
    h - 18,
    -42,
    -105 + pose.landing * 2,
    84,
    117,
  );
  ctx.restore();
}

export function drawMinangBridge(
  ctx: CanvasRenderingContext2D,
  camera: number,
  activated: boolean,
) {
  const signX = 2020 - camera;
  ctx.save();
  ctx.strokeStyle = "#a87435";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(signX, MINANG_GROUND_Y - 80);
  ctx.lineTo(signX, MINANG_GROUND_Y);
  ctx.stroke();
  rounded(ctx, signX - 64, MINANG_GROUND_Y - 126, 128, 48, 10, "#23794e");
  ctx.strokeStyle = "#fff3c8";
  ctx.lineWidth = 3;
  ctx.strokeRect(signX - 59, MINANG_GROUND_Y - 121, 118, 38);
  ctx.fillStyle = "#fff7dc";
  ctx.font = "bold 14px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Jalur aman →", signX, MINANG_GROUND_Y - 97);
  ctx.restore();
  const switchX = MINANG_BRIDGE.switchX - camera;
  rounded(
    ctx,
    switchX - 18,
    MINANG_GROUND_Y - 40,
    36,
    40,
    8,
    activated ? "#3eac68" : "#df643b",
  );
  ctx.font = "bold 21px sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "#fff9d4";
  ctx.fillText(activated ? "✓" : "E", switchX, MINANG_GROUND_Y - 13);
  rounded(ctx, switchX - 67, MINANG_GROUND_Y - 93, 134, 36, 14, "#fff1bf");
  ctx.font = "bold 12px sans-serif";
  ctx.fillStyle = "#684329";
  ctx.fillText(
    activated ? "Jembatan terbuka" : "Aktifkan · E / Interaksi",
    switchX,
    MINANG_GROUND_Y - 71,
  );
  if (activated) {
    const x = MINANG_BRIDGE.x - camera;
    rounded(ctx, x, MINANG_GROUND_Y, MINANG_BRIDGE.width, 21, 5, "#b87531");
    for (let i = 0; i < MINANG_BRIDGE.width; i += 18) {
      rounded(ctx, x + i, MINANG_GROUND_Y + 1, 17, 17, 5, "#e7a34f");
      ctx.strokeStyle = "#ffce78";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x + i + 3, MINANG_GROUND_Y + 4, 10, 10);
    }
  }
}

export function drawMinangGuide(
  ctx: CanvasRenderingContext2D,
  art: MinangArtwork,
  x: number,
  index: number,
) {
  const y = MINANG_GROUND_Y;
  ctx.save();
  const height = 152;
  const width = (height * art.guide.naturalWidth) / art.guide.naturalHeight;
  const center = x + 78;
  ctx.fillStyle = "#28472c25";
  ctx.beginPath();
  ctx.ellipse(center, y - 2, 27, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.drawImage(art.guide, center - width / 2, y - height, width, height);
  rounded(ctx, center + 5, y - 27, 78, 23, 11, "#217550");
  ctx.strokeStyle = "#fff6c9";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = "#fff7de";
  ctx.font = "bold 11px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Kak Naya", center + 44, y - 11);
  ctx.restore();
  if (index === 2) {
    rounded(ctx, x - 190, y - 158, 140, 48, 12, "#1c7951");
    ctx.fillStyle = "white";
    ctx.font = "bold 14px sans-serif";
    ctx.fillText("TITIK KUMPUL", x - 120, y - 129);
    ctx.strokeStyle = "#b47c37";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(x - 120, y - 110);
    ctx.lineTo(x - 120, y);
    ctx.stroke();
  }
}
