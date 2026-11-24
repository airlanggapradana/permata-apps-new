import * as Phaser from "phaser";
import {
  createQuakeState,
  stepQuake,
  quakeSnapshot,
  QUAKE_WIDTH,
  QUAKE_FLOOR,
  QUAKE_SPEED,
  QUAKE_LESSONS,
} from "@/lib/games/sigapBencana";
import { drawQuakeHero, drawQuakeHouse } from "@/components/games/quakePainter";
import type { MinangPose } from "@/components/games/minangPainter";
import type { QuakeBridge } from "../quakeBridge";

export default class GameScene extends Phaser.Scene {
  private bridge: QuakeBridge;
  private hero!: Phaser.GameObjects.Image;
  private shadow!: Phaser.GameObjects.Ellipse;
  private heroTexture!: Phaser.Textures.CanvasTexture;
  private heroArt?: HTMLImageElement;
  private markers: Phaser.GameObjects.Container[] = [];
  private accumulator = 0;
  private previousX = 100;
  private previousY = 452;
  private renderedX = 100;
  private renderedY = 452;
  private cameraX = 0;
  private lastUpdate = -Infinity;
  private pose: MinangPose = {
    gait: 0,
    run: 0,
    air: 0,
    lean: 0,
    landing: 0,
    facing: 1,
    time: 0,
  };
  constructor(bridge: QuakeBridge) {
    super("SigapBencana");
    this.bridge = bridge;
  }
  preload() {
    const base = "/images/sigap-bencana/";
    this.load.image("sigap-living-art", base + "living-room-v2.webp");
    this.load.image("sigap-corridor-art", base + "corridor-v2.webp");
    this.load.image("sigap-exit-art", base + "exit-hall-v2.webp");
    this.load.image("sigap-hero-art", base + "hero-v2.webp");
  }
  create() {
    this.cameras.main.setOrigin(0, 0);
    this.bridge.stateRef.current = createQuakeState();
    const room = this.textures.createCanvas("sigap-room", QUAKE_WIDTH, 1800);
    if (!room) throw new Error("Gambar rumah belum tersedia.");
    const roomKeys = [
      "sigap-living-art",
      "sigap-corridor-art",
      "sigap-exit-art",
    ];
    drawQuakeHouse(
      room.getContext(),
      roomKeys.every((key) => this.textures.exists(key))
        ? {
            rooms: roomKeys.map(
              (key) =>
                this.textures.get(key).getSourceImage() as HTMLImageElement,
            ),
          }
        : undefined,
    );
    if (this.textures.exists("sigap-hero-art"))
      this.heroArt = this.textures
        .get("sigap-hero-art")
        .getSourceImage() as HTMLImageElement;
    room.refresh();
    this.add.image(0, -800, "sigap-room").setOrigin(0);
    for (let i = 0; i < QUAKE_LESSONS.length; i++) {
      const lesson = QUAKE_LESSONS[i];
      const marker = this.add.container(lesson.x, 366);
      const plate = this.add.graphics();
      plate.fillStyle(0x000000, 0.1).fillRoundedRect(-72, -72, 144, 34, 12);
      plate.fillStyle(0x245c50).fillRoundedRect(-74, -74, 148, 34, 12);
      plate.lineStyle(2, 0xffedb3).strokeRoundedRect(-74, -74, 148, 34, 12);
      plate.fillStyle(0x245c50).fillTriangle(-8, -40, 8, -40, 0, -32);
      plate.fillStyle(0xf9ca31).fillTriangle(-8, 20, 8, 20, 0, 52);
      plate.fillStyle(0xfff3bf).fillCircle(0, 0, 27);
      plate.fillStyle(0xe9b923).fillCircle(0, 0, 25);
      plate.fillStyle(0x2b695b).fillCircle(0, 0, 22);
      plate.lineStyle(1.5, 0x92b99b).strokeCircle(0, 0, 20);
      plate.lineStyle(4, 0xffefad);
      plate.lineBetween(-36, -28, -43, -35);
      plate.lineBetween(-39, -11, -48, -13);
      const number = this.add
        .text(0, 0, String(i + 1), {
          fontFamily: "Arial, sans-serif",
          fontSize: "27px",
          fontStyle: "bold",
          color: "#fffbe6",
          shadow: {
            offsetX: 0,
            offsetY: 2,
            color: "#174d42",
            blur: 1,
            fill: true,
          },
        })
        .setOrigin(0.5);
      const label = this.add
        .text(0, -57, lesson.room, {
          fontFamily: "Arial, sans-serif",
          fontSize: lesson.room.length > 15 ? "14px" : "17px",
          fontStyle: "bold",
          color: "#fffbe6",
        })
        .setOrigin(0.5);
      marker.add([plate, number, label]);
      this.markers.push(marker);
    }
    this.shadow = this.add.ellipse(100, 503, 36, 7, 0x304d3c, 0.2);
    const heroTexture = this.textures.createCanvas("sigap-hero", 192, 280);
    if (!heroTexture) throw new Error("Karakter belum tersedia.");
    this.heroTexture = heroTexture;
    this.heroTexture.getContext().setTransform(2, 0, 0, 2, 0, 0);
    this.hero = this.add
      .image(100, 500, "sigap-hero")
      .setOrigin(0.5, 132 / 140)
      .setScale(this.heroArt ? 0.5 : 0.65);
    this.game.canvas.setAttribute(
      "aria-label",
      "Area permainan Sigap Bencana. Gunakan A D atau panah untuk berjalan dan Spasi untuk melompat.",
    );
    this.game.canvas.tabIndex = 0;
    this.game.canvas.style.outlineColor = "#eccb8e";
    this.bridge.onReady();
    this.bridge.onUpdate(quakeSnapshot(this.bridge.stateRef.current));
  }
  update(time: number, delta: number) {
    const state = this.bridge.stateRef.current;
    if (!state || !this.hero) return;
    const elapsed = Math.min(0.1, Math.max(0, delta / 1000));
    if (this.bridge.inputRef.current.enabled && !state.won) {
      this.accumulator += elapsed;
      while (this.accumulator >= 1 / 60) {
        this.previousX = state.x;
        this.previousY = state.y;
        const wasGrounded = state.grounded;
        const events = stepQuake(state, this.bridge.inputRef.current);
        if (!wasGrounded && state.grounded) this.pose.landing = 1;
        this.accumulator -= 1 / 60;
        for (const event of events) {
          if (event.type === "question" && event.id) {
            this.bridge.inputRef.current.enabled = false;
            this.bridge.onQuestion(event.id);
          }
          if (event.type === "exit") {
            this.bridge.inputRef.current.enabled = false;
            this.bridge.onFinish(quakeSnapshot(state));
          }
        }
        if (!this.bridge.inputRef.current.enabled) {
          this.accumulator = 0;
          break;
        }
      }
    } else {
      this.accumulator = 0;
      state.jumpHeld = false;
      state.jumpBuffer = 0;
    }
    const teleported = Math.abs(state.x - this.renderedX) > 100;
    if (teleported || !this.bridge.inputRef.current.enabled) {
      this.previousX = state.x;
      this.previousY = state.y;
    }
    const alpha = this.bridge.inputRef.current.enabled
      ? this.accumulator * 60
      : 1;
    const x = this.previousX + (state.x - this.previousX) * alpha;
    const y = this.previousY + (state.y - this.previousY) * alpha;
    if (this.bridge.inputRef.current.enabled) {
      const blend = 1 - Math.exp(-elapsed / 0.08);
      this.pose.gait += (teleported ? 0 : Math.abs(x - this.renderedX)) * 0.115;
      this.pose.run +=
        (Math.min(1, Math.abs(state.vx) / QUAKE_SPEED) - this.pose.run) * blend;
      this.pose.air += ((state.grounded ? 0 : 1) - this.pose.air) * blend;
      this.pose.lean += (state.vx / QUAKE_SPEED - this.pose.lean) * blend;
      this.pose.facing +=
        (state.facing - this.pose.facing) * (1 - Math.exp(-elapsed / 0.045));
      this.pose.landing *= Math.exp(-elapsed / 0.07);
      this.pose.time = state.elapsed / 1000;
    }
    if (this.bridge.reducedMotionRef.current)
      Object.assign(this.pose, {
        gait: 0,
        run: 0,
        air: 0,
        lean: 0,
        landing: 0,
        facing: state.facing,
        time: 0,
      });
    this.renderedX = x;
    this.renderedY = y;
    const frame = this.bridge.reducedMotionRef.current
      ? 0
      : !state.grounded
        ? state.vy < 0
          ? 6
          : 7
        : this.pose.run > 0.15
          ? 1 + (Math.floor(this.pose.gait / 1.6) % 5)
          : 0;
    drawQuakeHero(
      this.heroTexture.getContext(),
      this.pose,
      this.heroArt ? { image: this.heroArt, frame } : undefined,
    );
    this.heroTexture.refresh();
    this.hero.setPosition(x, y + 48);
    this.shadow
      .setPosition(x, 503)
      .setScale(Math.max(0.3, 1 - Math.max(0, 452 - y) / 230), 1);
    const width = this.scale.width,
      height = this.scale.height;
    const viewport = Math.min(1000, Math.max(440, width)),
      zoom = width / viewport;
    const target = Math.min(
      QUAKE_WIDTH - viewport,
      Math.max(0, x - viewport * 0.32),
    );
    if (teleported || this.bridge.reducedMotionRef.current)
      this.cameraX = target;
    else if (this.bridge.inputRef.current.enabled)
      this.cameraX += (target - this.cameraX) * (1 - Math.exp(-elapsed / 0.09));
    const floorPixel = height - Math.max(90, Math.min(210, height * 0.21));
    // Tremors belong to the first, "during shaking" lesson. DOM controls stay still.
    const tremorTime = (state.elapsed / 1000) % 5.6;
    const tremor =
      this.bridge.shakeEnabledRef.current &&
      !this.bridge.reducedMotionRef.current &&
      this.bridge.inputRef.current.enabled &&
      state.answers.length === 0 &&
      tremorTime < 1.8
        ? Math.sin((tremorTime / 1.8) * Math.PI) * 2.8
        : 0;
    const shakeX = Math.sin(state.elapsed * 0.065) * tremor;
    const shakeY = Math.cos(state.elapsed * 0.083) * tremor * 0.7;
    this.cameras.main
      .setZoom(zoom)
      .setScroll(
        this.cameraX + shakeX,
        QUAKE_FLOOR - floorPixel / zoom + shakeY,
      );
    for (let i = 0; i < this.markers.length; i++)
      this.markers[i].setAlpha(i < state.answers.length ? 0.5 : 1);
    const canvas = this.game.canvas;
    canvas.dataset.playerX = state.x.toFixed(2);
    canvas.dataset.playerY = state.y.toFixed(2);
    canvas.dataset.visualX = x.toFixed(3);
    canvas.dataset.grounded = String(state.grounded);
    canvas.dataset.quakeShaking = String(tremor > 0);
    canvas.dataset.quakeOffset = Math.hypot(shakeX, shakeY).toFixed(3);
    canvas.dataset.heroFrame = String(frame);
    canvas.dataset.illustrated = String(Boolean(this.heroArt));
    if (time - this.lastUpdate >= 100 && this.bridge.inputRef.current.enabled) {
      this.bridge.onUpdate(quakeSnapshot(state));
      this.lastUpdate = time;
    }
  }
}
