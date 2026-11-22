import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const compile = (file) =>
  ts.transpileModule(readFileSync(new URL(file, import.meta.url), "utf8"), {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
    },
  }).outputText;
const guard = {};
vm.runInNewContext(compile("../src/lib/requestOrigin.ts"), {
  exports: guard,
  URL,
});
const { isSameOriginRequest } = guard;
const request = (
  headers,
  internal = "http://localhost:3000/api/games/test",
) => ({ headers: new Headers(headers), nextUrl: new URL(internal) });

test("the received Host handles local aliases, deployment hosts, default ports and IPv6", () => {
  const cases = [
    [{ origin: "http://127.0.0.1:3000", host: "127.0.0.1:3000" }],
    [
      { origin: "http://localhost:3000", host: "localhost:3000" },
      "http://127.0.0.1:3000/api/test",
    ],
    [
      { origin: "https://permata.example", host: "permata.example" },
      "https://internal.example/api/test",
    ],
    [
      { origin: "https://permata.example:443", host: "permata.example" },
      "https://internal.example/api/test",
    ],
    [
      { origin: "https://PERMATA.example", host: "permata.example:443" },
      "https://internal.example/api/test",
    ],
    [{ origin: "http://[::1]:3000", host: "[::1]:3000" }],
    [{ origin: "http://localhost:3000" }],
  ];
  for (const [headers, internal] of cases)
    assert.equal(
      isSameOriginRequest(request(headers, internal)),
      true,
      JSON.stringify(headers),
    );
});

test("foreign hosts, ports, schemes, opaque origins and malformed values are rejected", () => {
  for (const origin of [
    "https://external.example",
    "http://localhost:3001",
    "https://localhost:3000",
    "http://localhost:3000.external.example",
    "null",
    "",
    "not a URL",
    "http://person@localhost:3000",
    "http://localhost:3000/path",
    "http://localhost:3000?query=1",
    "http://localhost:3000/#fragment",
  ]) {
    assert.equal(
      isSameOriginRequest(request({ origin, host: "localhost:3000" })),
      false,
      origin,
    );
  }
  assert.equal(
    isSameOriginRequest(
      request({ origin: "http://localhost:3000", host: "user@localhost:3000" }),
    ),
    false,
  );
});

test("forwarded hosts never permit a foreign browser origin", () => {
  assert.equal(
    isSameOriginRequest(
      request(
        {
          origin: "https://external.example",
          host: "permata.example",
          "x-forwarded-host": "external.example",
        },
        "https://internal.example/api/test",
      ),
    ),
    false,
  );
});

test("clients without Origin still proceed to normal session authentication", () => {
  assert.equal(isSameOriginRequest(request({ host: "localhost:3000" })), true);
});

for (const route of [
  "games/sigap-bencana",
  "games/emergency-bag",
  "games/breathing",
  "games/siaga-minang",
  "games/roleplay",
  "journal/breathe",
]) {
  test(`${route}: a local alias reaches authentication, foreign requests stop before authentication`, async () => {
    let authCalls = 0;
    const exports = {};
    vm.runInNewContext(compile(`../src/app/api/${route}/route.ts`), {
      exports,
      console,
      require: (name) => {
        if (name === "@/lib/requestOrigin") return guard;
        if (name === "next/server")
          return {
            NextResponse: { json: (body, init) => Response.json(body, init) },
          };
        if (name === "@/lib/auth")
          return {
            getSessionUser: async () => {
              authCalls++;
              return null;
            },
          };
        if (name === "@/lib/db")
          return {
            getPgPool: () => {
              throw new Error("No database access is expected");
            },
          };
        return {};
      },
    });
    const valid = await exports.POST(
      request({ origin: "http://127.0.0.1:3000", host: "127.0.0.1:3000" }),
    );
    assert.equal(valid.status, 401);
    assert.equal(authCalls, 1);
    const foreign = await exports.POST(
      request({ origin: "https://external.example", host: "127.0.0.1:3000" }),
    );
    assert.equal(foreign.status, 403);
    assert.equal(authCalls, 1);
  });
}
