// Experimental image-motion analysis. These values describe video patterns,
// not a physiological measurement or proof that someone followed the exercise.
export type TorsoRegion = {
  x: number;
  y: number;
  width: number;
  height: number;
};
export type MotionQuality = "usable" | "lighting" | "texture" | "movement";
export type MotionEstimate = { quality: MotionQuality; expansion: number };
export type CameraPatternSummary = { cycles: number; matchedCycles: number };

export function grayscale(rgba: Uint8ClampedArray): Float32Array {
  const output = new Float32Array(rgba.length / 4);
  for (let i = 0; i < output.length; i++)
    output[i] =
      rgba[i * 4] * 0.299 + rgba[i * 4 + 1] * 0.587 + rgba[i * 4 + 2] * 0.114;
  return output;
}

// Local least-squares optical flow. A translation common to all torso patches
// cancels when we compare opposite patches; brightness offsets are removed.
function patchFlow(
  previous: Float32Array,
  current: Float32Array,
  width: number,
  region: TorsoRegion,
) {
  const height = current.length / width;
  const x0 = Math.max(2, Math.ceil(region.x));
  const y0 = Math.max(2, Math.ceil(region.y));
  const x1 = Math.min(width - 2, Math.floor(region.x + region.width));
  const y1 = Math.min(height - 2, Math.floor(region.y + region.height));
  let count = 0,
    brightnessDelta = 0,
    mean = 0;
  for (let y = y0; y < y1; y++)
    for (let x = x0; x < x1; x++) {
      const i = y * width + x;
      brightnessDelta += current[i] - previous[i];
      mean += current[i];
      count++;
    }
  if (count < 40) return null;
  brightnessDelta /= count;
  mean /= count;
  let xx = 0,
    yy = 0,
    xy = 0,
    xt = 0,
    yt = 0;
  for (let y = y0; y < y1; y++)
    for (let x = x0; x < x1; x++) {
      const i = y * width + x;
      const dx =
        (current[i + 1] - current[i - 1] + previous[i + 1] - previous[i - 1]) /
        4;
      const dy =
        (current[i + width] -
          current[i - width] +
          previous[i + width] -
          previous[i - width]) /
        4;
      const dt = current[i] - previous[i] - brightnessDelta;
      xx += dx * dx;
      yy += dy * dy;
      xy += dx * dy;
      xt += dx * dt;
      yt += dy * dt;
    }
  const determinant = xx * yy - xy * xy;
  const minEigenvalue = (xx + yy - Math.hypot(xx - yy, 2 * xy)) / (2 * count);
  if (determinant <= 0 || minEigenvalue < 1.5) return null;
  return {
    x: (xy * yt - yy * xt) / determinant,
    y: (xy * xt - xx * yt) / determinant,
    mean,
    brightnessDelta,
  };
}

export function estimateTorsoMotion(
  previous: Float32Array,
  current: Float32Array,
  width: number,
  region: TorsoRegion,
): MotionEstimate {
  const halfW = region.width / 2,
    halfH = region.height / 2;
  const patches = [
    { x: region.x, y: region.y, width: halfW, height: halfH },
    { x: region.x + halfW, y: region.y, width: halfW, height: halfH },
    { x: region.x, y: region.y + halfH, width: halfW, height: halfH },
    { x: region.x + halfW, y: region.y + halfH, width: halfW, height: halfH },
  ].map((patch) => patchFlow(previous, current, width, patch));
  const valid = patches.filter((patch) => patch !== null);
  if (
    valid.some(
      (patch) =>
        patch.mean < 30 ||
        patch.mean > 225 ||
        Math.abs(patch.brightnessDelta) > 14,
    )
  )
    return { quality: "lighting", expansion: 0 };
  if (valid.length !== 4) {
    let mean = 0;
    for (let i = 0; i < current.length; i++) mean += current[i];
    mean /= current.length;
    return {
      quality: mean < 30 || mean > 225 ? "lighting" : "texture",
      expansion: 0,
    };
  }
  if (valid.some((patch) => Math.hypot(patch.x, patch.y) > 1.25))
    return { quality: "movement", expansion: 0 };
  const [topLeft, topRight, bottomLeft, bottomRight] = valid;
  let expansionX = (topRight.x + bottomRight.x - topLeft.x - bottomLeft.x) / 2;
  let expansionY = (bottomLeft.y + bottomRight.y - topLeft.y - topRight.y) / 2;
  // Compensate for camera zoom/common background motion when the corners have
  // enough detail. Uniform walls provide no flow estimate, so abstain there.
  const height = current.length / width;
  const bw = Math.floor(width * 0.16),
    bh = Math.floor(height * 0.16);
  const corners = [
    { x: 4, y: 4, width: bw, height: bh },
    { x: width - bw - 4, y: 4, width: bw, height: bh },
    { x: 4, y: height - bh - 4, width: bw, height: bh },
    { x: width - bw - 4, y: height - bh - 4, width: bw, height: bh },
  ].map((patch) => patchFlow(previous, current, width, patch));
  if (corners.every((patch) => patch !== null)) {
    if (corners.some((patch) => Math.hypot(patch.x, patch.y) > 1.25))
      return { quality: "movement", expansion: 0 };
    const [tl, tr, bl, br] = corners;
    expansionX -=
      (((tr.x + br.x - tl.x - bl.x) / 2) * halfW) / (width - bw - 8);
    expansionY -=
      (((bl.y + br.y - tl.y - tr.y) / 2) * halfH) / (height - bh - 8);
  }
  return { quality: "usable", expansion: (expansionX + expansionY) / 2 };
}

