import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const origin = "https://permata.example";
const source = readFileSync(
  new URL("../public/sw.js", import.meta.url),
  "utf8",
);
function worker({ offline = false, cacheWriteFails = false } = {}) {
  const listeners = {};
  const entries = new Map();
  const names = new Set([
    "permata-survival-v1",
    "permata-survival-old",
    "another-app-cache",
  ]);
  const onlineBody = "new-version";
  const key = (request) =>
    new URL(typeof request === "string" ? request : request.url, origin).href;
  const cache = {
    match: async (request) => entries.get(key(request))?.clone(),
    put: async (request, response) => {
      if (cacheWriteFails) throw new Error("Quota full");
      entries.set(key(request), response.clone());
    },
  };
  const caches = {
    open: async () => cache,
    keys: async () => [...names],
    delete: async (name) => names.delete(name),
  };
  vm.runInNewContext(source, {
    self: {
      location: { origin },
      addEventListener: (type, cb) => {
        listeners[type] = cb;
      },
      skipWaiting() {},
      clients: { claim: async () => {} },
    },
    caches,
    URL,
    Response,
    fetch: async () => {
      if (offline) throw new Error("Offline");
      const response = new Response(onlineBody);
      return response;
    },
  });
  return {
    seed(path, body) {
      entries.set(key(path), new Response(body));
    },
    async fetch(path, options = {}) {
      let response;
      listeners.fetch({
        request: {
          url: new URL(path, origin).href,
          method: "GET",
          mode: "cors",
          destination: "",
          ...options,
        },
        respondWith(value) {
          response = value;
        },
      });
      return response ? await response : null;
    },
    async activate() {
      let pending;
      listeners.activate({
        waitUntil(value) {
          pending = value;
        },
      });
      await pending;
      return [...names];
    },
  };
}

test("current scripts, styles and game HTML replace stale cache while online", async () => {
  for (const path of [
    "/_next/static/chunks/app/page.js",
    "/_next/static/chunks/main-app.js",
    "/_next/static/css/app.css",
    "/Breathing.html",
    "/manifest.webmanifest",
  ]) {
    const sw = worker();
    sw.seed(path, "old-version");
    assert.equal(await (await sw.fetch(path)).text(), "new-version", path);
  }
});
test("a script destination is refreshed even without a .js extension", async () => {
  const sw = worker();
  sw.seed("/_next/static/script", "old-version");
  assert.equal(
    await (
      await sw.fetch("/_next/static/script", { destination: "script" })
    ).text(),
    "new-version",
  );
});
test("offline scripts, styles and game HTML still use saved content", async () => {
  const sw = worker({ offline: true });
  for (const path of [
    "/_next/static/chunks/main-app.js",
    "/tokens.css",
    "/Breathing.html",
  ]) {
    sw.seed(path, "saved-offline");
    assert.equal(await (await sw.fetch(path)).text(), "saved-offline");
  }
  assert.equal((await sw.fetch("/missing.js")).status, 504);
});
test("cached images remain available immediately", async () => {
  const sw = worker();
  sw.seed("/permata.png", "saved-image");
  assert.equal(await (await sw.fetch("/permata.png")).text(), "saved-image");
});
test("failed cache writes do not replace successful network responses", async () => {
  const sw = worker({ cacheWriteFails: true });
  sw.seed("/app.js", "old-version");
  assert.equal(await (await sw.fetch("/app.js")).text(), "new-version");
});
test("API writes and other origins bypass the survival cache", async () => {
  const sw = worker();
  assert.equal(await sw.fetch("/api/games/breathing"), null);
  assert.equal(await sw.fetch("/app.js", { method: "POST" }), null);
  assert.equal(await sw.fetch("https://external.example/app.js"), null);
});
test("worker upgrades preserve unrelated caches", async () => {
  const sw = worker();
  assert.deepEqual((await sw.activate()).sort(), [
    "another-app-cache",
    "permata-survival-v1",
  ]);
});
