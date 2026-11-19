const DEFAULT_MODEL = "gemini-embedding-001";
const DEFAULT_DIM = 768;
const EMBED_TIMEOUT_MS = 8000;

export type RagTaskType = "RETRIEVAL_QUERY" | "RETRIEVAL_DOCUMENT";

export function getRagEmbeddingModel(): string {
  const value = process.env.RAG_EMBEDDING_MODEL?.trim();
  return value || DEFAULT_MODEL;
}

export function getRagEmbeddingDim(): number {
  const raw = process.env.RAG_EMBEDDING_DIM?.trim();
  if (!raw) return DEFAULT_DIM;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) return DEFAULT_DIM;
  return parsed;
}

export function getGeminiApiKey(): string | undefined {
  const key = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;
  return key?.trim() || undefined;
}

export async function embedText(
  text: string,
  taskType: RagTaskType,
): Promise<number[] | null> {
  const input = text.trim();
  if (!input) return null;

  const apiKey = getGeminiApiKey();
  if (!apiKey) return null;

  const model = getRagEmbeddingModel();
  const dim = getRagEmbeddingDim();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), EMBED_TIMEOUT_MS);

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:embedContent?key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: `models/${model}`,
        content: { parts: [{ text: input }] },
        taskType,
        outputDimensionality: dim,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as {
      embedding?: { values?: unknown[] };
    };
    const values = data.embedding?.values;
    if (!Array.isArray(values) || values.length !== dim) {
      return null;
    }
    const vector = values.map((v) => Number(v));
    if (vector.some((v) => !Number.isFinite(v))) {
      return null;
    }
    return vector;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export function toPgVectorLiteral(values: number[]): string {
  return `[${values.join(",")}]`;
}
