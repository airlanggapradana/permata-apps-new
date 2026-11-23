import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const { outputText } = ts.transpileModule(
  readFileSync(
    new URL("../src/lib/games/bagCameraSession.ts", import.meta.url),
    "utf8",
  ),
  {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
    },
  },
);
const { createBagCameraSession } = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
);
const image = {};
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

test("failure, pagehide and unmount close a tracker only once", async () => {
  let closes = 0;
  const session = createBagCameraSession({
    send: async () => {},
    close: () => {
      if (++closes > 1)
        throw new Error("SolutionWasm instance already deleted");
    },
  });
  const first = session.stop();
  assert.equal(session.stop(), first);
  assert.equal(session.stop(), first);
  await first;
  await session.stop();
  assert.equal(closes, 1);
});

test("closing waits for an active inference and blocks all later frames", async () => {
  const detection = deferred();
  let sends = 0,
    closes = 0;
  const session = createBagCameraSession({
    send: () => {
      sends++;
      return detection.promise;
    },
    close: async () => {
      closes++;
    },
  });
  const frame = session.send({ image });
  await Promise.resolve();
  const close = session.stop();
  await session.send({ image });
  assert.equal(sends, 1);
  assert.equal(closes, 0);
  detection.resolve();
  await Promise.all([frame, close]);
  assert.equal(closes, 1);
});

test("canceling before a queued inference starts never touches deleted WASM", async () => {
  let sends = 0,
    closes = 0;
  const session = createBagCameraSession({
    send: async () => {
      sends++;
    },
    close: async () => {
      closes++;
    },
  });
  await Promise.all([session.send({ image }), session.stop()]);
  assert.equal(sends, 0);
  assert.equal(closes, 1);
});

test("a failed inference still closes the tracker after rejecting", async () => {
  const detection = deferred();
  let closes = 0;
  const session = createBagCameraSession({
    send: () => detection.promise,
    close: async () => {
      closes++;
    },
  });
  const frame = session.send({ image });
  await Promise.resolve();
  const failure = assert.rejects(frame, /Model failed/);
  const close = session.stop();
  detection.reject(new Error("Model failed"));
  await Promise.all([failure, close]);
  assert.equal(closes, 1);
});

test("both synchronous WASM deletion errors and async cleanup failures are contained", async () => {
  for (const close of [
    () => {
      throw new Error("SolutionWasm instance already deleted");
    },
    async () => {
      throw new Error("WASM initialization failed");
    },
  ]) {
    const session = createBagCameraSession({ send: async () => {}, close });
    await assert.doesNotReject(session.stop());
    await assert.doesNotReject(session.stop());
  }
});

test("overlapping inference requests share one active WASM call", async () => {
  const detection = deferred();
  let sends = 0;
  const session = createBagCameraSession({
    send: () => {
      sends++;
      return detection.promise;
    },
    close: async () => {},
  });
  const first = session.send({ image }),
    second = session.send({ image });
  assert.equal(first, second);
  await Promise.resolve();
  assert.equal(sends, 1);
  detection.resolve();
  await first;
  await session.stop();
});
