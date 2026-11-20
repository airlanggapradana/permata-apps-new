#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { config as loadDotenv } from "dotenv";
import pg from "pg";

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const DOCS_RAG_DIR = path.join(ROOT_DIR, "docs", "rag");

const DEFAULT_MODEL = "gemini-embedding-001";
const DEFAULT_DIM = 768;
const TARGET_CHUNK_CHARS = 900;
const MIN_CHUNK_CHARS = 350;
const MAX_CHUNK_CHARS = 1400;
const OVERLAP_CHARS = 120;
const EMBED_BATCH_SIZE = 16;
const EMBED_MAX_RETRIES = 5;

function log(message) {
  console.log(`[rag:index] ${message}`);
}

function warn(message) {
  console.warn(`[rag:index] WARN: ${message}`);
}

function fail(message, error) {
  console.error(`[rag:index] ERROR: ${message}`);
  if (error) {
    const detail =
      error instanceof Error
        ? error.stack || error.message
        : typeof error === "string"
          ? error
          : JSON.stringify(error);
    console.error(detail);
  }
  process.exitCode = 1;
}

function loadEnvFiles() {
  const candidates = [
    path.join(ROOT_DIR, ".env"),
    path.join(ROOT_DIR, "apps", "web", ".env.local"),
    path.join(ROOT_DIR, "apps", "web", ".env"),
    path.join(ROOT_DIR, "apps", "api", ".env.local"),
    path.join(ROOT_DIR, "apps", "api", ".env"),
  ];
  for (const file of candidates) {
    loadDotenv({ path: file, override: false });
  }
}

function normalizeNewlines(text) {
  return text.replace(/\r\n?/g, "\n");
}

function parseFrontmatter(raw) {
  const text = normalizeNewlines(raw);
  if (!text.startsWith("---\n")) {
    return { metadata: {}, body: text.trim() };
  }
  const end = text.indexOf("\n---\n", 4);
  if (end === -1) {
    return { metadata: {}, body: text.trim() };
  }
  const block = text.slice(4, end);
  const body = text.slice(end + 5).trim();
  const metadata = {};
  for (const line of block.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf(":");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if (!key) continue;
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    metadata[key] = value;
  }
  return { metadata, body };
}

