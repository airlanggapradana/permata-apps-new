import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

// Load the pure TS analyzer with the repository's compiler, without requiring
// a browser, camera, model downloads, or a Node-specific TS runtime.
const source = readFileSync(new URL("../src/lib/games/breathingMotion.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } });
const { estimateTorsoMotion, BreathingPatternTracker } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);
const width = 160, height = 120;
const region = { x: 48, y: 32, width: 64, height: 64 };
const texture = (x, y) => 125 + 27 * Math.sin(x * 0.4) + 21 * Math.cos(y * 0.48) + 15 * Math.sin(x * 0.25 + y * 0.31);
function frame({ expansion = 0, translation = 0, brightness = 0, zoom = 0 } = {}) {
  const pixels = new Float32Array(width * height);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const inTorso = x >= region.x - 3 && x < region.x + region.width + 3 && y >= region.y - 3 && y < region.y + region.height + 3;
    const scale = 1 + zoom + (inTorso ? expansion : 0);
    pixels[y * width + x] = texture((x - 80 - translation) / scale + 80, (y - 64 - translation) / scale + 64) + brightness;
  }
  return pixels;
}
test("static video, light offsets, and common translation do not produce expansion", () => {
  const first = frame();
  for (const next of [frame(), frame({ brightness: 8 }), frame({ translation: 0.25 }), frame({ zoom: 0.003 })]) {
    const result = estimateTorsoMotion(first, next, width, region);
    assert.equal(result.quality, "usable");
    assert.ok(Math.abs(result.expansion) < 0.015, JSON.stringify(result));
  }
});
test("torso-only expansion/contraction have opposite motion signs", () => {
  const first = frame();
  const expanded = frame({ expansion: 0.005 });
  const out = estimateTorsoMotion(first, expanded, width, region);
  const back = estimateTorsoMotion(expanded, first, width, region);
  assert.equal(out.quality, "usable");
  assert.ok(out.expansion > 0.03, JSON.stringify(out));
  assert.ok(back.expansion < -0.03, JSON.stringify(back));
});
test("dark, overexposed, blank, and large-motion frames are rejected", () => {
  for (const light of [0, 255]) assert.equal(estimateTorsoMotion(new Float32Array(width * height).fill(light), new Float32Array(width * height).fill(light), width, region).quality, "lighting");
  assert.equal(estimateTorsoMotion(new Float32Array(width * height).fill(120), new Float32Array(width * height).fill(120), width, region).quality, "texture");
  assert.equal(estimateTorsoMotion(frame(), frame({ translation: 2 }), width, region).quality, "movement");
});
function feed(periodMs, expectedMs = 6000, durationMs = 60000) {
  const tracker = new BreathingPatternTracker(expectedMs);
  let previous = 0, final;
  for (let time = 1000; time <= durationMs + 1000; time += 100) {
    const value = Math.sin((time - 1000) / periodMs * Math.PI * 2) * 0.8;
    final = tracker.add(time, value - previous);
    previous = value;
  }
  return final;
}
test("repeated motion is detected and counts continue past the rolling window", () => {
  const result = feed(6000);
  assert.equal(result.detected, true);
  assert.equal(result.followsGuide, true);
  assert.ok(result.cycles >= 7, JSON.stringify(result));
  assert.equal(result.matchedCycles, result.cycles);
});
test("guide similarity follows the observed period, not the prompt timer", () => {
  const result = feed(10000);
  assert.equal(result.detected, true);
  assert.equal(result.followsGuide, false);
  assert.equal(result.matchedCycles, 0);
});
test("stillness, slow drift and fast jitter never count as completed breaths", () => {
  for (const motion of [() => 0, () => 0.003, (t) => t % 200 ? 0.05 : -0.05]) {
    const tracker = new BreathingPatternTracker(6000);
    for (let time = 1000; time < 61000; time += 100) {
      const result = tracker.add(time, motion(time));
      assert.equal(result.detected, false);
      assert.equal(result.cycles, 0);
    }
  }
});
test("an isolated movement cannot establish a periodic pattern", () => {
  const tracker = new BreathingPatternTracker(6000);
  for (let time = 1000; time <= 30000; time += 100) {
    const result = tracker.add(time, time === 2000 ? 0.9 : time === 3000 ? -0.9 : 0);
    assert.equal(result.cycles, 0);
  }
});
test("actual image-derived repeated expansion reaches the pattern detector", () => {
  const tracker = new BreathingPatternTracker(6000);
  let previous = frame(), result;
  for (let time = 1000; time <= 31000; time += 100) {
    const next = frame({ expansion: Math.sin((time - 1000) / 6000 * Math.PI * 2) * 0.025 });
    const motion = estimateTorsoMotion(previous, next, width, region);
    assert.equal(motion.quality, "usable");
    result = tracker.add(time, motion.expansion);
    previous = next;
  }
  assert.ok(result.cycles >= 2, JSON.stringify(result));
  assert.equal(result.followsGuide, true);
});