type Sample = { time: number; value: number };
export type PatternReading = CameraPatternSummary & {
  detected: boolean;
  followsGuide: boolean;
  values: number[];
};

export class BreathingPatternTracker {
  private position = 0;
  private smoothed = 0;
  private lastTime = 0;
  private samples: Sample[] = [];
  private direction = 0;
  private extremum: Sample = { time: 0, value: 0 };
  private lastPeak = 0;
  private periods: { time: number; duration: number; id: number }[] = [];
  private periodId = 0;
  private creditedPeriod = 0;
  private observed = 0;
  private matched = 0;
  private expectedCycleMs: number;

  constructor(expectedCycleMs: number) {
    this.expectedCycleMs = expectedCycleMs;
  }

  add(time: number, expansion: number): PatternReading {
    const dt = this.lastTime ? time - this.lastTime : 100;
    if (dt <= 0 || dt > 500 || !Number.isFinite(expansion))
      return this.reading(time);
    this.lastTime = time;
    this.position = this.position * Math.exp(-dt / 12000) + expansion;
    this.smoothed +=
      (this.position - this.smoothed) * (1 - Math.exp(-dt / 250));
    const sample = { time, value: this.smoothed };
    this.samples.push(sample);
    this.samples = this.samples.filter((item) => time - item.time <= 26000);
    const threshold = 0.18;
    if (this.direction === 0) {
      this.extremum = this.samples[0];
      if (Math.abs(sample.value - this.extremum.value) >= threshold) {
        this.direction = sample.value > this.extremum.value ? 1 : -1;
        this.extremum = sample;
      }
    } else if (this.direction > 0) {
      if (sample.value >= this.extremum.value) this.extremum = sample;
      else if (this.extremum.value - sample.value >= threshold) {
        if (this.lastPeak) {
          const duration = this.extremum.time - this.lastPeak;
          // Broad window for this game's optional 6/8-second guide, not a
          // medical definition of a normal respiratory rate.
          if (duration >= 3500 && duration <= 12000)
            this.periods.push({ time, duration, id: ++this.periodId });
          else this.periods = [];
        }
        this.lastPeak = this.extremum.time;
        this.direction = -1;
        this.extremum = sample;
      }
    } else {
      if (sample.value <= this.extremum.value) this.extremum = sample;
      else if (sample.value - this.extremum.value >= threshold) {
        this.direction = 1;
        this.extremum = sample;
      }
    }
    this.periods = this.periods.filter((period) => time - period.time <= 26000);
    return this.reading(time);
  }

  private reading(time: number): PatternReading {
    const recent = this.periods.slice(-3);
    const period =
      recent.reduce((sum, item) => sum + item.duration, 0) / recent.length;
    const consistent =
      recent.length >= 2 &&
      recent.every((item) => Math.abs(item.duration - period) < period * 0.22);
    let correlation = 0;
    if (consistent && this.samples.length > 50) {
      const pairs: [number, number][] = [];
      let index = 0;
      for (const sample of this.samples) {
        const targetTime = sample.time - period;
        while (
          index + 1 < this.samples.length &&
          this.samples[index + 1].time <= targetTime
        )
          index++;
        const previous = this.samples[index];
        if (Math.abs(previous.time - targetTime) < 200)
          pairs.push([sample.value, previous.value]);
      }
      if (pairs.length >= 30) {
        const mx = pairs.reduce((sum, pair) => sum + pair[0], 0) / pairs.length;
        const my = pairs.reduce((sum, pair) => sum + pair[1], 0) / pairs.length;
        let xy = 0,
          xx = 0,
          yy = 0;
        for (const [x, y] of pairs) {
          xy += (x - mx) * (y - my);
          xx += (x - mx) ** 2;
          yy += (y - my) ** 2;
        }
        correlation = xy / Math.sqrt(xx * yy || 1);
      }
    }
    const recentAmplitude = this.samples
      .filter((sample) => time - sample.time < 3000)
      .map((sample) => sample.value);
    const moving =
      recentAmplitude.length > 5 &&
      Math.max(...recentAmplitude) - Math.min(...recentAmplitude) > 0.18;
    const detected =
      consistent &&
      correlation >= 0.7 &&
      moving &&
      time - recent[recent.length - 1].time < period * 1.5;
    // Count a cycle only once, after sufficient periodic evidence exists.
    if (detected) {
      const newPeriods = recent.filter((item) => item.id > this.creditedPeriod);
      this.observed += newPeriods.length;
      this.matched += newPeriods.filter(
        (item) =>
          Math.abs(item.duration - this.expectedCycleMs) /
            this.expectedCycleMs <=
          0.25,
      ).length;
      this.creditedPeriod = recent[recent.length - 1].id;
    }
    return {
      detected,
      followsGuide:
        detected &&
        Math.abs(period - this.expectedCycleMs) / this.expectedCycleMs <= 0.25,
      cycles: this.observed,
      matchedCycles: this.matched,
      values: this.samples.slice(-100).map((item) => item.value),
    };
  }
}