function splitByHeadings(body) {
  const lines = body.split("\n");
  const sections = [];
  let currentTitle = null;
  let buffer = [];

  const flush = () => {
    const text = buffer.join("\n").trim();
    buffer = [];
    if (!text) return;
    sections.push({
      heading: currentTitle,
      text,
    });
  };

  for (const line of lines) {
    const m = /^(#{1,6})\s+(.*\S)\s*$/.exec(line);
    if (m) {
      flush();
      currentTitle = m[2].trim();
      continue;
    }
    buffer.push(line);
  }
  flush();

  if (sections.length === 0 && body.trim()) {
    return [{ heading: null, text: body.trim() }];
  }
  return sections;
}

function splitLongParagraph(paragraph, maxChars) {
  if (paragraph.length <= maxChars) return [paragraph];
  const parts = [];
  let remaining = paragraph.trim();
  while (remaining.length > maxChars) {
    let cut = remaining.lastIndexOf(". ", maxChars);
    if (cut < Math.floor(maxChars * 0.5)) {
      cut = remaining.lastIndexOf(" ", maxChars);
    }
    if (cut < Math.floor(maxChars * 0.5)) {
      cut = maxChars;
    } else {
      cut += 1;
    }
    const piece = remaining.slice(0, cut).trim();
    if (piece) parts.push(piece);
    remaining = remaining.slice(cut).trim();
  }
  if (remaining) parts.push(remaining);
  return parts;
}

function buildParagraphUnits(text) {
  const rawParas = text
    .split(/\n\s*\n+/)
    .map((p) => p.replace(/\n+/g, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const units = [];
  for (const para of rawParas) {
    units.push(...splitLongParagraph(para, MAX_CHUNK_CHARS));
  }
  return units;
}

function chunkUnits(units) {
  if (units.length === 0) return [];
  const chunks = [];
  let current = "";
  let i = 0;
  while (i < units.length) {
    const unit = units[i];
    if (!current) {
      current = unit;
      i += 1;
      continue;
    }
    const candidate = `${current}\n\n${unit}`;
    if (candidate.length <= TARGET_CHUNK_CHARS) {
      current = candidate;
      i += 1;
      continue;
    }
    if (candidate.length <= MAX_CHUNK_CHARS && current.length < MIN_CHUNK_CHARS) {
      current = candidate;
      i += 1;
      continue;
    }

    chunks.push(current.trim());
    const overlapSource = current.trim();
    const overlap = overlapSource.slice(-OVERLAP_CHARS).trim();
    current = overlap ? `${overlap}\n\n${unit}` : unit;
    if (current.length > MAX_CHUNK_CHARS) {
      chunks.push(current.trim());
      current = "";
    }
    i += 1;
  }
  if (current.trim()) {
    if (chunks.length > 0 && current.trim().length < MIN_CHUNK_CHARS) {
      const prev = chunks.pop();
      const merged = `${prev}\n\n${current.trim()}`.trim();
      if (merged.length <= MAX_CHUNK_CHARS + OVERLAP_CHARS) {
        chunks.push(merged);
      } else {
        chunks.push(prev);
        chunks.push(current.trim());
      }
    } else {
      chunks.push(current.trim());
    }
  }
  return chunks.filter(Boolean);
}

function chunkDocument(body) {
  const sections = splitByHeadings(body);
  const sectionChunks = [];
  for (const section of sections) {
    const units = buildParagraphUnits(section.text);
    let pieces = chunkUnits(units);
    if (pieces.length === 0 && section.text.trim()) {
      pieces = [section.text.trim()];
    }
    for (const piece of pieces) {
      const content = section.heading
        ? `${section.heading}\n${piece}`.trim()
        : piece.trim();
      if (content) {
        sectionChunks.push({ heading: section.heading, content });
      }
    }
  }
  return sectionChunks;
}

function hashContent(text) {
  return crypto.createHash("sha256").update(text, "utf8").digest("hex");
}

async function discoverDocs() {
  let entries;
  try {
    entries = await fs.readdir(DOCS_RAG_DIR, { withFileTypes: true });
  } catch (error) {
    throw new Error(
      `Cannot read docs/rag directory at ${DOCS_RAG_DIR}: ${error.message}`,
    );
  }
  const files = entries
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".md"))
    .map((e) => e.name)
    .sort((a, b) => a.localeCompare(b));
  return files.map((name) => ({
    name,
    absPath: path.join(DOCS_RAG_DIR, name),
    source: `docs/rag/${name}`,
  }));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function embedTexts(texts, { apiKey, model, dim }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:batchEmbedContents?key=${encodeURIComponent(apiKey)}`;
  let attempt = 0;
  while (true) {
    attempt += 1;
    let response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requests: texts.map((text) => ({
            model: `models/${model}`,
            content: { parts: [{ text }] },
            taskType: "RETRIEVAL_DOCUMENT",
            outputDimensionality: dim,
          })),
        }),
      });
    } catch (error) {
      if (attempt >= EMBED_MAX_RETRIES) {
        throw new Error(`Embedding request failed: ${error.message}`);
      }
      const backoff = Math.min(1000 * 2 ** (attempt - 1), 15000);
      warn(`Embedding network error, retrying in ${backoff}ms (${attempt}/${EMBED_MAX_RETRIES})...`);
      await sleep(backoff);
      continue;
    }

    if (response.ok) {
      const data = await response.json();
      const embeddings = Array.isArray(data.embeddings) ? data.embeddings : [];
      if (embeddings.length !== texts.length) {
        throw new Error(
          `Embedding response count mismatch: expected ${texts.length}, got ${embeddings.length}`,
        );
      }
      return embeddings.map((item, idx) => {
        const values = Array.isArray(item?.values) ? item.values : null;
        if (!values || values.length !== dim) {
          throw new Error(
            `Embedding ${idx} has invalid dimension: expected ${dim}, got ${values ? values.length : "none"}`,
          );
        }
        return values;
      });
    }

    const bodyText = await response.text().catch(() => "");
    const retryable = response.status === 429 || response.status >= 500;
    if (retryable && attempt < EMBED_MAX_RETRIES) {
      const retryAfter = Number(response.headers.get("retry-after"));
      const backoff = Number.isFinite(retryAfter) && retryAfter > 0
        ? Math.min(retryAfter * 1000, 30000)
        : Math.min(1000 * 2 ** (attempt - 1), 15000);
      warn(
        `Embedding API ${response.status}, retrying in ${backoff}ms (${attempt}/${EMBED_MAX_RETRIES})...`,
      );
      await sleep(backoff);
      continue;
    }
    throw new Error(
      `Embedding API error ${response.status}: ${bodyText.slice(0, 500)}`,
    );
  }
}

function toVectorLiteral(values) {
  return `[${values.join(",")}]`;
}

async function ensureKnowledgeTable(client) {
  const res = await client.query(`SELECT to_regclass('public.knowledge_chunks') AS name`);
  if (!res.rows[0]?.name) {
    throw new Error(
      "Table knowledge_chunks not found. Run database migrations first (pnpm db:migrate or pnpm db:deploy).",
    );
  }
}

async function main() {
  loadEnvFiles();

  const apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;
  const model = (process.env.RAG_EMBEDDING_MODEL || DEFAULT_MODEL).trim() || DEFAULT_MODEL;
  const dimRaw = process.env.RAG_EMBEDDING_DIM;
  const dim = dimRaw ? Number.parseInt(dimRaw, 10) : DEFAULT_DIM;
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    fail("DATABASE_URL is required.");
    return;
  }
  if (!apiKey) {
    fail("GEMINI_API_KEY or AI_API_KEY is required for embeddings.");
    return;
  }
  if (!Number.isInteger(dim) || dim <= 0) {
    fail(`RAG_EMBEDDING_DIM must be a positive integer (got: ${dimRaw}).`);
    return;
  }
  if (dim !== DEFAULT_DIM) {
    warn(
      `RAG_EMBEDDING_DIM=${dim} differs from migration default ${DEFAULT_DIM}; ensure schema/index and retrieval use the same dimension.`,
    );
  }

  const docs = await discoverDocs();
  if (docs.length === 0) {
    fail(`No markdown files found in ${DOCS_RAG_DIR}.`);
    return;
  }

  log(`Found ${docs.length} corpus file(s) in docs/rag (model=${model}, dim=${dim}).`);

  const allChunks = [];
  let filesIndexed = 0;
  for (const doc of docs) {
    const raw = await fs.readFile(doc.absPath, "utf8");
    const { metadata, body } = parseFrontmatter(raw);
    if (!body.trim()) {
      warn(`Skipping empty corpus file: ${doc.source}`);
      continue;
    }
    const pieces = chunkDocument(body);
    if (pieces.length === 0) {
      warn(`No chunks produced for: ${doc.source}`);
      continue;
    }
    filesIndexed += 1;
    pieces.forEach((piece, idx) => {
      const content = piece.content.trim();
      allChunks.push({
        id: `${doc.source}#${idx}`,
        source: doc.source,
        chunk_index: idx,
        content,
        content_hash: hashContent(content),
        metadata: {
          ...metadata,
          source: doc.source,
          chunkIndex: idx,
          heading: piece.heading || undefined,
        },
      });
    });
    log(`Prepared ${pieces.length} chunk(s) from ${doc.source}`);
  }

  if (allChunks.length === 0) {
    fail("No indexable chunks produced from docs/rag.");
    return;
  }

  log(`Embedding ${allChunks.length} chunk(s)...`);
  for (let i = 0; i < allChunks.length; i += EMBED_BATCH_SIZE) {
    const batch = allChunks.slice(i, i + EMBED_BATCH_SIZE);
    const vectors = await embedTexts(
      batch.map((c) => c.content),
      { apiKey, model, dim },
    );
    vectors.forEach((vec, j) => {
      batch[j].embedding = toVectorLiteral(vec);
    });
    log(
      `Embedded ${Math.min(i + batch.length, allChunks.length)}/${allChunks.length}`,
    );
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const client = await pool.connect();
  let upserted = 0;
  let deletedStale = 0;
  try {
    await ensureKnowledgeTable(client);
    await client.query("BEGIN");

    const bySource = new Map();
    for (const chunk of allChunks) {
      if (!bySource.has(chunk.source)) bySource.set(chunk.source, []);
      bySource.get(chunk.source).push(chunk);
    }

    for (const [source, chunks] of bySource.entries()) {
      const indexes = chunks.map((c) => c.chunk_index);
      for (const chunk of chunks) {
        await client.query(
          `INSERT INTO knowledge_chunks (id, source, chunk_index, content, content_hash, metadata, embedding, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::vector, NOW(), NOW())
           ON CONFLICT (source, chunk_index)
           DO UPDATE SET
             id = EXCLUDED.id,
             content = EXCLUDED.content,
             content_hash = EXCLUDED.content_hash,
             metadata = EXCLUDED.metadata,
             embedding = EXCLUDED.embedding,
             updated_at = NOW()`,
          [
            chunk.id,
            chunk.source,
            chunk.chunk_index,
            chunk.content,
            chunk.content_hash,
            JSON.stringify(chunk.metadata),
            chunk.embedding,
          ],
        );
        upserted += 1;
      }

      const staleRes = await client.query(
        `DELETE FROM knowledge_chunks
         WHERE source = $1 AND NOT (chunk_index = ANY($2::int[]))`,
        [source, indexes],
      );
      deletedStale += staleRes.rowCount || 0;
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
    await pool.end();
  }

  log(
    `Done. files=${filesIndexed} chunks=${allChunks.length} upserted=${upserted} stale_deleted=${deletedStale}`,
  );
}

main().catch((error) => {
  fail("Indexing failed.", error);
  process.exit(1);
});
